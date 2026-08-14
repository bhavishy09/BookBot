"""
Availability engine — checks whether a time slot is bookable and
finds all open slots for a given service + date.

Business rules:
  - Business hours: configurable (default 9 AM – 5 PM)
  - Open every day of the week (configurable)
  - Slots align to 15-minute boundaries
  - No double-booking: appointments must not overlap
  - No past-time booking
"""
from datetime import datetime, timedelta, date, time
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from config import settings
from models import Service, Appointment, AppointmentStatus


def get_business_now() -> datetime:
    """Return the current datetime in the business timezone, as a naive datetime (representing local time)."""
    tz = ZoneInfo(settings.TIMEZONE)
    return datetime.now(tz).replace(tzinfo=None)


# Slot alignment granularity (15 minutes)
SLOT_GRANULARITY_MINUTES = 15


def _business_start(dt: date) -> datetime:
    """Return the business-hour start datetime for a given date."""
    return datetime.combine(dt, time(hour=settings.BUSINESS_HOUR_START, minute=0))


def _business_end(dt: date) -> datetime:
    """Return the business-hour end datetime for a given date."""
    return datetime.combine(dt, time(hour=settings.BUSINESS_HOUR_END, minute=0))


def _times_overlap(
    s1: datetime, e1: datetime, s2: datetime, e2: datetime
) -> bool:
    """Return True if the two time ranges overlap (exclusive end)."""
    return s1 < e2 and s2 < e1


def check_availability(
    db: Session,
    service_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_id: int | None = None,
) -> tuple[bool, str, int]:
    """
    Check whether a specific time slot is available for booking.

    Returns:
        (True, "", 0) if the slot is available.
        (False, reason_string, suggested_http_status) if not bookable.
            suggested_http_status is 400 for bad input, 409 for conflicts.
    """
    BAD_REQUEST = 400
    CONFLICT = 409
    now = get_business_now()

    # 1. Past-time check
    if start_time < now:
        return False, "Cannot book an appointment in the past.", BAD_REQUEST

    # 2. Business day check
    target_date = start_time.date()
    if target_date.weekday() not in settings.BUSINESS_DAYS:
        return False, (
            f"We're not open on {target_date.strftime('%A')}. "
            f"Business days: {settings.BUSINESS_DAYS}."
        ), BAD_REQUEST

    # 3. Business hours check
    biz_start = _business_start(target_date)
    biz_end = _business_end(target_date)

    if start_time < biz_start:
        return False, (
            f"Requested start time ({start_time.strftime('%H:%M')}) is before "
            f"business hours ({settings.BUSINESS_HOUR_START}:00)."
        ), BAD_REQUEST
    if end_time > biz_end:
        return False, (
            f"Requested end time ({end_time.strftime('%H:%M')}) is after "
            f"business hours ({settings.BUSINESS_HOUR_END}:00)."
        ), BAD_REQUEST

    # 4. End must be after start
    if end_time <= start_time:
        return False, "End time must be after start time.", BAD_REQUEST

    # 5. Double-booking check — only look at confirmed/completed appointments
    query = db.query(Appointment).filter(
        Appointment.status.in_([AppointmentStatus.confirmed, AppointmentStatus.completed]),
        Appointment.start_time < end_time,
        Appointment.end_time > start_time,
    )
    if exclude_id is not None:
        query = query.filter(Appointment.id != exclude_id)

    conflicting = query.first()
    if conflicting:
        return False, (
            f"Time slot conflicts with an existing appointment "
            f"(#{conflicting.id}: {conflicting.start_time.strftime('%H:%M')}–"
            f"{conflicting.end_time.strftime('%H:%M')})."
        ), CONFLICT

    return True, "", 0


def find_available_slots(
    db: Session,
    service_id: int,
    target_date: date,
) -> list[dict]:
    """
    Find all available time slots for a service on a given date.
    Each slot is the service's full duration, aligned to 15-minute boundaries.
    Returns a list of dicts: [{"start": iso_string, "end": iso_string}, ...]
    """
    service = db.query(Service).filter(Service.id == service_id).first()
    if service is None:
        return []

    duration = timedelta(minutes=service.duration_minutes)
    step = timedelta(minutes=SLOT_GRANULARITY_MINUTES)

    biz_start = _business_start(target_date)
    biz_end = _business_end(target_date)

    now = get_business_now()
    if biz_end <= now:
        return []

    # Adjust start if today — skip slots that have already passed
    effective_start = biz_start
    if target_date == now.date():
        minutes_past = now.hour * 60 + now.minute
        slots_past = (minutes_past // SLOT_GRANULARITY_MINUTES) + 1
        effective_start = biz_start + timedelta(minutes=slots_past * SLOT_GRANULARITY_MINUTES)

    existing = db.query(Appointment).filter(
        Appointment.status.in_([AppointmentStatus.confirmed, AppointmentStatus.completed]),
        Appointment.start_time < biz_end,
        Appointment.end_time > biz_start,
    ).all()

    available: list[dict] = []
    candidate = effective_start

    while candidate + duration <= biz_end:
        candidate_end = candidate + duration
        is_free = True
        for appt in existing:
            if _times_overlap(candidate, candidate_end, appt.start_time, appt.end_time):
                is_free = False
                break
        if is_free:
            available.append({
                "start": candidate.isoformat(),
                "end": candidate_end.isoformat(),
            })
        candidate += step

    return available
