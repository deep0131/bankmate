# 5. Mobile-First Chat UI Layout

Date: 2026-08-05

## Status

Accepted

## Context

We need to decide the primary layout for the application demo. While a traditional desktop dashboard with a sidecar chat was considered, it violates modern "Gen-Z" mobile-first design principles and would perform poorly if judges tested the application on their phones.

## Decision

The application will be a mobile-first, full-screen chat interface. To establish context (so it feels like a banking app rather than just ChatGPT), the chat will load with pre-populated messages. For example, upon loading, the AI will immediately present a welcome summary, current balance, and an initial visualization (like a monthly spending breakdown) before the user even types anything.

## Consequences

*   **Good:** Highly responsive. Looks like a modern native mobile app (e.g., CashApp, Cleo).
*   **Good:** Reduces UI complexity by unifying all interactions (data viewing and querying) into a single feed.
*   **Bad:** Requires careful design of the chat bubbles to ensure charts render clearly on narrow mobile screens.
