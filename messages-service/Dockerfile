FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8006
CMD ["sh", "-c", "python manage.py migrate --run-syncdb 2>/dev/null || true && gunicorn messages_service.wsgi:application --bind 0.0.0.0:8006 --workers 2"]