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
    "Calculate monthly loan payments (EMI), total interest, and compare loan terms/rates (e.g., mortgages, auto loans, personal loans).",
  inputSchema: z.object({
    loanAmount: z
      .number()
      .default(350000)
      .describe("Principal loan amount in USD (e.g. 350000)."),
    interestRate: z
      .number()
      .default(6.5)
      .describe("Annual interest rate percentage / APR (e.g. 6.5)."),
    loanTermYears: z
      .number()
      .default(30)
      .describe("Duration of the loan in years (e.g. 15 or 30)."),
    loanType: z
      .enum(["mortgage", "auto", "personal", "student"])
      .optional()
      .describe("Type of loan product."),
  }),
  execute: async ({
    loanAmount = 350000,
    interestRate = 6.5,
    loanTermYears = 30,
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

export const chatTools = {
  "transaction-table": transactionTableTool,
  "loan-calculator": loanCalculatorTool,
};

export type ChatTools = typeof chatTools;
export type ChatUITools = InferUITools<ChatTools>;
export type ChatUIMessage = UIMessage<unknown, UIDataTypes, ChatUITools>;

export type TransactionTableUITool = InferUITool<typeof transactionTableTool>;
export type LoanCalculatorUITool = InferUITool<typeof loanCalculatorTool>;
