const TOKEN_KEY = "mlimi.token";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  const t = getToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  return fetch(apiUrl(input), { ...init, headers });
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  createdAt: number;
  isAdmin?: boolean;
  disabled?: boolean;
}

export async function signup(name: string, email: string, password: string) {
  const r = await apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Could not create account.");
  return data as { token: string; user: AuthUser };
}

export async function login(email: string, password: string) {
  const r = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Could not sign in.");
  return data as { token: string; user: AuthUser };
}

export async function fetchMe() {
  const r = await apiFetch("/api/auth/me");
  if (!r.ok) throw new Error("Not authenticated");
  const data = await r.json();
  return data.user as AuthUser;
}
