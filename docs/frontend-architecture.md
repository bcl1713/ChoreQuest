# Frontend Architecture & SOLID Guide

## Purpose
Provide a compact guide for applying SOLID principles, dependency inversion, and feature-first boundaries across the frontend, plus guardrails for keeping TypeScript files under 300 lines.

## Current Audit (line-count hot spots)
- 61 `.ts`/`.tsx` files exceed 300 lines today; the longest are generated types (`lib/types/database*.ts`) and legacy contexts/services (`lib/auth-context.tsx`, `lib/recurring-quest-generator.ts`, `lib/quest-instance-service.ts`, `lib/statistics-service.ts`, `lib/realtime-context.tsx`).
- High-visibility UI overages resolved: `components/rewards/reward-manager/index.tsx`, `components/profile/PasswordChangeForm.tsx`, `components/profile/ClassChangeForm.tsx`, and `components/quests/quest-template-manager/template-form.tsx` are now under 300 lines with waivers removed. The dashboard and boss quest panels remain under 300 lines; reward store, guild master manager, family settings, quest create modal, quest card, and statistics panel have been split into containers + presentational parts with waivers removed.
- Tests over 300 lines are temporarily waived but should be decomposed alongside their source files; see eslint config for the explicit waiver list.
- Generated/third-party files: `lib/types/database-generated.ts`, `lib/types/database.ts` stay exempt but should not be edited manually.

## Feature-First Module Map (boundaries)
- Routes/containers: `app/(routes)/**` orchestrate data fetching and state, depending on service interfaces; avoid embedding visual primitives directly.
- Feature modules: `components/<feature>/**` hold containers and presentational pieces for quests, boss battles, admin, rewards, family settings, profile, etc. Keep container files thin; push layout to presentational components.
- Shared primitives: `components/ui/**` (and `components/animations/**` where appropriate) host reusable styling/interaction primitives. Prefer extending via props/composition rather than cloning patterns in features.
- Cross-cutting hooks/services: `hooks/**` for UI-facing state and orchestration; `lib/services/**` for side-effectful APIs (Supabase, realtime, permissions, formatting). Components should import interfaces from `lib/services/**` or hooks, not raw clients.
- Contexts: keep contexts focused (auth, realtime, character). If a component only needs one concern, inject via props/hook instead of pulling the entire context.

## SOLID Checkpoints
- Single Responsibility: each file has one reason to change. Split fetch/orchestration (containers) from rendering (presentational) and from data helpers (lib/services).
- Open/Closed: extend via composition/config (e.g., slot props, render props, wrapper components) instead of modifying internals.
- Liskov: keep prop contracts stable; prefer optional composition over conditional branching inside a base component.
- Interface Segregation: expose narrow service interfaces and hooks per concern (auth, quests, rewards, boss). Avoid catch-all utilities that span unrelated responsibilities.
- Dependency Inversion: UI depends on interfaces; services implement them and are injected via props/hooks/contexts. Avoid importing Supabase clients directly into components.

## Dependency Inversion Patterns (prop-first, optional context)
- Define service interfaces in `lib/services/<feature>-service.ts` and provide concrete implementations plus lightweight fakes for tests.
- Containers resolve the concrete service (default exports) and pass it to presentational components as props. Presentational components stay pure/render-only.
- Use context providers only when multiple descendants in a subtree need the same service instance; default to prop injection for clarity and testability.
- Example extraction:

```ts
// lib/services/quest-service.ts
export interface QuestService {
  list(): Promise<Quest[]>;
  approve(id: string): Promise<void>;
}

export const supabaseQuestService: QuestService = { /* Supabase-backed impl */ };

// hooks/useQuestService.ts
export const useQuestService = () => supabaseQuestService; // swap in tests

// components/quests/quest-dashboard/container.tsx
export function QuestDashboardContainer() {
  const service = useQuestService();
  const quests = useAsync(() => service.list(), [service]);
  return <QuestDashboard quests={quests} onApprove={(id) => service.approve(id)} />;
}
```

## Max-Line Guardrails (300 LOC)
- ESLint enforces `max-lines: 300` for all `.ts`/`.tsx` files (no skipping blank lines/comments). New files must stay under the limit.
- Temporary waivers live in `eslint.config.mjs` and document legacy overages; remove waivers as files are decomposed.
- Decomposition guidelines: extract data loaders to hooks/services, move layout to presentational components, split large forms into sections, and isolate utility helpers.

## Contribution Checklist (apply per PR)
- Module location follows feature-first map; shared patterns live in `components/ui`.
- Containers own data fetching/side effects and inject services; presentational components render only.
- Services expose interfaces; components do not import Supabase clients directly.
- TypeScript files under 300 lines (or explicitly waived with an exit plan).
- Tests mirror the decomposition: smaller, focused suites aligned to the new boundaries.
