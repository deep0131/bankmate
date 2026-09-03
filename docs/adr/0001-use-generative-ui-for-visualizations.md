# 1. Use Interactive Widget for Chat Visualizations

Date: 2026-09-02

## Status

Accepted

## Context

Bankmate is a chat-based financial assistant. Customers need to understand complex data like spending trends, transaction histories, and loan comparisons. Relying on an AI model to generate raw HTML, Markdown tables, or SVG charts is highly error-prone, visually inconsistent, and impossible to make truly interactive.

## Decision

We will use the **Vercel AI SDK** and its **Tool Calling (Interactive Widget)** capabilities. 
Instead of the AI model generating the visualization directly, the AI model will output structured JSON to trigger specific tools (e.g., `render_spending_chart`, `render_loan_table`). The Next.js frontend will intercept these tool calls and render pre-built, highly styled React components (built with `shadcn/ui` and Recharts) populated with the AI model's extracted parameters.

## Consequences

*   **Good:** Charts and tables will be perfectly styled, interactive, and completely reliable.
*   **Good:** The AI model's job is simplified to intent recognition and parameter extraction.
*   **Bad:** Requires the setup of React Server Components and AI SDK tool streaming, which introduces more architectural complexity than a standard text-only chat application.