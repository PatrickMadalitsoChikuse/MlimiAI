import { Bug, CloudRain, Wheat, Tractor } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  {
    icon: Wheat,
    title: "Maize variety choice",
    prompt:
      "Which maize variety should I plant in central Malawi this rainy season, and how much seed per hectare?",
  },
  {
    icon: CloudRain,
    title: "When to plant",
    prompt:
      "When is the best time to plant groundnuts in southern Malawi, and what signs should I look for?",
  },
  {
    icon: Bug,
    title: "Pest control",
    prompt:
      "I see small holes in my maize leaves and white powdery patches. What pest is this and how do I treat it?",
  },
  {
    icon: Tractor,
    title: "Fertiliser plan",
    prompt:
      "How should I apply NPK and Urea for one hectare of maize on a smallholder plot?",
  },
];

interface EmptyStateProps {
  onPick: (prompt: string) => void;
}

export function EmptyState({ onPick }: EmptyStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-8 text-center sm:py-10">
      <h1 className="pt-12 font-display text-2xl font-bold tracking-tight text-foreground sm:pt-16 sm:text-4xl">
        Moni! How can I help your farm today?
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
        Ask about crops, soils, pests, fertiliser, or post-harvest. Mlimi AI
        answers with Malawi context in mind.
      </p>
      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map(({ icon: Icon, title, prompt }) => (
          <button
            key={title}
            type="button"
            onClick={() => onPick(prompt)}
            className={cn(
              "group flex h-full items-start gap-3 rounded-2xl border border-border/70 bg-white/70 p-4 text-left shadow-sm transition-all",
              "hover:-translate-y-0.5 hover:border-leaf-300 hover:bg-white hover:shadow-md"
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700 group-hover:bg-leaf-100">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {title}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {prompt}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
