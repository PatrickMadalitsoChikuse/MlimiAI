import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import type { Conversation } from "@/lib/chat";
import { cn } from "@/lib/utils";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onOpenAccount: () => void;
}

interface MobileSidebarProps extends SidebarProps {
  open: boolean;
  onClose: () => void;
}

function TruncatedTitle({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setTruncated(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <span
      ref={ref}
      title={truncated ? text : undefined}
      className={cn("truncate", className)}
    >
      {text}
    </span>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function SidebarBody({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onOpenAccount,
  showClose,
  onClose,
}: SidebarProps & { showClose?: boolean; onClose?: () => void }) {
  const { user } = useAuth();
  const [modalId, setModalId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const modalConversation = conversations.find((c) => c.id === modalId) ?? null;

  function openModal(id: string, current: string) {
    setModalId(id);
    setDraft(current);
  }

  function closeModal() {
    setModalId(null);
    setDraft("");
  }

  function commitRename() {
    if (!modalId) return;
    const next = draft.trim();
    if (next && next !== modalConversation?.title) onRename(modalId, next);
    closeModal();
  }

  function confirmDelete() {
    if (!modalId) return;
    onDelete(modalId);
    closeModal();
  }

  useEffect(() => {
    if (!modalId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalId]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <Logo />
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="pl-3 pr-6">
        <Button onClick={onCreate} className="w-full justify-start" size="lg">
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="mt-5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recent conversations
      </div>

      <ScrollArea className="mt-2 flex-1 px-3 scrollbar-thin">
        <ul className="space-y-1 pb-4 pr-3">
          {conversations.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No conversations yet.
            </li>
          )}
          {conversations.map((c) => {
            const isActive = c.id === activeId;
            return (
              <li key={c.id}>
                <div
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    isActive
                      ? "bg-leaf-100 text-leaf-800"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  <span
                    role="button"
                    aria-label="Open conversation actions"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(c.id, c.title);
                    }}
                    className={cn(
                      "inline-flex shrink-0 cursor-pointer rounded-md p-0.5",
                      isActive ? "text-leaf-700" : "text-muted-foreground",
                      "hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <ChevronsUpDown className="h-4 w-4" />
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <TruncatedTitle text={c.title} className="block font-medium" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>

      {modalConversation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit conversation"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Conversation
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Title
            </label>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                }
              }}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-leaf-400 focus:ring-2 focus:ring-leaf-100"
            />
            <div className="mt-5 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                onClick={confirmDelete}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Delete
              </Button>
              <Button onClick={commitRename} disabled={!draft.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="border-t border-border/60 px-3 py-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/70 p-2.5 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-harvest-300 to-harvest-500 text-sm font-bold text-soil-500 shadow-sm">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold text-foreground">
                {user.name}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onOpenAccount}
              aria-label="Open account menu"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-border/60 bg-white/60 backdrop-blur-xl md:flex">
      <SidebarBody {...props} />
    </aside>
  );
}

export function MobileSidebar({ open, onClose, ...props }: MobileSidebarProps) {
  // lock body scroll + ESC to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <aside
        className={cn(
          "absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col border-r border-border/60 bg-cream shadow-2xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarBody
          {...props}
          showClose
          onClose={onClose}
          onSelect={(id) => {
            props.onSelect(id);
            onClose();
          }}
          onCreate={() => {
            props.onCreate();
            onClose();
          }}
        />
      </aside>
    </div>
  );
}
