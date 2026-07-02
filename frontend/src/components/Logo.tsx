import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  showStatus?: boolean;
}

type HealthStatus = "ok" | "down" | "checking";

function useHealth(enabled: boolean): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>("checking");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function check() {
      try {
        const r = await fetch("/api/health");
        if (cancelled) return;
        const data = await r.json().catch(() => ({}));
        setStatus(r.ok && data?.ok ? "ok" : "down");
      } catch {
        if (!cancelled) setStatus("down");
      }
    }

    check();
    const id = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled]);

  return enabled ? status : "ok";
}

export function Logo({ className, iconOnly, showStatus = true }: LogoProps) {
  const status = useHealth(showStatus);
  const dotColor =
    status === "ok"
      ? "bg-leaf-500"
      : status === "down"
        ? "bg-destructive"
        : "bg-muted-foreground/60";
  const tooltip =
    status === "ok"
      ? "System is healthy"
      : status === "down"
        ? "Backend unreachable"
        : "Checking system status…";

  const stretchRow = !iconOnly && showStatus;

  return (
    <div className={cn("flex items-center gap-2.5", stretchRow && "min-w-0 flex-1", className)}>
      <div className="relative h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-leaf-600 to-leaf-800 shadow-lg shadow-leaf-600/30 ring-1 ring-leaf-700/40">
        <svg
          viewBox="0 0 32 32"
          className="absolute inset-0 m-auto h-6 w-6 text-harvest-300"
          fill="currentColor"
          aria-hidden
        >
          <path d="M23 6c-7.2 0-13 5.4-13 12.5 0 2 .4 3.8 1.2 5.4 3-3.8 7.4-6.5 12.8-7.6V6z" />
          <path
            d="M23 6v10.3c-5.4 1.1-9.8 3.8-12.8 7.6L9 26c5.4-1.1 12.4-6.5 14-13.5V6h-.0z"
            opacity="0.55"
            fill="#EFF6EE"
          />
        </svg>
      </div>
      {!iconOnly && (
        <div className="leading-tight">
          <div className="font-display text-lg font-bold tracking-tight text-foreground">
            Mlimi AI
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Farm Advisor
          </div>
        </div>
      )}
      {!iconOnly && showStatus && (
        <span className="group relative ml-auto inline-flex shrink-0 items-center">
          <span
            aria-label={tooltip}
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              dotColor,
              status === "ok" && "animate-pulse"
            )}
          />
          <span
            role="tooltip"
            className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
          >
            {tooltip}
          </span>
        </span>
      )}
    </div>
  );
}
