# 5. PII Sanitization Middleware

Date: 2026-09-02

## Status

Accepted

## Context

Bankmate provides a chat interface to a bank's internal data. To parse natural language queries, the application must send parts of this internal data (like transaction histories) to an external, third-party AI Model API. Sending raw banking data introduces severe privacy and security risks, potentially exposing mock Customer profilelly Identifiable Information (PII) such as account numbers, real names, or exact locations.

## Decision

We will implement a strict **Sanitization Layer** middleware. Before any internal bank data is serialized into the prompt context for the AI Model, it must pass through a utility function that explicitly strips, masks, or aggregates sensitive fields. Only the semantic data strictly required for the AI to understand the context (e.g., Date, Amount, generic Category) will cross the network boundary.

## Consequences

*   **Good:** Demonstrates strong architectural maturity and ethical considerations regarding data privacy in AI.
*   **Good:** Protects the hypothetical customers from data leaks to third-party AI model providers.
*   **Bad:** Requires writing and maintaining rigorous unit tests for the sanitization utility to ensure the data model does not accidentally leak new sensitive fields over time.