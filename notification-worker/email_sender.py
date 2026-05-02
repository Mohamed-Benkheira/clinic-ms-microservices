import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_NAME = os.getenv("FROM_NAME", "ClinicOS")


def send_email(to: str, subject: str, body: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("Email not configured — skipping send")
        return
    if not to:
        logger.warning("No recipient email — skipping send")
        return
    try:
        msg = MIMEMultipart()
        msg["From"] = f"{FROM_NAME} <{SMTP_USER}>"
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to, msg.as_string())
        logger.info(f"Email sent to {to}")
    except Exception as e:
        logger.error(f"Email send failed: {e}")