# Design: Raise Auth & Dashboard Test Coverage

## Context

ChoreQuest has strong test coverage for hooks, services,
and utilities, but critical user-facing paths are undertested.
The AuthForm component (login/register/create-family) has
zero tests. The main dashboard component is untested.
81% of API routes (21/26) lack meaningful coverage. The
0.7.0 release needs confidence in these high-risk areas.

Existing test infrastructure uses Jest with React Testing
Library for components and hooks, and direct handler
invocation for API route tests. Supabase calls are mocked
at the module level.

## Goals / Non-Goals

**Goals:**

- Cover AuthForm component rendering, validation, and
  submission for all three form types
- Cover auth action functions including the untested
  `registerUser` edge cases and `updatePasswordFlow`
- Cover DashboardContent/AdminDashboard tab rendering
  and `useQuestTemplates` hook lifecycle
- Cover the quest-instances API route group (5 endpoints:
  approve, assign, deny, release, delete)
- Raise file-level coverage materially in selected files

**Non-Goals:**

- Full application coverage
- Playwright/E2E tests (separate concern)
- Refactoring production code for testability
- Coverage for all 26 API routes
- Coverage thresholds or ratcheting (future issue)

## Decisions

### Test file placement follows existing conventions

Test files colocate with source when possible (e.g.
`components/auth/AuthForm.test.tsx`) or use the
`tests/unit/app/api/` directory for API route tests. This
matches the existing project structure.

**Alternative considered:** Centralizing all tests under
`tests/`. Rejected because the project already uses mixed
placement and consistency within each area matters more.

### Mock Supabase at the module level

All tests mock `@/lib/supabase` and auth helpers rather
than hitting a real database. This is consistent with
existing test patterns in the project.

**Alternative considered:** Integration tests with a test
database. Rejected as out of scope for this change and
inconsistent with the existing test approach.

### API route tests invoke handlers directly

API route tests import the exported handler function
(e.g. `POST`, `DELETE`) and call it with constructed
`Request` objects and route params. This matches the
pattern in existing API route tests like
`boss-quests-complete.test.ts`.

**Alternative considered:** Supertest or similar HTTP
test runner. Rejected because Next.js route handlers
are plain functions and direct invocation is simpler.

### AuthForm tests use React Testing Library

Component tests render with RTL, simulate user
interactions via `userEvent`, and assert on DOM state
and callback invocations. This matches the project's
existing component test approach.

## Risks / Trade-offs

- **[Risk] Mocking fidelity**: Mocked Supabase calls
  may diverge from actual API behavior.
  Mitigation: Keep mocks minimal and match real
  response shapes from Supabase types.

- **[Risk] Test maintenance burden**: Adding ~60-80 new
  test cases increases maintenance surface.
  Mitigation: Keep tests focused on behavior, not
  implementation details. Avoid testing internal state.

- **[Trade-off] Breadth vs depth**: Covering 3 areas
  with moderate depth rather than 1 area exhaustively.
  This matches the issue's intent of raising confidence
  across high-risk hotspots.
