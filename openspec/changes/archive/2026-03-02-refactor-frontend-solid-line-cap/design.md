## Context

Frontend components currently blend data access, orchestration, and presentation
across `app/**`, `components/**`, `hooks/**`, and `lib/**`. This makes SOLID
adherence uneven, complicates testing/mocking Supabase and realtime
dependencies, and results in large TS/TSX files that hide multiple
responsibilities. A refactor will standardize feature-first modules, clarify
layering, and add guardrails (lint + documentation) to keep boundaries intact.

## Goals / Non-Goals

- Goals: enforce SOLID-aligned component structure; introduce dependency
  inversion for data/side-effects; define container vs. presentational roles;
  cap TS/TSX files at 300 lines; document patterns and lint checks to keep the
  structure healthy.
- Non-Goals: change product behavior or UX; rewrite API contracts; migrate away
  from existing libraries (Next.js, Supabase, Headless UI, Tailwind); introduce
  a new state management library.

## Decisions

- Decision: Adopt feature-first modules with explicit public entrypoints
  (`app/(routes)`, `components/<feature>/index.ts`, `hooks/<feature>/index.ts`)
  and shared primitives under `components/ui` to promote single responsibility
  and open/closed extensions.
- Decision: Separate containers (data fetching/coordination) from presentational
  components; containers depend on interfaces exported from `lib/services/**`
  and inject results via props, supporting dependency inversion and easier
  mocking.
- Decision: Centralize cross-cutting hooks/services (auth/session, realtime
  subscriptions, formatting, permissions) under `hooks/` and `lib/services/`
  with interface contracts to prevent feature modules from reimplementing side
  effects.
- Decision: Enforce 300-line maximum for `.ts`/`.tsx` files via ESLint
  (`max-lines`) with overrides only when explicitly justified; refactor
  over-limit files by extracting components/hooks.
- Decision: Add an architecture checklist in docs (and PR template note)
  covering SOLID checkpoints, allowed dependencies between layers, and size
  guardrails to keep contributions aligned.

## Risks / Trade-offs

- Risk: Large refactors can introduce regressions; mitigation: incremental
  module-by-module refactors with targeted tests and feature walkthroughs.
- Risk: New interfaces may add boilerplate; mitigation: provide
  templates/examples and keep interfaces slim around existing Supabase/client
  patterns.
- Risk: Max-line guard could split cohesive files; mitigation: allow rare,
  documented exceptions with reviewer approval and prioritize meaningful
  boundaries over arbitrary splits.

## Migration Plan

- Inventory and group components/hooks by feature; define desired module
  boundaries.
- Introduce lint rule and docs/checklists before refactoring to catch
  regressions early.
- Refactor shared primitives, then feature containers/presentational components,
  extracting services/hooks as interfaces.
- Validate with lint/tests and manual flows; document updated structure.

## Open Questions (resolved)

- DI approach: proceed with prop-based service injection; use lightweight
  context providers only where a feature benefits from shared service instances
  (no full DI layer).
- Prioritization: no high-churn features were flagged; start with stable areas
  while steadily decomposing legacy long files.
