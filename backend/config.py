"""
Application configuration using pydantic-settings.
Reads from environment variables with sensible defaults.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database — switch to postgresql+psycopg2://... for production
    DATABASE_URL: str = "sqlite:///./appointment_booking.db"

    # JWT auth
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Gemini API
    GEMINI_API_KEY: str = ""

    # Business hours (24h format)
    BUSINESS_HOUR_START: int = 9   # 9:00 AM
    BUSINESS_HOUR_END: int = 17    # 5:00 PM
    BUSINESS_DAYS: list[int] = [0, 1, 2, 3, 4, 5, 6]  # Mon–Sun (all days open)
    TIMEZONE: str = "Asia/Kolkata"

    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"


settings = Settings()
