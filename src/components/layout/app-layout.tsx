"use client";

import { useCallback, useEffect, useState } from "react";
import { Chat } from "@/components/chat/chat";
import type { ChatUIMessage } from "@/lib/ai/tools";
import {
  type ChatSession,
  createNewChatId,
  deleteChatSession,
  getChatSession,
  loadChatSessions,
  saveChatSession,
} from "@/lib/chat-history";
import { LeftSidebar } from "./left-sidebar";

export function AppLayout() {
  const [activeChatId, setActiveChatId] = useState<string>(() => createNewChatId());
  const [activeMessages, setActiveMessages] = useState<ChatUIMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Load sessions on mount
  useEffect(() => {
    setSessions(loadChatSessions());
  }, []);

  const handleMessagesChange = useCallback(
    (targetId: string, messages: ChatUIMessage[]) => {
      if (!targetId) return;
      if (messages.length === 0) {
        deleteChatSession(targetId);
      } else {
        saveChatSession(targetId, messages);
      }
      setSessions(loadChatSessions());
    },
    [],
  );

  const handleNewChat = useCallback(() => {
    const newId = createNewChatId();
    setActiveChatId(newId);
    setActiveMessages([]);
  }, []);

  const handleSelectChat = useCallback(
    (id: string) => {
      if (id === activeChatId) return;
      const session = getChatSession(id);
      if (session) {
        setActiveChatId(session.id);
        setActiveMessages(session.messages || []);
      }
    },
    [activeChatId],
  );

  const handleDeleteChat = useCallback(
    (id: string) => {
      deleteChatSession(id);
      const updated = loadChatSessions();
      setSessions(updated);

      if (id === activeChatId) {
        if (updated.length > 0) {
          setActiveChatId(updated[0].id);
          setActiveMessages(updated[0].messages || []);
        } else {
          const newId = createNewChatId();
          setActiveChatId(newId);
          setActiveMessages([]);
        }
      }
    },
    [activeChatId],
  );

  return (
    <div
      className="w-full h-dvh overflow-hidden flex justify-center font-sans p-1"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* 1440p Max Width Application Container */}
      <div
        className="flex h-full w-full max-w-[1440px] mx-auto gap-1 relative font-sans"
      >
        {/* Left Sidebar with New Chat and Chat History */}
        <div className="w-[280px] shrink-0 hidden md:flex h-full">
          <LeftSidebar
            onNewChat={handleNewChat}
            sessions={sessions}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 min-w-0 flex flex-col h-full relative">
          <Chat
            key={activeChatId}
            chatId={activeChatId}
            initialMessages={activeMessages}
            onMessagesChange={handleMessagesChange}
          />
        </div>
      </div>
    </div>
  );
}
