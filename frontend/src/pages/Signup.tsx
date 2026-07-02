import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const passwordHint = passwordStrength(password);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      navigate("/chat", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Could not create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Mlimi AI in under a minute — it's free."
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-leaf-700 hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name">
          <Input
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chimwemwe Banda"
          />
        </Field>

        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field
          label="Password"
          extra={
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {show ? "Hide" : "Show"}
            </button>
          }
        >
          <Input
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          <PasswordMeter hint={passwordHint} />
        </Field>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="h-12 w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}

function Field({
  label,
  extra,
  children,
}: {
  label: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground/80">{label}</span>
        {extra}
      </div>
      {children}
    </label>
  );
}

type Strength = { score: 0 | 1 | 2 | 3; label: string; color: string };

function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: " ", color: "bg-transparent" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  const map: Record<number, Strength> = {
    0: { score: 0, label: "Too short", color: "bg-destructive" },
    1: { score: 1, label: "Weak", color: "bg-destructive/70" },
    2: { score: 2, label: "Okay", color: "bg-harvest-400" },
    3: { score: 3, label: "Strong", color: "bg-leaf-500" },
  };
  return map[s];
}

function PasswordMeter({ hint }: { hint: Strength }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < hint.score ? hint.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <span className="w-16 text-right text-[11px] font-medium text-muted-foreground">
        {hint.label}
      </span>
    </div>
  );
}
