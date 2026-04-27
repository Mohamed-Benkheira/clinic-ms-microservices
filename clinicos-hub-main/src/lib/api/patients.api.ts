import { apiClient } from "./client";
import type { Patient } from "../types";

export interface BackendPatient {
  id: number;
  full_name: string;
  date_of_birth: string | null;
  gender: "male" | "female";
  phone: string;
  email: string;
  address: string | null;
  medical_notes: string;
  created_at: string;
  updated_at: string;
}

export interface BackendPatientPayload {
  full_name: string;
  date_of_birth?: string;
  gender: "male" | "female";
  phone: string;
  email: string;
  address?: string;
  medical_notes?: string;
}

export function normalizePatient(p: BackendPatient): Patient {
  return {
    id:     String(p.id),
    name:   p.full_name,
    email:  p.email,
    phone:  p.phone,
    gender: p.gender === "female" ? "F" : "M",
    dob:    p.date_of_birth ?? "",
    notes:  p.medical_notes ?? "",
  };
}

export function denormalizePatient(p: Omit<Patient, "id">): BackendPatientPayload {
  return {
    full_name:     p.name,
    email:         p.email,
    phone:         p.phone,
    gender:        p.gender === "F" ? "female" : "male",
    date_of_birth: p.dob || undefined,
    medical_notes: p.notes,
  };
}

export async function fetchPatients(): Promise<Patient[]> {
  const { data } = await apiClient.get<BackendPatient[]>("/api/patients/");
  return data.map(normalizePatient);
}

export async function fetchPatient(id: string): Promise<Patient> {
  const { data } = await apiClient.get<BackendPatient>(`/api/patients/${id}/`);
  return normalizePatient(data);
}

export async function createPatient(payload: Omit<Patient, "id">): Promise<Patient> {
  const { data } = await apiClient.post<BackendPatient>("/api/patients/", denormalizePatient(payload));
  return normalizePatient(data);
}

export async function updatePatient(id: string, payload: Partial<Patient>): Promise<Patient> {
  const partial: Partial<BackendPatientPayload> = {};
  if (payload.name)              partial.full_name     = payload.name;
  if (payload.email)             partial.email         = payload.email;
  if (payload.phone)             partial.phone         = payload.phone;
  if (payload.gender)            partial.gender        = payload.gender === "F" ? "female" : "male";
  if (payload.dob)               partial.date_of_birth = payload.dob;
  if (payload.notes !== undefined) partial.medical_notes = payload.notes;
  const { data } = await apiClient.patch<BackendPatient>(`/api/patients/${id}/`, partial);
  return normalizePatient(data);
}

export async function deletePatient(id: string): Promise<void> {
  await apiClient.delete(`/api/patients/${id}/`);
}

export async function updatePatientNotes(id: string, notes: string): Promise<Patient> {
  const { data } = await apiClient.patch<BackendPatient>(
    `/api/patients/${id}/notes/`,
    { medical_notes: notes }
  );
  return normalizePatient(data);
}
