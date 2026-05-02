import { apiClient, setToken, clearToken } from "./client";
import type { Role } from "../types";

export interface LoginPayload {
  email: string;
  password: string;
}

type BackendRole = "admin" | "doctor" | "receptionist" | "patient";

function normalizeRole(r: BackendRole): Role {
  return r.toUpperCase() as Role;
}

interface BackendAuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: BackendRole;
    created_at: string;
  };
}

export interface NormalizedAuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  refresh: string;
}

export async function loginRequest(payload: LoginPayload): Promise<NormalizedAuthUser> {
  const { data } = await apiClient.post<BackendAuthResponse>("/api/auth/login/", payload);
  setToken(data.access);
  return {
    id: String(data.user.id),
    email: data.user.email,
    name: data.user.full_name,
    role: normalizeRole(data.user.role),
    refresh: data.refresh,
  };
}

export async function logoutRequest(refresh: string): Promise<void> {
  try {
    await apiClient.post("/api/auth/logout/", { refresh });
  } catch {
    /* best effort */
  }
  clearToken();
}

export async function refreshTokenRequest(refresh: string): Promise<string> {
  const { data } = await apiClient.post<{ access: string }>("/api/auth/refresh/", { refresh });
  setToken(data.access);
  return data.access;
}

export async function getMeRequest(): Promise<NormalizedAuthUser> {
  const { data } = await apiClient.get<BackendAuthResponse["user"]>("/api/auth/me/");
  return {
    id: String(data.id),
    email: data.email,
    name: data.full_name,
    role: normalizeRole(data.role),
    refresh: "",
  };
}
