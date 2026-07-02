import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 220);
    el.style.height = next + "px";
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled && !isStreaming;

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-4 pt-2 sm:px-6 sm:pb-5">
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-3xl border border-border/70 bg-white p-2 shadow-lg shadow-leaf-900/5 transition-all",
          "focus-within:border-leaf-400 focus-within:ring-4 focus-within:ring-leaf-100"
        )}
      >
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          rows={1}
          placeholder="Ask about crops, soils, pests, fertiliser…"
          className="min-h-[44px] flex-1 border-0 bg-transparent px-3 py-2.5 text-[15px] shadow-none focus-visible:ring-0"
          disabled={disabled}
        />

        {isStreaming ? (
          <Button
            size="icon"
            variant="outline"
            onClick={onStop}
            className="h-10 w-10 rounded-full"
            aria-label="Stop generating"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={onSend}
            disabled={!canSend}
            className="h-10 w-10 rounded-full"
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        Mlimi AI gives general guidance and may be wrong. Cross-check with your
        local extension officer.
      </p>
    </div>
  );
}
