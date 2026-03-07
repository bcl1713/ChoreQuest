# Design: Fix Icon-Text Button Alignment

## Context

Two distinct icon+text alignment problems exist:

**Problem 1 - Dashboard header buttons** (lines 120-159 of
`dashboard-layout.tsx`): Four buttons with inconsistent
mobile patterns:

- **Admin**: `startIcon` + `hidden sm:inline` text
  (icon-only on mobile)
- **Create Quest**: `startIcon` + `hidden sm:inline` text,
  plus `sm:hidden` span showing "Quest" on mobile
- **Profile**: `startIcon` + `hidden sm:inline` text
  (icon-only on mobile)
- **Logout**: No icon, always shows text

The Button component (`Button.tsx`, line 152) renders a
children wrapper span whenever `children` is truthy. When
children contains a `hidden sm:inline` span, the wrapper
still renders as an empty flex item. Combined with the
button's flex gap, this pushes icons off-center.

**Problem 2 - Landing page and migration buttons**: The
landing page (`app/page.tsx`, lines 34-47) uses raw
`fantasy-button` CSS class on `<Link>` elements with
`flex items-center gap-2`. The icon (`<Castle size={20} />`)
and text sit in the same flex container but the icon
renders above the text instead of beside it because the
link also has `inline-block`, which conflicts with `flex`.
The migration notice (`UserMigrationNotice.tsx`, line 75)
has the same `block flex` conflict.

## Goals / Non-Goals

**Goals:**

- All dashboard header buttons: icon-only on mobile,
  icon+text on desktop, centered icons
- Landing page hero buttons: icon and text inline-aligned
- Migration notice button: icon and text inline-aligned
- Screen readers can identify all icon-only buttons
- Fix the root CSS conflicts causing misalignment

**Non-Goals:**

- Redesigning the header layout or navigation
- Changing button sizes, colors, or variants
- Adding a hamburger menu or collapsible navigation
- Modifying Button or FantasyButton component APIs
- Refactoring landing page buttons to use Button component

## Decisions

### 1. Logout button gets a `startIcon` and hidden text

Add `startIcon={<LogOut size={16} />}` and wrap "Logout"
in `<span className="hidden sm:inline">Logout</span>`.
This makes it consistent with Admin and Profile.

**Alternative considered:** Using `icon-sm` size for all
mobile buttons. Rejected because it would change the button
dimensions and require more layout adjustments.

### 2. Remove mobile-only "Quest" text from Create Quest

Remove `<span className="sm:hidden">Quest</span>` so it
behaves like the other buttons: icon-only on mobile, full
text on desktop.

### 3. Fix icon centering with responsive gap override

Rather than modifying Button component internals, apply
`gap-0 sm:gap-[var(--btn-gap)]` via className on each
header button that hides text on mobile. This eliminates
the gap between the icon and the empty children wrapper on
mobile without affecting desktop layout or other buttons.

**Alternative considered:** Changing Button component to
detect hidden children at runtime. Rejected as fragile and
over-engineered for this use case.

### 4. Fix landing page `inline-block flex` conflict

The `fantasy-button` links have both `inline-block` and
`flex` classes. `flex` overrides `inline-block` for display,
but the combination is confusing. Remove `inline-block` and
keep `flex items-center gap-2` so icon and text align on
the same horizontal line.

**Alternative considered:** Replacing raw `fantasy-button`
links with the `FantasyButton` component. Rejected because
these are `<Link>` elements, not buttons, and the
FantasyButton component uses `motion.button` which can't
wrap a Next.js Link without refactoring.

### 5. Fix migration notice same conflict

Same fix as landing page: remove conflicting `block` from
the class list on the migration notice link, keep `flex`.

### 6. Add `aria-label` for accessibility

Each icon-only mobile button needs an `aria-label` so
screen readers announce the button purpose when text is
hidden.

## Risks / Trade-offs

- **Per-button gap override**: Each header button that hides
  text on mobile needs the gap override className. This is
  explicit and avoids unintended side effects on other
  buttons elsewhere in the app.
- **Landing page display fix is minimal**: Just removing
  `inline-block`/`block` conflicts. No visual change on
  desktop, fixes mobile alignment.
