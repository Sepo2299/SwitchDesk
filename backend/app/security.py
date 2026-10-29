"""Argon2 passwords and twelve-hour signed bearer sessions."""
import os
import secrets
from pathlib import Path
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

hasher = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)

def signing_secret():
    configured = os.getenv("SECRET_KEY", "").strip()
    if configured and not configured.startswith("replace-"):
        if len(configured) < 32:
            raise RuntimeError("SECRET_KEY must have at least 32 characters")
        return configured
    if os.getenv("APP_ENV", "development") == "production":
        raise RuntimeError("Set a strong SECRET_KEY before running in production")
    # Keep local sessions valid across restarts without shipping a shared secret.
    path = Path(__file__).resolve().parent.parent / ".dev-secret"
    try:
        with path.open("x", encoding="utf8") as handle:
            handle.write(secrets.token_urlsafe(48))
    except FileExistsError:
        pass
    return path.read_text(encoding="utf8").strip()

SECRET_KEY = signing_secret()
def hash_password(password: str):
    return hasher.hash(password)
def verify_password(password: str, hashed: str):
    return hasher.verify(password, hashed)
def create_token(user_id: int):
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": str(user_id), "iat": now, "exp": now + timedelta(hours=12)}, SECRET_KEY, algorithm="HS256")
def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if credentials is None:
        raise HTTPException(401, "Sign in to access this workspace", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"], options={"require": ["sub", "exp"]})
        user = db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, ValueError, KeyError, TypeError):
        user = None
    if not user:
        raise HTTPException(401, "Invalid or expired session", headers={"WWW-Authenticate": "Bearer"})
    return user
