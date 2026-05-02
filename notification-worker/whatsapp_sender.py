import os
import logging
from twilio.rest import Client

logger = logging.getLogger(__name__)

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WA_FROM = os.getenv("TWILIO_WA_FROM", "whatsapp:+14155238886")


def send_whatsapp(to_phone: str, body: str):
    if not TWILIO_SID or not TWILIO_TOKEN:
        logger.warning("Twilio not configured — skipping WhatsApp send")
        return
    if not to_phone:
        logger.warning("No recipient phone — skipping WhatsApp send")
        return
    try:
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        
        # Twilio WhatsApp expects: whatsapp:+1234567890 (E.164 without the + for the API)
        # or just the number without the + prefix
        clean_phone = to_phone.lstrip("+")
        wa_to = f"whatsapp:+{clean_phone}"
        
        logger.info(f"Sending WhatsApp to {wa_to}")
        
        message = client.messages.create(
            from_=TWILIO_WA_FROM,
            to=wa_to,
            body=body
        )
        logger.info(f"WhatsApp sent to {to_phone}, SID: {message.sid}")
    except Exception as e:
        logger.error(f"WhatsApp send failed: {e}")