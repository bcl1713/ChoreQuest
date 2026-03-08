# Tasks: Refactor Dashboard Tabs

## 1. Create TabBar Component

- [x] 1.1 Create `components/ui/tab-bar.tsx` with
  `TabItem` and `TabBarProps` generic interfaces
- [x] 1.2 Implement tab rendering with bordered
  bottom-indicator active state styling
- [x] 1.3 Add responsive labels: full label on desktop,
  `shortLabel` or first word on mobile
- [x] 1.4 Add icon rendering at consistent 18px size
- [x] 1.5 Support optional `testId` as `data-testid`
- [x] 1.6 Export `TabBar` and types from
  `components/ui/index.ts`

## 2. Write TabBar Tests

- [x] 2.1 Test that all provided tabs render as buttons
- [x] 2.2 Test active tab gets gold border/text styling
- [x] 2.3 Test inactive tab gets gray styling
- [x] 2.4 Test `onTabChange` fires on click
- [x] 2.5 Test `data-testid` renders when provided and
  is absent when omitted
- [x] 2.6 Test responsive label behavior (shortLabel
  fallback to first word)

## 3. Integrate into Dashboard

- [x] 3.1 Define dashboard tab config array with Sword
  and Store icons, labels, and test IDs
- [x] 3.2 Replace Button-based tab toggle in
  `dashboard-layout.tsx` with `TabBar` component
- [x] 3.3 Remove unused `Button` import if no longer
  needed in dashboard-layout
- [x] 3.4 Update dashboard layout tests for new tab
  markup (N/A — no existing tests)

## 4. Integrate into ProfileSettings

- [x] 4.1 Replace inline tab markup in
  `ProfileSettings.tsx` with `TabBar` component
- [x] 4.2 Remove inline tab styling and `cn` import
  if no longer needed
- [x] 4.3 Update ProfileSettings tests for new tab
  markup (N/A — no existing tests)

## 5. Verify Quality Gates

- [x] 5.1 Run `npm run build` — zero TypeScript errors
- [x] 5.2 Run `npm run lint` — zero lint errors
- [x] 5.3 Run `npm run test` — all tests pass
- [x] 5.4 Visual check: dashboard tabs match
  ProfileSettings style
