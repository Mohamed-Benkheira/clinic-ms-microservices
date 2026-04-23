import pika
import json
import os
import logging

logger = logging.getLogger(__name__)

def publish_appointment_created(appointment_data):
    try:
        url = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672/')
        params = pika.URLParameters(url)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()

        channel.exchange_declare(
            exchange='clinicos.events',
            exchange_type='topic',
            durable=True
        )

        channel.basic_publish(
            exchange='clinicos.events',
            routing_key='appointment.created',
            body=json.dumps(appointment_data),
            properties=pika.BasicProperties(
                delivery_mode=2,  # persistent
                content_type='application/json'
            )
        )

        connection.close()
        logger.info(f"Published appointment.created event: {appointment_data}")
        print(f"✅ RabbitMQ: published appointment.created for appointment {appointment_data.get('id')}")

    except Exception as e:
        logger.error(f"RabbitMQ publish failed: {e}")
        print(f"⚠️ RabbitMQ publish failed: {e}")
