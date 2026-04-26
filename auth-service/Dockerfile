FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn core.wsgi:application --bind 0.0.0.0:8001 --workers 2"]