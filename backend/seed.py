"""Optional, repeatable local demo data. Never run on a public deployment."""
import os
from datetime import datetime, timedelta, timezone
from app.database import Base, engine, SessionLocal
from app.models import User, Ticket, TicketEvent, Comment
from app.security import hash_password

DEMO_USERS = [
    ("Alex Morgan", "admin@switchdesk.local", "Admin123!", "admin"),
    ("Jordan Lee", "tech@switchdesk.local", "Tech12345!", "technician"),
    ("Taylor Reed", "employee@switchdesk.local", "Employee123!", "employee"),
    ("Sam Nandi", "sam@switchdesk.local", "Employee123!", "employee"),
    ("Mia Jacobs", "mia@switchdesk.local", "Tech12345!", "technician"),
]
# Relative ages keep the fresh demo useful on any day. These are stored fixtures,
# not hard-coded analytics: creating or updating a ticket changes the actual charts.
SAMPLES = [
    ("VPN connection failing for remote staff", "Remote staff cannot connect to the company VPN. The client displays a connection timeout after sign-in. Restarting did not help.", "Network", "Critical", "In Progress", 1, 0),
    ("Shared drive access for finance", "Please grant read access to the quarterly reporting folder for the finance team. Manager approval is available.", "Access", "High", "Open", None, 0),
    ("Outlook stopped syncing new messages", "Outlook desktop has not received new messages since this morning. Webmail works and restarting Outlook did not resolve the issue.", "Software", "High", "In Progress", 4, 1),
    ("Meeting room display not detected", "The HDMI display in the Acacia meeting room is not detected by two laptops. We tested a second cable.", "Hardware", "Medium", "Open", None, 1),
    ("Office Wi-Fi keeps disconnecting", "The wireless network drops every few minutes on the second floor. Multiple devices are affected.", "Network", "High", "Resolved", 1, 2),
    ("Install approved design software", "Please install the approved design application on the marketing workstation. A license is available.", "Software", "Low", "Closed", 4, 3),
    ("Printer reports a paper jam", "The third-floor printer reports a paper jam even when the paper tray is empty. Please inspect the device.", "Hardware", "Medium", "Resolved", 1, 3),
    ("New starter needs email access", "A new team member needs an email account and access to the standard employee collaboration tools.", "Access", "Medium", "Closed", 4, 4),
    ("Request a replacement keyboard", "Several keys on the reception keyboard are unresponsive. Cleaning and reconnecting did not help.", "Hardware", "Low", "Open", None, 5),
    ("Spreadsheet crashes on opening", "A shared budget workbook closes the spreadsheet application. Other workbooks open normally.", "Software", "Medium", "Resolved", 1, 5),
    ("Update team contact information", "Please update the support contact information displayed on the intranet team directory.", "Other", "Low", "Closed", 4, 6),
    ("Guest network setup for visitors", "We need instructions for approved guest network access for the upcoming partner meeting.", "Network", "Low", "Resolved", 1, 6),
]

def seed_database():
    if os.getenv("APP_ENV") == "production":
        raise RuntimeError("Demo seeding is disabled in production")
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        empty = db.query(User).count() == 0 and db.query(Ticket).count() == 0
        users = []
        for name, email, password, role in DEMO_USERS:
            user = db.query(User).filter(User.email == email).first()
            if user is None:
                user = User(name=name, email=email, password_hash=hash_password(password), role=role)
                db.add(user)
                db.flush()
            users.append(user)
        if empty:
            now = datetime.now(timezone.utc)
            for index, (title, description, category, priority, status, assignee, age) in enumerate(SAMPLES):
                created = now - timedelta(days=age, hours=3)
                creator = users[2 if index % 3 else 3]
                ticket = Ticket(title=title, description=description, category=category, priority=priority, status=status, created_by=creator.id, assigned_to=users[assignee].id if assignee is not None else None, created_at=created, updated_at=created)
                db.add(ticket)
                db.flush()
                db.add(TicketEvent(ticket_id=ticket.id, actor_id=creator.id, kind="created", description="Created this support request", created_at=created))
                if assignee is not None:
                    db.add(TicketEvent(ticket_id=ticket.id, actor_id=users[0].id, kind="updated", description=f"Assigned to {users[assignee].name}", created_at=created+timedelta(minutes=15)))
                if status != "Open":
                    changed = created + timedelta(hours=1)
                    db.add(TicketEvent(ticket_id=ticket.id, actor_id=users[assignee].id, kind="resolved" if status in ("Resolved", "Closed") else "updated", description=f"Status: Open → {status}", created_at=changed))
                    ticket.updated_at = changed
                if index == 0:
                    db.add(Comment(ticket_id=ticket.id, author_id=users[1].id, body="I’m checking the VPN gateway and the affected user connections. Please add the exact error text if it changes.", created_at=created+timedelta(minutes=45)))
                    db.add(TicketEvent(ticket_id=ticket.id, actor_id=users[1].id, kind="commented", description="Added an update to the discussion", created_at=created+timedelta(minutes=45)))
        db.commit()
    print("Demo ready. Existing users, passwords, and tickets were preserved.")

if __name__ == "__main__":
    seed_database()
