# Tasks: Login Error Feedback

## 1. Fix Auth Action

- [x] 1.1 Add catch block to `loginUser` in `lib/auth/auth-actions.ts`
      that calls `setError(message)` and re-throws, matching the pattern
      used by `registerUser` in the same file

## 2. Tests

- [x] 2.1 Add unit test for `loginUser` error path — verify that when
      `signInWithPassword` rejects, `setError` is called with the error
      message
- [x] 2.2 Add unit test verifying `loginUser` re-throws after calling
      `setError`, so callers can handle the rejection
- [x] 2.3 Verify existing `loginUser` success test still passes

## 3. Quality Gate

- [x] 3.1 Run `npm run build` — zero TypeScript errors
- [x] 3.2 Run `npm run lint` — zero lint errors
- [x] 3.3 Run `npm run test` — all tests pass
