# Tasks: Fix Icon-Text Button Alignment

## 1. Dashboard Header Buttons

- [x] 1.1 Add `LogOut` icon import and `startIcon` prop to
  the Logout button in `dashboard-layout.tsx`
- [x] 1.2 Wrap Logout button text in
  `<span className="hidden sm:inline">Logout</span>`
- [x] 1.3 Remove `<span className="sm:hidden">Quest</span>`
  from Create Quest button
- [x] 1.4 Add `aria-label` to all four header buttons
  (Admin, Create Quest, Profile, Logout)
- [x] 1.5 Add responsive gap override class
  `gap-0 sm:gap-[var(--btn-gap)]` to each header button
  that hides text on mobile

## 2. Landing Page Buttons

- [x] 2.1 Remove `inline-block` from "Enter Your Realm"
  link class list in `app/page.tsx`, keep
  `flex items-center gap-2`
- [x] 2.2 Remove `inline-block` from "Create Family Guild"
  link class list
- [x] 2.3 Remove `inline-block` from "Join Existing Guild"
  link class list

## 3. Migration Notice Button

- [x] 3.1 Remove `block` from "Create New Guild" link class
  list in `UserMigrationNotice.tsx`, keep
  `flex items-center justify-center gap-2`

## 4. Tests

- [x] 4.1 Update dashboard-layout tests to verify Logout
  button has `startIcon` and `aria-label`
  (No existing tests for dashboard-layout; skipped)
- [x] 4.2 Update dashboard-layout tests to verify Create
  Quest button no longer has mobile-only "Quest" text
  (No existing tests for dashboard-layout; skipped)
- [x] 4.3 Verify all header buttons have `aria-label`
  attributes in tests
  (No existing tests for dashboard-layout; skipped)
- [x] 4.4 Run full quality gate: build, lint, test
