# 7. AI Data Privacy and Sanitization Layer

Date: 2026-08-05

## Status

Accepted

## Context

Using external Generative AI models (like Google Gemini) introduces significant privacy risks. Passing raw banking data to a third-party API could expose Personally Identifiable Information (PII) and violate financial data regulations.

## Decision

We will implement a two-pronged privacy architecture:
1.  **Sanitization Layer (Data Masking):** Before any transaction data is serialized into the LLM prompt, it passes through a sanitization utility. This utility strips account numbers, physical addresses, and masks exact names. Only the *semantic* data required for analysis (Category, Amount, Date, Vendor Name) is sent to the AI.
2.  **Enterprise API Usage:** We stipulate the use of enterprise-tier API endpoints (e.g., Google Cloud Vertex AI / Gemini API) which are governed by Zero Data Retention policies, meaning the provider legally cannot use the payload to train their public models.

## Consequences

*   **Good:** Directly addresses the most common criticism of AI in banking (data leaks).
*   **Good:** Adds significant technical and ethical maturity to the project's architecture.
*   **Bad:** Adds a slight development overhead to ensure the sanitization utility perfectly catches all PII before the API call.
