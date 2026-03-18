# Proposal: Login Error Feedback

## Why

When a user enters wrong credentials on the login page, the error thrown
by Supabase is silently discarded. `loginUser` in `auth-actions.ts` has a
`try/finally` block but no `catch`, so `setError` is never called and the
UI shows no feedback. The `AuthForm` and login page already have all the
wiring to display an error; the auth action just needs to set it.

## What Changes

- Add a `catch` block to `loginUser` in `lib/auth/auth-actions.ts` that
  calls `setError(message)` and re-throws, matching the pattern already
  used by `registerUser` and `updatePasswordFlow` in the same file.
- The inline error display in `AuthForm` (already rendered when `error`
  prop is non-null) requires no changes.
- The login page passing `error={error}` from `useAuth()` requires no
  changes.

## Capabilities

### New Capabilities

- `login-error-feedback`: Defines the requirement that login credential
  failures must surface a user-visible error message in the login form.

### Modified Capabilities

None — no existing spec-level requirements are changing; this change
implements behavior that was simply missing.

## Impact

- `lib/auth/auth-actions.ts` — add catch block to `loginUser`
- `lib/auth/__tests__/auth-actions.test.ts` — add coverage for error path
- No API, database, or dependency changes required
