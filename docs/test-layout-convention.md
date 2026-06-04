# Test Layout Convention Audit

Issue: #143
Status: first-slice audit only — no broad test relocation in this PR

## Decision summary

ChoreQuest should move toward one primary convention for unit and component tests:

- Co-locate unit and component tests next to the source they exercise.
- Standardize on `.test.ts` / `.test.tsx` filenames.
- Reserve top-level `tests/` for integration, E2E, setup, and shared helper files.
- Avoid creating new `__tests__` directories for unit or component coverage.

This document records the current layout, the inconsistencies that matter, and a safe first migration batch for follow-up work.

## Current audit snapshot

Audit date: 2026-06-04
Audit scope: repository source test files only (`.js/.jsx/.ts/.tsx`), excluding build artifacts and planning docs

### Test inventory counts

| Bucket | Count | Notes |
| --- | ---: | --- |
| Co-located `.test.*` files outside `tests/` | 89 | Already aligned with the target direction |
| Files under `__tests__/` | 110 | Main legacy convention to unwind |
| Files under `tests/unit/` | 84 | Second major legacy convention |
| `tests/integration/` | 8 | Should remain top-level |
| `tests/e2e/` | 5 | Should remain top-level |
| Top-level setup/helper files under `tests/` | 5 | `tests/jest.setup.js`, `tests/jest.setup.d.ts`, `tests/jest.integration.setup.js`, `tests/jest.integration.setup-after-env.js`, `tests/utils/test-helpers.tsx` |
| Total source test-like files | 301 | Matches issue triage baseline |

Suffix audit:

- `.test.ts` / `.test.tsx`: 269 files
- `.spec.*`: 0 source test files found

### Notable current clusters

Largest `__tests__` owners:

| Area | Count |
| --- | ---: |
| `lib/__tests__/` | 62 |
| `components/rewards/reward-store/__tests__/` | 10 |
| `components/rewards/reward-manager/__tests__/` | 9 |
| `components/quests/quest-dashboard/__tests__/` | 7 |
| `components/quests/quest-card/__tests__/` | 6 |

Largest `tests/unit` groups:

| Area | Count |
| --- | ---: |
| `tests/unit/app/` | 27 |
| `tests/unit/lib/` | 19 |
| `tests/unit/components/` | 18 |
| `tests/unit/migrations/` | 7 |
| `tests/unit/statistics/` | 4 |

## Current convention problems

1. Same test type, three locations.
   - Unit and component tests currently live in co-located files, `__tests__/` directories, and `tests/unit/`.
   - That makes test discovery inconsistent and forces contributors to guess where new coverage belongs.

2. Mixed conventions inside the same feature area.
   - `components/quests/quest-card/` already has co-located tests (`index.test.tsx`, `index-actions.test.tsx`) while also keeping related files under `components/quests/quest-card/__tests__/`.
   - This is the most obvious example of local inconsistency and a good signal for the migration shape.

3. `tests/unit/` is carrying source-adjacent work that belongs beside app code.
   - Example buckets such as `tests/unit/app/`, `tests/unit/lib/`, and `tests/unit/components/` map directly onto production directories and are better discovered when stored beside those modules.

4. `__tests__/` increases path churn without adding real separation.
   - Most files under `__tests__/` already use `.test.*` naming, so the extra directory layer is mostly noise.
   - It also creates awkward imports from nearby co-located tests, such as component-root tests importing fixtures from `./__tests__/...`.

5. The Jest unit config currently has to support both worlds.
   - `jest.config.js` matches both `<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}` and `<rootDir>/**/*.(test|spec).{js,jsx,ts,tsx}`.
   - That broad matching is functional, but it reflects the layout sprawl rather than a deliberate testing model.

## Intended steady-state layout

### Keep top-level `tests/`

These should remain top-level because they are cross-cutting or environment-oriented rather than owned by one source module:

- `tests/integration/`
- `tests/e2e/`
- Jest setup/bootstrap files:
  - `tests/jest.setup.js`
  - `tests/jest.setup.d.ts`
  - `tests/jest.integration.setup.js`
  - `tests/jest.integration.setup-after-env.js`
- Shared test helpers:
  - `tests/utils/test-helpers.tsx`

### Migrate toward co-location

These groups should move toward co-location over time:

- `tests/unit/app/` → next to `app/` route handlers or route-owned helpers
- `tests/unit/components/` → next to `components/` modules
- `tests/unit/lib/` → next to `lib/` modules
- `hooks/` should continue using co-located `.test.*` files (already the cleanest large cluster)
- Existing component or library `__tests__/` directories should be flattened into the parent source folder as follow-up work lands

### Naming rule

For unit and component tests:

- Use `*.test.ts` for non-React modules
- Use `*.test.tsx` for React components/hooks rendering tests
- Do not introduce new `.spec.*` files
- Do not introduce new `__tests__/` directories

## Recommended first migration batch

### Batch: `components/quests/quest-card`

Recommended scope for the next implementation PR:

- Move these files out of `components/quests/quest-card/__tests__/` into `components/quests/quest-card/`:
  - `quest-card.accessibility.test.tsx`
  - `quest-card.gm.test.tsx`
  - `quest-card.hero.test.tsx`
  - `quest-meta.test.tsx`
  - `quest-card.fixtures.tsx`
- Leave these already co-located files in place:
  - `index.test.tsx`
  - `index-actions.test.tsx`
  - `quest-card-helpers.test.ts`
- Explicitly defer `components/quests/quest-card/__tests__/quest-card-helpers.test.ts` to a second batch unless the implementer is prepared to merge or rename coverage in the same PR.
  - That file collides by name with the existing co-located `components/quests/quest-card/quest-card-helpers.test.ts`.
  - The two helper-test files cover different behavior today, so a blind move would either overwrite coverage or force an unplanned rename decision.
  - The canary should document that the first batch reduces the split, but does not fully eliminate the `quest-card/__tests__/` directory.

Estimated migration size:

- 5 moved files
- 2 existing co-located tests likely need import updates to stop referencing `./__tests__/quest-card.fixtures`
- 1 deferred duplicate-helper decision (`quest-card-helpers.test.ts`) called out explicitly for the follow-up card
- Expected follow-up PR touch count: roughly 7-8 files for the canary, with a separate small follow-up needed to merge/rename the duplicate helper coverage

### Why this is the best first slice

1. It is already partially co-located.
   - The directory already contains three root-level tests, so the target shape is established rather than speculative.

2. It is feature-local and easy to review.
   - The files all belong to one component cluster instead of a cross-repo sweep.

3. It exercises the main migration mechanics without triggering a mass move.
   - File relocation
   - Nearby import rewrites
   - Jest discovery verification

4. It exposes a real edge case early, without widening the blast radius.
   - The duplicate `quest-card-helpers.test.ts` name is exactly the sort of collision the broader migration needs documented before larger batches proceed.
   - Handling that collision explicitly makes the canary honest about what it fixes now versus what still needs a deliberate merge/rename pass.

5. It gives a template for later batches.
   - If the quest-card cluster moves cleanly, the same pattern can be repeated for `quest-dashboard`, `reward-manager`, and `reward-store`, while reserving duplicate-name cleanup for batches that actually need it.

## Follow-up batch candidates after the canary

After `components/quests/quest-card`, the next most sensible clusters are:

1. `components/quests/quest-dashboard/__tests__/` (7 files)
2. `components/rewards/reward-manager/__tests__/` (9 files)
3. `components/rewards/reward-store/__tests__/` (10 files)
4. Focused `tests/unit/components/` slices that map cleanly to one component family
5. Focused `tests/unit/lib/` slices that map cleanly to one library module family

The `lib/__tests__/` and `tests/unit/app/` buckets are much larger and should be split into smaller, module-owned batches rather than migrated in one heroic and regrettable gesture.

## Constraints for follow-up implementation PRs

- Do not move `tests/integration/` or `tests/e2e/` into source folders.
- Do not delete or relocate Jest setup files or shared helpers from top-level `tests/`.
- Keep migration PRs small enough to verify with focused Jest runs.
- Prefer batches that are owned by one feature directory and already have obvious source adjacency.
- Update imports as part of each batch rather than relying on brittle alias hacks.

## Verification expectations for migration PRs

For documentation-only work like this audit:

- No focused Jest run required
- No `npm run lint` required unless source or script files change

For follow-up migration PRs that actually move tests:

- Run focused Jest on the migrated cluster
- Run `npm run lint` if source, scripts, or config files change
- Record any skipped verification explicitly in the PR body or Kanban handoff
