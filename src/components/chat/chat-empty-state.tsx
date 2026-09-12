"use client";

import {
  BanknoteIcon,
  BarChart3Icon,
  CalculatorIcon,
  CreditCardIcon,
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
    bgDark: "#172554",
    label: "My Bank Profile",
    prompt: "Show my complete BankMate account profile and balances",
  },
  {
    icon: BarChart3Icon,
    color: "#10B981",
    bg: "#ECFDF5",
    bgDark: "#064E3B",
    label: "Spending Breakdown",
    prompt: "Show me a visual pie chart breakdown of my spending this month",
  },
  {
    icon: CreditCardIcon,
    color: "#6366F1",
    bg: "#EEF2FF",
    bgDark: "#1E1B4B",
    label: "Credit Card & Limits",
    prompt: "What is my current credit card outstanding and available limit?",
  },
  {
    icon: CalculatorIcon,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    bgDark: "#2E1065",
    label: "Home Loan EMI",
    prompt: "Calculate EMI for my ₹1 Crore pre-approved home loan at 8.25% for 20 years",
  },
];

export function ChatEmptyState({ onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] my-auto">
      {/* Welcome heading */}
      <h2
        className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-3"
        style={{ color: "var(--foreground)" }}
      >
        Welcome to BankMate, Deep
      </h2>
      <p
        className="text-base text-center mb-10 max-w-md"
        style={{ color: "var(--muted-foreground)" }}
      >
        Manage your accounts, review statements, or calculate loans. What can I help you with today?
      </p>

      {/* Suggestion cards — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
        {SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="group flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 hover:shadow-md"
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
              className="size-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: item.bg, color: item.color }}
            >
              <item.icon className="size-5" />
            </div>
            <span
              className="text-sm font-medium text-left flex-1"
              style={{ color: "var(--foreground)" }}
            >
              {item.label}
            </span>
            <PlusIcon className="size-4 opacity-40 group-hover:opacity-70 transition-opacity" style={{ color: "var(--muted-foreground)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}
