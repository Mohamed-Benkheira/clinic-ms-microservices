import pika
import json
import os
import time
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [NOTIFICATION] %(message)s'
)
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://clinicos:rabbit2025@clinicos_rabbitmq:5672/clinicos')

def handle_appointment_created(ch, method, properties, body):
    try:
        data = json.loads(body)
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        logger.info("📅 NEW APPOINTMENT NOTIFICATION")
        logger.info(f"   Appointment ID : {data.get('id')}")
        logger.info(f"   Patient ID     : {data.get('patient_id')}")
        logger.info(f"   Doctor ID      : {data.get('doctor_id')}")
        logger.info(f"   Scheduled At   : {data.get('scheduled_at')}")
        logger.info(f"   Reason         : {data.get('reason')}")
        logger.info(f"   Status         : {data.get('status')}")
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def start_worker():
    while True:
        try:
            logger.info("Connecting to RabbitMQ...")
            params = pika.URLParameters(RABBITMQ_URL)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()

            channel.exchange_declare(
                exchange='clinicos.events',
                exchange_type='topic',
                durable=True
            )

            channel.queue_declare(queue='notifications', durable=True)
            channel.queue_bind(
                queue='notifications',
                exchange='clinicos.events',
                routing_key='appointment.created'
            )

            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue='notifications',
                on_message_callback=handle_appointment_created
            )

            logger.info("✅ Notification Worker started — waiting for events...")
            channel.start_consuming()

        except pika.exceptions.AMQPConnectionError:
            logger.warning("RabbitMQ not ready, retrying in 5s...")
            time.sleep(5)
        except KeyboardInterrupt:
            logger.info("Worker stopped.")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}, retrying in 5s...")
            time.sleep(5)

if __name__ == '__main__':
    start_worker()
