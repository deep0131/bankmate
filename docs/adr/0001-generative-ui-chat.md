# 1. Use Interactive Widget (Vercel AI SDK) for Chat Visualizations

Date: 2026-08-05

## Status

Accepted

## Context

We are building a chat-based AI financial assistant. The user requirement states: "ai can create data visualizations and answer questions from the data." 
Having an AI model generate raw SVG or HTML charts is highly error-prone, insecure, and visually inconsistent. We need a reliable way to render modern, interactive charts (e.g., Recharts) inside a chat stream based on natural language queries.

## Decision

We will use the **Vercel AI SDK** with its **Tool Calling (Interactive Widget)** capabilities. 
Instead of the AI model generating the chart directly, the AI model will output structured JSON (e.g., triggering a `render_spending_chart` tool with specific data points). The Next.js frontend will intercept this tool call and render a pre-built React component (shadcn/ui charts) populated with the AI model's data.

## Consequences

*   **Good:** Charts will be perfectly styled, interactive, and completely reliable.
*   **Good:** The AI model's job is simplified to just filtering/grouping the JSON transaction data and passing it to the tool.
*   **Bad:** Requires setting up React Server Components and Vercel AI SDK, which is slightly more complex than a standard text-only chat integration.
