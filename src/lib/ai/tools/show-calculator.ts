import { z } from "zod";

/**
 * Tool: show_calculator
 * Triggers the Interest/EMI Calculator Interactive Widget.
 *
 * Per ADR-0003: The AI only passes initial parameters.
 * The React component handles all math (compounding interest, EMI formula)
 * and slider interactions — never the AI model.
 */
export const showCalculatorSchema = z.object({
  principal: z
    .number()
    .positive()
    .describe(
      "The loan principal amount in INR. Extract from the user's query, e.g., '50 lakh' = 5000000.",
    ),
  annualRate: z
    .number()
    .positive()
    .describe(
      "The annual interest rate as a percentage. Use the bank's product rate if relevant, or the user's specified rate. E.g., 8.5 for 8.5%.",
    ),
  termMonths: z
    .number()
    .int()
    .positive()
    .describe(
      "The loan tenure in months. Convert years to months if needed. E.g., '20 years' = 240.",
    ),
});

export type ShowCalculatorParams = z.infer<typeof showCalculatorSchema>;
