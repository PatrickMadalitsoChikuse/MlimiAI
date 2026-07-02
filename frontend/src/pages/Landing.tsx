import { Link } from "react-router-dom";
import {
  Sprout,
  CloudRain,
  Bug,
  Wheat,
  Tractor,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { useAuth } from "@/lib/auth-context";

const FEATURES = [
  {
    icon: Wheat,
    title: "Crop-specific guidance",
    body: "Maize, groundnuts, soybean, tobacco, cassava and more — answers tuned to the crops that matter on smallholder plots.",
  },
  {
    icon: CloudRain,
    title: "Season-aware",
    body: "Knows the Malawi rainy season rhythm so timing advice — planting, top-dressing, harvesting — fits your calendar.",
  },
  {
    icon: Bug,
    title: "Pest & disease help",
    body: "Describe what you see on the leaves. Mlimi AI helps you name the pest and choose a practical treatment.",
  },
  {
    icon: Tractor,
    title: "Fertiliser plans",
    body: "Clear NPK, CAN and Urea schedules sized to your plot, not generic textbook ratios.",
  },
  {
    icon: MessageCircle,
    title: "Conversational",
    body: "Ask follow-up questions in plain language. Mlimi AI remembers what you discussed in the conversation.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Your conversations stay in your account. No advice is shared with neighbours, brokers or third parties.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const primaryCta = user ? { label: "Open the chat", to: "/chat" } : { label: "Create free account", to: "/signup" };

  return (
    <div className="field-gradient min-h-screen text-foreground">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-leaf-200/40 blur-3xl" />
          <div className="absolute right-[-8rem] top-32 h-72 w-72 rounded-full bg-harvest-200/40 blur-3xl" />
        </div>

        <div className="container relative grid grid-cols-1 items-center gap-10 pb-14 pt-8 sm:gap-12 lg:grid-cols-2 lg:pb-24 lg:pt-10">
          <div className="space-y-5 sm:space-y-6">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your AI partner from{" "}
              <span className="bg-gradient-to-br from-leaf-600 to-leaf-800 bg-clip-text text-transparent">
                planting
              </span>{" "}
              to{" "}
              <span className="bg-gradient-to-br from-harvest-500 to-harvest-600 bg-clip-text text-transparent">
                harvest
              </span>
              .
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Mlimi AI answers your farming questions in seconds — crop choice,
              fertiliser plans, pests, weather timing — with practical advice
              tuned to Malawi.
            </p>
            <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to={primaryCta.to}>
                  {primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {!user && (
                <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                  <Link to="/login">I already have an account</Link>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" /> Free to start
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-harvest-400" /> Works on any phone browser
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" /> No app to install
              </span>
            </div>
          </div>

          {/* Hero illustration / chat preview */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-leaf-600/10 via-harvest-300/10 to-leaf-200/20 blur-2xl" />
            <div className="relative rounded-3xl border border-border/60 bg-white/85 p-5 shadow-2xl shadow-leaf-900/10 backdrop-blur-xl">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-harvest-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-leaf-500" />
                <span className="ml-2 text-xs font-medium text-muted-foreground">Mlimi AI · Chat</span>
              </div>
              <div className="space-y-3 py-4">
                <ChatLine role="user">
                  When should I plant maize in central Malawi this season?
                </ChatLine>
                <ChatLine role="assistant">
                  In central Malawi, plant maize after the first <b>well-established</b> rains
                  — usually mid-November to mid-December. Wait until you've had
                  about 25–30&nbsp;mm of rainfall over 2–3 days so seeds
                  germinate evenly.
                </ChatLine>
                <ChatLine role="user">How much seed per hectare?</ChatLine>
                <ChatLine role="assistant">
                  For most hybrids (e.g.&nbsp;SC403, DK8033): ~25&nbsp;kg/ha at
                  75&nbsp;×&nbsp;25&nbsp;cm spacing, one seed per station.
                </ChatLine>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="border-leaf-200 bg-leaf-50 text-leaf-700">Why Mlimi AI</Badge>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-4xl">
            Practical advice. Local context.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Not generic AI. Mlimi AI is grounded in Malawian farming realities
            — smallholder plots, ADMARC, extension services, NPK availability.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-border/60 bg-white/80 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-leaf-300 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700 group-hover:bg-leaf-100">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border/40 bg-white/40">
        <div className="container py-14 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="border-harvest-100 bg-harvest-50 text-harvest-700">How it works</Badge>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-4xl">
              Three steps from question to answer.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { n: "01", title: "Sign up", body: "Create a free account with just your name, email and password. Takes 30 seconds." },
              { n: "02", title: "Ask anything", body: "Type your question in plain language. Mention your crop, region and stage if you can." },
              { n: "03", title: "Get clear advice", body: "Mlimi AI answers with Malawi context — specific quantities, timing and practical next steps." },
            ].map(({ n, title, body }) => (
              <div key={n} className="relative rounded-2xl border border-border/60 bg-cream p-6 shadow-sm">
                <div className="font-display text-3xl font-extrabold text-leaf-600/30">{n}</div>
                <h3 className="mt-2 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Button asChild size="lg" className="h-12 px-7 text-base">
              <Link to={primaryCta.to}>
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="border-leaf-200 bg-leaf-50 text-leaf-700">FAQ</Badge>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-4xl">
            Common questions
          </h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4">
          {[
            {
              q: "Is it free?",
              a: "Yes, you can sign up and start chatting for free. We may add optional paid features later.",
            },
            {
              q: "Does it understand Chichewa?",
              a: "Today it works best in English. We are training a dedicated Chichewa model and will switch it in soon.",
            },
            {
              q: "Can I trust the answers completely?",
              a: "Mlimi AI is a helpful starting point, but always cross-check important decisions with your local extension officer or trusted neighbour.",
            },
            {
              q: "Will my conversations be private?",
              a: "Your chat history is tied to your account and only visible to you. We do not share it with third parties.",
            },
          ].map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-2xl border border-border/60 bg-white/70 p-5 shadow-sm open:bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                {q}
                <span className="text-leaf-700 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container pb-14 sm:pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-leaf-700/30 bg-gradient-to-br from-leaf-700 to-leaf-800 px-6 py-10 text-primary-foreground shadow-2xl sm:px-8 sm:py-12">
          <div className="pointer-events-none absolute -right-12 -top-12 h-72 w-72 rounded-full bg-harvest-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-64 w-64 rounded-full bg-leaf-300/20 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-cream">
                <Sprout className="h-3.5 w-3.5 text-harvest-300" /> Plant smarter this season
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
                Ready to grow with Mlimi AI?
              </h2>
              <p className="mt-2 max-w-md text-sm text-cream/80">
                Create your free account and ask your first question in under a
                minute. Your AI farm advisor is one tap away.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center md:justify-end">
              <Button asChild size="lg" variant="secondary" className="h-12 px-6 text-base">
                <Link to={primaryCta.to}>
                  {primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {!user && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/40 bg-transparent px-6 text-base text-cream hover:bg-white/10 hover:text-cream"
                >
                  <Link to="/login">Sign in</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function ChatLine({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-tr-md bg-leaf-600 px-3.5 py-2 text-sm text-primary-foreground shadow-sm"
            : "max-w-[85%] rounded-2xl rounded-tl-md border border-border/60 bg-white px-3.5 py-2 text-sm text-foreground shadow-sm"
        }
      >
        {children}
      </div>
    </div>
  );
}
