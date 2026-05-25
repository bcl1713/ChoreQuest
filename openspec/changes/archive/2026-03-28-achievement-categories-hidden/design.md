# Design: Achievement Categories & Hidden Achievements

## Context

The achievement system schema already includes
`achievement_categories` and `achievements` tables with
`is_hidden`, `category_id`, and `display_order` fields.
The UI has `AchievementGrid` with a category tab structure
and `AchievementBadge` with a hidden state. However, no
admin CRUD exists for categories/achievements, category
filtering isn't wired up with real data, and category
completion tracking is missing.

The admin panel uses HeadlessUI tabs, service-role Supabase
client for writes, and RLS policies enforcing Guild Master
access.

## Goals / Non-Goals

**Goals:**

- Admin can create, edit, reorder, and delete achievement
  categories
- Admin can create and edit achievements with category
  assignment and hidden flag
- Players can filter achievements by category tab
- Players see category completion counts (e.g., "3/8")
- Hidden achievements show "???" when locked, full details
  when unlocked

**Non-Goals:**

- Bulk import/export of achievements
- Achievement category icons customization beyond existing
  icon field
- Player-facing category reordering or preferences
- Achievement deletion from admin (soft-delete is future)

## Decisions

### 1. Admin UI as new AdminDashboard tabs

Add two new tabs: "Achievement Categories" and
"Achievements" to the existing `AdminDashboard` component.

**Why**: Follows the established admin pattern (HeadlessUI
tabs, `useTabNavigation` hook, URL-synced state). Avoids
introducing a separate admin routing structure.

**Alternative considered**: Separate admin pages with
Next.js routing. Rejected because the existing tab pattern
is well-established and keeps related admin functions
together.

### 2. API routes with service-role client

Create new API routes under `/api/admin/achievement-categories`
and `/api/admin/achievements` using the service-role
Supabase client.

**Why**: RLS policies restrict category/achievement writes
to service role only. Admin API routes already use this
pattern for other CRUD operations.

**Alternative considered**: Direct client-side Supabase
calls with RLS policy changes. Rejected because it would
weaken the security model.

### 3. Category filtering via client-side filter

Fetch all achievements with their categories in one query,
then filter client-side based on selected category tab.

**Why**: The total achievement count is small (tens, not
thousands). Client-side filtering is simpler and avoids
extra network requests when switching tabs. The data is
already fetched for the grid display.

**Alternative considered**: Server-side filtering with
separate queries per category. Rejected as unnecessary
overhead for the expected data volume.

### 4. Category completion tracking in AchievementGrid

Compute completion counts by grouping fetched achievements
by `category_id` and counting unlocked vs total per
category. Display as "N/M" badge on each category tab.

**Why**: All data needed is already available from the
existing achievements fetch (which includes unlock status).
No additional queries or database changes needed.

### 5. Hidden achievement enforcement in display layer

The `AchievementBadge` component already handles a hidden
state. Ensure the data layer passes `is_hidden` through
and the badge/modal components mask name and description
for locked hidden achievements.

**Why**: Display-layer enforcement keeps the API simple
(return all achievements) and lets the UI decide
presentation. The badge component already has the visual
states implemented.

## Risks / Trade-offs

- **Category deletion with linked achievements**: Deleting
  a category that has achievements assigned would break
  references. Mitigation: prevent deletion if category has
  achievements, show error message to admin.

- **Display order conflicts**: Multiple admins reordering
  simultaneously could cause conflicts. Mitigation:
  acceptable for now given single-family admin usage.
  Optimistic UI with refetch on save.

- **Hidden achievement data exposure**: Achievement details
  are sent to the client even for hidden achievements.
  Mitigation: acceptable because the data isn't sensitive
  (game achievements, not security secrets). If needed
  later, server-side filtering can be added.
