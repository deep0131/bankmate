"use client";

import { useMemo } from "react";
import type { SanitizedTransaction } from "@/lib/sanitization/sanitize";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SpendingChartProps {
  transactions: SanitizedTransaction[];
  groupBy: "category" | "month";
  accountId: string;
}

const categoryChartColors = [
  "hsl(220, 90%, 60%)",
  "hsl(160, 70%, 45%)",
  "hsl(340, 80%, 55%)",
  "hsl(30, 90%, 55%)",
  "hsl(270, 70%, 60%)",
  "hsl(190, 80%, 45%)",
  "hsl(50, 85%, 50%)",
  "hsl(0, 75%, 55%)",
  "hsl(130, 60%, 45%)",
  "hsl(300, 65%, 55%)",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface SpendingData {
  label: string;
  amount: number;
  color: string;
  percentage: number;
}

export function SpendingChart({
  transactions,
  groupBy,
}: SpendingChartProps) {
  const data = useMemo<SpendingData[]>(() => {
    // Only analyze debits (spending)
    const debits = transactions.filter((t) => t.amount < 0);

    if (groupBy === "category") {
      const grouped = new Map<string, number>();
      for (const t of debits) {
        const current = grouped.get(t.category) ?? 0;
        grouped.set(t.category, current + Math.abs(t.amount));
      }

      const total = Array.from(grouped.values()).reduce(
        (sum, v) => sum + v,
        0,
      );

      return Array.from(grouped.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([label, amount], i) => ({
          label,
          amount,
          color: categoryChartColors[i % categoryChartColors.length],
          percentage: total > 0 ? (amount / total) * 100 : 0,
        }));
    }

    // Group by month
    const grouped = new Map<string, number>();
    for (const t of debits) {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const current = grouped.get(key) ?? 0;
      grouped.set(key, current + Math.abs(t.amount));
    }

    const total = Array.from(grouped.values()).reduce(
      (sum, v) => sum + v,
      0,
    );

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, amount], i) => {
        const [year, month] = key.split("-");
        const monthName = new Date(
          Number(year),
          Number(month) - 1,
        ).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        return {
          label: monthName,
          amount,
          color: categoryChartColors[i % categoryChartColors.length],
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      });
  }, [transactions, groupBy]);

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const totalSpend = data.reduce((sum, d) => sum + d.amount, 0);

  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No spending data available for this period.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">
          Spending {groupBy === "category" ? "by Category" : "Over Time"}
        </CardTitle>
        <CardDescription className="text-xs">
          Total: {formatCurrency(totalSpend)} across {data.length}{" "}
          {groupBy === "category" ? "categories" : "months"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Horizontal Bar Chart */}
        {data.map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium truncate max-w-[140px]">
                {item.label}
              </span>
              <span className="text-muted-foreground tabular-nums ml-2">
                {formatCurrency(item.amount)}
                <span className="text-[10px] ml-1">
                  ({item.percentage.toFixed(1)}%)
                </span>
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(item.amount / maxAmount) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
