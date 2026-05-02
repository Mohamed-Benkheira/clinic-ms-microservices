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

export interface BackendDoctorCreatePayload {
  full_name: string;
  specialization: string;
  phone: string;
  email: string;
  license_number: string;
}

const SPECIALTY_TO_BACKEND: Record<string, string> = {
  "General Practice": "general",
  Cardiology: "cardiology",
  Pediatrics: "pediatrics",
  Neurology: "neurology",
  Orthopedics: "orthopedics",
  Dermatology: "dermatology",
};

const SPECIALTY_FROM_BACKEND: Record<string, string> = {
  general: "General Practice",
  cardiology: "Cardiology",
  pediatrics: "Pediatrics",
  neurology: "Neurology",
  orthopedics: "Orthopedics",
  dermatology: "Dermatology",
  other: "Other",
};

export function normalizeDoctor(d: BackendDoctor): Doctor {
  return {
    id: String(d.id),
    name: d.full_name,
    specialty: SPECIALTY_FROM_BACKEND[d.specialization] ?? d.specialization,
    license: d.license_number,
    phone: d.phone,
    email: d.email,
    status: d.available ? "AVAILABLE" : "BUSY",
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
  if (payload.name) body.full_name = payload.name;
  if (payload.specialty)
    body.specialization = SPECIALTY_TO_BACKEND[payload.specialty] ?? payload.specialty;
  if (payload.phone) body.phone = payload.phone;
  if (payload.email) body.email = payload.email;
  if (payload.license) body.license_number = payload.license;
  if (payload.status !== undefined) body.available = payload.status === "AVAILABLE";
  const { data } = await apiClient.patch<BackendDoctor>(`/api/doctors/${id}/`, body);
  return normalizeDoctor(data);
}

export async function updateDoctorAvailability(id: string, available: boolean): Promise<Doctor> {
  const { data } = await apiClient.patch<BackendDoctor>(`/api/doctors/${id}/availability/`, {
    available,
  });
  return normalizeDoctor(data);
}

export async function createDoctor(payload: Omit<Doctor, "id" | "status">): Promise<Doctor> {
  const body: BackendDoctorCreatePayload = {
    full_name: payload.name,
    specialization: SPECIALTY_TO_BACKEND[payload.specialty] ?? payload.specialty,
    phone: payload.phone,
    email: payload.email,
    license_number: payload.license,
  };
  const { data } = await apiClient.post<BackendDoctor>("/api/doctors/", body);
  return normalizeDoctor(data);
}
