# 3. Static JSON Mock Data Layer (Locked)

Date: 2026-09-04

## Status

Superseded / Resolved — JSON is locked.

## Decision

Per project directive, we lock static JSON files as the sole mock data format. The previous TypeScript (`.ts`) module proposal (`0003-typescript-mock-data-layer.md`) is superseded by this decision. All mock `mock Customer profiles`, `Accounts`, and `Transactions` must reside in `.json` files (e.g., `src/data/customers.json`).

## Consequences

*   Zero database setup.
*   Consistent with `SPEC.md` Data Strategy.
*   Type safety handled via TypeScript interfaces imported over the JSON structures, not via `.ts` data exports.
