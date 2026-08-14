"""
FastAPI application entry point.
Mounts all routers and creates DB tables on startup.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth, appointments, chat


# Create all tables on startup (suitable for dev; use Alembic in prod)
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Appointment Booking Assistant",
    description="AI-powered appointment booking with admin dashboard",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow the React dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(appointments.router)
app.include_router(chat.router)


@app.get("/health")
async def health_check():
    """Simple health-check endpoint."""
    return {"status": "ok"}
