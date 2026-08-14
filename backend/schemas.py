"""
Pydantic schemas for request/response validation.
These are separate from ORM models to decouple API shape from DB shape.
"""
from datetime import datetime

from pydantic import BaseModel, EmailStr


# ──────────────────────────────────────
# Service schemas
# ──────────────────────────────────────
class ServiceOut(BaseModel):
    id: int
    name: str
    duration_minutes: int

    model_config = {"from_attributes": True}


# ──────────────────────────────────────
# Appointment schemas
# ──────────────────────────────────────
class AppointmentCreate(BaseModel):
    """Payload for creating an appointment (admin or chat)."""
    customer_name: str
    customer_contact: str
    service_id: int
    start_time: datetime
    end_time: datetime
    created_via: str = "admin"


class AppointmentUpdate(BaseModel):
    """Partial update — only supplied fields are changed."""
    customer_name: str | None = None
    customer_contact: str | None = None
    service_id: int | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    status: str | None = None


class AppointmentOut(BaseModel):
    """Full appointment returned to the frontend."""
    id: int
    customer_name: str
    customer_contact: str
    service_id: int
    service_name: str = ""  # populated via join
    start_time: datetime
    end_time: datetime
    status: str
    created_via: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────
# Auth schemas
# ──────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ──────────────────────────────────────
# Chat schemas
# ──────────────────────────────────────
class ChatRequest(BaseModel):
    """User message sent to the /chat endpoint."""
    session_id: str
    message: str


class ChatResponse(BaseModel):
    """Assistant reply returned from /chat."""
    session_id: str
    reply: str
    pending_action: dict | None = None  # e.g. {"action": "create_appointment", ...}


class ChatMessageOut(BaseModel):
    """A single persisted chat message."""
    id: int
    session_id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
