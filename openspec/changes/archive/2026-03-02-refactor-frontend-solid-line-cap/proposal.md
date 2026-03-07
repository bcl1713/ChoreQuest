# Change: Frontend SOLID Refactor and TS Line Length Guard

## Why

- Frontend components mix data access, orchestration, and presentation, making
  reuse and testing difficult and causing regressions when requirements shift.
- SOLID-aligned boundaries and dependency inversion are needed to keep rapidly
  growing UI/feature modules maintainable.
- Oversized TypeScript files (TS/TSX) reduce readability and hide excessive
  responsibility; a hard line-length guard will encourage decomposition.

## What Changes

- Establish feature-first frontend architecture with explicit separation between
  view components, hooks/state, and service interfaces, aligning with SOLID
  principles.
- Introduce dependency inversion patterns for data access and side effects, so
  UI layers depend on interfaces rather than concrete implementations.
- Refactor shared and feature components into cohesive modules with clear
  ownership and composition points (containers vs. presentational primitives).
- Enforce a maximum of 300 lines per `.ts`/`.tsx` file via linting, with
  remediation of over-limit files as part of the refactor.
- Add documentation and guardrails (lint rules, generator/checklist updates) to
  keep new code within the SOLID structure.

## Impact

- Affected specs: `frontend-architecture`
- Affected code: `components/**`, `app/**` client components, `hooks/**`,
  `lib/**` UI-facing services, `eslint.config.mjs`, lint docs/checklists.
