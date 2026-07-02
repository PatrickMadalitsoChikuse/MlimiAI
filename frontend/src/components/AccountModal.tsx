import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccountModal({ open, onClose }: AccountModalProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !user) return null;

  function handleSignOut() {
    onClose();
    signOut();
    navigate("/");
  }

  function openSettings() {
    onClose();
    navigate("/settings");
  }

  function openAdmin() {
    onClose();
    navigate("/admin");
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-harvest-300 to-harvest-500 text-sm font-bold text-soil-500 shadow-sm">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-foreground">
                {user.name}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {user.email}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {user.isAdmin && (
            <Button
              variant="outline"
              onClick={openAdmin}
              className="w-full justify-start border-harvest-300 text-harvest-700 hover:bg-harvest-50"
            >
              Admin panel
            </Button>
          )}
          <Button variant="outline" onClick={openSettings} className="w-full justify-start">
            Settings
          </Button>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
