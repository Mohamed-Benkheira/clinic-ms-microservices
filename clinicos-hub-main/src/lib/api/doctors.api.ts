import { apiClient } from "./client";
import type { Doctor } from "../types";

export interface BackendDoctor {
  id: number;
  full_name: string;
  specialization: string;
  phone: string;
  email: string;
  license_number: string;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendDoctorPayload {
  full_name?: string;
  specialization?: string;
  phone?: string;
  email?: string;
  license_number?: string;
  available?: boolean;
}

export function normalizeDoctor(d: BackendDoctor): Doctor {
  return {
    id:        String(d.id),
    name:      d.full_name,
    specialty: d.specialization,
    license:   d.license_number,
    phone:     d.phone,
    email:     d.email,
    status:    d.available ? "AVAILABLE" : "BUSY",
  };
}

export async function fetchDoctors(): Promise<Doctor[]> {
  const { data } = await apiClient.get<BackendDoctor[]>("/api/doctors/");
  return data.map(normalizeDoctor);
}

export async function fetchDoctor(id: string): Promise<Doctor> {
  const { data } = await apiClient.get<BackendDoctor>(`/api/doctors/${id}/`);
  return normalizeDoctor(data);
}

export async function updateDoctor(id: string, payload: Partial<Doctor>): Promise<Doctor> {
  const body: BackendDoctorPayload = {};
  if (payload.name)     body.full_name      = payload.name;
  if (payload.specialty)body.specialization = payload.specialty;
  if (payload.phone)    body.phone          = payload.phone;
  if (payload.email)    body.email          = payload.email;
  if (payload.license)  body.license_number = payload.license;
  if (payload.status !== undefined) body.available = payload.status === "AVAILABLE";
  const { data } = await apiClient.patch<BackendDoctor>(`/api/doctors/${id}/`, body);
  return normalizeDoctor(data);
}

export async function updateDoctorAvailability(id: string, available: boolean): Promise<Doctor> {
  const { data } = await apiClient.patch<BackendDoctor>(
    `/api/doctors/${id}/availability/`,
    { available }
  );
  return normalizeDoctor(data);
}
