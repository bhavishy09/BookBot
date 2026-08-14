# BookBot — AI-Powered Appointment Booking Assistant

BookBot is an intelligent, conversational booking assistant designed for a local barbershop or salon. It allows customers to browse services, check availability, book appointments, reschedule, and cancel bookings via natural language, while providing a secure web dashboard for administrators to manage appointments.

---

## 1. Abstract

Modern service-based businesses face significant overhead managing scheduling conflicts, cancellations, and inquiries. BookBot addresses this with a two-surface full-stack architecture:
1. **User Chat Interface**: A responsive, web-based conversational interface powered by Google Gemini and structured function-calling, translating natural language into validated database transactions.
2. **Admin Dashboard**: A secure CRUD management panel where staff can review, filter, create, reschedule, or cancel appointments manually.

The core innovation is the tight integration between natural language processing (NLU) and a deterministic scheduling engine, ensuring that scheduling constraints (business hours, past times, and overlapping bookings) are strictly enforced prior to database entry.

---

## 2. Spec & Plan

### System Design (High-Level Architecture)

```mermaid
graph TD
    subgraph Frontend [React Web App]
        Chat[Chat Interface /]
        Dash[Admin Dashboard /admin]
        Login[Login Page /login]
    end

    subgraph Backend [FastAPI Application]
        AuthRouter[/auth/login]
        ApptRouter[/appointments]
        ChatRouter[/chat]
        GeminiClient[Gemini Client / NLU Function Loop]
        AvailEngine[Availability Engine]
    end

    subgraph Storage [SQLite / PostgreSQL]
        DB[(Database Tables)]
    end

    Chat -->|POST /chat| ChatRouter
    Dash -->|GET/POST/PUT/POST-cancel| ApptRouter
    Login -->|POST| AuthRouter
    
    ChatRouter --> GeminiClient
    GeminiClient -->|Function Call| AvailEngine
    AvailEngine -->|Query / Verify| DB
    GeminiClient -->|Store Chat History| DB
    ApptRouter -->|CRUD operations| DB
```

- **Frontend**: Single Page Application (SPA) built with React, Vite, and React Router. Uses pure vanilla CSS with custom properties for a responsive layout, custom typing animations, and notifications.
- **Backend**: FastAPI framework providing REST endpoints, CORS middleware, and JWT authentication.
- **AI/NLU Layer**: Google GenAI SDK orchestrating a multi-turn function-calling loop with `gemini-2.0-flash`.
- **Database**: SQLAlchemy ORM for relational mapping. SQLite is used for local development (`appointment_booking.db`), migrating seamlessly to PostgreSQL in production via `DATABASE_URL`.

### Feature Breakdown
- **Dynamic System Prompt**: Injects available services and business hours directly into Gemini's context on every invocation.
- **Timezone-Aware Operations**: Handles server vs. client timezone discrepancies, checking if booking dates are in the past relative to the business local timezone.
- **NLU Double-Booking Prevention**: Resolves natural language booking queries to concrete datetime slots and runs them through a strict, database-wide overlap validation.
- **Conversational Rescheduling & Cancellation**: Enables users to update or delete appointments by booking ID through chat (e.g. *"Move appointment #5 to tomorrow at 3 PM"*).
- **Admin Management Panel**: Full CRUD operations for admin users, complete with status and date filtering, responsive layouts, and authentication guards.

### Prompt Design (Gemini)
Gemini 2.0 Flash is configured with a system instruction prompt detailing its role as a barbershop receptionist. To make date resolution work reliably, the system prompt dynamically injects the **current local date, time, and day of the week** at the beginning of each turn. This allows the model to correctly translate relative terms (like *"tomorrow"* or *"next Tuesday"*) to exact calendar dates (e.g., `YYYY-MM-DD`).

The assistant is equipped with 6 function tools:
1. `find_availability(service_id, date)`: Searches and lists open 15-minute aligned slots.
2. `create_appointment(customer_name, customer_contact, service_id, start_time)`: Sets up a pending booking.
3. `reschedule_appointment(appointment_id, new_start_time)`: Updates an existing slot.
4. `cancel_appointment(appointment_id)`: Marks an appointment as cancelled.
5. `get_appointment_status(appointment_id)`: Queries current booking details.
6. `ask_clarification(question)`: Prompts the customer for missing details.

### Data Model
The database consists of 4 tables:
```sql
CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    duration_minutes INTEGER NOT NULL
);

CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name VARCHAR(200) NOT NULL,
    customer_contact VARCHAR(200) NOT NULL,
    service_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled, completed
    created_via VARCHAR(10) NOT NULL DEFAULT 'admin', -- chat, admin
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL, -- user, assistant
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Implementation Plan (Phases)
1. **Scaffold**: Fast API router skeletons, SQLAlchemy models, and React boilerplate.
2. **Core CRUD**: Build the REST API, JWT auth, and admin dashboard table/modals.
3. **AI Chat Loop**: Connect React frontend to FastAPI `/chat/`, initialize the Gemini SDK, and write function handlers.
4. **Edge Cases**: Refine conflict logic (all services), implement timezone helpers, and dynamic date injection.
5. **Verification**: Write integration test suite (`test_main.py`), complete documentation (`README.md`, `info.md`), and verify builds.

---

## 3. Implementation Details

### AI Tools & Models Used

- **NLU Layer (Chat Bot)**: `gemini-2.0-flash`
  - *Why*: Chosen for its sub-second response times, excellent instruction-following, native function-calling capability, and generous free tier.
- **Code Generation & Auditing**: `gemini-3.5-flash` / Antigravity Agent
  - *Why*: Used to analyze the initial codebase, write the `pytest` integration test suite, locate logic gaps (like service-specific overlap bugs), and implement localized timezone scheduling.

### Estimated Token Usage (Per Chat Session)
- **Input Tokens per Turn**: ~800 tokens
  - Context includes the system instruction prompt (~300 tokens), dynamic services list (~150 tokens), chat history (increases by ~100-200 tokens per turn), and function call returns.
- **Output Tokens per Turn**: ~80-150 tokens
  - Gemini outputs either a direct structured function call (minimal tokens) or a concise user response.
- **Total Session (5-turn conversation)**: ~5,000 input tokens, ~600 output tokens.

---

## 4. Edge Cases Handled

The application is hardened against several edge cases in the scheduling flow:

1. **Database-Wide Overlap Booking (Single Provider)**:
   - *Scenario*: Booking a Haircut (30 mins) at 10 AM, then booking a Massage (60 mins) at 10:15 AM.
   - *Fix*: The backend availability engine checks overlap across *all* service IDs on the calendar. An existing confirmed slot blocks any other appointment from starting within its range.
2. **Out of Business Hours**:
   - *Scenario*: Booking at 8:00 AM or extending past 5:00 PM.
   - *Fix*: The backend checks boundary limits (`start_time < biz_start` and `end_time > biz_end`) and returns a `400 Bad Request` with a helpful message.
3. **Past-Time Bookings (Timezone Discrepancy)**:
   - *Scenario*: The cloud server runs on UTC, but a client in India tries to book a slot that has already passed locally.
   - *Fix*: The system utilizes the configured local timezone (`Asia/Kolkata`) and a `get_business_now()` helper to retrieve current local wall-clock time, comparing it against naive database-bound datetimes.
4. **Natural Language Date Ambiguities**:
   - *Scenario*: A customer says *"next Friday"* or *"tomorrow"*.
   - *Fix*: By injecting the current local weekday and calendar date into Gemini's system instructions, the NLU engine translates relative dates into exact ISO format.
5. **Race Condition Guard**:
   - *Scenario*: Two users try to confirm the same slot at the same time.
   - *Fix*: When the user replies *"yes"* to confirm a pending booking, the backend runs the availability check a **second time** immediately before committing to the database.
6. **Frontend State Persistence**:
   - *Scenario*: The user completes a booking, but the "Pending Action" banner remains stuck on the screen.
   - *Fix*: The React state `pendingAction` is set to `null` if the response `pending_action` field returns `null` or is empty.
