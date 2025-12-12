## 1. Foundations

- [x] 1.1 Audit current frontend components/hooks to catalog
      single-responsibility and dependency violations.
- [x] 1.2 Define feature-first module map (domains, pages, shared primitives)
      with ownership guidelines and SOLID checkpoints.

## 2. Architecture and Tooling

- [x] 2.1 Add architecture guide/checklist outlining SOLID application,
      dependency inversion boundaries, and container vs. presentational roles.
- [x] 2.2 Update linting/configuration to enforce a 300-line maximum for
      `.ts`/`.tsx` files and add CI coverage.
- [x] 2.3 Provide codemod or documented patterns to migrate
      data-fetching/side-effects into hooks/services with interface-driven
      dependencies.
- [x] 2.4 Remediate existing lint errors surfaced by the new guardrails
      (no-explicit-any, react-hooks/exhaustive-deps, ban-ts-comment, etc.) or
      document justified waivers.

## 3. Refactor Execution

- [x] 3.1 Refactor shared primitives and utilities to align with single
      responsibility and open/closed principles.
- [x] 3.2 Refactor page/feature components to use container + presentational
      split and injected services (dependency inversion).
- [x] 3.3 Extract reusable hooks/services for cross-cutting concerns
      (auth/session, realtime, formatting) and remove duplicate logic.
- [x] 3.4 Break down oversized TS/TSX files to satisfy the 300-line cap without
      regressing behavior.

## 4. Verification

- [x] 4.1 Update or add tests for refactored components/hooks; ensure behavior
      parity.
- [x] 4.2 Run `npm run lint`, targeted tests, and walkthroughs for key user
      flows to confirm stability after refactors.
- [x] 4.3 Backfill docs/readme notes on the new structure and guardrails for
      future contributions.

## 5. Waiver Burn-down

- [x] 5.1 Remove entries from `legacyMaxLineWaivers` via refactors until only
      generated `.ts`/`.tsx` artifacts (e.g., Supabase types) exceed 300 lines.
- [x] 5.2 Remove exemptions for `no-explicit-any`, `ban-ts-comment`, and
      `react-hooks/exhaustive-deps` by fixing remaining violations or limiting
      to narrowly scoped, justified ignores.
