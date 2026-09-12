"use client";

import { mermaid } from "@streamdown/mermaid";
import { UserIcon } from "lucide-react";
import { Streamdown } from "streamdown";
import { FinancialChart } from "@/components/tools/financial-chart";
import { LoanCalculator } from "@/components/tools/loan-calculator";
import {
  BookFixedDepositCard,
  TransferFundsCard,
} from "@/components/tools/transaction-action-card";
import { TransactionTable } from "@/components/tools/transaction-table";
import { UserProfileWidget } from "@/components/tools/user-profile-widget";
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
import type { ChatUIMessage } from "@/lib/ai/tools";

interface ChatMessageItemProps {
  message: ChatUIMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user";

  return (
    <MessageScrollerItem messageId={message.id} scrollAnchor={isUser}>
      <Message align={isUser ? "end" : "start"}>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback className={isUser ? "bg-blue-600 text-white font-bold text-xs" : "bg-primary text-primary-foreground font-bold text-xs"}>
              {isUser ? "DY" : "BM"}
            </AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>{isUser ? "Deep Yadav" : "Bankmate"}</MessageHeader>
          <Bubble variant={isUser ? "default" : "tinted"}>
            <BubbleContent>
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <Streamdown
                        key={`${message.id}-${i}`}
                        plugins={{ mermaid }}
                      >
                        {part.text}
                      </Streamdown>
                    );
                  case "tool-transaction-table":
                    return (
                      <TransactionTable key={`${message.id}-${i}`} {...part} />
                    );
                  case "tool-loan-calculator":
                    return (
                      <LoanCalculator key={`${message.id}-${i}`} {...part} />
                    );
                  case "tool-financial-chart":
                    return (
                      <FinancialChart key={`${message.id}-${i}`} {...part} />
                    );
                  case "tool-bank-profile":
                    return (
                      <UserProfileWidget key={`${message.id}-${i}`} {...part} />
                    );
                  case "tool-book-fixed-deposit":
                    return (
                      <BookFixedDepositCard key={`${message.id}-${i}`} {...part} />
                    );
                  case "tool-transfer-funds":
                    return (
                      <TransferFundsCard key={`${message.id}-${i}`} {...part} />
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
