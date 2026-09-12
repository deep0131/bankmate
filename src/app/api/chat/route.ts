import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  tool,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";
import mockTransactions from "@/data/transactions.json";
import type { Transaction } from "@/types/transaction";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-3.6-flash"),
    system:
      "You are Bankmate, an intelligent, helpful, and concise conversational net banking assistant. " +
      "When the user asks about recent transactions, payments, spending, or account statements, call the `transaction-table` tool to present the interactive transaction data. " +
      "Accompany the tool with a short, helpful summary message.",
    messages: await convertToModelMessages(messages),
    tools: {
      "transaction-table": tool({
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
      }),
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
