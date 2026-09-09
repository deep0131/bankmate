import type {
  Account,
  Customer,
  Transaction,
  TransactionFilters,
} from "@/types/customer";
import customersData from "@/data/customers.json";

/**
 * Server-side data access for Customer, Account, and Transaction data.
 * Reads from static JSON per ADR-0002 / ADR-0003 (locked).
 */

const customers = customersData as Customer[];

/** Get a specific customer by ID. */
export function getCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

/**
 * Get the default demo customer.
 * ADR-0006: App boots into hardcoded demo state — no authentication.
 * Default: Priya Sharma (cust_001) — the working professional profile.
 */
export function getDefaultCustomer(): Customer {
  const customer = customers.find((c) => c.id === "cust_001");
  if (!customer) {
    throw new Error("Default demo customer (cust_001) not found in data.");
  }
  return customer;
}

/** Get all available customer profiles (for profile switcher). */
export function getAllCustomers(): Pick<Customer, "id" | "name">[] {
  return customers.map((c) => ({ id: c.id, name: c.name }));
}

/** Get all accounts for a given customer. */
export function getAccountsByCustomerId(customerId: string): Account[] {
  const customer = getCustomerById(customerId);
  return customer?.accounts ?? [];
}

/** Get a specific account by ID across all customers. */
export function getAccountById(accountId: string): Account | undefined {
  for (const customer of customers) {
    const account = customer.accounts.find((a) => a.id === accountId);
    if (account) return account;
  }
  return undefined;
}

/** Get transactions for an account with optional filters. */
export function getTransactions(
  accountId: string,
  filters?: TransactionFilters,
): Transaction[] {
  const account = getAccountById(accountId);
  if (!account) return [];

  let transactions = [...account.transactions];

  if (filters) {
    if (filters.dateFrom) {
      transactions = transactions.filter((t) => t.date >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      transactions = transactions.filter((t) => t.date <= filters.dateTo!);
    }
    if (filters.merchant) {
      const search = filters.merchant.toLowerCase();
      transactions = transactions.filter((t) =>
        t.merchant.toLowerCase().includes(search),
      );
    }
    if (filters.category) {
      transactions = transactions.filter(
        (t) => t.category === filters.category,
      );
    }
    if (filters.type) {
      transactions = transactions.filter((t) => t.type === filters.type);
    }
    if (filters.minAmount !== undefined) {
      transactions = transactions.filter(
        (t) => Math.abs(t.amount) >= filters.minAmount!,
      );
    }
    if (filters.maxAmount !== undefined) {
      transactions = transactions.filter(
        (t) => Math.abs(t.amount) <= filters.maxAmount!,
      );
    }
  }

  // Sort by date descending (most recent first)
  transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return transactions;
}

/** Get all transactions across all accounts for a customer. */
export function getAllTransactionsForCustomer(
  customerId: string,
): Transaction[] {
  const accounts = getAccountsByCustomerId(customerId);
  const allTxns = accounts.flatMap((a) => a.transactions);
  allTxns.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return allTxns;
}
