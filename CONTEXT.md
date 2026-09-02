# Bankmate Domain Glossary

This document establishes the ubiquitous language for the Bankmate project. Use these terms consistently in code, database schemas, and discussions.

## Core Entities

*   **Customer**: The retail banking client who holds the account and interacts with the application. *Do not use: User.*
*   **Account**: A specific financial repository (e.g., Checking, Savings, Credit Card) held by a Customer. A Customer can have multiple Accounts.
*   **Transaction**: A single financial record representing a movement of funds (either a debit or a credit) associated with a specific Account.
*   **Banking Product**: A mock financial offering (e.g., a specific Home Loan, Credit Card) stored in our static dummy data catalog, used for comparison and recommendations.
*   **Insight**: The text-based analysis, advice, or "roast" produced by the Generative AI model after analyzing a Customer's Transactions.
*   **Persona**: A pre-defined JSON profile of a Customer containing mock Transactions, used to drive the demo without requiring a database.
*   **Generative UI Component**: A dynamic, interactive React component rendered directly inside the chat interface based on an AI tool call (e.g., Transaction Table, Loan Comparison Table, Interactive Calculator).
*   **Generative Chart**: A specific type of Generative UI Component, built using Recharts and shadcn/ui, that visualizes data (e.g., Interest Spent Bar Chart, Category Pie Chart).
*   **Design Tokens**: The CSS variables (`globals.css`) used to enforce the custom "Gen-Z Neobank" visual identity across all components.
*   **Open Banking Aggregator**: A third-party service (like Plaid) that standardizes and provides read-only access to a Customer's data across multiple financial institutions.
*   **PII (Personally Identifiable Information)**: Sensitive Customer data (e.g., account numbers, real names, exact locations) that must be protected.
*   **Sanitization Layer**: A middleware process that strips or masks PII from Transactions before sending them to the external AI model.
