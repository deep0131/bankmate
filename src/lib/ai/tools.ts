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

export const bankProfileTool = tool({
  description:
    "Retrieve and display Deep Yadav's complete net banking profile, accounts overview, card limits, KYC status, or relationship manager details in an interactive visual card widget.",
  inputSchema: z.object({
    view: z
      .enum(["overview", "accounts", "cards", "wealth", "kyc"])
      .default("overview")
      .describe("Specific section to highlight in the profile card."),
  }),
  execute: async ({ view = "overview" }) => {
    return {
      view,
    };
  },
});

export const bookFixedDepositTool = tool({
  description:
    "Open or book a new Fixed Deposit (FD) for the user. Prompts the user to review details and securely authorize the booking by entering their 6-digit transaction PIN. Use whenever the user asks to create, open, or invest in an FD / fixed deposit.",
  inputSchema: z.object({
    amount: z
      .number()
      .describe("Principal amount to invest in the Fixed Deposit in INR / Rupees (e.g. 20000, 50000)."),
    tenureYears: z
      .number()
      .default(2)
      .describe("Tenure duration in years (e.g. 1, 2, 3, 5)."),
    interestRate: z
      .number()
      .default(7.25)
      .describe("Annual interest rate percentage (e.g. 7.25 for 7.25% p.a.)."),
    payoutType: z
      .string()
      .default("Cumulative (At Maturity)")
      .describe("Interest payout mode: 'Cumulative (At Maturity)', 'Quarterly Payout', or 'Monthly Payout'."),
  }),
  execute: async ({
    amount,
    tenureYears = 2,
    interestRate = 7.25,
    payoutType = "Cumulative (At Maturity)",
  }) => {
    const n = tenureYears;
    const r = interestRate;
    const estimatedMaturity = Math.round(amount * Math.pow(1 + r / 400, 4 * n));
    return {
      actionType: "fixed-deposit" as const,
      amount,
      tenureYears,
      interestRate,
      payoutType,
      estimatedMaturity,
      status: "pending_pin_authorization",
    };
  },
});

export const transferFundsTool = tool({
  description:
    "Initiate a fund transfer (UPI / IMPS / NEFT) to a recipient. Prompts the user to enter their 6-digit transaction PIN to authorize the payment. Use whenever the user asks to send, transfer, or pay money to someone.",
  inputSchema: z.object({
    recipientName: z
      .string()
      .describe("Name of the recipient or beneficiary."),
    recipientAccount: z
      .string()
      .optional()
      .default("•••• 4092")
      .describe("Account number, UPI ID, or mobile number."),
    amount: z
      .number()
      .describe("Amount in INR / Rupees to transfer."),
    note: z
      .string()
      .optional()
      .default("Fund Transfer")
      .describe("Payment description or note (e.g. 'Rent payment', 'Dinner split')."),
  }),
  execute: async ({
    recipientName,
    recipientAccount = "•••• 4092",
    amount,
    note = "Fund Transfer",
  }) => {
    return {
      actionType: "transfer" as const,
      recipientName,
      recipientAccount,
      amount,
      note,
      status: "pending_pin_authorization",
    };
  },
});

export const chatTools = {
  "transaction-table": transactionTableTool,
  "loan-calculator": loanCalculatorTool,
  "financial-chart": financialChartTool,
  "bank-profile": bankProfileTool,
  "book-fixed-deposit": bookFixedDepositTool,
  "transfer-funds": transferFundsTool,
};

export type ChatTools = typeof chatTools;
export type ChatUITools = InferUITools<ChatTools>;
export type ChatUIMessage = UIMessage<unknown, UIDataTypes, ChatUITools>;

export type TransactionTableUITool = InferUITool<typeof transactionTableTool>;
export type LoanCalculatorUITool = InferUITool<typeof loanCalculatorTool>;
export type FinancialChartUITool = InferUITool<typeof financialChartTool>;
export type BankProfileUITool = InferUITool<typeof bankProfileTool>;
export type BookFixedDepositUITool = InferUITool<typeof bookFixedDepositTool>;
export type TransferFundsUITool = InferUITool<typeof transferFundsTool>;


