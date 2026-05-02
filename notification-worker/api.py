from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
from sqlalchemy.orm import Session
from models import SessionLocal, Notification, NotificationTemplate, NotificationSettings
from typing import List, Optional
import requests
import logging
import os
import re

from email_sender import send_email
from whatsapp_sender import send_whatsapp

logger = logging.getLogger(__name__)

app = FastAPI(title="Notifications API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PATIENT_SERVICE_URL = os.getenv("PATIENT_SERVICE_URL", "http://clinicos_patient:8002")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://clinicos_auth:8001")

# Default templates to create on first run
DEFAULT_TEMPLATES = [
    {
        "label": "Appointment Confirmed",
        "body": "Dear {{patient_name}},\n\nYour appointment with {{doctor_name}} is confirmed for {{scheduled_date}} at {{scheduled_time}}.\n\nPlease arrive 15 minutes early.\n\nBest regards,\nClinicOS",
        "wa_body": "Hi {{patient_name}}! Your appointment with {{doctor_name}} is confirmed for {{scheduled_date}} at {{scheduled_time}}. Please arrive 15 min early. ClinicOS",
        "body_html": "<p>Dear {{patient_name}},</p><p>Your appointment with <strong>{{doctor_name}}</strong> is confirmed for <strong>{{scheduled_date}}</strong> at <strong>{{scheduled_time}}</strong>.</p><p>Please arrive 15 minutes early.</p><p>Best regards,<br/>ClinicOS</p>",
        "channel": "Both",
        "event_type": "appointment.created",
        "is_active": True,
    },
    {
        "label": "Appointment Cancelled",
        "body": "Dear {{patient_name}},\n\nYour appointment with {{doctor_name}} originally scheduled for {{scheduled_date}} at {{scheduled_time}} has been cancelled.\n\nPlease contact us to reschedule.\n\nBest regards,\nClinicOS",
        "wa_body": "Hi {{patient_name}}. Your appointment with {{doctor_name}} on {{scheduled_date}} at {{scheduled_time}} has been cancelled. Please contact us to reschedule. ClinicOS",
        "body_html": "<p>Dear {{patient_name}},</p><p>Your appointment with <strong>{{doctor_name}}</strong> originally scheduled for <strong>{{scheduled_date}}</strong> at <strong>{{scheduled_time}}</strong> has been cancelled.</p><p>Please contact us to reschedule.</p><p>Best regards,<br/>ClinicOS</p>",
        "channel": "Both",
        "event_type": "appointment.cancelled",
        "is_active": True,
    },
    {
        "label": "Appointment Reminder",
        "body": "Dear {{patient_name}},\n\nThis is a reminder about your appointment with {{doctor_name}} tomorrow at {{scheduled_time}}.\n\nPlease arrive 10 minutes early.\n\nBest regards,\nClinicOS",
        "wa_body": "Reminder: Your appointment with {{doctor_name}} is tomorrow at {{scheduled_time}}. Please arrive 10 min early. ClinicOS",
        "body_html": "<p>Dear {{patient_name}},</p><p>This is a reminder about your appointment with <strong>{{doctor_name}}</strong> tomorrow at <strong>{{scheduled_time}}</strong>.</p><p>Please arrive 10 minutes early.</p><p>Best regards,<br/>ClinicOS</p>",
        "channel": "Both",
        "event_type": "appointment.reminder",
        "is_active": True,
    },
    {
        "label": "Manual Notification",
        "body": "Dear {{patient_name}},\n\n{{custom_message}}\n\nBest regards,\nClinicOS",
        "wa_body": "Hi {{patient_name}}! {{custom_message}} ClinicOS",
        "body_html": "<p>Dear {{patient_name}},</p><p>{{custom_message}}</p><p>Best regards,<br/>ClinicOS</p>",
        "channel": "Both",
        "event_type": "manual",
        "is_active": True,
    },
]


def init_defaults(db: Session):
    """Initialize default templates and settings if not exist."""
    # Check if templates exist
    existing = db.query(NotificationTemplate).first()
    if not existing:
        for t in DEFAULT_TEMPLATES:
            template = NotificationTemplate(**t)
            db.add(template)
        logger.info("Created default templates")
    
    # Check if settings exist
    settings = db.query(NotificationSettings).first()
    if not settings:
        settings = NotificationSettings()
        db.add(settings)
        logger.info("Created default settings")
    
    db.commit()


# Initialize on startup
@app.on_event("startup")
def startup():
    db = SessionLocal()
    try:
        init_defaults(db)
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_patient_info(patient_id: int) -> dict:
    """Fetch patient info from patient service."""
    try:
        auth_resp = requests.post(
            f"{AUTH_SERVICE_URL}/api/auth/login/",
            json={"email": "admin@clinicos.med", "password": "Admin1234!"},
            headers={"Host": "localhost"},
            timeout=5
        )
        if auth_resp.status_code != 200:
            return {}
        token = auth_resp.json().get("access")
        
        resp = requests.get(
            f"{PATIENT_SERVICE_URL}/api/patients/{patient_id}/",
            headers={"Authorization": f"Bearer {token}", "Host": "localhost"},
            timeout=5
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch patient: {e}")
    return {}


def get_doctor_info(doctor_id: int) -> dict:
    """Fetch doctor info from doctor service."""
    try:
        auth_resp = requests.post(
            f"{AUTH_SERVICE_URL}/api/auth/login/",
            json={"email": "admin@clinicos.med", "password": "Admin1234!"},
            headers={"Host": "localhost"},
            timeout=5
        )
        if auth_resp.status_code != 200:
            return {}
        token = auth_resp.json().get("access")
        
        resp = requests.get(
            f"http://clinicos_doctor:8003/api/doctors/{doctor_id}/",
            headers={"Authorization": f"Bearer {token}", "Host": "localhost"},
            timeout=5
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch doctor: {e}")
    return {}


def process_template(body: str, patient_id: int = None, doctor_id: int = None, 
                    scheduled_at: str = None, reason: str = None, custom_message: str = None,
                    patient_name: str = None, patient_email: str = None, patient_phone: str = None,
                    doctor_name: str = None) -> str:
    """Replace template variables with actual values using Jinja2."""
    logger.info(f"[process_template] INPUT body: {body!r}")
    logger.info(f"[process_template] patient_name={patient_name}, doctor_name={doctor_name}")
    
    # Parse scheduled datetime into date and time components
    scheduled_date = ""
    scheduled_time = ""
    if scheduled_at:
        try:
            if 'T' in scheduled_at:
                dt = scheduled_at.replace('T', ' ').split('.')[0]
                parts = dt.split(' ')
                scheduled_date = parts[0]
                scheduled_time = parts[1] if len(parts) > 1 else ""
            else:
                scheduled_date = scheduled_at
        except:
            scheduled_date = scheduled_at
    
    # Build replacement context
    replacements = {
        "patient_name": patient_name or "Patient",
        "patient_email": patient_email or "",
        "patient_phone": patient_phone or "",
        "doctor_name": doctor_name or "Doctor",
        "scheduled_date": scheduled_date,
        "scheduled_time": scheduled_time,
        "reason": reason or "your appointment",
        "clinic_name": "ClinicOS",
        "custom_message": custom_message or "",
    }
    logger.info(f"[process_template] replacements: {replacements}")
    
    # Replace Jinja2 {{variable}} syntax - handle ALL variations
    result = body
    for var, value in replacements.items():
        v = str(value)
        # {{variable}} (no spaces)
        result = result.replace("{{" + var + "}}", v)
        # {{ variable }} (single space both sides)
        result = result.replace("{{ " + var + " }}", v)
        # {{variable }} (no left, single right)  
        result = result.replace("{{" + var + " }}", v)
        # {{ variable}} (single left, no right)
        result = result.replace("{{ " + var + "}}", v)
        # Also handle {variable} simple syntax for backwards compatibility
        result = result.replace("{" + var + "}", v)
    
    logger.info(f"[process_template] OUTPUT: {result!r}")
    return result


# ==================== NOTIFICATIONS ====================

@app.get("/api/notifications/", response_model=List[dict])
def list_notifications(user_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Notification).order_by(Notification.created_at.desc())
    if user_id:
        q = q.filter(Notification.user_id == user_id)
    return [
        {"id": n.id, "type": n.type, "title": n.title,
         "body": n.body, "read": n.read, "created_at": str(n.created_at),
         "patient_email": n.patient_email, "patient_phone": n.patient_phone,
         "patient_name": n.patient_name, "channel": n.channel,
         "email_status": n.email_status, "email_error": n.email_error,
         "wa_status": n.wa_status, "wa_error": n.wa_error}
        for n in q.limit(50).all()
    ]


@app.patch("/api/notifications/{notification_id}/read/")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if n:
        n.read = True
        db.commit()
    return {"ok": True}


@app.post("/api/notifications/{notification_id}/resend/")
def resend_notification(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    results = {"Email": False, "WhatsApp": False}
    
    if n.patient_email:
        try:
            send_email(to=n.patient_email, subject=n.title, body=n.body)
            results["Email"] = True
        except Exception as e:
            logger.error(f"Email send failed: {e}")
    
    if n.patient_phone:
        try:
            send_whatsapp(to_phone=n.patient_phone, body=n.body)
            results["WhatsApp"] = True
        except Exception as e:
            logger.error(f"WhatsApp send failed: {e}")
    
    return results


# ==================== TEMPLATES ====================

@app.get("/api/notifications/templates/", response_model=List[dict])
def list_templates(db: Session = Depends(get_db)):
    templates = db.query(NotificationTemplate).all()
    return [
        {
            "id": t.id,
            "label": t.label,
            "body": t.body,
            "body_html": t.body_html,
            "channel": t.channel,
            "event_type": t.event_type,
            "is_active": t.is_active,
            "created_at": str(t.created_at),
            "updated_at": str(t.updated_at),
        }
        for t in templates
    ]


@app.post("/api/notifications/templates/", response_model=dict)
def create_template(
    label: str,
    body: str,
    channel: str = "Both",
    event_type: str = "manual",
    body_html: str = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    template = NotificationTemplate(
        label=label,
        body=body,
        body_html=body_html or body,
        channel=channel,
        event_type=event_type,
        is_active=is_active,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    logger.info(f"Created template: {template.label}")
    return {
        "id": template.id,
        "label": template.label,
        "body": template.body,
        "body_html": template.body_html,
        "channel": template.channel,
        "event_type": template.event_type,
        "is_active": template.is_active,
    }


@app.put("/api/notifications/templates/{template_id}/", response_model=dict)
def update_template(
    template_id: int,
    label: str = None,
    body: str = None,
    channel: str = None,
    event_type: str = None,
    body_html: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db)
):
    template = db.query(NotificationTemplate).filter(NotificationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if label is not None:
        template.label = label
    if body is not None:
        template.body = body
    if body_html is not None:
        template.body_html = body_html
    if channel is not None:
        template.channel = channel
    if event_type is not None:
        template.event_type = event_type
    if is_active is not None:
        template.is_active = is_active
    
    db.commit()
    logger.info(f"Updated template: {template.label}")
    return {
        "id": template.id,
        "label": template.label,
        "body": template.body,
        "body_html": template.body_html,
        "channel": template.channel,
        "event_type": template.event_type,
        "is_active": template.is_active,
    }


@app.delete("/api/notifications/templates/{template_id}/")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(NotificationTemplate).filter(NotificationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    logger.info(f"Deleted template: {template_id}")
    return {"ok": True}


# ==================== SETTINGS ====================

@app.get("/api/notifications/settings/", response_model=dict)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(NotificationSettings).first()
    if not settings:
        settings = NotificationSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return {
        "appointment_created_enabled": settings.appointment_created_enabled,
        "appointment_cancelled_enabled": settings.appointment_cancelled_enabled,
        "appointment_updated_enabled": settings.appointment_updated_enabled,
        "appointment_created_channel": settings.appointment_created_channel,
        "appointment_cancelled_channel": settings.appointment_cancelled_channel,
        "appointment_updated_channel": settings.appointment_updated_channel,
        "whatsapp_enabled": settings.whatsapp_enabled,
        "email_enabled": settings.email_enabled,
    }


@app.put("/api/notifications/settings/", response_model=dict)
def update_settings(
    appointment_created_enabled: bool = None,
    appointment_cancelled_enabled: bool = None,
    appointment_updated_enabled: bool = None,
    appointment_created_channel: str = None,
    appointment_cancelled_channel: str = None,
    appointment_updated_channel: str = None,
    whatsapp_enabled: bool = None,
    email_enabled: bool = None,
    db: Session = Depends(get_db)
):
    settings = db.query(NotificationSettings).first()
    if not settings:
        settings = NotificationSettings()
        db.add(settings)
    
    if appointment_created_enabled is not None:
        settings.appointment_created_enabled = appointment_created_enabled
    if appointment_cancelled_enabled is not None:
        settings.appointment_cancelled_enabled = appointment_cancelled_enabled
    if appointment_updated_enabled is not None:
        settings.appointment_updated_enabled = appointment_updated_enabled
    if appointment_created_channel is not None:
        settings.appointment_created_channel = appointment_created_channel
    if appointment_cancelled_channel is not None:
        settings.appointment_cancelled_channel = appointment_cancelled_channel
    if appointment_updated_channel is not None:
        settings.appointment_updated_channel = appointment_updated_channel
    if whatsapp_enabled is not None:
        settings.whatsapp_enabled = whatsapp_enabled
    if email_enabled is not None:
        settings.email_enabled = email_enabled
    
    db.commit()
    logger.info("Updated notification settings")
    return {"ok": True}


# ==================== COMPOSE ====================

@app.post("/api/notifications/compose/")
def compose_notification(
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Manually compose and send a notification to a patient."""
    patient_id = payload.get("patient_id")
    body = payload.get("body", "")
    title = payload.get("title", "Notification from ClinicOS")
    channel = payload.get("channel", "Both")
    template_id = payload.get("template_id")
    patient_email = payload.get("patient_email")
    patient_phone = payload.get("patient_phone")
    patient_name = payload.get("patient_name")
    
    results = {"Email": False, "WhatsApp": False, "saved": False}
    
    # Use provided values directly, only fetch if needed
    # First use provided patient_name, then try service call
    if not patient_name:
        patient = get_patient_info(patient_id)
        patient_name = patient.get("full_name") or "Patient"
        patient_email = patient_email or patient.get("email", "")
        patient_phone = patient_phone or patient.get("phone", "")
    
    if not patient_email and not patient_phone:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    use_template = False
    processed_body = body
    
    # If template_id provided, load template body and process it
    if template_id:
        template = db.query(NotificationTemplate).filter(NotificationTemplate.id == template_id).first()
        if template:
            use_template = True
            processed_body = process_template(
                template.body,
                patient_name=patient_name,
                patient_email=patient_email,
                patient_phone=patient_phone,
            )
            processed_body = processed_body.replace("{custom_message}", body)
            processed_body = processed_body.replace("{{ custom_message }}", body)
    
    # Always process placeholders in the body (even without template_id)
    processed_body = process_template(
        processed_body,
        patient_name=patient_name,
        patient_email=patient_email,
        patient_phone=patient_phone,
    )
    
    # Only add Dear/Best wrapper when using a template
    # For custom messages, send exactly what the user typed
    if use_template:
        message = f"Dear {patient_name},\n\n{processed_body}\n\nBest regards,\nClinicOS"
    else:
        message = processed_body
    
    # Determine statuses
    email_status = "SENT" if channel in ["Email", "Both"] and patient_email else "PENDING"
    wa_status = "SENT" if channel in ["WhatsApp", "Both"] and patient_phone else "PENDING"
    
    # Send based on channel
    if channel in ["Email", "Both"] and patient_email:
        try:
            send_email(to=patient_email, subject=title, body=message)
            results["Email"] = True
            logger.info(f"Email sent to {patient_email}")
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            email_status = "FAILED"
    
    if channel in ["WhatsApp", "Both"] and patient_phone:
        try:
            send_whatsapp(to_phone=patient_phone, body=message)
            results["WhatsApp"] = True
            logger.info(f"WhatsApp sent to {patient_phone}")
        except Exception as e:
            logger.error(f"WhatsApp send failed: {e}")
            wa_status = "FAILED"
    
    # Save notification to DB with statuses
    try:
        n = Notification(
            user_id=patient_id,
            type="manual.compose",
            title=title,
            body=message,
            patient_email=patient_email,
            patient_phone=patient_phone,
            patient_name=patient_name,
            channel=channel,
            email_status=email_status,
            wa_status=wa_status
        )
        db.add(n)
        db.commit()
        db.refresh(n)
        results["saved"] = True
    except Exception as e:
        logger.error(f"Failed to save notification: {e}")
    
    return results


# ==================== HEALTH ====================

@app.get("/health/")
def health():
    return {"status": "ok"}


# ==================== TEMPLATE VARIABLES ====================

@app.get("/api/notifications/template-variables/")
def get_template_variables():
    """Return available template variables."""
    return {
        "variables": [
            {"name": "{patient_name}", "description": "Patient's full name"},
            {"name": "{patient_email}", "description": "Patient's email address"},
            {"name": "{patient_phone}", "description": "Patient's phone number"},
            {"name": "{doctor_name}", "description": "Doctor's full name"},
            {"name": "{scheduled_date}", "description": "Appointment date (YYYY-MM-DD)"},
            {"name": "{scheduled_time}", "description": "Appointment time (HH:MM)"},
            {"name": "{reason}", "description": "Appointment reason"},
            {"name": "{clinic_name}", "description": "Clinic name"},
            {"name": "{custom_message}", "description": "Custom message (for manual notifications)"},
        ],
        "event_types": [
            {"value": "appointment.created", "label": "Appointment Created"},
            {"value": "appointment.cancelled", "label": "Appointment Cancelled"},
            {"value": "appointment.updated", "label": "Appointment Updated"},
            {"value": "appointment.reminder", "label": "Appointment Reminder"},
            {"value": "manual", "label": "Manual Notification"},
        ]
    }
