import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// ── Token helpers (in-memory + sessionStorage fallback) ──────────────────────
let _token: string | null = null;

export function setToken(token: string) {
  _token = token;
  try { sessionStorage.setItem("clinicos.token", token); } catch { /* sandboxed */ }
}

export function getToken(): string | null {
  if (_token) return _token;
  try { return sessionStorage.getItem("clinicos.token"); } catch { return null; }
}

export function clearToken() {
  _token = null;
  try { sessionStorage.removeItem("clinicos.token"); } catch { /* sandboxed */ }
}
