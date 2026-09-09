/**
 * Chat and Interactive Widget types.
 * These types bridge the AI SDK tool calls to the React widget components.
 */

/** Names of all Interactive Widgets the AI can invoke. */
export type WidgetType =
  | "show_account_summary"
  | "show_transactions"
  | "compare_products"
  | "show_calculator"
  | "show_spending_chart";

/** Result shape for the account summary tool. */
export interface AccountSummaryResult {
  widget: "show_account_summary";
  customerId: string;
}

/** Result shape for the transaction table tool. */
export interface TransactionTableResult {
  widget: "show_transactions";
  accountId: string;
  dateFrom?: string;
  dateTo?: string;
  merchant?: string;
  category?: string;
  type?: "credit" | "debit";
}

/** Result shape for the product comparison tool. */
export interface ProductComparisonResult {
  widget: "compare_products";
  category: string;
  productIds?: string[];
}

/** Result shape for the interest calculator tool. */
export interface CalculatorResult {
  widget: "show_calculator";
  principal: number;
  annualRate: number;
  termMonths: number;
}

/** Result shape for the spending chart tool. */
export interface SpendingChartResult {
  widget: "show_spending_chart";
  accountId: string;
  dateFrom?: string;
  dateTo?: string;
  groupBy: "category" | "month";
}

/** Union of all possible widget results from AI tool calls. */
export type WidgetResult =
  | AccountSummaryResult
  | TransactionTableResult
  | ProductComparisonResult
  | CalculatorResult
  | SpendingChartResult;
