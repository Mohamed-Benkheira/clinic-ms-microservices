# Clinicos

Healthcare microservices application.

## Services

| Service             | Port | Route             | Tech                 |
| ------------------- | ---- | ----------------- | -------------------- |
| clinicos-hub-main   | 5173 | /                 | React/TanStack Start |
| auth-service        | 8001 | /api/auth         | Django               |
| patient-service     | 8002 | /api/patients     | Django               |
| doctor-service      | 8003 | /api/doctors      | Django               |
| appointment-service | 8004 | /api/appointments | Django               |

## Run Commands

```bash
# Frontend (primary)
cd clinicos-hub-main && npm run dev

# All backend services + infrastructure
cd infrastructure && docker-compose up

# Lint / format
cd clinicos-hub-main && npm run lint
cd clinicos-hub-main && npm run format
```

## Notes

- All Django services share the same requirements: django, djangorestframework, djangorestframework-simplejwt, psycopg2-binary, python-consul, django-cors-headers, gunicorn
- Service discovery via Consul (port 8500)
- Message queue via RabbitMQ (port 5672, management: 15672)
- Traefik routes by path prefix

## Entry Points

- Frontend: `clinicos-hub-main/src/main.tsx`
- Django: `*/manage.py`
