import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getToken } from "@/lib/api/client";

const NOTIF_API_URL = import.meta.env.VITE_NOTIFICATION_API_URL ?? "http://localhost:8005";

const notifClient = axios.create({
  baseURL: NOTIF_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

notifClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  patient_email?: string;
  patient_phone?: string;
  patient_name?: string;
  channel?: string;
  email_status?: string;
  wa_status?: string;
}

export interface NotificationTemplate {
  id: number;
  label: string;
  body: string;
  body_html?: string;
  channel: string;
  event_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  appointment_created_enabled: boolean;
  appointment_cancelled_enabled: boolean;
  appointment_updated_enabled: boolean;
  appointment_created_channel: string;
  appointment_cancelled_channel: string;
  appointment_updated_channel: string;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
}

export interface ComposePayload {
  patient_id: number;
  body: string;
  title?: string;
  channel?: "Email" | "WhatsApp" | "Both";
  template_id?: number;
  patient_email?: string;
  patient_phone?: string;
  patient_name?: string;
}

// ==================== NOTIFICATIONS ====================

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => notifClient.get("/api/notifications/").then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notifClient.patch(`/api/notifications/${id}/read/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useResendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notifClient.post(`/api/notifications/${id}/resend/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useComposeNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ComposePayload) =>
      notifClient.post("/api/notifications/compose/", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ==================== TEMPLATES ====================

export function useTemplates() {
  return useQuery<NotificationTemplate[]>({
    queryKey: ["notification-templates"],
    queryFn: () => notifClient.get("/api/notifications/templates/").then((r) => r.data),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (template: Omit<NotificationTemplate, "id" | "created_at" | "updated_at">) =>
      notifClient.post("/api/notifications/templates/", template, {
        params: template,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-templates"] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...template }: Partial<NotificationTemplate> & { id: number }) =>
      notifClient.put(`/api/notifications/templates/${id}/`, undefined, {
        params: template,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notifClient.delete(`/api/notifications/templates/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-templates"] }),
  });
}

// ==================== SETTINGS ====================

export function useNotificationSettings() {
  return useQuery<NotificationSettings>({
    queryKey: ["notification-settings"],
    queryFn: () => notifClient.get("/api/notifications/settings/").then((r) => r.data),
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      notifClient.put("/api/notifications/settings/", undefined, {
        params: settings,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-settings"] }),
  });
}

// ==================== TEMPLATE VARIABLES ====================

export function useTemplateVariables() {
  return useQuery({
    queryKey: ["template-variables"],
    queryFn: () => notifClient.get("/api/notifications/template-variables/").then((r) => r.data),
  });
}
