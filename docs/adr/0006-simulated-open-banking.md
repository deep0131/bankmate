# 6. Simulated Open Banking Integration (Data Acquisition)

Date: 2026-08-05

## Status

Accepted

## Context

As a third-party financial aggregator, Bankmate requires access to customer data (balances, transactions, cards) across various institutions. Integrating with live Open Banking APIs (like Plaid or Tink) requires extensive regulatory compliance, sandbox approvals, and complex OAuth flows, which exceed the scope and timeframe of a final year university project demo.

## Decision

We will design the system architecture *as if* we are using Plaid, but we will mock the network boundary. 
The application will expect data in a standardized JSON schema (mimicking the Plaid Transactions API). Instead of making an external HTTP request to Plaid, the app will read this JSON from our local `Persona` files. 

## Consequences

*   **Good:** Demonstrates a clear understanding of modern fintech architecture (Open Banking) for the grading panel.
*   **Good:** Keeps the demo perfectly reliable and removes external dependencies that could break during a presentation.
*   **Bad:** The application cannot connect to a judge's actual bank account in real-time.
