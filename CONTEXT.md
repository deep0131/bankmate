# Bankmate Domain Glossary

This document establishes the ubiquitous language for the Bankmate project. Use these terms consistently in code, database schemas, and discussions.

## Core Entities

*   **Customer**: The retail banking client who holds the account and interacts with the application. *Do not use: User.*
*   **Account**: A specific financial repository (e.g., Checking, Savings, Credit Card) held by a Customer. A Customer can have multiple Accounts.
*   **Transaction**: A single financial record representing a movement of funds (either a debit or a credit) associated with a specific Account.
*   **Banking Product**: A financial offering (e.g., Home Loan, Credit Card) available to Customers.
*   **Interactive Widget**: A dynamic, interactive element rendered inside the chat interface (e.g., Transaction Table, Loan Comparison, Calculator, Chart).
*   **Chat Message**: A conversational turn in the interface, containing text or an interactive widget.
*   **PII (Personally Identifiable Information)**: Sensitive Customer data (e.g., account numbers, real names, exact locations) that must be protected.
*   **Sanitization Layer**: A middleware process that strips or masks PII from Transactions before cross-boundary transmission.
