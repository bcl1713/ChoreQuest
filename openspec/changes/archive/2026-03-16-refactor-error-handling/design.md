# Design: Refactor Error Handling

## Context

ChoreQuest has ~27 API routes, a dozen data-fetching hooks, and many
form components. Error handling grew organically, producing three
concrete problems:

1. **Brittle status code detection** — routes like
   `app/api/quests/[id]/claim/route.ts` match error message strings
   to decide between 400/500, meaning any message wording change
   silently breaks the mapping.
2. **Six UI error display patterns** — manual `notification` state
   objects, `useNotification` hook, `NotificationToast` component,
   `ErrorAlert` component, `AuthErrorHandler`, and
   `ProfileErrorBoundary` all exist in parallel with no clear rule
   for which to use.
3. **Auth helpers only partially adopted** — `api-auth-helpers.ts`
   provides the right pattern (centralized auth + typed errors) but
   only `/api/boss-quests` uses it; all other routes duplicate the
   auth logic manually.

No new packages are introduced. The refactor works within existing
TypeScript, React, and Next.js App Router patterns.

## Goals / Non-Goals

**Goals:**

- Typed errors that carry their HTTP status code, eliminating
  string-matching in route handlers
- Single canonical API error response shape across all routes
- Two and only two UI error patterns (toast and inline) with clear
  rules for which to use
- Root error boundary so unhandled component throws don't crash the
  whole app
- Broad adoption of `api-auth-helpers.ts` across all API routes

**Non-Goals:**

- External error monitoring (Sentry, Datadog) — out of scope for
  this change
- Retry logic or exponential backoff in hooks — separate concern
- Internationalisation of error messages
- Changing the visual design of toasts or alerts

## Decisions

### Decision 1: Typed error class hierarchy in `lib/errors.ts`

Create a base `AppError extends Error` that carries `statusCode` and
`code` (a machine-readable string). Subclasses cover the domain
categories that routes actually need:

```text
AppError (base)
├── AuthError       (401) — unauthenticated
├── ForbiddenError  (403) — authenticated but not authorized
├── NotFoundError   (404)
├── ValidationError (400) — bad input
└── ConflictError   (409) — business rule violation
    (e.g. "hero already has active quest")
```

**Why not plain error codes on `Error`?** TypeScript `instanceof`
checks on subclasses make route handlers exhaustive without string
comparisons, and editors auto-complete the subclass names.

**Why not a union type / discriminated union?** Error boundaries and
catch blocks require thrown values; class hierarchy works naturally
with `throw` / `catch` and `instanceof`.

**Alternative considered:** A single `AppError` with a `type` enum
field. Rejected — instanceof on subclasses is simpler and avoids
switching on an enum string in catch blocks.

### Decision 2: Route handlers catch `AppError` and derive status

Each route handler gets a shared `handleRouteError` helper:

```typescript
// lib/api-error-handler.ts
export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.statusCode }
    );
  }
  console.error(err);
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
```

Services throw typed subclasses; routes call `handleRouteError` in
their catch block. This replaces all string-matching status detection.

**Why a helper function rather than middleware?** Next.js App Router
does not support generic middleware for API routes in the same way
Express does. A shared helper is the idiomatic alternative.

### Decision 3: Standardized API response shape

All error responses: `{ error: string, code: string }` with an
appropriate HTTP status.
All success responses remain as-is (not in scope to change).

The `code` field enables clients to branch on error type without
parsing message strings.

### Decision 4: Consolidate UI error display to two patterns

| Pattern    | When to use                        | Hook/Component    |
| ---------- | ---------------------------------- | ----------------- |
| **Toast**  | Action feedback (save, delete)     | `useNotification` |
| **Inline** | Persistent field/section error     | `ErrorAlert`      |

Components that currently manage their own `notification` state
object are migrated to `useNotification`. The `NotificationToast`
component in `family-settings` is replaced by the existing
`useNotification` hook. No new components are created.

**Why not a single pattern?** Toasts auto-dismiss and are
appropriate for action feedback; inline alerts persist and are
appropriate for load/validation errors. Forcing one pattern for both
creates bad UX.

### Decision 5: Root error boundary in `app/layout.tsx`

A new `components/ErrorBoundary.tsx` (class component, required by
React) wraps the `{children}` in the root layout. It renders a
generic "Something went wrong" fallback with a reload button.

This is distinct from `ProfileErrorBoundary`, which is scoped to
profile settings and can stay.

### Decision 6: Incremental migration, route-by-route

Migrate API routes in batches grouped by feature area (quests,
rewards, users, boss-quests, admin). Each batch is a focused PR.
The UI consolidation and error boundary are a separate PR that can
land independently.

**Why not a single big PR?** The diff would be too large to review
safely. Incremental merges also mean each batch is testable in
isolation.

## Risks / Trade-offs

- **Risk: Missing a route during migration** → Mitigation: add a
  lint rule or test that asserts all route catch blocks call
  `handleRouteError`; alternatively, a post-migration grep audit.
- **Risk: Service classes throw plain `Error` that slips past
  `handleRouteError`** → The helper already handles unknown errors
  with a 500 fallback, so behavior degrades gracefully rather than
  breaking.
- **Trade-off: Class hierarchy over a flat error registry** —
  Subclasses are convenient but adding a new error category requires
  a new file. Acceptable given the small, stable set of HTTP error
  categories in use.
- **Risk: Root error boundary swallows useful errors in dev** →
  Mitigation: boundary only renders fallback UI in production;
  in development it re-throws so React's default overlay still
  appears (`process.env.NODE_ENV !== "production"`).

## Migration Plan

1. **Phase 1 — Foundation** (no behavior change)
   - Add `lib/errors.ts` with error class hierarchy
   - Add `lib/api-error-handler.ts` with `handleRouteError`
   - Add `components/ErrorBoundary.tsx` root boundary
   - Migrate `app/layout.tsx` to wrap children in boundary
   - All existing tests continue to pass

2. **Phase 2 — API routes** (per feature area batch)
   - Quest routes (`/api/quests/**`, `/api/quest-instances/**`,
     `/api/quest-templates/**`)
   - Reward routes (`/api/rewards/**`)
   - User/admin routes (`/api/users/**`, `/api/admin/**`)
   - Boss quest and cron routes
   - For each route: services throw typed errors, handler calls
     `handleRouteError`

3. **Phase 3 — UI consolidation**
   - Migrate components with manual `notification` state to
     `useNotification`
   - Remove `NotificationToast` usages in favor of hook
   - Update any component using raw `ErrorAlert` imports to
     ensure they come from the canonical path

**Rollback:** Each phase is a separate PR. Rolling back means
reverting that PR; earlier phases are fully independent.

## Open Questions

- Should `ValidationError` include a `fields` map for Zod errors
  (enabling per-field error display), or keep it flat for now?
  Current lean: keep flat and revisit if a form needs field-level
  API errors.
- Should cron routes (`/api/cron/**`) also use `handleRouteError`,
  or is a simpler try/catch appropriate given they respond to an
  internal scheduler? Current lean: yes, for consistency.
