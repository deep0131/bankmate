import { z } from "zod";

/**
 * Tool: show_transactions
 * Triggers the Transaction Table Interactive Widget.
 * Shows a sortable, filterable table of transactions.
 */
export const showTransactionsSchema = z.object({
  accountId: z
    .string()
    .describe(
      "The account ID to show transactions for. Use account IDs from the customer context.",
    ),
  dateFrom: z
    .string()
    .optional()
    .describe(
      "Start date for filtering transactions (ISO 8601, e.g., '2026-08-01'). Omit to show all.",
    ),
  dateTo: z
    .string()
    .optional()
    .describe(
      "End date for filtering transactions (ISO 8601, e.g., '2026-09-08'). Omit to show all.",
    ),
  merchant: z
    .string()
    .optional()
    .describe(
      "Filter by merchant name (partial match). E.g., 'Amazon', 'Uber'.",
    ),
  category: z
    .string()
    .optional()
    .describe(
      "Filter by spending category. E.g., 'Groceries', 'Dining', 'Transportation'.",
    ),
  type: z
    .enum(["credit", "debit"])
    .optional()
    .describe("Filter by transaction type: 'credit' or 'debit'."),
});

export type ShowTransactionsParams = z.infer<typeof showTransactionsSchema>;
