# Tasks: Add Redemption Request Timestamp to Pending Cards

## 1. Implementation

- [x] 1.1 Add `requested_at` timestamp line to each pending redemption
  card in `redemption-list.tsx`, using `toLocaleString()` with a
  fallback of "Unknown" when null

## 2. Tests

- [x] 2.1 Add unit test: pending card renders formatted timestamp when
  `requested_at` is present
- [x] 2.2 Add unit test: pending card renders "Unknown" when
  `requested_at` is null

## 3. Quality Gates

- [x] 3.1 `npm run build` passes with zero errors
- [x] 3.2 `npm run lint` passes with zero warnings
- [x] 3.3 `npm run test` passes with all tests green
