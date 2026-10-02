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
import { useVoice } from "@/context/voice-context";
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

  const { voiceMode, speak, stopSpeaking } = useVoice();
  const lastSpokenMessageIdRef = useRef<string | null>(null);

  const isBusy = status === "submitted" || status === "streaming";
  const initialCountRef = useRef(initialMessages.length);
  const userActedRef = useRef(false);

  // Hands-free Autoplay: When Voice Mode is On and generation completes, read out response
  useEffect(() => {
    if (voiceMode && status === "ready" && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (
        lastMsg &&
        lastMsg.role === "assistant" &&
        lastSpokenMessageIdRef.current !== lastMsg.id
      ) {
        lastSpokenMessageIdRef.current = lastMsg.id;

        const textParts = lastMsg.parts
          .filter((p) => p.type === "text")
          .map((p: any) => p.text)
          .join("\n");

        let speechText = textParts.trim();

        // If assistant invoked an interactive tool (e.g. transaction-table, loan card) without plain text,
        // provide a natural executive summary so the assistant speaks and resumes the conversational loop!
        if (!speechText) {
          const toolPart = lastMsg.parts.find(
            (p: any) =>
              p.type?.startsWith("tool") ||
              p.type === "dynamic-tool" ||
              p.toolName ||
              (p as any).name,
          ) as any;

          const toolName = (
            toolPart?.toolName ||
            toolPart?.name ||
            ""
          ).toLowerCase();

          if (toolName.includes("transaction")) {
            speechText =
              "Here are your recent account transactions and ledger.";
          } else if (toolName.includes("profile")) {
            speechText =
              "Here is an overview of your accounts, balance, and credit profile.";
          } else if (toolName.includes("deposit") || toolName.includes("fd")) {
            speechText =
              "I have prepared your fixed deposit booking. Please speak your 6-digit PIN or enter it to authorize.";
          } else if (toolName.includes("transfer")) {
            speechText =
              "I have prepared your funds transfer. Please speak your 6-digit PIN or enter it to authorize.";
          } else if (
            toolName.includes("loan-offers") ||
            toolName.includes("show-loan")
          ) {
            speechText =
              "Here are the loan offers and interest rates tailored for you.";
          } else if (toolName.includes("loan")) {
            speechText = "I have prepared your loan application for review.";
          } else if (toolName.includes("statement")) {
            speechText = "Here is your requested account statement.";
          } else if (toolName.includes("chart")) {
            speechText =
              "Here is your spending analysis and financial breakdown.";
          } else {
            speechText = "Here are the requested banking details.";
          }
        }

        speak(speechText, lastMsg.id);
      }
    }
  }, [voiceMode, status, messages, speak]);

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

  // Listen for programmatic prompt dispatches from interactive widgets (e.g. Loan Apply CTA)
  useEffect(() => {
    const handleChatPromptEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string }>;
      if (customEvent.detail?.text) {
        userActedRef.current = true;
        sendMessage({ text: customEvent.detail.text });
      }
    };

    window.addEventListener("bankmate-send-chat-prompt", handleChatPromptEvent);
    return () => {
      window.removeEventListener(
        "bankmate-send-chat-prompt",
        handleChatPromptEvent,
      );
    };
  }, [sendMessage]);

  const handleReset = () => {
    stopSpeaking();
    setMessages([]);
    userActedRef.current = true;
    onMessagesChange?.(chatId, []);
  };

  const handleQuickPrompt = (promptText: string) => {
    if (isBusy) return;
    stopSpeaking();
    userActedRef.current = true;
    sendMessage({ text: promptText });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    stopSpeaking();
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
                  <div className="max-w-[1000px] mx-auto w-full h-full flex flex-col justify-center">
                    <ChatEmptyState onSelectPrompt={handleQuickPrompt} />
                  </div>
                ) : (
                  <MessageScrollerContent className="max-w-[1000px] mx-auto w-full pb-4 not-typeset">
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
