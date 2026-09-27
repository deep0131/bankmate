"use client";

import { MoreHorizontalIcon, TrashIcon } from "lucide-react";
import type { ChatSession } from "@/lib/chat-history";

interface RightSidebarProps {
  sessions: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getPreview(session: ChatSession): string {
  // Get last assistant message preview
  const lastAssistant = [...session.messages]
    .reverse()
    .find((m) => m.role === "assistant");
  if (!lastAssistant) return "";
  const textPart = lastAssistant.parts.find((p) => p.type === "text");
  if (!textPart || textPart.type !== "text") return "";
  const text = textPart.text;
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

export function RightSidebar({
  sessions,
  activeChatId,
  onSelectChat,
  onDeleteChat,
}: RightSidebarProps) {
  return (
    <aside
      className="flex flex-col h-full border-l"
      style={{
        backgroundColor: "var(--panel-bg)",
        borderColor: "var(--panel-border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-3 border-b"
        style={{ borderColor: "var(--panel-border)" }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Chat History
          </h2>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
            style={{
              backgroundColor: "var(--toggle-bg)",
              color: "var(--muted-foreground)",
            }}
          >
            {sessions.length}
          </span>
        </div>
        <button
          type="button"
          className="p-1 rounded-md transition-colors duration-150"
          style={{ color: "var(--muted-foreground)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--nav-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <MoreHorizontalIcon className="size-4" />
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {sessions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs" style={{ color: "var(--muted-foreground)" }}>
            No chat history yet
          </div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => {
              const isActive = session.id === activeChatId;
              return (
                <li key={session.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectChat(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectChat(session.id);
                      }
                    }}
                    className="group w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 relative cursor-pointer"
                    style={{
                      backgroundColor: isActive ? "var(--nav-active)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "var(--history-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-sm font-medium truncate flex-1"
                        style={{
                          color: isActive ? "var(--nav-active-text)" : "var(--foreground)",
                        }}
                      >
                        {session.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="text-[10px] whitespace-nowrap"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {formatTime(session.updatedAt)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all duration-150"
                          style={{ color: "var(--muted-foreground)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#E5484D";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--muted-foreground)";
                          }}
                        >
                          <TrashIcon className="size-3" />
                        </button>
                      </div>
                    </div>
                    {getPreview(session) && (
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {getPreview(session)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
