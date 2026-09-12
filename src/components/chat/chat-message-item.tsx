"use client";

import type { UIMessage } from "ai";
import { UserIcon } from "lucide-react";
import { Streamdown } from "streamdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import { MessageScrollerItem } from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";

interface ChatMessageItemProps {
  message: UIMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user";

  return (
    <MessageScrollerItem messageId={message.id} scrollAnchor={isUser}>
      <Message align={isUser ? "end" : "start"}>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>
              {isUser ? <UserIcon className="size-4" /> : "BM"}
            </AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>{isUser ? "You" : "Bankmate"}</MessageHeader>
          <Bubble variant={isUser ? "default" : "tinted"}>
            <BubbleContent>
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <Streamdown key={`${message.id}-${i}`}>
                        {part.text}
                      </Streamdown>
                    );
                  default:
                    return null;
                }
              })}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

export function ChatThinkingIndicator() {
  return (
    <MessageScrollerItem messageId="loading-indicator">
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent className="shimmer">Thinking...</MarkerContent>
      </Marker>
    </MessageScrollerItem>
  );
}
