from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Appointment, Service, AppointmentStatus
from schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut, ServiceOut
from services.availability import check_availability
from routers.auth import get_current_user
from models import AdminUser

router = APIRouter(prefix="/appointments", tags=["appointments"])


# ──────────────────────────────────────
# Services (public)
# ──────────────────────────────────────
@router.get("/services", response_model=list[ServiceOut])
async def list_services(db: Session = Depends(get_db)):
    """Return all available services. Public — no auth required."""
    return db.query(Service).order_by(Service.id).all()


# ──────────────────────────────────────
# Appointments — list (public)
# ──────────────────────────────────────
@router.get("/", response_model=list[AppointmentOut])
async def list_appointments(
    db: Session = Depends(get_db),
    date: str | None = Query(None, description="Filter by date (YYYY-MM-DD)"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status"),
):
    """
    List all appointments with optional filters.
    Joins with the services table to include service_name.
    Public — no auth required.
    """
    query = (
        db.query(Appointment, Service.name.label("service_name"))
        .join(Service, Appointment.service_id == Service.id)
    )

    # Filter by date if provided
    if date:
        try:
            target = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(func.date(Appointment.start_time) == target)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format: '{date}'. Use YYYY-MM-DD.",
            )

    # Filter by status if provided
    if status_filter:
        valid_statuses = {s.value for s in AppointmentStatus}
        if status_filter not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: '{status_filter}'. Must be one of {valid_statuses}.",
            )
        query = query.filter(Appointment.status == status_filter)

    rows = query.order_by(Appointment.start_time).all()

    # Build response objects with service_name populated
    results = []
    for appt, svc_name in rows:
        out = AppointmentOut(
            id=appt.id,
            customer_name=appt.customer_name,
            customer_contact=appt.customer_contact,
            service_id=appt.service_id,
            service_name=svc_name,
            start_time=appt.start_time,
            end_time=appt.end_time,
            status=appt.status,
            created_via=appt.created_via,
            created_at=appt.created_at,
        )
        results.append(out)

    return results


# ──────────────────────────────────────
# Appointments — create (auth required)
# ──────────────────────────────────────
@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    body: AppointmentCreate,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_user),
):
    """
    Create a new appointment. Requires admin auth.
    Validates that the service exists and the time slot is available.
    """
    # Verify service exists
    service = db.query(Service).filter(Service.id == body.service_id).first()
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service with id={body.service_id} not found.",
        )

    # Check availability
    ok, reason, http_status = check_availability(
        db, body.service_id, body.start_time, body.end_time
    )
    if not ok:
        raise HTTPException(
            status_code=http_status or status.HTTP_409_CONFLICT,
            detail=reason,
        )

    # Create the appointment
    appt = Appointment(
        customer_name=body.customer_name,
        customer_contact=body.customer_contact,
        service_id=body.service_id,
        start_time=body.start_time,
        end_time=body.end_time,
        status=AppointmentStatus.confirmed.value,
        created_via=body.created_via,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    return AppointmentOut(
        id=appt.id,
        customer_name=appt.customer_name,
        customer_contact=appt.customer_contact,
        service_id=appt.service_id,
        service_name=service.name,
        start_time=appt.start_time,
        end_time=appt.end_time,
        status=appt.status,
        created_via=appt.created_via,
        created_at=appt.created_at,
    )


# ──────────────────────────────────────
# Appointments — partial update (auth)
# ──────────────────────────────────────
@router.put("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(
    appointment_id: int,
    body: AppointmentUpdate,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_user),
):
    """
    Partially update an appointment. Only provided fields are changed.
    If start_time/end_time or service_id change, re-checks availability.
    """
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if appt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment #{appointment_id} not found.",
        )

    # Track whether we need to re-validate availability
    time_or_service_changed = False

    if body.customer_name is not None:
        appt.customer_name = body.customer_name
    if body.customer_contact is not None:
        appt.customer_contact = body.customer_contact
    if body.service_id is not None:
        appt.service_id = body.service_id
        time_or_service_changed = True
    if body.start_time is not None:
        appt.start_time = body.start_time
        time_or_service_changed = True
    if body.end_time is not None:
        appt.end_time = body.end_time
        time_or_service_changed = True
    if body.status is not None:
        appt.status = body.status

    # Re-check availability if time or service changed
    if time_or_service_changed:
        ok, reason, http_status = check_availability(
            db, appt.service_id, appt.start_time, appt.end_time,
            exclude_id=appt.id,
        )
        if not ok:
            db.rollback()
            raise HTTPException(
                status_code=http_status or status.HTTP_409_CONFLICT,
                detail=reason,
            )

    db.commit()
    db.refresh(appt)

    # Fetch service name for the response
    service = db.query(Service).filter(Service.id == appt.service_id).first()
    svc_name = service.name if service else ""

    return AppointmentOut(
        id=appt.id,
        customer_name=appt.customer_name,
        customer_contact=appt.customer_contact,
        service_id=appt.service_id,
        service_name=svc_name,
        start_time=appt.start_time,
        end_time=appt.end_time,
        status=appt.status,
        created_via=appt.created_via,
        created_at=appt.created_at,
    )


# ──────────────────────────────────────
# Appointments — cancel (auth)
# ──────────────────────────────────────
@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
async def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_user),
):
    """
    Cancel an appointment by setting its status to 'cancelled'.
    Returns 404 if the appointment doesn't exist.
    Returns 400 if the appointment is already cancelled.
    """
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if appt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment #{appointment_id} not found.",
        )

    if appt.status == AppointmentStatus.cancelled.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Appointment #{appointment_id} is already cancelled.",
        )

    appt.status = AppointmentStatus.cancelled.value
    db.commit()
    db.refresh(appt)

    service = db.query(Service).filter(Service.id == appt.service_id).first()
    svc_name = service.name if service else ""

    return AppointmentOut(
        id=appt.id,
        customer_name=appt.customer_name,
        customer_contact=appt.customer_contact,
        service_id=appt.service_id,
        service_name=svc_name,
        start_time=appt.start_time,
        end_time=appt.end_time,
        status=appt.status,
        created_via=appt.created_via,
        created_at=appt.created_at,
    )
