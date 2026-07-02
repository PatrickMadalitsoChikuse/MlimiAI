import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UserCog,
  Users,
  Activity,
  Settings as SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  deleteUser,
  fetchStats,
  fetchUsers,
  resetUserPassword,
  updateUser,
  type AdminStats,
} from "@/lib/admin-api";
import type { AuthUser } from "@/lib/api";

type Tab = "dashboard" | "users" | "system";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="field-gradient min-h-screen w-full">
      <header className="border-b border-border/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/chat"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground/80 hover:bg-muted"
              aria-label="Back to chat"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-display text-lg font-bold tracking-tight">
              Mlimi Admin
            </h1>
          </div>
          <nav className="flex items-center gap-1 rounded-full border border-border bg-white p-1 text-sm">
            <TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
              <Activity className="h-4 w-4" /> Dashboard
            </TabButton>
            <TabButton active={tab === "users"} onClick={() => setTab("users")}>
              <Users className="h-4 w-4" /> Users
            </TabButton>
            <TabButton active={tab === "system"} onClick={() => setTab("system")}>
              <SettingsIcon className="h-4 w-4" /> System
            </TabButton>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {tab === "dashboard" && <Dashboard />}
        {tab === "users" && <UsersTab />}
        {tab === "system" && <SystemTab />}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-leaf-100 text-leaf-800"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      setStats(await fetchStats());
    } catch (e: any) {
      setErr(e?.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading analytics…
      </div>
    );
  }

  if (err) return <ErrorBanner message={err} onRetry={load} />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Last 30 days</h2>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total users" value={stats.totals.users} />
        <Stat label="Chat requests" value={stats.totals.chats} />
        <Stat label="Tokens used" value={stats.totals.totalTokens.toLocaleString()} />
        <Stat
          label="Est. cost (USD)"
          value="$0.00"
          hint="External endpoint does not report token pricing"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChart title="Signups per day" series={stats.signupsByDay} />
        <BarChart title="Chat requests per day" series={stats.chatsByDay} />
      </div>

      <LanguageSplit data={stats.languageSplit} />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function BarChart({
  title,
  series,
}: {
  title: string;
  series: { ts: number; count: number }[];
}) {
  const max = Math.max(1, ...series.map((s) => s.count));
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {series.length === 0 ? (
        <p className="text-xs text-muted-foreground">No activity in the last 30 days.</p>
      ) : (
        <div className="flex h-40 items-end gap-1">
          {series.map((s) => {
            const date = new Date(s.ts * 1000);
            return (
              <div key={s.ts} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div
                  className="w-full rounded-t bg-leaf-500/80"
                  style={{ height: `${(s.count / max) * 100}%` }}
                  title={`${date.toLocaleDateString()}: ${s.count}`}
                />
                <div className="text-[9px] text-muted-foreground">
                  {date.getDate()}/{date.getMonth() + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LanguageSplit({ data }: { data: { language: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Language split</h3>
      {total === 0 ? (
        <p className="text-xs text-muted-foreground">No chat requests yet.</p>
      ) : (
        <div className="space-y-2">
          {data.map((d) => {
            const pct = (d.count / total) * 100;
            return (
              <div key={d.language}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{labelForLang(d.language)}</span>
                  <span className="text-muted-foreground">
                    {d.count} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-leaf-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function labelForLang(code: string) {
  if (code === "ny") return "Chichewa";
  if (code === "en") return "English";
  return code;
}

function UsersTab() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tempPassword, setTempPassword] = useState<{ email: string; pwd: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AuthUser | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      setUsers(await fetchUsers(q || undefined));
    } catch (e: any) {
      setErr(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleDisabled(u: AuthUser) {
    try {
      const updated = await updateUser(u.id, { disabled: !u.disabled });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (e: any) {
      alert(e?.message || "Failed to update user");
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    try {
      await deleteUser(confirmDelete.id);
      setUsers((prev) => prev.filter((x) => x.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (e: any) {
      alert(e?.message || "Failed to delete user");
    }
  }

  async function doReset(u: AuthUser) {
    try {
      const pwd = await resetUserPassword(u.id);
      setTempPassword({ email: u.email, pwd });
    } catch (e: any) {
      alert(e?.message || "Failed to reset password");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Users</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="relative w-64"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email"
            className="pl-9"
          />
        </form>
      </div>

      {err && <ErrorBanner message={err} onRetry={load} />}

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="px-4 py-3 font-medium">
                    {u.name}
                    {u.isAdmin && (
                      <span className="ml-2 rounded-full bg-harvest-100 px-2 py-0.5 text-[10px] font-semibold text-harvest-700">
                        ADMIN
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.createdAt * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {u.disabled ? (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                        Suspended
                      </span>
                    ) : (
                      <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-[11px] font-semibold text-leaf-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => doReset(u)}
                        title="Reset password"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleDisabled(u)}
                        title={u.disabled ? "Re-enable" : "Suspend"}
                      >
                        <UserCog className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(u)}
                        title="Delete"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {tempPassword && (
        <Modal onClose={() => setTempPassword(null)} title="Temporary password">
          <p className="text-sm text-muted-foreground">
            Share this with <strong>{tempPassword.email}</strong> over a private channel.
            They should sign in and change it immediately.
          </p>
          <div className="mt-3 rounded-xl border border-border bg-muted p-3 font-mono text-sm">
            {tempPassword.pwd}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setTempPassword(null)}>Done</Button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} title="Delete user?">
          <p className="text-sm text-muted-foreground">
            This permanently removes <strong>{confirmDelete.email}</strong>. They will no
            longer be able to sign in.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              onClick={doDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SystemTab() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">System</h2>
      <div className="space-y-3">
        <InfoCard label="Model" value="English inference endpoint" hint="ENGLISH_MODEL_URL env var" />
        <InfoCard label="Languages" value="English, Chichewa" hint="Configured in frontend Header" />
        <InfoCard
          label="System prompt"
          value="Mlimi AI / Malawi smallholder context — strict per-language reply rules"
          hint="Defined in backend/app.py — edit and restart Flask to change"
        />
      </div>
      <p className="rounded-xl border border-border bg-white p-4 text-xs text-muted-foreground">
        Live configuration editing is read-only for now. Let me know if you want to enable
        model selection or live system-prompt edits from this panel.
      </p>
    </div>
  );
}

function InfoCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h3 className="mb-2 text-base font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <span>{message}</span>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
