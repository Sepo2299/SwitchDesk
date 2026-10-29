
"""Input validation and public API response shapes."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


# User roles
Role = Literal["employee", "technician", "admin"]

# Ticket priorities
Priority = Literal["Low", "Medium", "High", "Critical"]

# Ticket statuses
Status = Literal["Open", "In Progress", "Resolved", "Closed"]

# Ticket categories
Category = Literal["Hardware", "Software", "Network", "Access", "Other"]


# ==================================================
# AUTHENTICATION
# ==================================================

class TrimmedModel(BaseModel):
    @field_validator("*", mode="before")
    @classmethod
    def trim_text(cls, value, info):
        return value.strip() if isinstance(value, str) and info.field_name != "password" else value


class Register(TrimmedModel):
    """Validate information when registering a new user."""

    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class Login(TrimmedModel):
    """Validate login credentials, including local demo accounts."""

    # Use str because EmailStr rejects reserved .local domains.
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    """Define user information returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: Role


# ==================================================
# TICKET MANAGEMENT
# ==================================================

class TicketCreate(TrimmedModel):
    """Validate information when creating a ticket."""

    title: str = Field(min_length=5, max_length=150)
    description: str = Field(min_length=10, max_length=5000)
    category: Category
    priority: Priority


class TicketUpdate(BaseModel):
    """Allow partial updates to an existing ticket."""

    status: Status | None = None
    priority: Priority | None = None
    assigned_to: int | None = Field(default=None, gt=0)

    @field_validator("status", "priority", mode="before")
    @classmethod
    def non_null_state(cls, value):
        if value is None:
            raise ValueError("This field cannot be null")
        return value


class TicketOut(BaseModel):
    """Define ticket information returned by the API."""

    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str

    created_at: datetime
    updated_at: datetime

    created_by: int
    creator_name: str

    assigned_to: int | None
    assignee_name: str | None


# ==================================================
# TICKET COMMENTS
# ==================================================

class CommentCreate(TrimmedModel):
    """Validate a new comment on a support ticket."""

    body: str = Field(min_length=1, max_length=2000)


class CommentOut(BaseModel):
    """Define comment information returned by the API."""

    id: int
    body: str
    author_name: str
    created_at: datetime
