from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone
import os

DATA_DIR = os.getenv("DATA_DIR", "/app/data")
os.makedirs(DATA_DIR, exist_ok=True)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/notifications.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    type = Column(String(50))
    title = Column(String(200))
    body = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    # For resend functionality
    patient_email = Column(String(200), nullable=True)
    patient_phone = Column(String(20), nullable=True)
    patient_name = Column(String(200), nullable=True)
    channel = Column(String(20), default="Email")
    # Send status
    email_status = Column(String(20), default="pending")
    email_error = Column(Text, nullable=True)
    wa_status = Column(String(20), default="pending")
    wa_error = Column(Text, nullable=True)


class NotificationTemplate(Base):
    __tablename__ = "notification_templates"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(100), nullable=False)
    body = Column(Text, nullable=False)
    # Separate WhatsApp message body
    wa_body = Column(Text, nullable=True)
    channel = Column(String(20), default="Email")  # Email, WhatsApp, Both
    event_type = Column(String(50), nullable=False)  # appointment.created, appointment.cancelled, appointment.updated, manual
    is_active = Column(Boolean, default=True)
    # For rich text - store HTML
    body_html = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class NotificationSettings(Base):
    __tablename__ = "notification_settings"
    id = Column(Integer, primary_key=True)
    # Event triggers - which events send notifications
    appointment_created_enabled = Column(Boolean, default=True)
    appointment_cancelled_enabled = Column(Boolean, default=True)
    appointment_updated_enabled = Column(Boolean, default=True)
    # Default channels for events
    appointment_created_channel = Column(String(20), default="Both")
    appointment_cancelled_channel = Column(String(20), default="Both")
    appointment_updated_channel = Column(String(20), default="Both")
    # WhatsAp messages enabled by default as well
    whatsapp_enabled = Column(Boolean, default=True)
    email_enabled = Column(Boolean, default=True)


Base.metadata.create_all(bind=engine)