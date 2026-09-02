# Bankmate Specification

## Problem Statement

Navigating traditional net banking applications is often cumbersome. Customers are forced to click through multiple complex menus and layered interfaces just to perform standard tasks like checking balances across different accounts, finding a specific historical transaction, or comparing the bank's loan products. 

## Solution
Bankmate is a read-only, chat-based interface for net banking. Customers interact directly with their bank's internal data through natural language, bypassing traditional menus entirely. The AI responds with text and interactive Generative UI Components (tables, calculators) rendered directly in the chat stream, providing a streamlined, conversational net banking experience.

## User Stories

1. As a Customer, I want to ask for my current account balances, so that I can quickly check my funds without navigating to an account summary page.
2. As a Customer, I want to ask to see my recent transactions for a specific Account (e.g., "Show me my checking transactions"), so that I can review my recent activity.
3. As a Customer, I want to search for a specific transaction by merchant name or amount, so that I can quickly verify a charge without manually paginating through statements.
4. As a Customer, I want to ask for my transactions within a specific date range, so that I can view a conversational "mini-statement" for that period.
5. As a Customer, I want my transaction data presented in a clear, interactive Generative UI table, so that it resembles a standard bank statement.
6. As a Customer, I want to sort my transaction table by date or amount, so that I can easily find the largest or most recent charges.
7. As a Customer, I want to filter my transaction table by transaction type (credit/debit), so that I can isolate deposits or withdrawals.
8. As a Customer, I want to ask about the bank's own financial products (e.g., "What home loans do you offer?"), so that I can discover services without navigating a separate marketing site.
9. As a Customer, I want to see banking products compared side-by-side in a Generative UI table, so that I can easily evaluate interest rates and terms.
10. As a Customer, I want to ask for an interest calculator (e.g., "Calculate mortgage payments for $300k at your current rate"), so that I can run financial scenarios.
11. As a Customer, I want the calculator widget to be interactive, so that I can adjust the principal or term sliders and see the new repayment amount instantly.
12. As a Customer, I want my Personally Identifiable Information (PII) masked before my prompt is sent to the LLM, so that my banking privacy is maintained when using this chat interface.
13. As a Customer, I want to use this chat interface comfortably on a mobile device, so that I have a mobile-friendly net banking alternative.
14. As a Customer, I want the AI to ask for clarification if I request something ambiguous (e.g., "Show my balance" when I have three accounts), so that I get the exact information I need.
15. As a Customer, I want to scroll up to see previous tables or calculators in my chat history, so that I don't lose my context if I ask a follow-up question.

## Implementation Decisions

- **Core Identity:** Bankmate is a first-party chat interface to a single bank's data. It is *not* a third-party aggregator or a proactive "expense tracker." 
- **Architecture Framework:** Built using Next.js (App Router) for React Server Components.
- **AI Integration:** Vercel AI SDK with Google Gemini (`@ai-sdk/google`) to manage the conversational state and Generative UI tool calling.
- **UI and Styling:** Tailwind CSS and `shadcn/ui`. The interface is a full-screen, mobile-first chat feed.
- **Data Strategy:** The application relies on static JSON files to mock a standard internal bank database. This consists of `Customers`, their associated `Accounts`, and the `Transactions` within those accounts. A separate JSON file mocks the bank's internal `Banking Product` catalog.
- **Compute Boundaries (LLM vs Client):** The LLM is used strictly as a natural language router. It parses intent and extracts parameters (e.g., dates, loan amounts). The React UI components injected into the chat handle all deterministic math (calculators) and local state manipulation (sorting tables).
- **Privacy Enforcement:** Because we are using an external LLM (Gemini) to parse natural language, a strict Sanitization Layer middleware will intercept and strip PII from the bank's internal data before it is included in the LLM context.

## Testing Decisions

- **Testing Philosophy:** Tests will validate the external, observable behavior of the chat interface.
- **Seam 1 (Highest): End-to-End (E2E) UI Testing.** Playwright will drive the Next.js app in a browser. We will mock the Vercel AI SDK network boundary to return deterministic tool calls. The tests will simulate conversational net banking queries (e.g., "Show my accounts") and assert that the correct Generative UI Components render in the DOM and respond to client-side clicks.
- **Seam 2 (Critical Logic): Sanitization Layer Testing.** Focused unit tests (Jest/Vitest) will target the PII sanitization utility to ensure internal bank data is scrubbed of PII before crossing the network boundary to the AI provider.

## Out of Scope

- **Action Execution:** Bankmate is strictly a read-only chat interface. Executing write actions (transferring money, paying bills) is explicitly out of scope.
- **Third-Party Aggregation:** Connecting to other institutions or Open Banking APIs (like Plaid). The app only views its own bank's data.
- **Persistent Backend:** Storing chat histories or new transactions in a live database.
- **LLM Arithmetic:** Relying on the LLM to calculate interest or sum transaction totals within its text output.

## Further Notes

- *Triage Label:* `ready-for-agent`
- The core mental model is: "A terminal interface for a bank, but using natural language instead of bash commands."