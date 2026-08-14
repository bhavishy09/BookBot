import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db
from models import AdminUser, Service, Appointment, AppointmentStatus, CreatedVia
from passlib.hash import bcrypt

# Set up test database engine
TEST_DATABASE_URL = "sqlite:///./test_booking.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    """Create test tables and seed initial data, then clean up after tests."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed services
    services = [
        Service(id=1, name="Haircut", duration_minutes=30),
        Service(id=2, name="Hair Coloring", duration_minutes=60),
        Service(id=3, name="Beard Trim", duration_minutes=15),
    ]
    db.add_all(services)
    
    # Seed admin user (admin@example.com / admin123)
    admin = AdminUser(
        email="admin@example.com",
        password_hash=bcrypt.hash("admin123"),
    )
    db.add(admin)
    
    db.commit()
    db.close()
    
    yield
    
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Yield a database session and roll back changes after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Override get_db with the test session and yield TestClient."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)


# ──────────────────────────────────────────────────────────────────────
# Authentication Tests
# ──────────────────────────────────────────────────────────────────────

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_login_success(client):
    response = client.post("/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_failure(client):
    response = client.post("/auth/login", json={"email": "admin@example.com", "password": "wrongpassword"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


# ──────────────────────────────────────────────────────────────────────
# Appointment CRUD & Conflict Tests
# ──────────────────────────────────────────────────────────────────────

def test_list_services(client):
    response = client.get("/appointments/services")
    assert response.status_code == 200
    services = response.json()
    assert len(services) == 3
    assert services[0]["name"] == "Haircut"


def test_create_appointment_unauthorized(client):
    start = datetime.now() + timedelta(days=1)
    end = start + timedelta(minutes=30)
    
    payload = {
        "customer_name": "Test Client",
        "customer_contact": "555-0199",
        "service_id": 1,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "created_via": "admin"
    }
    
    response = client.post("/appointments/", json=payload)
    assert response.status_code == 403


def test_create_appointment_success(client):
    # Log in to get token
    login_res = client.post("/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 24 hours in the future
    start = datetime.now() + timedelta(days=1, hours=2)
    # Ensure it fits business hours (e.g. 11:00 AM)
    start = start.replace(hour=11, minute=0, second=0, microsecond=0)
    end = start + timedelta(minutes=30)
    
    payload = {
        "customer_name": "Test Client",
        "customer_contact": "555-0199",
        "service_id": 1,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "created_via": "admin"
    }
    
    response = client.post("/appointments/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["customer_name"] == "Test Client"
    assert data["service_name"] == "Haircut"
    assert data["status"] == "confirmed"


def test_conflict_prevention_different_services(client):
    """
    Verify conflict checking blocks overlapping appointments even for DIFFERENT services
    (strict single-provider resource scheduling).
    """
    # Log in
    login_res = client.post("/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    start = datetime.now() + timedelta(days=1, hours=4)
    start = start.replace(hour=13, minute=0, second=0, microsecond=0)
    end1 = start + timedelta(minutes=30)  # Haircut: 13:00 - 13:30
    
    # Create first appointment for service 1 (Haircut)
    payload1 = {
        "customer_name": "Customer A",
        "customer_contact": "555-0001",
        "service_id": 1, # Haircut
        "start_time": start.isoformat(),
        "end_time": end1.isoformat(),
        "created_via": "admin"
    }
    res1 = client.post("/appointments/", json=payload1, headers=headers)
    assert res1.status_code == 201
    
    # Attempt second appointment for service 2 (Hair Coloring: 60 mins) starting at 13:15 (overlaps with 13:00 - 13:30)
    start2 = start + timedelta(minutes=15) # 13:15
    end2 = start2 + timedelta(minutes=60) # 14:15
    
    payload2 = {
        "customer_name": "Customer B",
        "customer_contact": "555-0002",
        "service_id": 2, # Hair Coloring
        "start_time": start2.isoformat(),
        "end_time": end2.isoformat(),
        "created_via": "admin"
    }
    
    res2 = client.post("/appointments/", json=payload2, headers=headers)
    assert res2.status_code == 409  # Conflict!
    assert "conflicts with an existing appointment" in res2.json()["detail"]


# ──────────────────────────────────────────────────────────────────────
# Availability Engine Edge Cases
# ──────────────────────────────────────────────────────────────────────

def test_past_time_booking_prevention(client):
    login_res = client.post("/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2 hours in the past
    start = datetime.now() - timedelta(hours=2)
    end = start + timedelta(minutes=30)
    
    payload = {
        "customer_name": "Past Customer",
        "customer_contact": "555-0003",
        "service_id": 1,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "created_via": "admin"
    }
    
    res = client.post("/appointments/", json=payload, headers=headers)
    assert res.status_code == 400
    assert "Cannot book an appointment in the past." in res.json()["detail"]


def test_business_hours_out_of_bounds(client):
    login_res = client.post("/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 8:00 AM (business starts at 9:00 AM)
    start = datetime.now() + timedelta(days=1)
    start = start.replace(hour=8, minute=0, second=0, microsecond=0)
    end = start + timedelta(minutes=30)
    
    payload = {
        "customer_name": "Early Customer",
        "customer_contact": "555-0004",
        "service_id": 1,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "created_via": "admin"
    }
    
    res = client.post("/appointments/", json=payload, headers=headers)
    assert res.status_code == 400
    assert "is before business hours" in res.json()["detail"]


# ──────────────────────────────────────────────────────────────────────
# Rescheduling Logic Tests
# ──────────────────────────────────────────────────────────────────────

def test_reschedule_appointment_success(client):
    login_res = client.post("/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create initial appointment: 15:00 - 15:30
    start = datetime.now() + timedelta(days=1)
    start = start.replace(hour=15, minute=0, second=0, microsecond=0)
    end = start + timedelta(minutes=30)
    
    payload = {
        "customer_name": "Reschedule Customer",
        "customer_contact": "555-0005",
        "service_id": 1,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "created_via": "admin"
    }
    res = client.post("/appointments/", json=payload, headers=headers)
    assert res.status_code == 201
    appt_id = res.json()["id"]
    
    # Reschedule to 16:00
    new_start = start.replace(hour=16, minute=0)
    new_end = start.replace(hour=16, minute=30)
    
    update_payload = {
        "start_time": new_start.isoformat(),
        "end_time": new_end.isoformat()
    }
    
    res_update = client.put(f"/appointments/{appt_id}", json=update_payload, headers=headers)
    assert res_update.status_code == 200
    assert res_update.json()["start_time"] == new_start.isoformat()


def test_reschedule_appointment_conflict(client):
    login_res = client.post("/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create Appt 1: 14:00 - 14:30
    start1 = datetime.now() + timedelta(days=1)
    start1 = start1.replace(hour=14, minute=0, second=0, microsecond=0)
    end1 = start1 + timedelta(minutes=30)
    
    res1 = client.post("/appointments/", json={
        "customer_name": "Appt 1 Customer",
        "customer_contact": "555-1001",
        "service_id": 1,
        "start_time": start1.isoformat(),
        "end_time": end1.isoformat(),
        "created_via": "admin"
    }, headers=headers)
    appt1_id = res1.json()["id"]
    
    # Create Appt 2: 15:00 - 15:30
    start2 = start1.replace(hour=15, minute=0)
    end2 = start1.replace(hour=15, minute=30)
    
    client.post("/appointments/", json={
        "customer_name": "Appt 2 Customer",
        "customer_contact": "555-1002",
        "service_id": 1,
        "start_time": start2.isoformat(),
        "end_time": end2.isoformat(),
        "created_via": "admin"
    }, headers=headers)
    
    # Attempt to reschedule Appt 1 to overlap with Appt 2 (e.g. 15:15)
    bad_start = start1.replace(hour=15, minute=15)
    bad_end = start1.replace(hour=15, minute=45)
    
    res_update = client.put(f"/appointments/{appt1_id}", json={
        "start_time": bad_start.isoformat(),
        "end_time": bad_end.isoformat()
    }, headers=headers)
    assert res_update.status_code == 409  # Conflict!
