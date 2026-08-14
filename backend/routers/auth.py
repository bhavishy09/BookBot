from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.hash import bcrypt as bcrypt_hash
from pydantic import EmailStr
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import AdminUser
from schemas import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# Bearer-token extractor
bearer_scheme = HTTPBearer()


# ──────────────────────────────────────
# JWT helpers
# ──────────────────────────────────────
def _create_token(admin_id: int, admin_email: str) -> str:
    """Create a signed JWT access token."""
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": admin_email,
        "id": admin_id,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    """
    FastAPI dependency that decodes the JWT from the Authorization header
    and returns the corresponding AdminUser ORM object.

    Raises 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        admin_id: int | None = payload.get("id")
        if admin_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials.")

    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if admin is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin user not found.")

    return admin


# ──────────────────────────────────────
# Endpoints
# ──────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Validate email + password and return a JWT access token.

    Returns 401 if credentials don't match.
    """
    admin = db.query(AdminUser).filter(AdminUser.email == body.email).first()

    # User not found or password doesn't match
    if admin is None or not bcrypt_hash.verify(body.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = _create_token(admin.id, admin.email)
    return TokenResponse(access_token=token, token_type="bearer")
