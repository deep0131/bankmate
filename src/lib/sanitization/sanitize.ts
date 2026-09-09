import type { Account, Customer, Transaction } from "@/types/customer";

/**
 * PII Sanitization Layer — ADR-0004, ADR-0005, ADR-0007.
 *
 * Strips or masks Personally Identifiable Information before
 * data crosses the network boundary to the AI model provider.
 *
 * Only semantic data required for analytical reasoning is retained:
 * - Dates, amounts, categories, generalized merchant names
 *
 * Everything else (names, emails, account numbers, addresses) is
 * stripped, masked, or replaced with tokens.
 */

/** A Customer with all PII removed. */
export interface SanitizedCustomer {
  id: string;
  /** Token replacement, e.g., "Customer" */
  label: string;
  accounts: SanitizedAccount[];
}

/** An Account with sensitive fields masked. */
export interface SanitizedAccount {
  id: string;
  type: Account["type"];
  name: string;
  /** Masked to last 4 digits: "****1234" */
  accountNumberMasked: string;
  balance: number;
  currency: string;
  transactionCount: number;
}

/** A Transaction with PII removed for AI context. */
export interface SanitizedTransaction {
  id: string;
  accountId: string;
  date: string;
  /** Merchant name (retained — considered non-PII for analysis) */
  merchant: string;
  category: string;
  amount: number;
  type: Transaction["type"];
  /** Generalized to city-level only, or omitted */
  city?: string;
}

/**
 * Mask an account number to show only the last 4 digits.
 * "1234567890123456" → "****3456"
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return `****${accountNumber.slice(-4)}`;
}

/** Generalize a location to city-level only. */
export function generalizeLocation(location?: string): string | undefined {
  if (!location) return undefined;
  // In our mock data, locations are already city-level.
  // In production, this would extract city from a full address.
  return location.split(",")[0].trim();
}

/** Sanitize a single transaction for AI context. */
export function sanitizeTransaction(
  transaction: Transaction,
): SanitizedTransaction {
  return {
    id: transaction.id,
    accountId: transaction.accountId,
    date: transaction.date,
    merchant: transaction.merchant,
    category: transaction.category,
    amount: transaction.amount,
    type: transaction.type,
    city: generalizeLocation(transaction.location),
  };
}

/** Sanitize an account — mask account number, exclude raw transactions. */
export function sanitizeAccount(account: Account): SanitizedAccount {
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    accountNumberMasked: maskAccountNumber(account.accountNumber),
    balance: account.balance,
    currency: account.currency,
    transactionCount: account.transactions.length,
  };
}

/** Sanitize a full customer profile for AI context. */
export function sanitizeCustomer(customer: Customer): SanitizedCustomer {
  return {
    id: customer.id,
    label: "Customer",
    accounts: customer.accounts.map(sanitizeAccount),
  };
}

/**
 * Sanitize an array of transactions for AI context.
 * This is the primary function used when injecting transaction data
 * into the AI model's prompt.
 */
export function sanitizeTransactions(
  transactions: Transaction[],
): SanitizedTransaction[] {
  return transactions.map(sanitizeTransaction);
}

/**
 * Build a complete sanitized context string for the AI model.
 * Strips ALL PII before serialization.
 */
export function buildSanitizedContext(customer: Customer): string {
  const sanitized = sanitizeCustomer(customer);
  const allTransactions = customer.accounts.flatMap((a) =>
    a.transactions.map(sanitizeTransaction),
  );

  return JSON.stringify(
    {
      customer: sanitized,
      recentTransactions: allTransactions.slice(0, 50),
    },
    null,
    2,
  );
}
