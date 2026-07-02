import { Sprout } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="field-gradient flex min-h-screen flex-col">
      <MarketingHeader />

      <div className="flex flex-1">
        {/* Left: form */}
        <div className="flex w-full justify-center px-4 py-6 sm:px-10 sm:py-8 lg:w-1/2 lg:px-16">
          <div className="flex w-full max-w-md flex-col">
            <div className="flex flex-1 flex-col justify-center py-4 sm:py-6">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

              <div className="mt-6 sm:mt-8">{children}</div>

              {footer && (
                <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              By continuing you agree to use Mlimi AI as a guide, not a
              replacement for your extension officer.
            </div>
          </div>
        </div>

      {/* Right: photo panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <img
          src="/auth-cover.jpg"
          alt="Lush farmland at golden hour"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* gradient wash for legibility + brand tint */}
        <div className="absolute inset-0 bg-gradient-to-tr from-leaf-900/85 via-leaf-800/55 to-leaf-700/20" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />

        <div className="relative z-10 flex w-full flex-col justify-center px-10 pb-40 pt-14 text-cream xl:px-14">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-cream backdrop-blur-sm">
            <Sprout className="h-3.5 w-3.5 text-harvest-300" /> Built for Malawi
          </div>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight drop-shadow-md xl:text-4xl">
            Smarter farming,
            <br />
            one conversation at a time.
          </h2>
          <p className="mt-3 max-w-md text-sm text-cream/90 drop-shadow">
            Ask Mlimi AI about crops, weather, fertiliser, pests and
            post-harvest — answers tuned to Malawian smallholder reality.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
