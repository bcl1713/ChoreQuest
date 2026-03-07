# Fix Icon-Text Button Alignment Across App

## Why

Multiple buttons across the app have misaligned icons and
text. The dashboard header buttons are inconsistent on
mobile (some show text, some are icon-only, and icon-only
buttons are off-center). The landing page buttons ("Enter
Your Realm", "Create Family Guild", "Join Existing Guild")
use raw `fantasy-button` CSS with `flex items-center gap-2`
but the icon sits above the text instead of inline. The
migration notice has the same issue. This is a systematic
problem affecting any button that combines an icon with
text outside the `Button` or `FantasyButton` components.

## What Changes

- Make all dashboard header buttons icon-only on mobile
  with consistent icon+text on desktop
- Fix off-center icon alignment when button text is hidden
  on mobile (flex gap on empty children wrapper)
- Fix landing page hero buttons so icon and text are
  properly inline-aligned
- Fix migration notice buttons with the same icon+text
  alignment issue
- Add `aria-label` attributes to icon-only mobile buttons
  for accessibility
- Audit and fix any other `fantasy-button` + inline icon
  usage across the codebase

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `frontend-architecture`: Button component needs to handle
  hidden children without rendering an empty wrapper that
  affects icon centering. Dashboard header buttons need
  consistent mobile/desktop treatment. Landing page and
  migration notice buttons using raw `fantasy-button` CSS
  class need proper icon+text inline alignment.

## Impact

- `components/ui/Button.tsx`: Fix children rendering when
  all children are visually hidden (empty wrapper span
  creates gap offset)
- `components/dashboard/dashboard-layout.tsx`: Standardize
  all header buttons (Admin, Create Quest, Profile, Logout)
  to use the same `startIcon` + `hidden sm:inline` pattern
- `app/page.tsx`: Fix "Enter Your Realm", "Create Family
  Guild", and "Join Existing Guild" button icon alignment
- `components/migration/UserMigrationNotice.tsx`: Fix
  "Create New Guild" button icon alignment
- Existing tests for Button and dashboard-layout may need
  updates to reflect the new consistent behavior
