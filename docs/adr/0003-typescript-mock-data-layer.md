# 3. TypeScript Modules for Mock Data Layer

Date: 2026-09-02

## Status

Accepted

## Context

We need to mock a bank's internal relational database (Customers, Accounts, Transactions, Products) to power the demo. While raw `.json` files are easy to create, they lack type safety, cannot store native JavaScript objects (like `Date`), and require manual file-system parsing (`fs.readFileSync`), which can be brittle in serverless deployment environments like Vercel. A full SQL database (like SQLite or Postgres) introduces unnecessary deployment and infrastructure complexity for a read-only conceptual demo.

## Decision

We will mock the bank's internal database using **Static TypeScript (`.ts`) Modules**. 
We will define strictly typed interfaces (e.g., `interface Transaction`) and export constant arrays of mock data directly from these files (e.g., `export const TRANSACTIONS: Transaction[] = [...]`). We can also export helper functions alongside the data (e.g., `getTransactionsByAccountId(id)`).

## Consequences

*   **Good:** Maximum developer impression: full compile-time type safety, instant IDE autocomplete, and native `Date` support.
*   **Good:** Minimal effort: Zero database setup, zero connection pooling, and 100% reliability in serverless edge deployments.
*   **Good:** Easy refactoring. If a field name changes, the TypeScript compiler will immediately flag all affected mock data and UI components.
*   **Bad:** The data is completely read-only and requires a code deployment to change. (Acceptable for this specific project).