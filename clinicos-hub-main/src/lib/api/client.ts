import axios from "axios";

const SERVICE_URLS = {
  auth: import.meta.env.VITE_AUTH_URL ?? "http://localhost:8001",
  patients: import.meta.env.VITE_PATIENTS_URL ?? "http://localhost:8002",
  doctors: import.meta.env.VITE_DOCTORS_URL ?? "http://localhost:8003",
  appointments: import.meta.env.VITE_APPOINTMENTS_URL ?? "http://localhost:8004",
  messages: import.meta.env.VITE_MESSAGES_URL ?? "http://localhost:8006",
};

const routeMap: [RegExp, string][] = [
  [/^\/api\/auth/, SERVICE_URLS.auth],
  [/^\/api\/patients/, SERVICE_URLS.patients],
  [/^\/api\/doctors/, SERVICE_URLS.doctors],
  [/^\/api\/appointments/, SERVICE_URLS.appointments],
  [/^\/api\/conversations/, SERVICE_URLS.messages],
  [/^\/api\/messages/, SERVICE_URLS.messages],
];

export const apiClient = axios.create({
  baseURL: "http://localhost",
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  for (const [pattern, baseUrl] of routeMap) {
    if (pattern.test(config.url || "")) {
      config.baseURL = baseUrl;
      break;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

let _token: string | null = null;

export function setToken(token: string) {
  _token = token;
  try {
    sessionStorage.setItem("clinicos.token", token);
  } catch {
    /* sandboxed */
  }
}

export function getToken(): string | null {
  if (_token) return _token;
  try {
    return sessionStorage.getItem("clinicos.token");
  } catch {
    return null;
  }
}

export function clearToken() {
  _token = null;
  try {
    sessionStorage.removeItem("clinicos.token");
  } catch {
    /* sandboxed */
  }
}
