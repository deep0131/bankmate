/**
 * Banking Product types for the product catalog.
 * Products are the bank's public financial offerings — no PII sensitivity.
 */

/** Categories of banking products. */
export type ProductCategory =
  | "home_loan"
  | "personal_loan"
  | "credit_card"
  | "savings"
  | "fixed_deposit";

/**
 * A financial offering available to Customers.
 * e.g., Home Loan, Credit Card, Savings Account.
 */
export interface BankingProduct {
  id: string;
  name: string;
  category: ProductCategory;
  /** Annual interest rate as a percentage (e.g., 8.5 = 8.5%) */
  interestRate: number;
  /** Minimum amount/credit limit in the product's currency */
  minAmount?: number;
  /** Maximum amount/credit limit in the product's currency */
  maxAmount?: number;
  /** Available terms in months */
  termMonths?: number[];
  /** Key features and benefits */
  features: string[];
  /** Eligibility criteria description */
  eligibility: string;
  /** Annual fees or charges */
  annualFee?: number;
  /** Processing fee as percentage */
  processingFee?: number;
  /** Brief marketing description */
  description: string;
}
