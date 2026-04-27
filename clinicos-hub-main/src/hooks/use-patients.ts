import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPatients, fetchPatient, createPatient, updatePatient, deletePatient } from "../lib/api/patients.api";
import { queryKeys } from "../lib/api/query-keys";
import type { Patient } from "../lib/types";

export function usePatients(page = 1) {
  return useQuery({
    queryKey: queryKeys.patients.list(page),
    queryFn: () => fetchPatients(page),
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: () => fetchPatient(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Patient, "id">) => createPatient(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.patients.all }),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Patient> & { id: string }) =>
      updatePatient(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.patients.all });
      qc.invalidateQueries({ queryKey: queryKeys.patients.detail(id) });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.patients.all }),
  });
}
