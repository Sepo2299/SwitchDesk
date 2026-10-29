"""SwitchDesk REST API. Start with: uvicorn app.main:app --reload"""
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from .models import User, Ticket, Comment, TicketEvent
from .schemas import Register, Login, UserOut, TicketCreate, TicketUpdate, TicketOut, CommentCreate, CommentOut
from .security import hash_password, verify_password, create_token, current_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    yield

app = FastAPI(title="SwitchDesk API", version="1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def staff(user: User): return user.role in ("admin", "technician")
def visible_tickets(db: Session, user: User):
    query = select(Ticket)
    return query if staff(user) else query.where(Ticket.created_by == user.id)
def ticket_or_404(db: Session, ticket_id: int, user: User):
    ticket = db.get(Ticket, ticket_id)
    if not ticket or (not staff(user) and ticket.created_by != user.id):
        raise HTTPException(404, "Ticket not found")
    return ticket
def ticket_output(t: Ticket):
    return TicketOut(id=t.id, title=t.title, description=t.description, category=t.category, priority=t.priority, status=t.status, created_at=t.created_at, updated_at=t.updated_at, created_by=t.created_by, creator_name=t.creator.name, assigned_to=t.assigned_to, assignee_name=t.assignee.name if t.assignee else None)

@app.get("/api/health")
def health(): return {"status": "ok"}

@app.post("/api/auth/register", response_model=UserOut, status_code=201)
def register(data: Register, db: Session = Depends(get_db)):
    email = str(data.email).lower()
    if db.scalar(select(User).where(User.email == email)): raise HTTPException(409, "Email already registered")
    user = User(name=data.name.strip(), email=email, password_hash=hash_password(data.password), role="employee")
    db.add(user); db.commit(); db.refresh(user)
    return user

@app.post("/api/auth/login")
def login(data: Login, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(data.email).lower()))
    if not user or not verify_password(data.password, user.password_hash): raise HTTPException(401, "Incorrect email or password")
    return {"access_token": create_token(user.id), "token_type": "bearer", "user": UserOut.model_validate(user)}

@app.get("/api/me", response_model=UserOut)
def me(user: User = Depends(current_user)): return user

@app.get("/api/users", response_model=list[UserOut])
def users(db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not staff(user): raise HTTPException(403, "Staff access required")
    return db.scalars(select(User).order_by(User.name)).all()

@app.get("/api/tickets", response_model=list[TicketOut])
def list_tickets(search: str = Query("", max_length=150), status: str = "", priority: str = "", db: Session = Depends(get_db), user: User = Depends(current_user)):
    query = visible_tickets(db, user)
    if search: query = query.where(or_(Ticket.title.ilike(f"%{search}%"), Ticket.description.ilike(f"%{search}%")))
    if status: query = query.where(Ticket.status == status)
    if priority: query = query.where(Ticket.priority == priority)
    tickets = db.scalars(query.order_by(Ticket.created_at.desc(), Ticket.id.desc())).all()
    return [ticket_output(t) for t in tickets]

@app.post("/api/tickets", response_model=TicketOut, status_code=201)
def create_ticket(data: TicketCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    ticket = Ticket(**data.model_dump(), created_by=user.id)
    db.add(ticket); db.flush()
    db.add(TicketEvent(ticket_id=ticket.id, actor_id=user.id, kind="created", description="Created this support request"))
    db.commit(); db.refresh(ticket)
    return ticket_output(ticket)

@app.get("/api/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return ticket_output(ticket_or_404(db, ticket_id, user))

@app.patch("/api/tickets/{ticket_id}", response_model=TicketOut)
def update_ticket(ticket_id: int, data: TicketUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not staff(user): raise HTTPException(403, "Only support staff can update tickets")
    ticket = ticket_or_404(db, ticket_id, user)
    updates = data.model_dump(exclude_unset=True)
    if "assigned_to" in updates and updates["assigned_to"] is not None:
        assignee = db.get(User, updates["assigned_to"])
        if not assignee or not staff(assignee): raise HTTPException(422, "Assignee must be a technician or administrator")
    for key, value in updates.items():
        previous = getattr(ticket, key)
        if previous == value:
            continue
        if key == "assigned_to":
            old_name = db.get(User, previous).name if previous else "Unassigned"
            new_name = db.get(User, value).name if value else "Unassigned"
            description = f"Assignment: {old_name} → {new_name}"
        else:
            description = f"{key.capitalize()}: {previous} → {value}"
        kind = "resolved" if key == "status" and value in ("Resolved", "Closed") and previous not in ("Resolved", "Closed") else "updated"
        db.add(TicketEvent(ticket_id=ticket.id, actor_id=user.id, kind=kind, description=description))
        setattr(ticket, key, value)
    db.commit(); db.refresh(ticket)
    return ticket_output(ticket)

@app.get("/api/tickets/{ticket_id}/comments", response_model=list[CommentOut])
def comments(ticket_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    ticket_or_404(db, ticket_id, user)
    return [CommentOut(id=c.id, body=c.body, author_name=c.author.name, created_at=c.created_at) for c in db.scalars(select(Comment).where(Comment.ticket_id == ticket_id).order_by(Comment.created_at)).all()]

@app.post("/api/tickets/{ticket_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(ticket_id: int, data: CommentCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    ticket = ticket_or_404(db, ticket_id, user)
    comment = Comment(ticket_id=ticket_id, author_id=user.id, body=data.body)
    db.add(comment)
    db.add(TicketEvent(ticket_id=ticket.id, actor_id=user.id, kind="commented", description="Added an update to the discussion"))
    db.commit(); db.refresh(comment)
    return CommentOut(id=comment.id, body=comment.body, author_name=user.name, created_at=comment.created_at)

@app.get("/api/tickets/{ticket_id}/events")
def events(ticket_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    ticket = ticket_or_404(db, ticket_id, user)
    history = db.scalars(select(TicketEvent).where(TicketEvent.ticket_id == ticket_id).order_by(TicketEvent.created_at, TicketEvent.id)).all()
    result = [{"id": e.id, "actor_name": e.actor.name, "description": e.description, "created_at": e.created_at} for e in history]
    if not any(e.kind == "created" for e in history):
        result.insert(0, {"id": 0, "actor_name": ticket.creator.name, "description": "Created this support request (imported ticket; later history is recorded from this version onward)", "created_at": ticket.created_at})
    return result

@app.get("/api/analytics")
def analytics(db: Session = Depends(get_db), user: User = Depends(current_user)):
    tickets = db.scalars(visible_tickets(db, user)).all()
    statuses = {s: sum(t.status == s for t in tickets) for s in ("Open", "In Progress", "Resolved", "Closed")}
    priorities = {p: sum(t.priority == p for t in tickets) for p in ("Low", "Medium", "High", "Critical")}
    categories = {c: sum(t.category == c for t in tickets) for c in ("Hardware", "Software", "Network", "Access", "Other")}
    today = datetime.now(timezone.utc).date()
    ids = [t.id for t in tickets]
    resolutions = db.scalars(select(TicketEvent).where(TicketEvent.ticket_id.in_(ids), TicketEvent.kind == "resolved", TicketEvent.created_at >= datetime.combine(today - timedelta(days=6), datetime.min.time()))).all() if ids else []
    activity = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        activity.append({"date": day.isoformat(), "day": day.strftime("%a"), "created": sum(t.created_at.date() == day for t in tickets), "resolved": sum(e.created_at.date() == day for e in resolutions)})
    return {"activity": activity, "unassigned": sum(t.assigned_to is None and t.status in ("Open", "In Progress") for t in tickets), "total": len(tickets), "statuses": statuses, "priorities": priorities, "categories": categories, "resolution_rate": round(100 * (statuses["Resolved"] + statuses["Closed"]) / len(tickets)) if tickets else 0}
