# 2. Use Static JSON for Mock Internal Bank Data

Date: 2026-09-02

## Status

Accepted

## Context

Bankmate is a conceptual demo of a chat-based net banking interface. We need to provide realistic banking data to demonstrate the conversational UI. However, building and maintaining a full relational database (PostgreSQL/SQLite) with schemas, migrations, and ORMs to represent a bank's internal systems introduces unnecessary infrastructure complexity and slows down frontend development. 

Furthermore, this application represents a *single* bank's interface. We do not need to model complex third-party Open Banking integrations, institution routing, or aggregator APIs.

## Decision

We will completely mock the bank's internal database using static JSON files. 
We will define mock `Customers`. Each `Customer` will contain multiple `Accounts` (e.g., Checking, Savings), which in turn contain arrays of mock `Transactions`. A separate static `ProductCatalog` JSON file will hold the bank's mock `Banking Products` (like Home Loans or Credit Cards) so the chat interface can answer questions about the bank's offerings.

## Consequences

*   **Good:** Zero infrastructure setup and zero database maintenance.
*   **Good:** Absolute control over the demo narrative, ensuring the data perfectly matches the queries we want to showcase.
*   **Good:** Accurately reflects the data topology of a single, closed-ecosystem bank rather than an aggregator.
*   **Bad:** The system cannot permanently store *new* data or state changes beyond the current browser session. This is an acceptable tradeoff for a read-only demo of the chat interface.