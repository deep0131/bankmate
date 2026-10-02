"use client";

import { mermaid } from "@streamdown/mermaid";
import { cn } from "cn";
import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { Streamdown } from "streamdown";
import { AccountStatementCard } from "@/components/tools/account-statement-card";
import { BankingDocumentCard } from "@/components/tools/banking-document-card";
import { CardManagementCard } from "@/components/tools/card-management-card";
import { FDServicingCard } from "@/components/tools/fd-servicing-card";
import { FinanceIntelligenceCard } from "@/components/tools/finance-intelligence-card";
import { FinancialChart } from "@/components/tools/financial-chart";
import { LoanCalculator } from "@/components/tools/loan-calculator";
import {
  ApplyLoanCard,
  LoanOffersCatalog,
} from "@/components/tools/loan-offers-widget";
import { LoanServicingCard } from "@/components/tools/loan-servicing-card";
import { PaymentHubCard } from "@/components/tools/payment-hub-card";
import { ProfileUpdateCard } from "@/components/tools/profile-update-card";
import { ServiceRequestCard } from "@/components/tools/service-request-card";
import {
  BookFixedDepositCard,
  TransferFundsCard,
} from "@/components/tools/transaction-action-card";
import { TransactionTable } from "@/components/tools/transaction-table";
import { UserProfileWidget } from "@/components/tools/user-profile-widget";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { MessageScrollerItem } from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import { useVoice } from "@/context/voice-context";
import type { ChatUIMessage } from "@/lib/ai/tools";

interface ChatMessageItemProps {
  message: ChatUIMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const { speak, stopSpeaking, isSpeaking, speakingMessageId } = useVoice();
  const isSpeakingThisMessage = isSpeaking && speakingMessageId === message.id;

  const assistantText = !isUser
    ? message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("\n")
    : "";

  // Filter and deduplicate parts:
  // If multiple tool parts exist in this message (e.g. from parallel LLM tool calls),
  // keep only the latest tool part to prevent duplicate widget cards in the UI.
  const renderedParts = (() => {
    let hasSeenTool = false;
    const reversed = [...message.parts].reverse();
    const filteredReversed = reversed.filter((part) => {
      if (part.type.startsWith("tool-")) {
        if (hasSeenTool) {
          return false;
        }
        hasSeenTool = true;
        return true;
      }
      return true;
    });
    return filteredReversed.reverse();
  })();

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

          {/* Content Area */}
          <div
            className={cn(
              "flex flex-col gap-2 min-w-0",
              isUser
                ? "items-end max-w-[85%]"
                : "items-start w-full max-w-[1000px]",
            )}
          >
            {renderedParts.map((part, i) => {
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
                    <AccountStatementCard
                      key={`${message.id}-${i}`}
                      {...part}
                    />
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
                case "tool-generate-banking-document":
                  return (
                    <BankingDocumentCard key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-service-request-tool":
                  return (
                    <ServiceRequestCard key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-customer-profile-update":
                  return (
                    <ProfileUpdateCard key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-payment-transfer-tool":
                  return (
                    <PaymentHubCard key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-card-management-tool":
                  return (
                    <CardManagementCard key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-loan-servicing-tool":
                  return (
                    <LoanServicingCard key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-fd-servicing-tool":
                  return (
                    <FDServicingCard key={`${message.id}-${i}`} {...part} />
                  );
                case "tool-finance-intelligence-tool":
                  return (
                    <FinanceIntelligenceCard
                      key={`${message.id}-${i}`}
                      {...part}
                    />
                  );
                default:
                  return null;
              }
            })}

            {/* Audio Voice Playback Bar for Assistant Responses */}
            {!isUser && assistantText.trim() && (
              <div
                className="flex items-center gap-2"
                style={{ marginTop: 2, marginLeft: 4 }}
              >
                {isSpeakingThisMessage ? (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
                    style={{
                      padding: "4px 10px",
                      backgroundColor: "rgba(59, 130, 246, 0.12)",
                      border: "1px solid rgba(59, 130, 246, 0.35)",
                      color: "#2563EB",
                    }}
                    title="Stop audio playback"
                  >
                    <span
                      className="flex items-center gap-0.5"
                      style={{ height: 10 }}
                    >
                      <span
                        className="rounded-full animate-bounce"
                        style={{
                          width: 2,
                          height: 8,
                          backgroundColor: "#2563EB",
                          animationDelay: "-0.3s",
                        }}
                      />
                      <span
                        className="rounded-full animate-bounce"
                        style={{
                          width: 2,
                          height: 12,
                          backgroundColor: "#2563EB",
                          animationDelay: "-0.15s",
                        }}
                      />
                      <span
                        className="rounded-full animate-bounce"
                        style={{
                          width: 2,
                          height: 6,
                          backgroundColor: "#2563EB",
                        }}
                      />
                    </span>
                    <span>Speaking...</span>
                    <VolumeXIcon
                      style={{ width: 14, height: 14, marginLeft: 2 }}
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => speak(assistantText, message.id)}
                    className="inline-flex items-center gap-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
                    style={{
                      padding: "4px 10px",
                      color: "#64748B",
                      opacity: 0.85,
                    }}
                    title="Listen with natural voice"
                  >
                    <Volume2Icon
                      style={{ width: 14, height: 14, color: "#2563EB" }}
                    />
                    <span>Listen</span>
                  </button>
                )}
              </div>
            )}
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
