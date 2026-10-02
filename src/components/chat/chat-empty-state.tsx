"use client";

import {
  BanknoteIcon,
  BarChart3Icon,
  CalculatorIcon,
  CreditCardIcon,
  FileCheck2Icon,
  HeadphonesIcon,
  PlusIcon,
} from "lucide-react";

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const SUGGESTIONS = [
  {
    icon: BanknoteIcon,
    color: "#2563EB",
    bg: "#EFF6FF",
    label: "My Bank Profile",
    prompt: "Show my complete BankMate account profile and balances",
  },
  {
    icon: FileCheck2Icon,
    color: "#0284C7",
    bg: "#F0F9FF",
    label: "Document Center",
    prompt: "List all documents and certificates that you can generate for me",
  },
  {
    icon: HeadphonesIcon,
    color: "#D97706",
    bg: "#FFFBEB",
    label: "Service Requests",
    prompt: "Show my active service requests and complaints",
  },
  {
    icon: CreditCardIcon,
    color: "#7C3AED",
    bg: "#F5F3FF",
    label: "Card Management",
    prompt: "Show my card controls, limits, and reward points",
  },
  {
    icon: BarChart3Icon,
    color: "#059669",
    bg: "#ECFDF5",
    label: "Spending Analysis",
    prompt: "Why did my spending increase this month?",
  },
  {
    icon: CalculatorIcon,
    color: "#DC2626",
    bg: "#FEF2F2",
    label: "Loans & Financing",
    prompt: "Show all available loans and pre-approved offers",
  },
];

const QUICK_CHIPS = [
  "Request a new cheque book",
  "Download my TDS certificate",
  "Transfer ₹15,000 to Rohit",
  "Block my debit card",
  "Cash flow forecast",
  "Check my CIBIL score",
];

export function ChatEmptyState({ onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] my-auto px-4">
      {/* Welcome heading */}
      <h2
        className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-2.5"
        style={{ color: "var(--foreground)" }}
      >
        Welcome to BankMate, Deep
      </h2>
      <p
        className="text-sm md:text-base text-center mb-6 max-w-lg"
        style={{ color: "var(--muted-foreground)" }}
      >
        Your AI banking concierge for balances, statements, loans, card
        controls, and service requests.
      </p>

      {/* Suggestion cards — 2×3 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full max-w-3xl mb-6">
        {SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="group flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-200 hover:shadow-md text-left"
            style={{
              borderColor: "var(--panel-border)",
              backgroundColor: "var(--card)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = item.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--panel-border)";
            }}
          >
            <div
              className="size-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: item.bg, color: item.color }}
            >
              <item.icon className="size-4.5" />
            </div>
            <span
              className="text-xs font-semibold flex-1 leading-snug truncate"
              style={{ color: "var(--foreground)" }}
            >
              {item.label}
            </span>
            <PlusIcon
              className="size-3.5 opacity-40 group-hover:opacity-70 transition-opacity shrink-0"
              style={{ color: "var(--muted-foreground)" }}
            />
          </button>
        ))}
      </div>

      {/* Quick Action Chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-2xl">
        <span className="text-[11px] font-semibold text-muted-foreground mr-1">
          Quick queries:
        </span>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onSelectPrompt(chip)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-border/80 bg-slate-50/60 dark:bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
