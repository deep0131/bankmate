/**
 * Core domain types for Bankmate.
 * Follows the ubiquitous language defined in CONTEXT.md.
 * Fields marked with `@pii` must be sanitized before AI model context.
 */

/** A physical or mailing address. @pii — stripped entirely before AI. */
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * The retail banking client who holds accounts and interacts with the app.
 * CONTEXT.md: "Do not use: User."
 */
export interface Customer {
  id: string;
  /** @pii — replaced with a token (e.g., "Customer-1") before AI. */
  name: string;
  /** @pii — stripped entirely before AI. */
  email: string;
  /** @pii — stripped entirely before AI. */
  phone: string;
  /** @pii — stripped entirely before AI. */
  dateOfBirth: string;
  /** @pii — stripped entirely before AI. */
  address: Address;
  accounts: Account[];
  createdAt: string;
}

/** Account types supported by the bank. */
export type AccountType = "checking" | "savings" | "credit_card";

/**
 * A specific financial repository held by a Customer.
 * A Customer can have multiple Accounts.
 */
export interface Account {
  id: string;
  customerId: string;
  type: AccountType;
  /** Display name, e.g., "Primary Checking" */
  name: string;
  /** @pii — masked to last 4 digits (e.g., "****1234") before AI. */
  accountNumber: string;
  balance: number;
  currency: string;
  transactions: Transaction[];
}

/** Transaction direction. */
export type TransactionType = "credit" | "debit";

/** Spending categories for transactions. */
export type TransactionCategory =
  | "Groceries"
  | "Entertainment"
  | "Dining"
  | "Transportation"
  | "Shopping"
  | "Utilities"
  | "Healthcare"
  | "Education"
  | "Travel"
  | "Rent"
  | "Salary"
  | "Transfer"
  | "Investment"
  | "Insurance"
  | "Subscription"
  | "Other";

/**
 * A single financial record representing a movement of funds.
 * Associated with a specific Account.
 */
export interface Transaction {
  id: string;
  accountId: string;
  /** ISO 8601 date string */
  date: string;
  description: string;
  merchant: string;
  category: TransactionCategory;
  /** Positive = credit, negative = debit */
  amount: number;
  type: TransactionType;
  /** @pii — generalized to city-level before AI (e.g., "Mumbai" not "123 MG Road, Andheri"). */
  location?: string;
}

/** Filters for querying transactions. */
export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  merchant?: string;
  category?: TransactionCategory;
  type?: TransactionType;
  minAmount?: number;
  maxAmount?: number;
}
