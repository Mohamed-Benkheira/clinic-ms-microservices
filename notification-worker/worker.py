import pika
import json
import os
import time
import logging
import requests
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [NOTIFICATION] %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://clinicos:rabbit2025@clinicos_rabbitmq:5672/clinicos")
EXCHANGE     = "clinicos.events"
QUEUE        = "notifications"
ROUTING_KEYS = [
    "appointment.created",
    "appointment.updated",
    "appointment.cancelled",
]

PATIENT_SERVICE_URL = os.getenv("PATIENT_SERVICE_URL", "http://clinicos_patient:8002")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://clinicos_auth:8001")

DATA_DIR = os.getenv("DATA_DIR", "/app/data")
os.makedirs(DATA_DIR, exist_ok=True)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/notifications.db")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Notification, NotificationTemplate, NotificationSettings, Base

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)


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
            "http://clinicos_doctor:8003/api/doctors/{}/".format(doctor_id),
            headers={"Authorization": f"Bearer {token}", "Host": "localhost"},
            timeout=5
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch doctor: {e}")
    return {}


def get_template(db, event_type: str):
    """Get active template for event type."""
    return db.query(NotificationTemplate).filter(
        NotificationTemplate.event_type == event_type,
        NotificationTemplate.is_active == True
    ).first()


def get_settings(db):
    """Get notification settings."""
    settings = db.query(NotificationSettings).first()
    if not settings:
        settings = NotificationSettings()
        db.add(settings)
        db.commit()
    return settings


def is_event_enabled(settings, event_type: str) -> bool:
    """Check if event type is enabled in settings."""
    if event_type == "appointment.created":
        return settings.appointment_created_enabled
    elif event_type == "appointment.cancelled":
        return settings.appointment_cancelled_enabled
    elif event_type == "appointment.updated":
        return settings.appointment_updated_enabled
    return True


def get_channel_for_event(settings, event_type: str) -> str:
    """Get channel for event type."""
    if event_type == "appointment.created":
        return settings.appointment_created_channel
    elif event_type == "appointment.cancelled":
        return settings.appointment_cancelled_channel
    elif event_type == "appointment.updated":
        return settings.appointment_updated_channel
    return "Both"


def process_template(body: str, context: dict) -> str:
    """Replace template variables with actual values."""
    result = body
    for var, value in context.items():
        v = str(value) if value else ""
        result = result.replace("{{" + var + "}}", v)
        result = result.replace("{{ " + var + " }}", v)
        result = result.replace("{{" + var + " }}", v)
        result = result.replace("{{ " + var + "}}", v)
        result = result.replace("{" + var + "}", v)
    return result


def send_notification(data, event_type: str):
    """Main notification sending logic."""
    db = SessionLocal()
    try:
        settings = get_settings(db)
        if not is_event_enabled(settings, event_type):
            logger.info(f"Event {event_type} is disabled in settings, skipping")
            return

        channel = get_channel_for_event(settings, event_type)
        patient_id = data.get("patient_id")
        doctor_id = data.get("doctor_id")
        scheduled_at = data.get("scheduled_at", "")
        reason = data.get("reason", "")
        status_val = data.get("status", "")

        patient = get_patient_info(patient_id) if patient_id else {}
        doctor = get_doctor_info(doctor_id) if doctor_id else {}

        patient_name = patient.get("full_name") or patient.get("name") or "Patient"
        patient_email = patient.get("email", "")
        patient_phone = patient.get("phone", "")
        doctor_name = doctor.get("full_name") or doctor.get("name") or "Doctor"

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
            except Exception:
                scheduled_date = scheduled_at

        context = {
            "patient_name": patient_name,
            "patient_email": patient_email,
            "patient_phone": patient_phone,
            "doctor_name": doctor_name,
            "scheduled_date": scheduled_date,
            "scheduled_time": scheduled_time,
            "reason": reason or "your appointment",
            "clinic_name": "ClinicOS",
        }

        template = get_template(db, event_type)
        if template:
            title = template.label
            body = process_template(template.body, context)
        else:
            title = f"Appointment {event_type.split('.')[-1].title()}"
            body = f"Dear {patient_name},\n\nYour appointment with {doctor_name} has been {status_val} for {scheduled_date} at {scheduled_time}.\n\nBest regards,\nClinicOS"

        email_status = "PENDING"
        wa_status = "PENDING"
        email_error = None
        wa_error = None

        if channel in ["Email", "Both"] and patient_email and settings.email_enabled:
            try:
                from email_sender import send_email
                send_email(to=patient_email, subject=title, body=body)
                email_status = "SENT"
                logger.info(f"Email sent to {patient_email}")
            except Exception as e:
                email_status = "FAILED"
                email_error = str(e)
                logger.error(f"Email send failed: {e}")

        if channel in ["WhatsApp", "Both"] and patient_phone and settings.whatsapp_enabled:
            try:
                from whatsapp_sender import send_whatsapp
                wa_body = template.wa_body if template and template.wa_body else body
                processed_wa = process_template(wa_body, context)
                send_whatsapp(to_phone=patient_phone, body=processed_wa)
                wa_status = "SENT"
                logger.info(f"WhatsApp sent to {patient_phone}")
            except Exception as e:
                wa_status = "FAILED"
                wa_error = str(e)
                logger.error(f"WhatsApp send failed: {e}")

        n = Notification(
            user_id=patient_id,
            type=event_type,
            title=title,
            body=body,
            read=False,
            created_at=datetime.now(timezone.utc),
            patient_email=patient_email,
            patient_phone=patient_phone,
            patient_name=patient_name,
            channel=channel,
            email_status=email_status,
            email_error=email_error,
            wa_status=wa_status,
            wa_error=wa_error,
        )
        db.add(n)
        db.commit()
        logger.info(f"Notification saved to DB: id={n.id}, type={event_type}, patient={patient_name}")

    except Exception as e:
        logger.error(f"Failed to process notification for {event_type}: {e}")
        db.rollback()
    finally:
        db.close()


def handle_appointment_created(data):
    logger.info("┌─────────────────────────────────────┐")
    logger.info("│      NEW APPOINTMENT BOOKED          │")
    logger.info("├─────────────────────────────────────┤")
    logger.info("│  ID         : {}".format(data.get('id')))
    logger.info("│  Patient ID : {}".format(data.get('patient_id')))
    logger.info("│  Doctor ID  : {}".format(data.get('doctor_id')))
    logger.info("│  Scheduled  : {}".format(data.get('scheduled_at')))
    logger.info("│  Reason     : {}".format(data.get('reason') or 'N/A'))
    logger.info("│  Status     : {}".format(data.get('status')))
    logger.info("└─────────────────────────────────────┘")
    send_notification(data, "appointment.created")


def handle_appointment_cancelled(data):
    logger.info("┌─────────────────────────────────────┐")
    logger.info("│      APPOINTMENT CANCELLED           │")
    logger.info("├─────────────────────────────────────┤")
    logger.info("│  ID         : {}".format(data.get('id')))
    logger.info("│  Patient ID : {}".format(data.get('patient_id')))
    logger.info("│  Doctor ID  : {}".format(data.get('doctor_id')))
    logger.info("│  Scheduled  : {}".format(data.get('scheduled_at')))
    logger.info("└─────────────────────────────────────┘")
    send_notification(data, "appointment.cancelled")


def handle_appointment_updated(data):
    logger.info("┌─────────────────────────────────────┐")
    logger.info("│      APPOINTMENT UPDATED             │")
    logger.info("├─────────────────────────────────────┤")
    logger.info("│  ID         : {}".format(data.get('id')))
    logger.info("│  New Status : {}".format(data.get('status')))
    logger.info("│  Scheduled  : {}".format(data.get('scheduled_at')))
    logger.info("└─────────────────────────────────────┘")
    send_notification(data, "appointment.updated")


HANDLERS = {
    "appointment.created":   handle_appointment_created,
    "appointment.cancelled": handle_appointment_cancelled,
    "appointment.updated":   handle_appointment_updated,
}


def on_message(ch, method, properties, body):
    routing_key = method.routing_key
    try:
        data = json.loads(body)
        logger.info(f"Received event: {routing_key}")
        handler = HANDLERS.get(routing_key)
        if handler:
            handler(data)
        else:
            logger.warning(f"No handler for routing key: {routing_key}")
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logger.error(f"Error processing [{routing_key}]: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_worker():
    retry_delay = 5
    while True:
        try:
            logger.info("Connecting to RabbitMQ...")
            params = pika.URLParameters(RABBITMQ_URL)
            params.heartbeat = 60
            params.blocked_connection_timeout = 30
            connection = pika.BlockingConnection(params)
            channel = connection.channel()

            channel.exchange_declare(
                exchange=EXCHANGE,
                exchange_type="topic",
                durable=True
            )
            channel.queue_declare(queue=QUEUE, durable=True)

            for key in ROUTING_KEYS:
                channel.queue_bind(queue=QUEUE, exchange=EXCHANGE, routing_key=key)
                logger.info(f"  Bound: {QUEUE} <- {key}")

            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=QUEUE, on_message_callback=on_message)

            logger.info("✅ Notification Worker ready — listening for events...")
            retry_delay = 5
            channel.start_consuming()

        except pika.exceptions.AMQPConnectionError:
            logger.warning(f"RabbitMQ not ready, retrying in {retry_delay}s...")
            time.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 60)
        except KeyboardInterrupt:
            logger.info("Worker stopped.")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}, retrying in {retry_delay}s...")
            time.sleep(retry_delay)


if __name__ == "__main__":
    start_worker()
