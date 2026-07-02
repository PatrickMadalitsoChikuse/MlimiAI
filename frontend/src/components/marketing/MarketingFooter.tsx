import { Logo } from "@/components/Logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/40 bg-white/40">
      <div className="container flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
        <div className="space-y-3">
          <Logo showStatus={false} />
          <p className="max-w-sm text-sm text-muted-foreground">
            A friendly AI advisor for Malawian farmers. Built with the local
            farming calendar, crops, and conditions in mind.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-muted-foreground sm:grid-cols-3">
          <a className="hover:text-foreground" href="#features">Features</a>
          <a className="hover:text-foreground" href="#how">How it works</a>
          <a className="hover:text-foreground" href="#faq">FAQ</a>
          <a className="hover:text-foreground" href="/login">Sign in</a>
          <a className="hover:text-foreground" href="/signup">Create account</a>
        </div>
      </div>
      <div className="border-t border-border/40">
        <div className="container py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Mlimi AI · Made for Malawian farmers.
        </div>
      </div>
    </footer>
  );
}
