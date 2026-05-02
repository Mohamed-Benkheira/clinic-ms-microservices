FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x start.sh

EXPOSE 8005

CMD ["bash", "start.sh"]
