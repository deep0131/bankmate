# 4. Client-Side Computation for Financial Math

Date: 2026-09-02

## Status

Accepted

## Context

Customers will use Bankmate to perform financial calculations, such as estimating mortgage repayments or sorting their transaction history. AI Models, by their autoregressive nature, are prone to hallucination and are fundamentally unreliable at performing deterministic arithmetic (like compounding interest formulas).

## Decision

We establish a strict compute boundary: **The AI Model extracts parameters; the Client computes the math.**
When the AI triggers a tool (e.g., `render_loan_calculator`), it will only pass the raw extracted parameters from the user's prompt (e.g., `principal: 300000`, `rate: 5.5`). The injected React Component will execute the actual financial math using standard JavaScript. Furthermore, interacting with the widget (e.g., dragging a slider or sorting a table) will rely entirely on client-side React state and will *never* trigger a new network request to the AI Model.

## Consequences

*   **Good:** Financial calculations are 100% accurate, deterministic, and trustworthy.
*   **Good:** UI interactions are instant, mimicking a high-quality native application.
*   **Good:** Significantly reduces API costs and latency by not relying on the AI for simple state changes.