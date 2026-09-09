import { z } from "zod";

/**
 * Tool: show_spending_chart
 * Triggers the Spending Chart Interactive Widget.
 * Shows a Recharts visualization of spending patterns.
 */
export const showSpendingChartSchema = z.object({
  accountId: z
    .string()
    .describe("The account ID to analyze spending for."),
  dateFrom: z
    .string()
    .optional()
    .describe("Start date for the analysis period (ISO 8601)."),
  dateTo: z
    .string()
    .optional()
    .describe("End date for the analysis period (ISO 8601)."),
  groupBy: z
    .enum(["category", "month"])
    .describe(
      "How to group spending: 'category' for a breakdown by spending category, 'month' for a month-over-month trend.",
    ),
});

export type ShowSpendingChartParams = z.infer<
  typeof showSpendingChartSchema
>;
