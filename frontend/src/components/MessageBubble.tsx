import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/chat";

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

interface MessageBubbleProps {
  message: ChatMessage;
  streaming?: boolean;
}

export function MessageBubble({ message, streaming }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const { user } = useAuth();

  return (
    <div
      className={cn(
        "flex w-full animate-fade-in gap-2 px-3 sm:gap-3 sm:px-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="mt-1 shrink-0">
          <Logo iconOnly showStatus={false} />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] shadow-sm sm:max-w-[78%]",
          isUser
            ? "rounded-tr-md bg-leaf-600 text-primary-foreground"
            : "rounded-tl-md border border-border/70 bg-white text-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose-chat text-[15px] text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || (streaming ? "…" : "")}
            </ReactMarkdown>
            {streaming && (
              <span
                aria-hidden
                className="ml-0.5 inline-block h-4 w-0.5 translate-y-[2px] animate-pulse bg-leaf-600"
              />
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div
          aria-label={user?.name}
          title={user?.name}
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-harvest-300 to-harvest-500 text-sm font-bold text-soil-500 shadow-sm"
        >
          {initials(user?.name ?? "")}
        </div>
      )}
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex w-full animate-fade-in gap-2 px-3 sm:gap-3 sm:px-6">
      <div className="mt-1 shrink-0">
        <Logo iconOnly showStatus={false} />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border/70 bg-white px-4 py-3 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-leaf-500 animate-pulse-dot" />
        <span
          className="h-2 w-2 rounded-full bg-leaf-500 animate-pulse-dot"
          style={{ animationDelay: "0.15s" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-leaf-500 animate-pulse-dot"
          style={{ animationDelay: "0.3s" }}
        />
      </div>
    </div>
  );
}
