import { apiClient } from "./client";
import type { Appointment } from "../types";

type BackendStatus = "scheduled" | "completed" | "cancelled";
type FrontendStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface BackendAppointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  scheduled_at: string;
  status: BackendStatus;
  reason: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendAppointmentPayload {
  patient_id: number;
  doctor_id: number;
  scheduled_at: string;
  reason: string;
  notes?: string;
}

function upStatus(s: BackendStatus): FrontendStatus {
  return s.toUpperCase() as FrontendStatus;
}
function downStatus(s: FrontendStatus): BackendStatus {
  return s.toLowerCase() as BackendStatus;
}

export function normalizeAppointment(a: BackendAppointment): Appointment {
  return {
    id:              String(a.id),
    patientId:       String(a.patient_id),
    doctorId:        String(a.doctor_id),
    datetime:        a.scheduled_at,
    status:          upStatus(a.status),
    reason:          a.reason,
    notes:           a.notes ?? "",
    appointmentType: "Consultation",
    duration:        "30 min",
    notifyPatient:   false,
  };
}

export async function fetchAppointments(params?: Record<string, string>): Promise<Appointment[]> {
  const { data } = await apiClient.get<BackendAppointment[]>("/api/appointments/", { params });
  return data.map(normalizeAppointment);
}

export async function fetchAppointment(id: string): Promise<Appointment> {
  const { data } = await apiClient.get<BackendAppointment>(`/api/appointments/${id}/`);
  return normalizeAppointment(data);
}

export async function createAppointment(payload: Omit<Appointment, "id">): Promise<Appointment> {
  const body: BackendAppointmentPayload = {
    patient_id:   Number(payload.patientId),
    doctor_id:    Number(payload.doctorId),
    scheduled_at: payload.datetime,
    reason:       payload.reason,
    notes:        payload.notes,
  };
  const { data } = await apiClient.post<BackendAppointment>("/api/appointments/", body);
  return normalizeAppointment(data);
}

export async function updateAppointmentStatus(id: string, status: FrontendStatus): Promise<Appointment> {
  const { data } = await apiClient.patch<BackendAppointment>(
    `/api/appointments/${id}/status/`,
    { status: downStatus(status) }
  );
  return normalizeAppointment(data);
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  return updateAppointmentStatus(id, "CANCELLED");
}
