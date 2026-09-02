# 4. Use Shadcn UI and Recharts for Visual Identity

Date: 2026-08-05

## Status

Accepted

## Context

The application requires a highly customized, modern "Gen-Z Neobank" aesthetic (dark mode, neon accents) to impress the judging panel. Furthermore, the AI must be able to dynamically generate complex data visualizations based on natural language queries.

## Decision

We will use **shadcn/ui** as the foundational component library. We will heavily customize its CSS variable design tokens to achieve the desired brand identity. For the Generative UI visualizations, we will utilize the `Chart` component provided by shadcn (which is a wrapper around **Recharts**).

## Consequences

*   **Good:** Shadcn's design token system allows for rapid, sweeping changes to the visual theme via CSS variables without rewriting component logic.
*   **Good:** The native Recharts integration provides a unified aesthetic for both the static app and the dynamically generated AI charts.
*   **Bad:** Requires upfront configuration of CSS variables and copying over raw component files, which slightly pollutes the codebase compared to an npm package, but offers ultimate control.
