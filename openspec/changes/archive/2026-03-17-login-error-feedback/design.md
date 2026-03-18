# Design: Login Error Feedback

## Context

`loginUser` in `lib/auth/auth-actions.ts` is called by `AuthContext.login`,
which passes `setError` as a callback. Every other auth action in the same
file (`registerUser`, `updatePasswordFlow`) uses a `catch` block to call
`setError(message)` before re-throwing. `loginUser` was written with only
`try/finally`, so Supabase auth errors propagate out without ever updating
the error state.

The `AuthForm` component already renders `props.error` inline when non-null,
and `LoginPage` already passes `error` from `useAuth()` to `AuthForm`. The
full display path exists and works — the only missing piece is populating the
error state in the first place.

## Goals / Non-Goals

**Goals:**

- Ensure login credential failures set `error` in `AuthContext` so the UI
  displays the message.
- Match the established error-handling pattern in `auth-actions.ts`.

**Non-Goals:**

- Changing the error display mechanism (inline vs. toast) — the existing
  inline display in `AuthForm` is sufficient for this fix.
- Modifying `AuthForm`, `LoginPage`, or `AuthContext` — the fix is isolated
  to `loginUser`.
- Internationalizing error messages — Supabase's message is acceptable here.

## Decisions

### Add a catch block to `loginUser` matching `registerUser`

`registerUser` and `updatePasswordFlow` both follow this pattern:

```ts
} catch (err) {
  const message = err instanceof Error ? err.message : 'Login failed';
  setError(message);
  throw err;
}
```

Applying the same pattern to `loginUser` is the minimal, consistent fix.
No structural changes to `AuthContext` or `AuthForm` are needed.

**Alternative considered**: move error handling into `AuthContext.login`
rather than inside `loginUser`. Rejected — it would diverge from the
established pattern where each action owns its own error handling, and
would require more changes across more files.

## Risks / Trade-offs

- Supabase returns a generic message ("Invalid login credentials") that does
  not distinguish wrong email from wrong password. This is intentional from
  a security standpoint and acceptable for this fix.
- No migration plan required — this is an additive behavior change with no
  data or API impact.

## Open Questions

None.
