import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash

load_dotenv()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").strip().lower()
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")

JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60

password_hasher = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


def verify_admin_password(email: str, password: str) -> bool:
    if not ADMIN_EMAIL or not ADMIN_PASSWORD_HASH:
        return False

    if email.strip().lower() != ADMIN_EMAIL:
        return False

    try:
        return password_hasher.verify(password, ADMIN_PASSWORD_HASH)
    except Exception:
        return False


def _create_token(email: str, role: str) -> str:
    if not JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY is not configured.")

    now = datetime.now(timezone.utc)

    payload = {
        "sub": email.strip().lower(),
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_EXPIRE_MINUTES),
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_access_token(email: str) -> str:
    """Create an admin token."""
    return _create_token(email, "admin")


def create_employee_access_token(email: str) -> str:
    """Create an employee token."""
    return _create_token(email, "employee")


def _decode_token(credentials: HTTPAuthorizationCredentials):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET_KEY is not configured.",
        )

    try:
        return jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Session expired. Please sign in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    payload = _decode_token(credentials)

    email = payload.get("sub")
    role = payload.get("role")

    if (
        not email
        or role != "admin"
        or email.strip().lower() != ADMIN_EMAIL
    ):
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    return {
        "email": email,
        "role": "admin",
    }


def get_current_employee(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    payload = _decode_token(credentials)

    email = payload.get("sub")
    role = payload.get("role")

    if not email or role != "employee":
        raise HTTPException(
            status_code=403,
            detail="Employee access required.",
        )

    return {
        "email": email,
        "role": "employee",
    }