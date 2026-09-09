"use client";

import type { SanitizedAccount } from "@/lib/sanitization/sanitize";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  WalletIcon,
  PiggyBankIcon,
  CreditCardIcon,
} from "lucide-react";

interface AccountSummaryProps {
  accounts: SanitizedAccount[];
}

const accountIcons: Record<SanitizedAccount["type"], React.ReactNode> = {
  checking: <WalletIcon />,
  savings: <PiggyBankIcon />,
  credit_card: <CreditCardIcon />,
};

const accountLabels: Record<SanitizedAccount["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
};

function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function maskAccountNumber(num: string): string {
  if (num.length <= 4) return num;
  return `****${num.slice(-4)}`;
}

export function AccountSummary({ accounts }: AccountSummaryProps) {
  const totalBalance = accounts
    .filter((a) => a.type !== "credit_card")
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Total Balance Header */}
      <div className="rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20 p-4">
        <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
        <p className="text-2xl font-bold tracking-tight">
          {formatCurrency(totalBalance)}
        </p>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map((account) => (
          <Card key={account.id} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-muted text-muted-foreground">
                  {accountIcons[account.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm truncate">
                    {account.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {account.accountNumberMasked}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {accountLabels[account.type]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p
                className={`text-xl font-semibold tabular-nums ${
                  account.balance < 0
                    ? "text-destructive"
                    : ""
                }`}
              >
                {formatCurrency(account.balance, account.currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {account.transactionCount} recent transactions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
