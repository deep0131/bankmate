# 4. PII Sanitization Layer

Date: 2026-09-02

## Status

Accepted

## Context

Bankmate acts as a financial aggregator analyzing Customer transactions. Passing raw banking data to a third-party LLM API (Google Gemini) introduces significant privacy risks, as it could expose Personally Identifiable Information (PII) such as account numbers, real names, or precise merchant locations.

## Decision

We will implement a strict **Sanitization Layer** middleware. Before any `Transaction` data is serialized and included in the LLM's context window, it must pass through a sanitization utility function. This function will explicitly strip or mask sensitive fields, ensuring that only the *semantic* data required for analytical reasoning (e.g., Date, Amount, Category, generalized Vendor Name) crosses the network boundary to the AI provider.

## Consequences

*   **Good:** Directly mitigates the primary security/privacy risk of using Generative AI in fintech.
*   **Good:** Demonstrates strong architectural maturity and ethical considerations for the project.
*   **Bad:** Requires maintaining a utility function and writing rigorous unit tests to ensure no PII accidentally leaks as the data model evolves.