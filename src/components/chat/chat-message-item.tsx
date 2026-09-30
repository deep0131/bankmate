"use client";

import { mermaid } from "@streamdown/mermaid";
import { cn } from "cn";
import { Streamdown } from "streamdown";
import { FinancialChart } from "@/components/tools/financial-chart";
import { LoanCalculator } from "@/components/tools/loan-calculator";
import {
  BookFixedDepositCard,
  TransferFundsCard,
} from "@/components/tools/transaction-action-card";
import { TransactionTable } from "@/components/tools/transaction-table";
import { AccountStatementCard } from "@/components/tools/account-statement-card";
import { UserProfileWidget } from "@/components/tools/user-profile-widget";
import {
  LoanOffersCatalog,
  ApplyLoanCard,
} from "@/components/tools/loan-offers-widget";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
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
      <div
        className={cn(
          "flex w-full my-3",
          isUser ? "flex-col items-end" : "flex-col items-start",
        )}
      >
        {/* Sender Name Label */}
        <div
          className={cn(
            "text-xs font-medium text-slate-400 dark:text-slate-500 mb-1.5",
            isUser ? "text-right mr-11" : "text-left ml-11",
          )}
        >
          {isUser ? "Deep Yadav" : "Bankmate"}
        </div>

        {/* Message and Avatar Row */}
        <div
          className={cn(
            "flex w-full gap-2.5",
            isUser ? "items-end justify-end" : "items-start justify-start",
          )}
        >
          {/* Assistant Avatar on Left */}
          {!isUser && (
            <div className="size-8 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs mt-1">
              BM
            </div>
          )}

          {/* Content Area — No Outer Border Wrappers */}
          <div
            className={cn(
              "flex flex-col gap-2 min-w-0",
              isUser ? "items-end max-w-[85%]" : "items-start w-full max-w-[1000px]",
            )}
          >
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return isUser ? (
                    <div
                      key={`${message.id}-${i}`}
                      className="bg-[#1D4ED8] text-white rounded-3xl px-5 py-2.5 text-sm font-medium shadow-2xs leading-relaxed"
                    >
                      {part.text}
                    </div>
                  ) : (
                    <div
                      key={`${message.id}-${i}`}
                      className="bg-slate-100 dark:bg-card text-slate-900 dark:text-foreground border border-slate-200/80 dark:border-border rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-3xl shadow-2xs"
                    >
                      <Streamdown plugins={{ mermaid }}>{part.text}</Streamdown>
                    </div>
                  );
                case "tool-bank-profile":
                  return (
                    <UserProfileWidget key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-transaction-table":
                  return (
                    <TransactionTable key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-account-statement":
                  return (
                    <AccountStatementCard key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-loan-calculator":
                  return (
                    <LoanCalculator key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-financial-chart":
                  return (
                    <FinancialChart key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-book-fixed-deposit":
                  return (
                    <BookFixedDepositCard
                      key={`${message.id}-${i}`}
                      {...part}
                    />
                  );
                case "tool-transfer-funds":
                  return (
                    <TransferFundsCard key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-show-loan-offers":
                  return (
                    <LoanOffersCatalog key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-apply-loan":
                  return <ApplyLoanCard key={`${message.id}-${i}`} {...part} />;
                default:
                  return null;
              }
            })}
          </div>

          {/* User Avatar on Right */}
          {isUser && (
            <div className="size-8 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs mb-0.5">
              DY
            </div>
          )}
        </div>
      </div>
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
