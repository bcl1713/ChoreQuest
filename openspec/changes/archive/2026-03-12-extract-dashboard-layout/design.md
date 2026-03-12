# Design: Extract Dashboard Layout

## Context

Three authenticated pages (dashboard, profile, admin) each
render their own page shell: gradient background, header
with guild/character info, and a content area. The
dashboard page already extracts its header into
`DashboardHeader`, but profile and admin duplicate the
header inline with slight variations (different action
buttons, admin shows a Crown icon title).

The existing component hierarchy is:

- `DashboardContent` (container, data fetching)
  - `DashboardLayout` (dashboard-specific orchestration)
    - `DashboardHeader` (presentational header)
- `app/profile/page.tsx` (inline header, ~70 lines)
- `app/admin/page.tsx` (inline header, ~20 lines)

## Goals / Non-Goals

**Goals:**

- Single source of truth for the authenticated page
  shell (background + header + content area)
- Profile and admin pages reuse `DashboardHeader`
  instead of duplicating header markup
- Remove duplicated `getRoleDisplay`/`getClassDisplay`
  from profile page (already exists in `display-maps.ts`)
- Keep each page's unique action buttons configurable

**Non-Goals:**

- Refactoring `DashboardLayout` internals (tabs, stats,
  modals) — those are dashboard-specific concerns
- Adding auth/redirect logic to the shell — pages
  handle their own auth guards
- Moving clock state management into the shell — the
  clock timer stays in the consuming page/container

## Decisions

### 1. Create `AuthenticatedPageShell` in `components/layout/`

A thin wrapper that renders the gradient background,
`DashboardHeader`, and a content slot (`children`).

**Why not extend `DashboardLayout`?** DashboardLayout
is tightly coupled to dashboard concerns (tabs, stats,
quests, modals, 20+ props). The shell is a simpler
abstraction — just background + header + content area.

**Why not a Next.js layout route?** The three pages
have different auth guards and loading states that run
before the shell renders. A route-level layout can't
conditionally render based on per-page auth logic
without pulling all auth concerns into the layout.

### 2. Make `DashboardHeader` accept custom action buttons

Currently `DashboardHeader` hardcodes dashboard-specific
buttons (Admin, Create Quest, Profile, Logout). Instead
of creating header variants, accept an `actions` render
prop or `ReactNode` slot so each page provides its own
buttons.

**Alternative considered:** Multiple header variants
(`DashboardHeader`, `ProfileHeader`, `AdminHeader`).
Rejected because the header layout (title, guild info,
time, character info) is identical — only the action
buttons differ. A slot avoids N variants.

**Alternative considered:** A `variant` prop with
switch-case logic. Rejected because it couples the
header to knowledge of every page that uses it, and
requires header changes when adding new pages.

### 3. Admin page gets a different title section

The admin header shows "Admin Dashboard" with a Crown
icon instead of "ChoreQuest". Rather than adding title
customization to `DashboardHeader`, the admin page can
pass `title` and `titleIcon` props to the shell, which
forwards them to the header.

**Props to add to `DashboardHeader`:**

- `actions: ReactNode` — replaces hardcoded buttons
- `title?: string` — defaults to "ChoreQuest"
- `titleIcon?: ReactNode` — optional icon before title

**Props to remove from `DashboardHeader`:**

- `onCreateQuest`, `onProfile`, `onAdmin`, `onLogout`
  (replaced by `actions` slot)

### 4. `AuthenticatedPageShell` props

```typescript
type AuthenticatedPageShellProps = {
  children: ReactNode;
  character: Character;
  family: Family | null;
  profile: UserProfile | null;
  currentTime: Date;
  actions: ReactNode;
  title?: string;
  titleIcon?: ReactNode;
};
```

This keeps the shell purely presentational — no data
fetching, no auth, no side effects.

## Risks / Trade-offs

- **DashboardHeader API is a breaking change** — All
  current consumers (`DashboardLayout`) must update to
  pass `actions` instead of individual callbacks. Since
  there's only one consumer today, this is low risk.
  Mitigation: update `DashboardLayout` in the same PR.

- **Admin header diverges more in the future** — If
  admin needs a substantially different header layout
  (not just different title/buttons), the shell
  abstraction may not fit. Mitigation: the shell is
  thin enough to bypass — admin could render its own
  layout without much duplication.
