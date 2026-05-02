#!/bin/bash
set -e

echo "=== Seeding Clinicos Demo Data ==="

# Auth Service - Users
echo "[1/4] Creating users in auth-service..."
docker exec clinicos_auth python manage.py shell -c "
from accounts.models import User
users = [
    ('admin@clinicos.med',    'Admin1234!',       'admin',         'Admin User'),
    ('doctor@clinicos.med',   'Doctor1234!',      'doctor',        'Dr. Sarah Johnson'),
    ('reception@clinicos.med','Reception1234!',   'receptionist',  'Maria Lopez'),
    ('patient@clinicos.med',  'Patient1234!',     'patient',       'John Smith'),
]
for email, pwd, role, name in users:
    if not User.objects.filter(email=email).exists():
        u = User.objects.create_superuser(email, pwd, role=role, full_name=name)
        print(f'Created {role}: {email}')
    else:
        print(f'Already exists: {email}')
"

# Patient Service - Sample patients
echo "[2/4] Seeding patients in patient-service..."
docker exec clinicos_patient python manage.py shell -c "
from patients.models import Patient
import datetime

patients = [
    {'full_name': 'Alice Brown',    'date_of_birth': '1985-03-15', 'gender': 'female', 'phone': '555-0101', 'email': 'alice@email.com',    'address': '123 Oak St',   'medical_notes': 'Regular checkups'},
    {'full_name': 'Bob Wilson',     'date_of_birth': '1972-07-22', 'gender': 'male',   'phone': '555-0102', 'email': 'bob@email.com',      'address': '456 Pine Ave', 'medical_notes': 'Allergic to penicillin'},
    {'full_name': 'Carol Davis',    'date_of_birth': '1990-11-08', 'gender': 'female', 'phone': '555-0103', 'email': 'carol@email.com',   'address': '789 Elm Blvd', 'medical_notes': 'Diabetic'},
    {'full_name': 'David Miller',   'date_of_birth': '1968-01-30', 'gender': 'male',   'phone': '555-0104', 'email': 'david@email.com',    'address': '321 Maple Ln', 'medical_notes': 'Hypertension'},
    {'full_name': 'Eva Martinez',   'date_of_birth': '1995-06-12', 'gender': 'female', 'phone': '555-0105', 'email': 'eva@email.com',      'address': '654 Cedar Rd', 'medical_notes': 'Athletic physical'},
]
for p in patients:
    if not Patient.objects.filter(email=p['email']).exists():
        Patient.objects.create(**p)
        print(f\"Created patient: {p['full_name']}\")
    else:
        print(f\"Already exists: {p['full_name']}\")
"

# Doctor Service - Sample doctors
echo "[3/4] Seeding doctors in doctor-service..."
docker exec clinicos_doctor python manage.py shell -c "
from doctors.models import Doctor

doctors = [
    {'full_name': 'Dr. James Chen',       'specialization': 'general',      'phone': '555-1001', 'email': 'j.chen@clinicos.med',   'license_number': 'US-GEN-001',  'available': True},
    {'full_name': 'Dr. Emily Roberts',     'specialization': 'cardiology',   'phone': '555-1002', 'email': 'e.roberts@clinicos.med', 'license_number': 'US-CARD-002', 'available': True},
    {'full_name': 'Dr. Michael Torres',    'specialization': 'pediatrics',    'phone': '555-1003', 'email': 'm.torres@clinicos.med',  'license_number': 'US-PED-003',  'available': False},
]
for d in doctors:
    if not Doctor.objects.filter(license_number=d['license_number']).exists():
        Doctor.objects.create(**d)
        print(f\"Created doctor: {d['full_name']}\")
    else:
        print(f\"Already exists: {d['full_name']}\")
"

# Appointment Service - Sample appointments
echo "[4/4] Seeding appointments in appointment-service..."
docker exec clinicos_appointment python manage.py shell -c "
from appointments.models import Appointment
from django.utils import timezone
import datetime

# Use fixed dates for idempotency
base_date = timezone.now().replace(hour=9, minute=0, second=0, microsecond=0)

appts = [
    {'patient_id': 2, 'doctor_id': 1, 'scheduled_at': base_date + datetime.timedelta(days=1),  'status': 'SCHEDULED', 'reason': 'Annual checkup',           'duration': 30, 'appointment_type': 'checkup',       'notify_patient': True,  'payment': 50.00},
    {'patient_id': 3, 'doctor_id': 2, 'scheduled_at': base_date + datetime.timedelta(days=3),  'status': 'SCHEDULED', 'reason': 'Heart palpitations', 'duration': 45, 'appointment_type': 'consultation',  'notify_patient': True,  'payment': 100.00},
    {'patient_id': 2, 'doctor_id': 3, 'scheduled_at': base_date + datetime.timedelta(days=7), 'status': 'SCHEDULED', 'reason': 'Follow-up visit',          'duration': 20, 'appointment_type': 'followup',      'notify_patient': False, 'payment': 0.00},
]
for a in appts:
    exists = Appointment.objects.filter(
        patient_id=a['patient_id'],
        doctor_id=a['doctor_id'],
        reason=a['reason']
    ).exists()
    if not exists:
        Appointment.objects.create(**a)
        print(f\"Created appointment: patient={a['patient_id']}, doctor={a['doctor_id']}, reason={a['reason']}\")
    else:
        print(f\"Already exists: patient={a['patient_id']}, doctor={a['doctor_id']}, reason={a['reason']}\")
"

echo "=== Seed complete ==="

# Verify
echo ""
echo "=== Verification ==="
echo "Patients: $(curl -s http://localhost:8002/api/patients/ | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))')"
echo "Doctors:  $(curl -s http://localhost:8003/api/doctors/ | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))')"
echo "Appointments: $(curl -s http://localhost:8004/api/appointments/ | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))')"