# 2. Use Static JSON mock Customer profiles for Data Storage

Date: 2026-08-05

## Status

Accepted

## Context

This is a final year university project intended to demonstrate AI capabilities in a banking context to a panel of judges. The focus is on the frontend experience and AI integration, not backend infrastructure. Managing a relational database (PostgreSQL/SQLite) with schemas, migrations, and ORMs introduces unnecessary complexity and risk of failure during the demo.

## Decision

We will use static JSON files to mock `mock Customer profiles` and their `Transactions`. We will pre-generate 3-4 distinct financial profiles (e.g., "High Spender", "Frugal Student"). The Next.js application will read directly from these JSON files on the server side.

## Consequences

*   **Good:** Zero infrastructure setup. No database provisioning.
*   **Good:** Absolute control over the demo narrative. The AI's responses will be highly predictable because the source data is static and perfectly tailored to showcase the AI's capabilities.
*   **Bad:** The system cannot permanently store *new* transactions added during the session (though we can fake it in memory for the duration of the chat). This is an acceptable tradeoff for a demo.
