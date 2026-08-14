"""
Gemini Function-Calling Client

Handles multi-turn conversations with Google Gemini, using function-calling
to let the AI create appointments, check availability, cancel bookings, etc.

Confirmation flow for create_appointment:
  1. Gemini calls create_appointment → we store details in _pending_bookings
  2. We return a summary and ask the user to confirm
  3. If the user says "yes" / "confirm" / "proceed", we actually write to DB
"""
import re
from datetime import datetime, timedelta, date, time

from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from config import settings
from models import Appointment, Service, ChatMessage, AppointmentStatus, CreatedVia, MessageRole
from schemas import ChatResponse
from services.availability import check_availability, find_available_slots
from services.date_utils import parse_date


# ──────────────────────────────────────
# In-memory store for pending bookings
# Keyed by session_id
# ──────────────────────────────────────
_pending_bookings: dict[str, dict] = {}


# ──────────────────────────────────────
# Confirmation detection
# ──────────────────────────────────────
_CONFIRM_PATTERNS = re.compile(
    r"^(?:yes|yeah|yep|sure|confirm|proceed|go ahead|please do it|book it|do it|ok|okay)\b",
    re.IGNORECASE,
)

_REJECT_PATTERNS = re.compile(
    r"^(?:no|nope|cancel|don'?t|do not|stop|never mind|forget it)\b",
    re.IGNORECASE,
)


def _is_confirmation(text: str) -> bool:
    """Return True if the user message looks like a confirmation."""
    return bool(_CONFIRM_PATTERNS.match(text.strip()))


def _is_rejection(text: str) -> bool:
    """Return True if the user message looks like a rejection/cancellation."""
    return bool(_REJECT_PATTERNS.match(text.strip()))


# ──────────────────────────────────────
# Gemini function declarations
# ──────────────────────────────────────

def _build_service_list(db: Session) -> str:
    """Query services from DB and format them as a string."""
    services = db.query(Service).order_by(Service.id).all()
    lines = []
    for s in services:
        lines.append(f"  - ID {s.id}: {s.name} ({s.duration_minutes} min)")
    return "\n".join(lines)


def _build_system_prompt(db: Session) -> str:
    """Build the system prompt with live service data."""
    service_list = _build_service_list(db)
    return f"""You are a friendly and efficient appointment booking assistant for a salon/barbershop.

Your job is to help customers:
1. Browse available services
2. Find available time slots
3. Book appointments
4. Check appointment status
5. Cancel appointments

## Available Services
{service_list}

## Business Hours
Open every day of the week, {settings.BUSINESS_HOUR_START}:00 AM – {settings.BUSINESS_HOUR_END}:00 PM.

## Important Rules
- Always use the provided tools/functions to interact with the system. Never make up data.
- When a customer wants to book, first use find_availability to check open slots, then use create_appointment.
- create_appointment will NOT immediately book — it will show the details and ask the customer to confirm.
- Be conversational but concise. Use a warm, professional tone.
- If the customer's request is ambiguous, use ask_clarification.
- When presenting available slots, show them in a clean, readable format.
- All times are in the local timezone.
"""


def _get_function_declarations() -> list[types.FunctionDeclaration]:
    """Define the 5 Gemini function-calling tools."""
    return [
        types.FunctionDeclaration(
            name="create_appointment",
            description="Start booking an appointment. This does NOT immediately confirm — it returns the details for the customer to confirm.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "customer_name": types.Schema(type="STRING", description="Customer's full name"),
                    "customer_contact": types.Schema(type="STRING", description="Customer's phone or email"),
                    "service_id": types.Schema(type="INTEGER", description="ID of the service to book"),
                    "start_time": types.Schema(type="STRING", description="ISO 8601 datetime, e.g. 2025-03-15T10:00:00"),
                },
                required=["customer_name", "customer_contact", "service_id", "start_time"],
            ),
        ),
        types.FunctionDeclaration(
            name="find_availability",
            description="Find all available time slots for a service on a specific date.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "service_id": types.Schema(type="INTEGER", description="ID of the service"),
                    "date": types.Schema(type="STRING", description="Date in YYYY-MM-DD format"),
                },
                required=["service_id", "date"],
            ),
        ),
        types.FunctionDeclaration(
            name="cancel_appointment",
            description="Cancel an existing appointment by its ID.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "appointment_id": types.Schema(type="INTEGER", description="ID of the appointment to cancel"),
                },
                required=["appointment_id"],
            ),
        ),
        types.FunctionDeclaration(
            name="get_appointment_status",
            description="Get the current status and details of an appointment.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "appointment_id": types.Schema(type="INTEGER", description="ID of the appointment"),
                },
                required=["appointment_id"],
            ),
        ),
        types.FunctionDeclaration(
            name="ask_clarification",
            description="Ask the customer a clarifying question when their request is ambiguous.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "question": types.Schema(type="STRING", description="The clarification question to ask the customer"),
                },
                required=["question"],
            ),
        ),
    ]


# ──────────────────────────────────────
# Function-call handlers
# ──────────────────────────────────────

def _handle_create_appointment(
    db: Session, session_id: str, args: dict
) -> tuple[str, dict | None]:
    """
    Handle the create_appointment function call.
    Does NOT write to DB — stores a pending booking and returns a confirmation prompt.
    """
    service_id = args["service_id"]
    customer_name = args["customer_name"]
    customer_contact = args["customer_contact"]
    start_time_str = args["start_time"]

    # Parse the start time
    try:
        start_time = datetime.fromisoformat(start_time_str)
    except (ValueError, TypeError):
        return (f"Invalid start time format: '{start_time_str}'. Please use ISO format like 2025-03-15T10:00:00.", None)

    # Look up the service to compute end_time
    service = db.query(Service).filter(Service.id == service_id).first()
    if service is None:
        return (f"Service with ID {service_id} not found.", None)

    end_time = start_time + timedelta(minutes=service.duration_minutes)

    # Check availability
    ok, reason, _ = check_availability(db, service_id, start_time, end_time)
    if not ok:
        return (f"Sorry, that slot is not available: {reason}", None)

    # Store the pending booking
    pending = {
        "customer_name": customer_name,
        "customer_contact": customer_contact,
        "service_id": service_id,
        "service_name": service.name,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
    }
    _pending_bookings[session_id] = pending

    msg = (
        f"I'd like to confirm your booking:\n\n"
        f"  👤 **{customer_name}**\n"
        f"  📞 {customer_contact}\n"
        f"  ✂️ Service: {service.name} ({service.duration_minutes} min)\n"
        f"  📅 {start_time.strftime('%A, %B %d, %Y')}\n"
        f"  🕐 {start_time.strftime('%I:%M %p')} – {end_time.strftime('%I:%M %p')}\n\n"
        f"Please reply **yes** to confirm, or **no** to cancel."
    )
    return (msg, {"action": "create_appointment", "details": pending})


def _handle_find_availability(db: Session, args: dict) -> tuple[str, None]:
    """Handle find_availability — query slots and format them."""
    service_id = args["service_id"]
    date_str = args["date"]

    # Parse date
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return (f"Invalid date format: '{date_str}'. Please use YYYY-MM-DD.", None)

    service = db.query(Service).filter(Service.id == service_id).first()
    if service is None:
        return (f"Service with ID {service_id} not found.", None)

    slots = find_available_slots(db, service_id, target_date)

    if not slots:
        return (
            f"No available slots for **{service.name}** on {target_date.strftime('%A, %B %d, %Y')}.\n"
            f"Would you like to try a different date?",
            None,
        )

    lines = [f"Available slots for **{service.name}** on {target_date.strftime('%A, %B %d, %Y')}:\n"]
    for slot in slots:
        start_dt = datetime.fromisoformat(slot["start"])
        end_dt = datetime.fromisoformat(slot["end"])
        lines.append(f"  • {start_dt.strftime('%I:%M %p')} – {end_dt.strftime('%I:%M %p')}")

    lines.append("\nWhich time works best for you?")
    return ("\n".join(lines), None)


def _handle_cancel_appointment(db: Session, args: dict) -> tuple[str, None]:
    """Handle cancel_appointment — cancel if exists and not already cancelled."""
    appointment_id = args["appointment_id"]

    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if appt is None:
        return (f"Appointment #{appointment_id} not found.", None)

    if appt.status == AppointmentStatus.cancelled.value:
        return (f"Appointment #{appointment_id} is already cancelled.", None)

    appt.status = AppointmentStatus.cancelled.value
    db.commit()

    return (f"Appointment #{appointment_id} has been cancelled successfully.", None)


def _handle_get_appointment_status(db: Session, args: dict) -> tuple[str, None]:
    """Handle get_appointment_status — return appointment details."""
    appointment_id = args["appointment_id"]

    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if appt is None:
        return (f"Appointment #{appointment_id} not found.", None)

    service = db.query(Service).filter(Service.id == appt.service_id).first()
    svc_name = service.name if service else "Unknown"

    msg = (
        f"Here's the status of your appointment:\n\n"
        f"  📋 Appointment #{appt.id}\n"
        f"  👤 {appt.customer_name}\n"
        f"  ✂️ Service: {svc_name}\n"
        f"  📅 {appt.start_time.strftime('%A, %B %d, %Y')}\n"
        f"  🕐 {appt.start_time.strftime('%I:%M %p')} – {appt.end_time.strftime('%I:%M %p')}\n"
        f"  📌 Status: **{appt.status.upper()}**\n"
        f"  🏷️ Created via: {appt.created_via}"
    )
    return (msg, None)


def _handle_ask_clarification(args: dict) -> tuple[str, None]:
    """Handle ask_clarification — return the question to the user."""
    return (args["question"], None)


# Map function names to handlers
_FUNCTION_HANDLERS = {
    "create_appointment": _handle_create_appointment,
    "find_availability": _handle_find_availability,
    "cancel_appointment": _handle_cancel_appointment,
    "get_appointment_status": _handle_get_appointment_status,
    "ask_clarification": _handle_ask_clarification,
}


# ──────────────────────────────────────
# Main entry point
# ──────────────────────────────────────

async def process_message(
    db: Session, session_id: str, user_message: str
) -> ChatResponse:
    """
    Process a user message through the Gemini function-calling loop.

    Steps:
      1. Check for pending booking confirmation/rejection
      2. Load chat history from DB
      3. Build Gemini messages array
      4. Call Gemini with function-calling tools
      5. Handle any function calls (may loop)
      6. Save user + assistant messages to DB
      7. Return ChatResponse
    """
    if not settings.GEMINI_API_KEY:
        return ChatResponse(
            session_id=session_id,
            reply="I'm sorry, the AI assistant is not configured yet. Please set the GEMINI_API_KEY environment variable.",
            pending_action=None,
        )

    # ── Step 1: Check for pending booking confirmation ──
    pending = _pending_bookings.get(session_id)
    if pending and _is_confirmation(user_message):
        # Actually create the appointment in the DB
        start_time = datetime.fromisoformat(pending["start_time"])
        end_time = datetime.fromisoformat(pending["end_time"])

        # Double-check availability one more time (race condition guard)
        ok, reason, _ = check_availability(db, pending["service_id"], start_time, end_time)
        if not ok:
            del _pending_bookings[session_id]
            _save_message(db, session_id, "user", user_message)
            reply = f"Sorry, that slot was just taken: {reason} Would you like to try a different time?"
            _save_message(db, session_id, "assistant", reply)
            return ChatResponse(session_id=session_id, reply=reply, pending_action=None)

        appt = Appointment(
            customer_name=pending["customer_name"],
            customer_contact=pending["customer_contact"],
            service_id=pending["service_id"],
            start_time=start_time,
            end_time=end_time,
            status=AppointmentStatus.confirmed.value,
            created_via=CreatedVia.chat.value,
        )
        db.add(appt)
        db.commit()
        db.refresh(appt)

        # Clear the pending booking
        del _pending_bookings[session_id]

        _save_message(db, session_id, "user", user_message)
        reply = (
            f"✅ Your appointment has been booked successfully!\n\n"
            f"  📋 Appointment #{appt.id}\n"
            f"  👤 {pending['customer_name']}\n"
            f"  ✂️ {pending['service_name']}\n"
            f"  📅 {start_time.strftime('%A, %B %d, %Y')}\n"
            f"  🕐 {start_time.strftime('%I:%M %p')} – {end_time.strftime('%I:%M %p')}\n\n"
            f"Is there anything else I can help you with?"
        )
        _save_message(db, session_id, "assistant", reply)
        return ChatResponse(session_id=session_id, reply=reply, pending_action=None)

    if pending and _is_rejection(user_message):
        del _pending_bookings[session_id]
        _save_message(db, session_id, "user", user_message)
        reply = "No problem, the booking has been cancelled. Is there anything else I can help you with?"
        _save_message(db, session_id, "assistant", reply)
        return ChatResponse(session_id=session_id, reply=reply, pending_action=None)

    # ── Step 2: Load chat history ──
    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    # ── Step 3: Build Gemini messages ──
    system_prompt = _build_system_prompt(db)
    gemini_contents: list[types.Content] = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=system_prompt)],
        ),
        types.Content(
            role="model",
            parts=[types.Part.from_text(text="Understood! I'm ready to help with appointment bookings. What can I do for you?")],
        ),
    ]

    for msg in history:
        role = "user" if msg.role == "user" else "model"
        gemini_contents.append(
            types.Content(role=role, parts=[types.Part.from_text(text=msg.content)])
        )

    # Add the current user message
    gemini_contents.append(
        types.Content(role="user", parts=[types.Part.from_text(text=user_message)])
    )

    # ── Step 4: Call Gemini ──
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    tools = [types.Tool(function_declarations=_get_function_declarations())]

    pending_action = None
    final_reply = ""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=gemini_contents,
            config=types.GenerateContentConfig(
                tools=tools,
                temperature=0.3,
            ),
        )

        # ── Step 5: Handle function calls (loop until no more) ──
        while True:
            candidate = response.candidates[0]
            if not candidate.content or not candidate.content.parts:
                break

            # Check if there are function calls
            func_call_parts = [
                p for p in candidate.content.parts if p.function_call
            ]

            if not func_call_parts:
                # No function calls — extract the text reply
                text_parts = [p.text for p in candidate.content.parts if hasattr(p, "text") and p.text]
                final_reply = "\n".join(text_parts)
                break

            # Process each function call
            # Add model's function-call turn to conversation
            gemini_contents.append(candidate.content)

            function_responses = []
            for part in func_call_parts:
                fc = part.function_call
                handler = _FUNCTION_HANDLERS.get(fc.name)
                if handler:
                    try:
                        # create_appointment needs session_id
                        if fc.name == "create_appointment":
                            result_text, pa = handler(db, session_id, fc.args)
                        else:
                            result_text, _ = handler(db, fc.args)

                        if pa is not None:
                            pending_action = pa

                        function_responses.append(
                            types.Part.from_function_response(
                                name=fc.name,
                                response={"result": result_text},
                            )
                        )
                    except Exception as e:
                        function_responses.append(
                            types.Part.from_function_response(
                                name=fc.name,
                                response={"result": f"Error processing function: {str(e)}"},
                            )
                        )
                else:
                    function_responses.append(
                        types.Part.from_function_response(
                            name=fc.name,
                            response={"result": f"Unknown function: {fc.name}"},
                        )
                    )

            # Add function response turn
            gemini_contents.append(
                types.Content(role="user", parts=function_responses)
            )

            # Call Gemini again with the function results
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=gemini_contents,
                config=types.GenerateContentConfig(
                    tools=tools,
                    temperature=0.3,
                ),
            )

        # If we still don't have a reply, generate one without tools
        if not final_reply:
            if response.candidates and response.candidates[0].content:
                text_parts = [
                    p.text for p in response.candidates[0].content.parts
                    if hasattr(p, "text") and p.text
                ]
                final_reply = "\n".join(text_parts)

        if not final_reply:
            final_reply = "I'm not sure how to help with that. Could you please rephrase your request?"

    except Exception as e:
        final_reply = f"I encountered an error while processing your request. Please try again. (Error: {str(e)})"
        pending_action = None

    # ── Step 6: Save messages to DB ──
    _save_message(db, session_id, "user", user_message)
    _save_message(db, session_id, "assistant", final_reply)

    # ── Step 7: Return ──
    return ChatResponse(
        session_id=session_id,
        reply=final_reply,
        pending_action=pending_action,
    )


def _save_message(db: Session, session_id: str, role: str, content: str) -> None:
    """Persist a chat message to the database."""
    msg = ChatMessage(session_id=session_id, role=role, content=content)
    db.add(msg)
    db.commit()
