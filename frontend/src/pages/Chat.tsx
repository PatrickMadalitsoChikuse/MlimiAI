import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar, MobileSidebar } from "@/components/Sidebar";
import { Header, type LanguageCode } from "@/components/Header";
import { AccountModal } from "@/components/AccountModal";
import { EmptyState } from "@/components/EmptyState";
import { MessageBubble, TypingBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth-context";
import {
  type ChatMessage,
  type Conversation,
  cryptoId,
  deriveTitle,
  loadConversations,
  newConversation,
  saveConversations,
  streamChat,
} from "@/lib/chat";

export default function ChatPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [accountOpen, setAccountOpen] = useState(false);

  function handleToggleMenu() {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setSidebarCollapsed((v) => !v);
    } else {
      setMenuOpen(true);
    }
  }
  const abortRef = useRef<AbortController | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = loadConversations();
    if (stored.length > 0) {
      setConversations(stored);
      setActiveId(stored[0].id);
    } else {
      const c = newConversation();
      setConversations([c]);
      setActiveId(c.id);
    }
  }, []);

  useEffect(() => {
    if (conversations.length) saveConversations(conversations);
  }, [conversations]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [active?.messages.length, active?.messages.at(-1)?.content]);

  function createConversation() {
    const c = newConversation();
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
    setInput("");
    setError(null);
  }

  function renameConversation(id: string, title: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c))
    );
  }

  function deleteConversation(id: string) {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) {
        if (next.length) setActiveId(next[0].id);
        else {
          const c = newConversation();
          setActiveId(c.id);
          return [c];
        }
      }
      return next;
    });
  }

  function updateActive(updater: (c: Conversation) => Conversation) {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? updater(c) : c))
    );
  }

  async function sendMessage(promptText?: string) {
    const content = (promptText ?? input).trim();
    if (!content || isStreaming || !active) return;

    setError(null);
    setInput("");

    const userMsg: ChatMessage = {
      id: cryptoId(),
      role: "user",
      content,
      createdAt: Date.now(),
    };
    const assistantMsg: ChatMessage = {
      id: cryptoId(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    updateActive((c) => ({
      ...c,
      title: c.messages.length === 0 ? deriveTitle(content) : c.title,
      updatedAt: Date.now(),
      messages: [...c.messages, userMsg, assistantMsg],
    }));

    const history = [...active.messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    try {
      await streamChat({
        messages: history,
        language,
        signal: controller.signal,
        onToken: (text) => {
          updateActive((c) => {
            const msgs = c.messages.slice();
            const last = msgs[msgs.length - 1];
            if (last && last.id === assistantMsg.id) {
              msgs[msgs.length - 1] = { ...last, content: last.content + text };
            }
            return { ...c, messages: msgs, updatedAt: Date.now() };
          });
        },
      });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // user stopped — keep partial
      } else {
        const message = err?.message ?? "Something went wrong while contacting the assistant.";
        setError(message);
        updateActive((c) => {
          const msgs = c.messages.slice();
          const last = msgs[msgs.length - 1];
          if (last && last.id === assistantMsg.id && !last.content) {
            msgs.pop();
          }
          return { ...c, messages: msgs };
        });
        if (/session has expired/i.test(message)) {
          signOut();
          navigate("/login");
        }
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
  }

  const showEmpty = !active || active.messages.length === 0;

  return (
    <div className="field-gradient flex h-screen w-full">
      {!sidebarCollapsed && (
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            setError(null);
          }}
          onCreate={createConversation}
          onDelete={deleteConversation}
          onRename={renameConversation}
          onOpenAccount={() => setAccountOpen(true)}
        />
      )}

      <MobileSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setError(null);
        }}
        onCreate={createConversation}
        onDelete={deleteConversation}
        onRename={renameConversation}
        onOpenAccount={() => setAccountOpen(true)}
      />

      <main className="flex h-full min-w-0 flex-1 flex-col">
        <Header
          conversationTitle={active?.title}
          onOpenMenu={handleToggleMenu}
          language={language}
          onLanguageChange={setLanguage}
          onOpenAccount={() => setAccountOpen(true)}
        />

        <div className="relative flex-1 overflow-hidden">
          <ScrollArea className="h-full scrollbar-thin">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 py-6">
              {showEmpty ? (
                <EmptyState onPick={(p) => sendMessage(p)} />
              ) : (
                <>
                  {active!.messages.map((m, i) => {
                    const isLast = i === active!.messages.length - 1;
                    const streaming = isStreaming && isLast && m.role === "assistant";
                    if (streaming && !m.content) {
                      return <TypingBubble key={m.id} />;
                    }
                    return (
                      <MessageBubble
                        key={m.id}
                        message={m}
                        streaming={streaming}
                      />
                    );
                  })}
                </>
              )}

              {error && (
                <div className="mx-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:mx-6">
                  {error}
                </div>
              )}

              <div ref={scrollEndRef} className="h-px" />
            </div>
          </ScrollArea>
        </div>

        <div className="border-t border-border/60 bg-white/40 backdrop-blur-xl">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage()}
            onStop={stopStreaming}
            isStreaming={isStreaming}
          />
        </div>
      </main>

      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  );
}
