"""
SQLAlchemy ORM models matching the brief's data model:
  - services
  - appointments
  - admin_users
  - chat_messages
"""
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, String, Text, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class AppointmentStatus(str, PyEnum):
    """Allowed appointment statuses."""
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"


class CreatedVia(str, PyEnum):
    """Tracks how the appointment was created."""
    chat = "chat"
    admin = "admin"


class MessageRole(str, PyEnum):
    """Roles stored in chat_messages."""
    user = "user"
    assistant = "assistant"


class Service(Base):
    """Available services that can be booked."""
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationship: one service → many appointments
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="service")


class Appointment(Base):
    """A single appointment booking."""
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    customer_contact: Mapped[str] = mapped_column(String(200), nullable=False)
    service_id: Mapped[int] = mapped_column(Integer, ForeignKey("services.id"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=AppointmentStatus.confirmed)
    created_via: Mapped[str] = mapped_column(String(10), nullable=False, default=CreatedVia.admin)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    # Relationship back to service
    service: Mapped["Service"] = relationship(back_populates="appointments")


class AdminUser(Base):
    """Admin user for dashboard login."""
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)


class ChatMessage(Base):
    """Persisted chat history for multi-turn Gemini context.
    Also serves as an audit trail."""
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # 'user' | 'assistant'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
