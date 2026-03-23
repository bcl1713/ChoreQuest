# Tasks: Achievement Categories & Hidden Achievements

## 1. Admin API Routes

- [x] 1.1 Create POST/GET `/api/admin/achievement-categories`
  route with Guild Master auth check and service-role client
- [x] 1.2 Create PATCH/DELETE
  `/api/admin/achievement-categories/[id]` route with
  delete protection for categories with achievements
- [x] 1.3 Create POST/GET `/api/admin/achievements` route
  with Guild Master auth check and service-role client
- [x] 1.4 Create PATCH `/api/admin/achievements/[id]` route
  for editing achievements (category, hidden flag, rewards)
- [x] 1.5 Write tests for admin API routes (auth checks,
  CRUD operations, delete protection)

## 2. Admin Category Management UI

- [x] 2.1 Create `AchievementCategoryAdmin` component with
  category list table (name, description, icon, count,
  actions)
- [x] 2.2 Add category create/edit form with validation
  (name required, display_order)
- [x] 2.3 Add category reorder controls (display_order
  editing)
- [x] 2.4 Add category delete with confirmation and
  protection for non-empty categories
- [x] 2.5 Write tests for category admin component (list,
  create, edit, delete, validation)

## 3. Admin Achievement Management UI

- [x] 3.1 Create `AchievementAdmin` component with
  achievement list table (name, category, hidden,
  rewards, actions)
- [x] 3.2 Add achievement create/edit form with category
  dropdown, hidden flag toggle, criteria fields
- [x] 3.3 Add category filter on achievement list
- [x] 3.4 Write tests for achievement admin component
  (list, create, edit, filter, hidden toggle)

## 4. Admin Dashboard Integration

- [x] 4.1 Add Achievement Categories and Achievements tabs
  to AdminDashboard with icons and useTabNavigation

## 5. Category Filtering & Completion Tracking

- [x] 5.1 Update AchievementGrid to compute per-category
  completion counts (unlocked/total, excluding locked
  hidden)
- [x] 5.2 Add completion count badges to category tabs
  (e.g., "3/8")
- [x] 5.3 Implement client-side category filtering without
  network requests on tab switch
- [x] 5.4 Update AchievementSummary to reflect selected
  category counts when a category tab is active
- [x] 5.5 Handle empty category state in grid
- [x] 5.6 Write tests for category filtering logic and
  completion count calculations

## 6. Hidden Achievement Display Enforcement

- [x] 6.1 Verify AchievementBadge masks name/description
  for locked hidden achievements ("???", placeholder text)
- [x] 6.2 Verify AchievementDetailModal masks details for
  locked hidden achievements
- [x] 6.3 Write tests for hidden achievement display rules
  (locked hidden vs unlocked hidden vs non-hidden)
