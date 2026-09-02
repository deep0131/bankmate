# 1. Use Generative UI for Chat Visualizations

Date: 2026-09-02

## Status

Accepted

## Context

Bankmate is a chat-based financial assistant. Customers need to understand complex data like spending trends, transaction histories, and loan comparisons. Relying on an LLM to generate raw HTML, Markdown tables, or SVG charts is highly error-prone, visually inconsistent, and impossible to make truly interactive.

## Decision

We will use the **Vercel AI SDK** and its **Tool Calling (Generative UI)** capabilities. 
Instead of the LLM generating the visualization directly, the LLM will output structured JSON to trigger specific tools (e.g., `render_spending_chart`, `render_loan_table`). The Next.js frontend will intercept these tool calls and render pre-built, highly styled React components (built with `shadcn/ui` and Recharts) populated with the LLM's extracted parameters.

## Consequences

*   **Good:** Charts and tables will be perfectly styled, interactive, and completely reliable.
*   **Good:** The LLM's job is simplified to intent recognition and parameter extraction.
*   **Bad:** Requires the setup of React Server Components and AI SDK tool streaming, which introduces more architectural complexity than a standard text-only chat application.