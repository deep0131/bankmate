"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
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

export function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, setMessages, stop } =
    useChat<ChatUIMessage>();

  const isBusy = status === "submitted" || status === "streaming";

  const handleReset = () => {
    setMessages([]);
  };

  const handleQuickPrompt = (promptText: string) => {
    if (isBusy) return;
    sendMessage({ text: promptText });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  return (
    <div className="flex flex-col h-dvh w-full bg-background text-foreground">
      <ChatHeader
        hasMessages={messages.length > 0}
        isBusy={isBusy}
        onReset={handleReset}
      />

      <main className="flex-1 min-h-0 flex flex-col w-full">
        <MessageScrollerProvider autoScroll>
          <MessageScroller className="flex-1">
            <MessageScrollerViewport className="max-w-3xl mx-auto px-4 py-6">
              {messages.length === 0 ? (
                <ChatEmptyState onSelectPrompt={handleQuickPrompt} />
              ) : (
                <MessageScrollerContent className="pb-4 not-typeset">
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
  );
}
