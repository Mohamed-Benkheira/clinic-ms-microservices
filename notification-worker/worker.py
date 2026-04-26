import pika
import json
import os
import time
import logging

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


def handle_appointment_created(data):
    logger.info("┌─────────────────────────────────────┐")
    logger.info("│      NEW APPOINTMENT BOOKED          │")
    logger.info("├─────────────────────────────────────┤")
    logger.info(f"│  ID         : {data.get('id')}")
    logger.info(f"│  Patient ID : {data.get('patient_id')}")
    logger.info(f"│  Doctor ID  : {data.get('doctor_id')}")
    logger.info(f"│  Scheduled  : {data.get('scheduled_at')}")
    logger.info(f"│  Reason     : {data.get('reason') or 'N/A'}")
    logger.info(f"│  Status     : {data.get('status')}")
    logger.info("└─────────────────────────────────────┘")
    # TODO: send email/SMS via SMTP or Twilio


def handle_appointment_cancelled(data):
    logger.info("┌─────────────────────────────────────┐")
    logger.info("│      APPOINTMENT CANCELLED           │")
    logger.info("├─────────────────────────────────────┤")
    logger.info(f"│  ID         : {data.get('id')}")
    logger.info(f"│  Patient ID : {data.get('patient_id')}")
    logger.info(f"│  Doctor ID  : {data.get('doctor_id')}")
    logger.info(f"│  Scheduled  : {data.get('scheduled_at')}")
    logger.info("└─────────────────────────────────────┘")


def handle_appointment_updated(data):
    logger.info("┌─────────────────────────────────────┐")
    logger.info("│      APPOINTMENT UPDATED             │")
    logger.info("├─────────────────────────────────────┤")
    logger.info(f"│  ID         : {data.get('id')}")
    logger.info(f"│  New Status : {data.get('status')}")
    logger.info(f"│  Scheduled  : {data.get('scheduled_at')}")
    logger.info("└─────────────────────────────────────┘")


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