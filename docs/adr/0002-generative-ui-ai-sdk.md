# 2. Generative UI for Chat Visualizations

Date: 2026-09-02

## Status

Accepted

## Context

Bankmate is a chat-based alternative to traditional net banking. When a customer asks to see their transactions or compare loan products, returning plain text or markdown tables is insufficient for a modern banking experience. We need to render interactive, styled widgets directly within the conversational feed.

## Decision

We will use the **Vercel AI SDK** to power the chat state and its **Tool Calling (Generative UI)** capabilities to render interface elements. 
Instead of the AI Model attempting to format data visually, it will output structured JSON triggering specific tools (e.g., `render_transaction_table`). The Next.js frontend will intercept these tool calls and dynamically render the corresponding React components.

## Consequences

*   **Good:** Visualizations (tables, charts, calculators) are perfectly styled, interactive, and completely reliable because they are standard React components.
*   **Good:** It enforces a clean separation of concerns: the AI Model handles natural language understanding, and the application handles UI rendering.
*   **Bad:** Requires mapping every possible visual response to a strongly typed tool schema, increasing initial boilerplate.