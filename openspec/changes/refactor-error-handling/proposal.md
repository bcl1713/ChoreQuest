# Proposal: Refactor Error Handling

## Why

Error handling across ChoreQuest is inconsistent in three key ways:
API routes use brittle string-matching to determine HTTP status codes,
six distinct error-display patterns exist in the UI with no shared
primitive, and the centralized auth helpers in `api-auth-helpers.ts`
are only used by one route despite being the right pattern. This makes
bugs harder to diagnose and error UX unpredictable.

## What Changes

- Introduce a typed error system (`AppError`, domain-specific
  subclasses) replacing ad-hoc `new Error("message")` throws
- Replace string-matching status code detection in API routes with
  typed error classification
- Expand `api-auth-helpers.ts` adoption to all API routes (currently
  only `/api/boss-quests`)
- Consolidate UI error display to two patterns: `useNotification` hook
  (transient toasts) and `ErrorAlert` component (inline), retiring
  ad-hoc notification state
- Add a root-level React error boundary to `app/layout.tsx` to catch
  unhandled component errors
- Standardize API route error response shape:
  `{ error: string, code: string, status: number }`

## Capabilities

### New Capabilities

- `error-handling-strategy`: Typed error classes, standardized API
  error responses, and a two-pattern UI error display system (toast
  vs. inline) used consistently across all layers

### Modified Capabilities

None — no existing spec-level requirements are changing.

## Impact

- **API routes**: All `app/api/**/*.ts` — adopt typed errors and
  consistent response shape
- **Hooks**: `hooks/useQuests.ts`, `hooks/useRewards.ts`,
  `hooks/useCharacter.ts`, and others — errors flow through
  `useNotification`
- **Components**: Components with manual `notification` state
  (`family-settings.tsx`, profile forms) — migrate to `useNotification`
  or `ErrorAlert`
- **Layout**: `app/layout.tsx` — new error boundary wrapper
- **Lib**: `lib/api-auth-helpers.ts` extended and adopted broadly;
  new `lib/errors.ts` for typed error classes
- **No external dependencies added** — implementation uses existing
  patterns, no new packages required
