import {
  type InferUITool,
  type InferUITools,
  tool,
  type UIDataTypes,
  type UIMessage,
} from "ai";
import { z } from "zod";
import mockTransactions from "@/data/transactions.json";
import type { Transaction } from "@/types/transaction";

function calculateEmi(amount: number, ratePercent: number, years: number) {
  const r = ratePercent / 100 / 12;
  const n = years * 12;
  if (r === 0) return amount / n;
  return (amount * (r * (1 + r) ** n)) / ((1 + r) ** n - 1);
}

export const transactionTableTool = tool({
  description:
    "Retrieve the user's banking transaction history filtered by account, category, or limit to display in an interactive transaction data table.",
  inputSchema: z.object({
    account: z
      .enum(["checking", "savings", "credit", "all"])
      .optional()
      .describe(
        "Filter transactions by account type (checking, savings, credit, or all).",
      ),
    category: z
      .string()
      .optional()
      .describe(
        "Filter transactions by category (e.g. Groceries, Dining, Travel, Shopping, Utilities, Subscriptions, Income, Transfer).",
      ),
    limit: z
      .number()
      .optional()
      .describe("Max number of transactions to return (default 10)."),
  }),
  execute: async ({ account, category, limit = 10 }) => {
    let transactions = mockTransactions as Transaction[];

    if (account && account !== "all") {
      transactions = transactions.filter(
        (tx) => tx.account.toLowerCase() === account.toLowerCase(),
      );
    }

    if (category && category !== "all") {
      transactions = transactions.filter(
        (tx) => tx.category.toLowerCase() === category.toLowerCase(),
      );
    }

    return {
      account: account ?? "all",
      category: category ?? "all",
      totalCount: transactions.length,
      transactions: transactions.slice(0, limit),
    };
  },
});

export const loanCalculatorTool = tool({
  description:
    "Calculate monthly loan payments (EMI), total interest, and compare loan terms/rates (e.g., home loans, auto loans, personal loans, education loans in INR / Rupees).",
  inputSchema: z.object({
    loanAmount: z
      .number()
      .default(2500000)
      .describe("Principal loan amount in INR / Rupees (e.g. 2500000)."),
    interestRate: z
      .number()
      .default(8.5)
      .describe("Annual interest rate percentage / APR (e.g. 8.5)."),
    loanTermYears: z
      .number()
      .default(20)
      .describe("Duration of the loan in years (e.g. 15, 20, or 30)."),
    loanType: z
      .enum(["mortgage", "auto", "personal", "student"])
      .optional()
      .describe("Type of loan product."),
  }),
  execute: async ({
    loanAmount = 2500000,
    interestRate = 8.5,
    loanTermYears = 20,
    loanType = "mortgage",
  }) => {
    const monthly = calculateEmi(loanAmount, interestRate, loanTermYears);
    const totalPayment = monthly * loanTermYears * 12;
    const totalInterest = totalPayment - loanAmount;

    return {
      loanAmount,
      interestRate,
      loanTermYears,
      loanType,
      monthlyPayment: Math.round(monthly * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    };
  },
});

export const financialChartTool = tool({
  description:
    "Display an interactive financial chart (such as spending breakdown donut, income vs expenses bar chart, cash flow area chart, or loan comparison) using shadcn charts.",
  inputSchema: z.object({
    title: z
      .string()
      .describe(
        "Title of the chart (e.g. 'Monthly Spending Breakdown', 'Cash Flow Analysis').",
      ),
    description: z
      .string()
      .optional()
      .describe(
        "Subtitle or time range (e.g. 'September 2026', 'Last 3 Months').",
      ),
    chartType: z
      .enum(["donut", "bar", "area", "line"])
      .default("donut")
      .describe(
        "Chart visualization type: 'donut' for category breakdown, 'bar' for comparisons, 'area' for trends, 'line' for rate/timeline.",
      ),
    data: z
      .array(
        z.object({
          label: z
            .string()
            .describe(
              "Category, Month, or Label (e.g. 'Groceries', 'Dining', 'Aug 2026').",
            ),
          value: z
            .number()
            .describe("Primary value in Rupees / INR or number."),
          secondaryValue: z
            .number()
            .optional()
            .describe(
              "Optional secondary value for comparison (e.g. Income vs Expense).",
            ),
        }),
      )
      .describe("Data points to plot in the chart."),
    primaryKeyLabel: z
      .string()
      .optional()
      .default("Amount")
      .describe(
        "Label for the primary series (e.g. 'Expense', 'Spend', 'Balance').",
      ),
    secondaryKeyLabel: z
      .string()
      .optional()
      .describe(
        "Label for secondary series if comparing two series (e.g. 'Income').",
      ),
    totalLabel: z
      .string()
      .optional()
      .describe("Summary label (e.g. 'Total Spend', 'Net Savings')."),
  }),
  execute: async (params) => {
    const total = params.data.reduce((acc, curr) => acc + curr.value, 0);
    return {
      ...params,
      calculatedTotal: total,
    };
  },
});

export const chatTools = {
  "transaction-table": transactionTableTool,
  "loan-calculator": loanCalculatorTool,
  "financial-chart": financialChartTool,
};

export type ChatTools = typeof chatTools;
export type ChatUITools = InferUITools<ChatTools>;
export type ChatUIMessage = UIMessage<unknown, UIDataTypes, ChatUITools>;

export type TransactionTableUITool = InferUITool<typeof transactionTableTool>;
export type LoanCalculatorUITool = InferUITool<typeof loanCalculatorTool>;
export type FinancialChartUITool = InferUITool<typeof financialChartTool>;
