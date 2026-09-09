"use client";

import { useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { SendIcon, BotIcon, UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";

import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerViewport,
  MessageScrollerButton,
  MessageScrollerItem,
  MessageScrollerProvider,
} from "@/components/ui/message-scroller";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
} from "@/components/ui/message";
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
} from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ChatWidgetRenderer } from "./chat-widget-renderer";

export function Chat() {
  const [input, setInput] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        sendMessage({ text: input });
        setInput("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <BotIcon className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Bankmate Assistant</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500 inline-block" />
              Online
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 min-h-0 relative">
        <MessageScrollerProvider>
          <MessageScroller>
            <MessageScrollerViewport className="p-4">
              <MessageScrollerContent>
                {messages.length === 0 && (
                  <MessageScrollerItem key="welcome">
                    <MessageGroup>
                      <Message align="start">
                        <MessageAvatar>
                          <BotIcon className="size-4 text-primary" />
                        </MessageAvatar>
                        <MessageContent>
                          <BubbleGroup>
                            <Bubble variant="muted">
                              <BubbleContent className="prose prose-sm dark:prose-invert max-w-none text-sm/relaxed">
                                <ReactMarkdown>
                                  Hi there! 👋 I'm your Bankmate virtual assistant. I can help you check your account balances, search recent transactions, compare our banking products, or analyze your spending. How can I help you today?
                                </ReactMarkdown>
                              </BubbleContent>
                            </Bubble>
                          </BubbleGroup>
                        </MessageContent>
                      </Message>
                    </MessageGroup>
                  </MessageScrollerItem>
                )}
                {messages.map((message) => (
                  <MessageScrollerItem key={message.id}>
                    <MessageGroup>
                      <Message
                        align={message.role === "user" ? "end" : "start"}
                      >
                        <MessageAvatar>
                          {message.role === "user" ? (
                            <UserIcon className="size-4 text-muted-foreground" />
                          ) : (
                            <BotIcon className="size-4 text-primary" />
                          )}
                        </MessageAvatar>
                        <MessageContent>
                          <BubbleGroup>
                            {message.parts.map((part, i) => {
                              if (part.type === "text") {
                                return (
                                  <Bubble
                                    key={i}
                                    variant={
                                      message.role === "user"
                                        ? "tinted"
                                        : "muted"
                                    }
                                  >
                                    <BubbleContent className="prose prose-sm dark:prose-invert max-w-none text-sm/relaxed">
                                      <ReactMarkdown>
                                        {part.text}
                                      </ReactMarkdown>
                                    </BubbleContent>
                                  </Bubble>
                                );
                              }

                              // Handle Tool Parts
                              if (part.type.startsWith("tool-")) {
                                const toolPart = part as any;
                                return (
                                  <Bubble
                                    key={toolPart.toolCallId || i}
                                    variant="ghost"
                                    className="max-w-[95%] sm:max-w-[85%] mt-1"
                                  >
                                    <BubbleContent className="p-0">
                                      <ChatWidgetRenderer part={toolPart} />
                                    </BubbleContent>
                                  </Bubble>
                                );
                              }

                              return null;
                            })}
                          </BubbleGroup>
                        </MessageContent>
                      </Message>
                    </MessageGroup>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t bg-muted/10">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="relative flex items-end w-full gap-2 bg-background border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Bankmate about your finances..."
            className="min-h-[44px] max-h-32 resize-none border-0 focus-visible:ring-0 rounded-l-lg py-3 px-3 shadow-none bg-transparent"
            rows={1}
          />
          <div className="p-2 shrink-0">
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="size-8 rounded-md transition-transform active:scale-95"
            >
              <SendIcon className="size-4" />
            </Button>
          </div>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Bankmate is an AI assistant and may make mistakes. This is a read-only demo.
        </p>
      </div>
    </div>
  );
}
