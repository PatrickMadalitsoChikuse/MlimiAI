import { useEffect, useRef, useState } from "react";
import { Menu, ChevronsUpDown, Check, Sprout } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

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

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ny", label: "Chichewa" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

interface HeaderProps {
  conversationTitle?: string;
  onOpenMenu?: () => void;
  language?: LanguageCode;
  onLanguageChange?: (code: LanguageCode) => void;
  onOpenAccount?: () => void;
}

export function Header({
  conversationTitle,
  onOpenMenu,
  language = "en",
  onLanguageChange,
  onOpenAccount,
}: HeaderProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <header className="relative z-30 flex items-center justify-between gap-3 border-b border-border/60 bg-white/60 px-3 py-3 backdrop-blur-xl sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Toggle menu"
            className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground/80 hover:bg-muted md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="md:hidden">
          <Logo iconOnly />
        </div>
        <div className="hidden min-w-0 md:block">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <Sprout className="h-4 w-4 shrink-0 text-leaf-600" />
            <span className="truncate font-medium">
              {conversationTitle || "New conversation"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-sm text-foreground hover:bg-muted"
          >
            {current.label}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {open && (
            <ul
              role="listbox"
              className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg"
            >
              {LANGUAGES.map((lang) => {
                const selected = lang.code === current.code;
                return (
                  <li key={lang.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onLanguageChange?.(lang.code);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted",
                        selected ? "font-semibold text-foreground" : "text-foreground"
                      )}
                    >
                      {lang.label}
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {user && (
          <button
            type="button"
            onClick={onOpenAccount}
            aria-label="Open account details"
            title={user.name}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-harvest-300 to-harvest-500 text-sm font-bold text-soil-500 shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-leaf-300"
          >
            {initials(user.name)}
          </button>
        )}
      </div>
    </header>
  );
}
