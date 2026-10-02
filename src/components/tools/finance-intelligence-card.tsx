"use client";

import type { UIToolInvocation } from "ai";
import {
  AlertTriangleIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  FlameIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { financeIntelligenceTool } from "@/lib/ai/tools";
import {
  formatINR,
  useBankStore,
  validateTransactionPin,
} from "@/lib/bank-store";
import {
  analyzeMonthlySpending,
  generateCashFlowForecast,
} from "@/lib/finance-calculations";

export type FinanceIntelligenceCardProps = UIToolInvocation<
  typeof financeIntelligenceTool
>;

export function FinanceIntelligenceCard(props: FinanceIntelligenceCardProps) {
  const output = "output" in props ? props.output : undefined;
  const state = props.state;
  const errorText = "errorText" in props ? props.errorText : undefined;

  const {
    profile,
    transactions,
    budgets,
    savingsGoals,
    createOrUpdateBudget,
    contributeSavingsGoal,
  } = useBankStore();

  const [activeTab, setActiveTab] = useState<
    "spending" | "budgets" | "subscriptions" | "cashflow" | "goals" | "networth"
  >(
    (output?.initialTab as
      | "spending"
      | "budgets"
      | "subscriptions"
      | "cashflow"
      | "goals"
      | "networth") || "spending",
  );

  const [feedback, setFeedback] = useState<string | null>(null);

  // Budget create state
  const [newBudgetCat, setNewBudgetCat] = useState("Shopping & Retail");
  const [newBudgetAmount, setNewBudgetAmount] = useState(45000);

  // Goal contribute state
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState(50000);
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (state === "input-streaming" || state === "input-available") {
    return (
      <Card className="w-full max-w-2xl border-slate-200 dark:border-border shadow-md">
        <CardContent className="flex items-center gap-3 py-6">
          <Spinner className="size-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Computing Financial Intelligence & Predictive Analytics...
            </p>
            <p className="text-xs text-muted-foreground">
              Running deterministic budget models, recurring pattern detection,
              and cash-flow projections
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "output-error" || state === "output-denied") {
    return (
      <Card className="w-full max-w-2xl border-destructive/40 bg-destructive/5 shadow-md">
        <CardContent className="flex items-center gap-3 py-5">
          <AlertTriangleIcon className="size-5 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Analytics Execution Failed
            </p>
            <p className="text-xs text-muted-foreground">
              {errorText || "Could not calculate metrics."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const spendAnalysis = analyzeMonthlySpending(transactions);
  const cashflow = generateCashFlowForecast(
    profile.accounts[0]?.availableBalance || 485250,
    240000,
    115000,
    6,
  );

  const handleSaveBudget = () => {
    const res = createOrUpdateBudget(newBudgetCat, newBudgetAmount);
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleContribute = (goalId: string) => {
    if (!validateTransactionPin(pin)) {
      setFeedback("Incorrect 6-digit transaction PIN. (Default: 123456)");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const res = contributeSavingsGoal(goalId, contributeAmount, pin);
      setIsProcessing(false);
      setContributeGoalId(null);
      setPin("");
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 4000);
    }, 700);
  };

  return (
    <Card className="w-full max-w-2xl border border-slate-200 dark:border-border shadow-lg bg-card overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <SparklesIcon className="size-4 text-amber-300" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-200">
                Personal Finance Intelligence
              </span>
              <h3 className="text-base font-bold leading-tight">
                Financial Health & Insights
              </h3>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/20 text-[11px] font-semibold">
            {spendAnalysis.currentMonthName}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-border px-3 bg-slate-50 dark:bg-muted/30 gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("spending")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "spending"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Spending Insights
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("budgets")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "budgets"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Budgets & Alerts ({budgets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subscriptions")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "subscriptions"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Subscriptions & Recurring
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cashflow")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "cashflow"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Cash Flow Forecast
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("goals")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "goals"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Savings Goals ({savingsGoals.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("networth")}
          className={`px-3 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "networth"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Net Worth & Wealth
        </button>
      </div>

      <CardContent className="p-5 space-y-4">
        {feedback && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tab 1: Monthly Spend & Increase Explanations */}
        {activeTab === "spending" && (
          <div className="space-y-4 text-xs">
            {/* Top KPI Ribbon */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-muted/40 border">
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Month Total Spend
                </span>
                <span className="text-base font-bold text-foreground">
                  {formatINR(spendAnalysis.currentMonthSpend)}
                </span>
                <div className="flex items-center gap-1 text-[10px] mt-0.5 font-semibold text-amber-600 dark:text-amber-400">
                  <ArrowUpIcon className="size-3" />
                  <span>
                    +{spendAnalysis.spendDeltaPercentage}% vs last month
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Monthly Inflow
                </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatINR(spendAnalysis.totalIncome || 240000)}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  TechCorp Salary
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Savings Rate
                </span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                  {spendAnalysis.savingsRate}%
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {formatINR(spendAnalysis.netSavings)} retained
                </span>
              </div>
            </div>

            {/* Drivers of Increase Explanation */}
            {spendAnalysis.topIncreaseCategories.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-xs">
                  <FlameIcon className="size-4 text-amber-600" />
                  <span>Why Did My Spending Increase? (Key Drivers)</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {spendAnalysis.topIncreaseCategories
                    .slice(0, 3)
                    .map((cat) => (
                      <div
                        key={cat.category}
                        className="flex justify-between items-center"
                      >
                        <span className="text-muted-foreground font-medium">
                          • {cat.category}:
                        </span>
                        <span className="font-bold text-foreground">
                          {formatINR(cat.currentAmount)} (+
                          {formatINR(cat.difference)}, +{cat.percentChange}%)
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Category Breakdown Progress Bars */}
            <div className="space-y-2.5">
              <span className="font-bold block text-foreground">
                Spending by Category
              </span>
              <div className="space-y-2">
                {spendAnalysis.categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-foreground">
                        {cat.category}
                      </span>
                      <span className="font-bold">
                        {formatINR(cat.amount)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(cat.percentage, 100)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Budgets & Alerts */}
        {activeTab === "budgets" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {budgets.map((b) => {
                const percent = Math.round(
                  (b.currentSpend / b.monthlyBudget) * 100,
                );
                const isOver = percent >= 100;
                const isNear = percent >= 80;
                return (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      isOver
                        ? "bg-destructive/5 border-destructive/30"
                        : isNear
                          ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200"
                          : "bg-slate-50/70 dark:bg-muted/30 border-slate-200 dark:border-border"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-foreground block">
                          {b.category}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {b.period}
                        </span>
                      </div>
                      <Badge
                        variant={
                          isOver
                            ? "destructive"
                            : isNear
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {percent}%
                      </Badge>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isOver
                            ? "bg-destructive"
                            : isNear
                              ? "bg-amber-500"
                              : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Spent: {formatINR(b.currentSpend)}</span>
                      <span>Cap: {formatINR(b.monthlyBudget)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Set New Budget Drawer */}
            <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-muted/40 space-y-3">
              <span className="font-bold text-foreground block">
                Create or Update Category Budget
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Category
                    <select
                      value={newBudgetCat}
                      onChange={(e) => setNewBudgetCat(e.target.value)}
                      className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs mt-1 text-foreground"
                    >
                      <option value="Shopping & Retail">
                        Shopping & Retail
                      </option>
                      <option value="Travel & Fuel">Travel & Fuel</option>
                      <option value="Dining & Food Delivery">
                        Dining & Food Delivery
                      </option>
                      <option value="Groceries & Household">
                        Groceries & Household
                      </option>
                      <option value="Entertainment & Subscriptions">
                        Entertainment & Subscriptions
                      </option>
                    </select>
                  </label>
                </div>

                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">
                    Monthly Limit (₹)
                  </span>
                  <Input
                    type="number"
                    step={5000}
                    value={newBudgetAmount}
                    onChange={(e) => setNewBudgetAmount(Number(e.target.value))}
                    className="h-8 text-xs font-bold mt-1 text-foreground"
                  />
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleSaveBudget}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <PlusIcon className="size-3.5 mr-1" />
                Set Budget Alert
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Subscriptions */}
        {activeTab === "subscriptions" && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">
                Detected Recurring Subscriptions
              </span>
              <span className="text-muted-foreground">
                Auto-debit active on Metal Card
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-border border rounded-xl overflow-hidden">
              {[
                {
                  name: "Netflix India 4K Premium",
                  amt: 649,
                  freq: "Monthly",
                  next: "18 Oct 2026",
                  cat: "Entertainment",
                },
                {
                  name: "Spotify Premium Duo",
                  amt: 149,
                  freq: "Monthly",
                  next: "11 Oct 2026",
                  cat: "Entertainment",
                },
                {
                  name: "Amazon Prime Annual Plan",
                  amt: 1499,
                  freq: "Annual",
                  next: "20 Jan 2027",
                  cat: "Entertainment",
                },
                {
                  name: "Auto Loan EMI (LN-AUTO-4091)",
                  amt: 19250,
                  freq: "Monthly",
                  next: "05 Oct 2026",
                  cat: "Loan EMI",
                },
                {
                  name: "Cult.fit Elite Annual",
                  amt: 19500,
                  freq: "Annual",
                  next: "04 Nov 2026",
                  cat: "Fitness",
                },
              ].map((sub) => (
                <div
                  key={sub.name}
                  className="p-3 flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-foreground block">
                      {sub.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Next Due: {sub.next} • {sub.freq}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground block">
                      {formatINR(sub.amt)}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Auto-Debit
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Cash Flow Forecast */}
        {activeTab === "cashflow" && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-100 block">
                6-Month Predictive Cash Flow Forecast
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Calculated deterministically using steady ₹2,40,000 monthly
                TechCorp inflows and historical spend averages.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-border border rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 dark:bg-muted/60 px-3 py-2 font-bold grid grid-cols-4 text-center">
                <span className="text-left">Month</span>
                <span>Projected In</span>
                <span>Projected Out</span>
                <span className="text-right">Estimated Balance</span>
              </div>
              {cashflow.map((m) => (
                <div
                  key={m.month}
                  className="p-3 grid grid-cols-4 items-center text-center"
                >
                  <span className="text-left font-bold">{m.month}</span>
                  <span className="text-emerald-600 font-semibold">
                    +{formatINR(m.projectedInflow)}
                  </span>
                  <span className="text-destructive font-semibold">
                    -{formatINR(m.projectedOutflow)}
                  </span>
                  <span className="text-right font-bold text-blue-600 dark:text-blue-400">
                    {formatINR(m.estimatedClosingBalance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Savings Goals */}
        {activeTab === "goals" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-3">
              {savingsGoals.map((g) => {
                const percent = Math.round(
                  (g.currentAmount / g.targetAmount) * 100,
                );
                const isContributeActive = contributeGoalId === g.id;
                return (
                  <div
                    key={g.id}
                    className="p-4 rounded-xl border space-y-3 bg-slate-50/50 dark:bg-muted/20"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-foreground text-sm block">
                          {g.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Target Date: {g.targetDate}
                        </span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300">
                        {percent}% Achieved
                      </Badge>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-muted h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs">
                      <span>
                        Saved: <strong>{formatINR(g.currentAmount)}</strong>
                      </span>
                      <span>
                        Target: <strong>{formatINR(g.targetAmount)}</strong>
                      </span>
                    </div>

                    <div className="pt-2 border-t flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setContributeGoalId(isContributeActive ? null : g.id)
                        }
                        className="text-xs text-blue-600 dark:text-blue-400"
                      >
                        <PlusIcon className="size-3.5 mr-1" />
                        {isContributeActive ? "Cancel" : "Add Funds to Goal"}
                      </Button>
                    </div>

                    {isContributeActive && (
                      <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 space-y-2">
                        <span className="font-semibold block">
                          Transfer from Savings (PIN: 123456)
                        </span>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step={10000}
                            value={contributeAmount}
                            onChange={(e) =>
                              setContributeAmount(Number(e.target.value))
                            }
                            className="h-8 text-xs font-bold"
                          />
                          <Input
                            type="password"
                            maxLength={6}
                            value={pin}
                            onChange={(e) =>
                              setPin(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="PIN: 123456"
                            className="h-8 text-xs font-mono tracking-widest w-32"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleContribute(g.id)}
                            disabled={pin.length < 6 || isProcessing}
                            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                          >
                            {isProcessing ? (
                              <Spinner className="size-3 mr-1" />
                            ) : (
                              "Transfer"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 6: Net Worth */}
        {activeTab === "networth" && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg space-y-2">
              <span className="text-[11px] text-slate-300 uppercase tracking-wider block">
                Total Net Worth in BankMate
              </span>
              <span className="text-2xl font-bold text-amber-300">
                {formatINR(profile.wealth.totalNetWorth)}
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold block">
                +14.8% Year-over-Year Growth • Prime Tier Wealth Portfolio
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border bg-slate-50 dark:bg-muted/30">
                <span className="text-muted-foreground block text-[11px]">
                  Liquid Cash & Savings
                </span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">
                  {formatINR(profile.wealth.liquidCash)}
                </span>
              </div>
              <div className="p-3 rounded-xl border bg-slate-50 dark:bg-muted/30">
                <span className="text-muted-foreground block text-[11px]">
                  Fixed Income & FDs
                </span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">
                  {formatINR(profile.wealth.fixedIncome)}
                </span>
              </div>
              <div className="p-3 rounded-xl border bg-slate-50 dark:bg-muted/30">
                <span className="text-muted-foreground block text-[11px]">
                  Mutual Funds & SIPs
                </span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">
                  {formatINR(profile.wealth.investments)}
                </span>
              </div>
              <div className="p-3 rounded-xl border bg-slate-50 dark:bg-muted/30">
                <span className="text-muted-foreground block text-[11px]">
                  Sovereign Gold Bonds
                </span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">
                  {formatINR(profile.wealth.goldBonds)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
