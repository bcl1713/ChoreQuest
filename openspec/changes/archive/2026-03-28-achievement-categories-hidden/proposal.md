# Proposal: Achievement Categories & Hidden Achievements

## Why

Achievement categories and hidden achievements exist in the
database schema and are partially supported in the UI (badge
display handles hidden state, grid has category tab structure),
but there is no admin interface to manage categories or
achievements, no category filtering logic wired up, and no
category completion tracking. Admins need CRUD interfaces to
organize achievements, and players need browseable category
tabs with completion progress.

## What Changes

- Add admin tab for achievement category CRUD (create, edit,
  reorder, delete) following existing admin panel patterns
- Add admin tab for achievement CRUD with category assignment
  and hidden flag toggle
- Wire up category filter/tab UI on the achievement grid to
  fetch and filter by category
- Implement hidden achievement display logic: show "???" name
  and placeholder description for locked hidden achievements,
  reveal full details only after unlocking
- Add category completion tracking (e.g., "Questing: 3/8")
  to the achievement grid

## Capabilities

### New Capabilities

- `achievement-category-admin`: Admin CRUD interface for
  managing achievement categories (create, edit, reorder,
  delete) and achievements (create, edit with category
  assignment and hidden flag)
- `achievement-category-filtering`: Category tab filtering
  on the achievement grid with completion tracking per
  category

### Modified Capabilities

- `achievement-badge-display`: Add enforcement of hidden
  achievement display rules (locked hidden shows "???",
  unlocked hidden shows full details) and category
  completion counts

## Impact

- **Admin UI**: New admin tabs added to `AdminDashboard`
  component following existing HeadlessUI tab pattern
- **API routes**: New API routes for admin CRUD operations
  on categories and achievements (service-role client)
- **Achievement grid**: Enhanced with category filtering
  and completion tracking
- **Badge display**: Hidden achievement logic enforced in
  display layer
- **Dependencies**: Builds on achievement schema (#134) and
  badge display (#138), both already merged
