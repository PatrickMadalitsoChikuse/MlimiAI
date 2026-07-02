import { apiUrl, authHeaders } from "@/lib/api";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = "mlimi.conversations.v1";

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveConversations(items: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function newConversation(): Conversation {
  const now = Date.now();
  return {
    id: cryptoId(),
    title: "New conversation",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function deriveTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New conversation";
  if (trimmed.length <= 80) return trimmed;
  return trimmed.slice(0, 78).trimEnd() + "…";
}

/**
 * Stream chat tokens from the Flask backend using SSE-over-fetch.
 * Calls onToken for each appended text fragment.
 */
export async function streamChat(opts: {
  messages: { role: ChatRole; content: string }[];
  language?: string;
  signal?: AbortSignal;
  onToken: (text: string) => void;
}): Promise<void> {
  const response = await fetch(apiUrl("/api/chat/stream"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ messages: opts.messages, language: opts.language }),
    signal: opts.signal,
  });

  if (response.status === 401) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Split on SSE event boundary (blank line)
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const parsed = parseSSE(rawEvent);
      if (!parsed) continue;
      if (parsed.event === "token") {
        opts.onToken(parsed.data?.text ?? "");
      } else if (parsed.event === "error") {
        throw new Error(parsed.data?.message ?? "Stream error");
      } else if (parsed.event === "done") {
        return;
      }
    }
  }
}

function parseSSE(raw: string): { event: string; data: any } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (!dataLines.length) return null;
  try {
    return { event, data: JSON.parse(dataLines.join("\n")) };
  } catch {
    return { event, data: dataLines.join("\n") };
  }
}
