# 6. Hardcoded Demo State

Date: 2026-09-02

## Status

Accepted

## Context

Because Bankmate is a conceptual final-year project designed to be demonstrated to a panel or judges, time-to-value during the presentation is critical. Building a complete, secure authentication flow (login screens, session management, JWTs) consumes significant development time and distracts from the core feature: the chat interface.

## Decision

We will bypass authentication entirely. The application will boot directly into a **Hardcoded Demo State**. On application load, the system will automatically assume the identity of a pre-selected mock `Customer` from our static TypeScript data layer. 

## Consequences

*   **Good:** Saves significant development effort, allowing focus to remain entirely on the Interactive Widget and AI integration.
*   **Good:** Ensures a frictionless, zero-setup demonstration experience for the judging panel. 
*   **Bad:** The application is not production-ready from a security standpoint (which is fully acceptable given the project's scope and dummy data).