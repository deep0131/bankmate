# 1. Core Framework: Next.js and React Server Components

Date: 2026-09-02

## Status

Accepted

## Context

Bankmate requires a robust, modern frontend architecture to support a complex chat interface, seamless API routing for AI model communication, and performant UI rendering. We need a framework that allows for rapid development while providing a professional, production-ready feel for the final presentation.

## Decision

We will use **Next.js (App Router)** as the foundational framework, alongside **Tailwind CSS** and **shadcn/ui** for styling and component architecture.

## Consequences

*   **Good:** The App Router seamlessly blends Server Components (for fast initial loads and secure data fetching) with Client Components (for the interactive chat UI).
*   **Good:** `shadcn/ui` combined with Tailwind provides a highly customizable, accessible, and premium "Neobank" aesthetic with minimal CSS bloat.
*   **Bad:** The App Router paradigm has a steeper learning curve regarding server/client boundaries compared to traditional single-page applications.