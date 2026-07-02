import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";

export function MarketingHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-cream/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex min-w-0 items-center">
          <Logo showStatus={false} />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-foreground/70 md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <Button asChild size="sm" className="sm:h-10 sm:px-4 sm:text-sm">
              <Link to="/chat">Open chat</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex sm:h-10 sm:px-4 sm:text-sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="sm:h-10 sm:px-4 sm:text-sm">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
