# Proposal: Dashboard Load Performance

## Why

The dashboard has a confirmed serial loading bottleneck:
`useQuestTemplates` waits for the `character` context to resolve before
issuing its fetch, even though it only needs `family_id` (available
from the user profile). This forces quest templates to load in a third
sequential wave (auth → character → templates) instead of in parallel
with the character fetch.

## What Changes

- Remove `character` from the `enabled` guard in `useQuestTemplates`
  so templates begin loading as soon as `user` and `profile.family_id`
  are available
- Document baseline load behavior and the improvement

## Capabilities

### New Capabilities

- `dashboard-data-loading`: Defines how the dashboard loads its data
  (auth, character, quest templates) and what parallelism is required

### Modified Capabilities

None — no existing spec covers dashboard data-loading behavior.

## Impact

- `components/dashboard/dashboard-content.tsx` — the `enabled` prop
  passed to `useQuestTemplates`
- `components/dashboard/useQuestTemplates.ts` — the hook's enabled
  guard
- No API changes, no schema changes, no breaking changes
