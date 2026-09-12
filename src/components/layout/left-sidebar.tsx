"use client";

import { useState } from "react";
import {
  BotIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  MessageSquareIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TrashIcon,
} from "lucide-react";
import { BankProfileModal } from "@/components/profile/bank-profile-modal";
import type { ChatSession } from "@/lib/chat-history";
import { ThemeToggle } from "./theme-toggle";

interface LeftSidebarProps {
  onNewChat: () => void;
  sessions: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getPreview(session: ChatSession): string {
  const lastAssistant = [...session.messages]
    .reverse()
    .find((m) => m.role === "assistant");
  if (!lastAssistant) return "";
  const textPart = lastAssistant.parts.find((p) => p.type === "text");
  if (!textPart || textPart.type !== "text") return "";
  const text = textPart.text;
  return text.length > 55 ? `${text.slice(0, 52)}...` : text;
}

export function LeftSidebar({
  onNewChat,
  sessions,
  activeChatId,
  onSelectChat,
  onDeleteChat,
}: LeftSidebarProps) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <aside
        className="flex flex-col h-full border rounded-sm shadow-xs w-full select-none overflow-hidden"
        style={{
          backgroundColor: "var(--panel-bg)",
          borderColor: "var(--panel-border)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
          <div
            className="flex items-center justify-center size-8 rounded-lg text-white shadow-sm"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            }}
          >
            <BotIcon className="size-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            BankMate
          </span>
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
            PRO
          </span>
        </div>

        {/* New Chat Button (Prominent Action) */}
        <div className="px-4 py-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:opacity-95 hover:shadow-md active:scale-[0.98] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            }}
          >
            <PlusIcon className="size-4 stroke-[2.5]" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-1.5">
          <div
            className="flex items-center gap-2 h-8.5 px-3 rounded-lg text-xs"
            style={{
              backgroundColor: "var(--toggle-bg)",
              color: "var(--muted-foreground)",
            }}
          >
            <SearchIcon className="size-3.5 shrink-0" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[10px] hover:text-foreground font-medium"
              >
                ✕
              </button>
            ) : (
              <span className="ml-auto text-[10px] opacity-50 font-medium">⌘K</span>
            )}
          </div>
        </div>

        {/* Chat History Section */}
        <div className="flex-1 flex flex-col min-h-0 px-3 pt-6">
          <div className="flex items-center justify-between px-2 mb-2">
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              Chat History
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "var(--toggle-bg)",
                color: "var(--muted-foreground)",
              }}
            >
              {filteredSessions.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {filteredSessions.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-36 text-center px-4 text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                <MessageSquareIcon className="size-6 mb-2 opacity-40" />
                <p className="font-medium">No previous chats</p>
                <p className="text-[11px] mt-0.5 opacity-80">Click New Chat to begin</p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === activeChatId;
                const preview = getPreview(session);

                return (
                  <div
                    key={session.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectChat(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectChat(session.id);
                      }
                    }}
                    className="group relative w-full text-left px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center"
                    style={{
                      backgroundColor: isActive ? "var(--nav-active)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "var(--nav-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-1 w-full m-0 p-0">
                      <span
                        className="text-xs font-semibold truncate flex-1 leading-none m-0 p-0 block"
                        style={{
                          color: isActive ? "var(--nav-active-text)" : "var(--foreground)",
                        }}
                      >
                        {session.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/15 hover:text-destructive text-muted-foreground transition-all duration-150 shrink-0"
                        title="Delete chat"
                      >
                        <TrashIcon className="size-3" />
                      </button>
                    </div>
                    {preview && (
                      <p
                        className="text-[11px] mt-0.5 truncate leading-tight opacity-75"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {preview}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Settings & Help */}
        <div className="px-3 pt-2 border-t" style={{ borderColor: "var(--panel-border)" }}>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
            >
              <SettingsIcon className="size-3.5 shrink-0" />
              <span>Accounts & Limits</span>
            </button>
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
            >
              <HelpCircleIcon className="size-3.5 shrink-0" />
              <span>Support & RM (Priya Sharma)</span>
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="px-4 py-2.5">
          <ThemeToggle />
        </div>

        {/* User Profile — Deep Yadav */}
        <button
          type="button"
          onClick={() => setProfileModalOpen(true)}
          className="px-4 mb-6 pt-4 py-3 border-t flex items-center gap-3 w-full text-left transition-colors duration-150 group hover:bg-muted/40 cursor-pointer shrink-0"
          style={{ borderColor: "var(--panel-border)" }}
          title="Click to view full Bank Profile"
        >
          <div
            className="size-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm transition-transform duration-150 group-hover:scale-105"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)" }}
          >
            DY
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-sm font-bold truncate text-foreground leading-none">
                Deep Yadav
              </span>
              <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 leading-none">
                Premier
              </span>
            </div>
            <span className="text-[11px] truncate text-muted-foreground leading-none mt-0.5">
              deep.yadav@bankmate.io
            </span>
          </div>
          <ChevronRightIcon className="size-4 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
        </button>
      </aside>

      {/* Profile Modal */}
      <BankProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}
