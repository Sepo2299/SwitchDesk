"""Database connection. SQLite works locally; set DATABASE_URL for PostgreSQL."""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./switchdesk.db")
engine_options = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
if DATABASE_URL in ("sqlite://", "sqlite:///:memory:"):
    # One shared connection lets API worker threads use the isolated test DB.
    engine_options["poolclass"] = StaticPool
engine = create_engine(DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(bind=engine)
class Base(DeclarativeBase):
    pass

def get_db():
    with SessionLocal() as session:
        yield session
