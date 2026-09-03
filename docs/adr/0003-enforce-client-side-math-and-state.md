# 3. Enforce Client-Side Math and State

Date: 2026-09-02

## Status

Accepted

## Context

The application requires interactive financial widgets, such as an Interest Calculator and sortable/filterable Transaction Tables. Large Language Models are notoriously unreliable at performing deterministic arithmetic (like compounding interest) and incur latency and cost if used to manage simple UI state changes.

## Decision

We establish a strict compute boundary: **The AI model extracts parameters, the Client calculates and renders.**
When rendering a widget, the AI model will only pass initial starting parameters (e.g., `principal: 10000`, `rate: 5.5`) via the tool call. The React Component injected into the chat stream will execute the actual financial math using standard JavaScript. Furthermore, interacting with the widget (dragging a slider, sorting a table column) will rely entirely on client-side React state and will *never* trigger a new prompt to the AI model.

## Consequences

*   **Good:** Financial calculations are 100% accurate and deterministic.
*   **Good:** UI interactions (sorting, filtering, dragging sliders) are instant and feel like a native app.
*   **Good:** Saves API costs and latency by not polling the AI model for simple UI state changes.
*   **Bad:** Requires building slightly thicker, smarter React components rather than relying on the AI model to format every output.