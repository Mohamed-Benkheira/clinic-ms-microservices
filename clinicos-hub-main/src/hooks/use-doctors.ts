import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDoctors, fetchDoctor, updateDoctor, updateDoctorAvailability } from "../lib/api/doctors.api";
import { queryKeys } from "../lib/api/query-keys";
import type { Doctor } from "../lib/types";

export function useDoctors() {
  return useQuery({
    queryKey: queryKeys.doctors.all,
    queryFn:  fetchDoctors,
    staleTime: 30_000,
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn:  () => fetchDoctor(id),
    enabled:  !!id,
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Doctor> & { id: string }) =>
      updateDoctor(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.doctors.all });
      qc.invalidateQueries({ queryKey: queryKeys.doctors.detail(id) });
    },
  });
}

export function useUpdateDoctorAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      updateDoctorAvailability(id, available),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.doctors.all }),
  });
}
