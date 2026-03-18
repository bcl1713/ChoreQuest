# Design: Dashboard Load Performance

## Context

The dashboard data loads across three sequential waves today:

1. **Auth** — `AuthProvider` fetches user profile and family via HTTP
2. **Character** — `CharacterProvider` starts once `user` is set by auth
3. **Quest templates** — `useQuestTemplates` starts once `user`,
   `profile`, AND `character` are all truthy

Step 3 depends on `character` unnecessarily. Quest templates only need
`family_id` (from `profile`), which is available after step 1. The
`character` guard was likely added for safety but it is not a
data dependency.

## Goals / Non-Goals

**Goals:**

- Allow quest templates to load in parallel with character data
- Keep the UI behavior identical (no regressions in render logic)
- Document baseline vs. improved load sequence

**Non-Goals:**

- Parallelizing the profile + family fetches inside `loadUserData`
  (family genuinely depends on `profile.family_id`)
- Any other dashboard performance work
- Caching, prefetching, or SSR changes

## Decisions

### Remove `character` from `useQuestTemplates` enabled guard

**Current:**

```ts
enabled: Boolean(user && profile && character)
```

**Proposed:**

```ts
enabled: Boolean(user && profile?.family_id)
```

**Rationale:** Quest templates are fetched by `family_id`. They have
no dependency on character data. Removing `character` from the guard
lets the fetch start as soon as auth completes, overlapping with the
character fetch.

**Alternative considered:** Hoist template loading into its own
context provider. Rejected — over-engineered for a one-line guard
change; no other consumer needs it.

## Risks / Trade-offs

- **Risk:** Rendering quest templates before character loads could
  expose a state where templates appear but character stats do not.
  → **Mitigation:** `DashboardContent` already returns
  `<DashboardLoading />` while `isLoading || characterLoading`, so
  templates are fetched in the background but not rendered until
  character is ready.

- **Risk:** Extra network request if the user has no character yet
  and is about to be redirected to `/character/create`.
  → **Mitigation:** Low cost — one aborted or wasted query on first
  sign-up. Acceptable trade-off.

## Migration Plan

Single file change, no migration required. Rollback is reverting the
`enabled` line.
