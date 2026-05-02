import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAppointments,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
} from "../lib/api/appointments.api";
import { queryKeys } from "../lib/api/query-keys";
import type { Appointment } from "../lib/types";

export function useAppointments(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...queryKeys.appointments.all, params],
    queryFn: () => fetchAppointments(params),
    staleTime: 20_000,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Appointment, "id">) => createAppointment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.appointments.all }),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Appointment["status"] }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.appointments.all }),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.appointments.all }),
  });
}
