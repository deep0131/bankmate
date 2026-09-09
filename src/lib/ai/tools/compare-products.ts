import { z } from "zod";

/**
 * Tool: compare_products
 * Triggers the Product Comparison Interactive Widget.
 * Shows a side-by-side comparison of banking products.
 */
export const compareProductsSchema = z.object({
  category: z
    .enum([
      "home_loan",
      "personal_loan",
      "credit_card",
      "savings",
      "fixed_deposit",
    ])
    .describe(
      "The product category to compare. Must be one of: home_loan, personal_loan, credit_card, savings, fixed_deposit.",
    ),
  productIds: z
    .array(z.string())
    .optional()
    .describe(
      "Optional specific product IDs to compare. If omitted, all products in the category are shown.",
    ),
});

export type CompareProductsParams = z.infer<typeof compareProductsSchema>;
