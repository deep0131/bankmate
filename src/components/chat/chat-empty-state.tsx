"use client";

import { MessageCircleDashedIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const SUGGESTIONS = [
  {
    label: "Check Balances",
    prompt: "What is the current balance on my checking account?",
  },
  {
    label: "Recent Transactions",
    prompt: "Show me my recent transactions for this month",
  },
  {
    label: "Spending Breakdown",
    prompt: "Show me a visual pie chart breakdown of my spending this month",
  },
  {
    label: "Home Loan EMI",
    prompt: "Calculate EMI for a ₹35 Lakh home loan at 8.5% for 20 years",
  },
];

export function ChatEmptyState({ onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <Empty className="h-full min-h-[50vh] my-auto">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageCircleDashedIcon />
        </EmptyMedia>
        <EmptyTitle>Good morning!</EmptyTitle>
        <EmptyDescription>
          How can I help you with your accounts or loans today?
        </EmptyDescription>
      </EmptyHeader>
      <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-md">
        {SUGGESTIONS.map((item) => (
          <Button
            key={item.label}
            variant="outline"
            size="sm"
            onClick={() => onSelectPrompt(item.prompt)}
            className="text-xs"
          >
            {item.label}
          </Button>
        ))}
      </div>
    </Empty>
  );
}
