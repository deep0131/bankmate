# 3. Use Google Gemini via Vercel AI SDK

Date: 2026-08-05

## Status

Accepted

## Context

We need an LLM provider to power the generative UI tool calling. As this is a final year university project, budget constraints are a primary concern. Furthermore, analyzing transaction histories requires a model capable of handling moderately large context windows efficiently.

## Decision

We will use **Google Gemini (specifically gemini-1.5-flash)** via the `@ai-sdk/google` provider in the Vercel AI SDK. 

## Consequences

*   **Good:** Gemini offers a generous free tier, making it ideal for a student project with zero budget.
*   **Good:** The 1.5 Flash model has a massive context window (up to 1M+ tokens), meaning we can inject the entire JSON transaction history into the prompt without chunking or vector databases.
*   **Bad:** Tool calling syntaxes and quirks can occasionally differ slightly from OpenAI, but the Vercel AI SDK abstracts most of this away.
