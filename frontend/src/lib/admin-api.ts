import { apiFetch, type AuthUser } from "@/lib/api";

export interface AdminStats {
  totals: {
    users: number;
    chats: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  signupsByDay: { ts: number; count: number }[];
  chatsByDay: { ts: number; count: number }[];
  languageSplit: { language: string; count: number }[];
}

async function asJson(r: Response) {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { error?: string }).error || `Request failed: ${r.status}`);
  return data;
}

export async function fetchStats(): Promise<AdminStats> {
  const r = await apiFetch("/api/admin/stats");
  return (await asJson(r)) as AdminStats;
}

export async function fetchUsers(q?: string): Promise<AuthUser[]> {
  const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : "/api/admin/users";
  const r = await apiFetch(url);
  const data = await asJson(r);
  return data.users as AuthUser[];
}

export async function updateUser(id: number, patch: { disabled?: boolean; name?: string }) {
  const r = await apiFetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  const data = await asJson(r);
  return data.user as AuthUser;
}

export async function deleteUser(id: number) {
  const r = await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
  await asJson(r);
}

export async function resetUserPassword(id: number): Promise<string> {
  const r = await apiFetch(`/api/admin/users/${id}/reset-password`, { method: "POST" });
  const data = await asJson(r);
  return data.tempPassword as string;
}
