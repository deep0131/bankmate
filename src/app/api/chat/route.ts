import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { getDefaultCustomer } from "@/lib/data/customers";
import { getTransactions } from "@/lib/data/customers";
import { getAllProducts, getProductsByCategory } from "@/lib/data/products";
import {
  buildSanitizedContext,
  sanitizeTransactions,
  sanitizeCustomer,
} from "@/lib/sanitization/sanitize";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

import { showAccountSummarySchema } from "@/lib/ai/tools/show-account-summary";
import { showTransactionsSchema } from "@/lib/ai/tools/show-transactions";
import { compareProductsSchema } from "@/lib/ai/tools/compare-products";
import { showCalculatorSchema } from "@/lib/ai/tools/show-calculator";
import { showSpendingChartSchema } from "@/lib/ai/tools/show-spending-chart";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // ADR-0006: Hardcoded demo state — always use default customer
  const customer = getDefaultCustomer();

  // ADR-0004/0007: Sanitize customer data before AI context
  const sanitizedContext = buildSanitizedContext(customer);

  const result = streamText({
    model: google("gemini-3.6-flash"),
    system: `${SYSTEM_PROMPT}

## Current Customer Context (Sanitized — PII Removed)
${sanitizedContext}

## Available Banking Products
${JSON.stringify(getAllProducts(), null, 2)}`,
    messages: await convertToModelMessages(messages),
    tools: {
      show_account_summary: {
        description:
          "Show the customer's account summary with all account balances. Use when the customer asks about their balance, accounts, or financial overview.",
        inputSchema: showAccountSummarySchema,
        execute: async ({ customerId }) => {
          const cust = getDefaultCustomer(); // ADR-0006
          const sanitizedCust = sanitizeCustomer(cust);
          return { widget: "show_account_summary", customerId, accounts: sanitizedCust.accounts };
        },
      },
      show_transactions: {
        description:
          "Show a sortable, filterable transaction table for a specific account. Use when the customer asks about transactions, purchases, spending, or statements.",
        inputSchema: showTransactionsSchema,
        execute: async (params) => {
          // Fetch and sanitize transactions on the server
          const transactions = getTransactions(params.accountId, {
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            merchant: params.merchant,
            category: params.category as
              | import("@/types/customer").TransactionCategory
              | undefined,
            type: params.type,
          });
          const sanitized = sanitizeTransactions(transactions);
          return {
            widget: "show_transactions",
            transactions: sanitized,
            accountId: params.accountId,
            filters: {
              dateFrom: params.dateFrom,
              dateTo: params.dateTo,
              merchant: params.merchant,
              category: params.category,
              type: params.type,
            },
          };
        },
      },
      compare_products: {
        description:
          "Show a side-by-side comparison table of the bank's products. Use when the customer asks about loans, credit cards, savings accounts, fixed deposits, or wants to compare banking products.",
        inputSchema: compareProductsSchema,
        execute: async ({ category, productIds }) => {
          const products = productIds
            ? getAllProducts().filter((p) => productIds.includes(p.id))
            : getProductsByCategory(category);
          return {
            widget: "compare_products",
            products,
            category,
          };
        },
      },
      show_calculator: {
        description:
          "Launch an interactive EMI/interest calculator with adjustable sliders. Use when the customer asks to calculate loan payments, EMI, mortgage costs, or interest. Extract the principal amount, rate, and term from the query.",
        inputSchema: showCalculatorSchema,
        execute: async (params) => {
          return { widget: "show_calculator", ...params };
        },
      },
      show_spending_chart: {
        description:
          "Show a visual chart of spending patterns, either by category (pie/bar chart) or by month (trend chart). Use when the customer asks about spending breakdown, where their money goes, or spending trends.",
        inputSchema: showSpendingChartSchema,
        execute: async (params) => {
          const transactions = getTransactions(params.accountId, {
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
          });
          const sanitized = sanitizeTransactions(transactions);
          return {
            widget: "show_spending_chart",
            transactions: sanitized,
            groupBy: params.groupBy,
            accountId: params.accountId,
          };
        },
      },
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
