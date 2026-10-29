"""Create the first hosted administrator from deployment environment values."""
import os
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import User
from .security import hash_password


def create_initial_admin(db: Session):
    email = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")
    if not email and not password:
        return
    if not email or not password:
        raise RuntimeError("Set both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD")
    if len(password) < 12 or not password.strip():
        raise RuntimeError("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters")
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        if existing.role != "admin":
            raise RuntimeError("The bootstrap email already belongs to a non-administrator")
        return
    db.add(User(name="Administrator", email=email, password_hash=hash_password(password), role="admin"))
    db.commit()
