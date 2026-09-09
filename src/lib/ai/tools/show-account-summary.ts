import { z } from "zod";

/**
 * Tool: show_account_summary
 * Triggers the Account Summary Interactive Widget.
 * Shows all customer accounts with their balances.
 */
export const showAccountSummarySchema = z.object({
  customerId: z
    .string()
    .describe(
      "The ID of the customer whose accounts to display. Use the customer ID from context.",
    ),
});

export type ShowAccountSummaryParams = z.infer<
  typeof showAccountSummarySchema
>;
