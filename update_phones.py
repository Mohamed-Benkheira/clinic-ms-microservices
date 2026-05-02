#!/usr/bin/env python3
import subprocess
import json
import sys

def get_token():
    result = subprocess.run([
        "curl", "-s", "-X", "POST",
        "http://localhost:8001/api/auth/login/",
        "-H", "Content-Type: application/json",
        "-d", '{"email":"admin@clinicos.med","password":"Admin1234!"}'
    ], capture_output=True, text=True)
    return json.loads(result.stdout)["access"]

def get_patients(token):
    result = subprocess.run([
        "curl", "-s",
        "http://localhost:8002/api/patients/",
        "-H", f"Authorization: Bearer {token}"
    ], capture_output=True, text=True)
    return json.loads(result.stdout)

def update_patient(token, patient_id, phone):
    # Get current patient data
    result = subprocess.run([
        "curl", "-s",
        f"http://localhost:8002/api/patients/{patient_id}/",
        "-H", f"Authorization: Bearer {token}"
    ], capture_output=True, text=True)
    patient = json.loads(result.stdout)
    
    # Update phone
    patient["phone"] = phone
    
    # PUT updated patient
    result = subprocess.run([
        "curl", "-s", "-X", "PUT",
        f"http://localhost:8002/api/patients/{patient_id}/",
        "-H", f"Authorization: Bearer {token}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps(patient)
    ], capture_output=True, text=True)
    return json.loads(result.stdout)

def main():
    token = get_token()
    patients = get_patients(token)
    
    phones = ["+213796081530", "+213770090216"]
    
    for i, patient in enumerate(patients):
        patient_id = patient["id"]
        phone = phones[i % 2]
        result = update_patient(token, patient_id, phone)
        print(f"Updated patient {patient_id}: {result.get('phone', 'ERROR')}")

if __name__ == "__main__":
    main()