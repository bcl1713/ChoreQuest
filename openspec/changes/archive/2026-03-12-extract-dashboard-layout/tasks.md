# Tasks: Extract Dashboard Layout

## 1. Refactor DashboardHeader to accept flexible props

- [x] 1.1 Add `actions: ReactNode` prop to
  `DashboardHeader` and render it in place of the
  hardcoded button group
- [x] 1.2 Add optional `title` prop (default
  "ChoreQuest") and `titleIcon` prop to
  `DashboardHeader`
- [x] 1.3 Remove `onCreateQuest`, `onProfile`,
  `onAdmin`, `onLogout` props from `DashboardHeader`
- [x] 1.4 Update `DashboardLayout` to pass action
  buttons as an `actions` ReactNode to `DashboardHeader`
  instead of individual callbacks
- [x] 1.5 Update existing `DashboardHeader` tests to
  reflect the new props API

## 2. Create AuthenticatedPageShell component

- [x] 2.1 Create
  `components/layout/authenticated-page-shell.tsx` that
  renders the gradient background, `DashboardHeader`,
  and children in a `<main>` element
- [x] 2.2 Write tests for `AuthenticatedPageShell`
  covering default title, custom title, title icon,
  family display, character info, actions slot, and
  responsive layout

## 3. Migrate profile page

- [x] 3.1 Replace inline header in
  `app/profile/page.tsx` with `AuthenticatedPageShell`,
  passing Back to Dashboard and Logout as `actions`
- [x] 3.2 Remove duplicated `getRoleDisplay` and
  `getClassDisplay` functions from profile page (already
  in `display-maps.ts`)
- [x] 3.3 Remove local `currentTime` state and clock
  `useEffect` from profile page — pass clock from
  `AuthenticatedPageShell` or keep in page and pass
  as prop
- [x] 3.4 Verify existing profile page tests still pass

## 4. Migrate admin page

- [x] 4.1 Replace inline header in `app/admin/page.tsx`
  with `AuthenticatedPageShell`, passing
  `title="Admin Dashboard"`, `titleIcon={<Crown />}`,
  and Back to Dashboard as `actions`
- [x] 4.2 Verify existing admin page tests still pass

## 5. Final verification

- [x] 5.1 Run full quality gate
  (`npm run build && npm run lint && npm run test`)
- [x] 5.2 Visually verify dashboard, profile, and admin
  pages render correctly with consistent headers
