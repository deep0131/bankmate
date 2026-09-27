"use client";

import type { ChatUIMessage } from "@/lib/ai/tools";

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatUIMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "bankmate-chat-history";

function generateId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateTitle(messages: ChatUIMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "New Conversation";
  const textPart = firstUserMsg.parts.find((p) => p.type === "text");
  if (!textPart || textPart.type !== "text") return "New Conversation";
  const clean = textPart.text.replace(/\s+/g, " ").trim();
  return clean.length > 42 ? `${clean.slice(0, 39)}...` : clean || "New Conversation";
}

export function loadChatSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(
      (s): s is ChatSession =>
        Boolean(
          s &&
            typeof s.id === "string" &&
            Array.isArray(s.messages) &&
            s.messages.length > 0,
        ),
    );
    return valid.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch {
    return [];
  }
}

export function getChatSession(id: string): ChatSession | null {
  const sessions = loadChatSessions();
  return sessions.find((s) => s.id === id) ?? null;
}

export function saveChatSession(
  id: string,
  messages: ChatUIMessage[],
): ChatSession | null {
  if (!id || messages.length === 0) return null;
  const sessions = loadChatSessions();
  const existingIndex = sessions.findIndex((s) => s.id === id);
  const now = Date.now();

  const title =
    existingIndex >= 0 &&
    sessions[existingIndex].title &&
    sessions[existingIndex].title !== "New Conversation" &&
    sessions[existingIndex].title !== "New Chat"
      ? sessions[existingIndex].title
      : generateTitle(messages);

  const session: ChatSession = {
    id,
    title,
    messages,
    createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.unshift(session);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full — remove oldest sessions until it fits
    while (sessions.length > 5) {
      sessions.pop();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        break;
      } catch {
        continue;
      }
    }
  }

  return session;
}

export function deleteChatSession(id: string): void {
  const sessions = loadChatSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export function createNewChatId(): string {
  return generateId();
}
