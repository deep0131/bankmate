"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type { ChatUIMessage } from "@/lib/ai/tools";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessageItem, ChatThinkingIndicator } from "./chat-message-item";

interface ChatProps {
  chatId: string;
  initialMessages?: ChatUIMessage[];
  onMessagesChange?: (chatId: string, messages: ChatUIMessage[]) => void;
}

export function Chat({
  chatId,
  initialMessages = [],
  onMessagesChange,
}: ChatProps) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, setMessages, stop } =
    useChat<ChatUIMessage>({
      messages: initialMessages,
    });

  const isBusy = status === "submitted" || status === "streaming";
  const initialCountRef = useRef(initialMessages.length);
  const userActedRef = useRef(false);

  // Persist messages only when new messages are added/modified in this session
  useEffect(() => {
    if (userActedRef.current || messages.length > initialCountRef.current) {
      userActedRef.current = true;
      onMessagesChange?.(chatId, messages);
    }
  }, [messages, chatId, onMessagesChange]);

  // Also persist when assistant finishes streaming
  useEffect(() => {
    if (userActedRef.current && status === "ready" && messages.length > 0) {
      onMessagesChange?.(chatId, messages);
    }
  }, [status, messages, chatId, onMessagesChange]);

  const handleReset = () => {
    setMessages([]);
    userActedRef.current = true;
    onMessagesChange?.(chatId, []);
  };

  const handleQuickPrompt = (promptText: string) => {
    if (isBusy) return;
    userActedRef.current = true;
    sendMessage({ text: promptText });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    userActedRef.current = true;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full w-full gap-1 select-text min-h-0">
      <ChatHeader
        hasMessages={messages.length > 0}
        isBusy={isBusy}
        onReset={handleReset}
      />

      {/* Main Chat Screen — separate rounded panel */}
      <div
        className="flex-1 min-h-0 flex flex-col w-full border rounded-sm shadow-xs overflow-hidden relative"
        style={{
          backgroundColor: "var(--panel-bg)",
          borderColor: "var(--panel-border)",
        }}
      >
        <main className="flex-1 min-h-0 flex flex-col w-full">
          <MessageScrollerProvider autoScroll>
            <MessageScroller className="flex-1">
              <MessageScrollerViewport className="w-full px-4 py-6">
                {messages.length === 0 ? (
                  <div className="max-w-3xl mx-auto w-full h-full flex flex-col justify-center">
                    <ChatEmptyState onSelectPrompt={handleQuickPrompt} />
                  </div>
                ) : (
                  <MessageScrollerContent className="max-w-3xl mx-auto w-full pb-4 not-typeset">
                    {messages.map((message) => (
                      <ChatMessageItem key={message.id} message={message} />
                    ))}

                    {status === "submitted" && <ChatThinkingIndicator />}
                  </MessageScrollerContent>
                )}
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </main>

        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isBusy={isBusy}
          onStop={() => stop()}
        />
      </div>
    </div>
  );
}
