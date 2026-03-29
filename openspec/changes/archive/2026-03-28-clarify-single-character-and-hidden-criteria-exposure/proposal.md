# Proposal: Clarify Single-Character and Hidden Achievement Specs

## Why

Reviewers are requesting code changes that conflict with intentional design
decisions: treating the use of `characters?.[0]` as a bug when
single-character-per-user is a system constraint by design, and requesting
that `criteria_type` be nulled out for locked hidden achievements when its
exposure is intentional. Adding explicit language to the relevant specs will
prevent these review comments from recurring.

## What Changes

- Add a single-character-per-user constraint to the `achievement-progress`
  spec, scoping the reward approval integration scenario to explicitly state
  that each user has exactly one character
- Add an explicit statement to the `achievement-badge-display` spec that
  `criteria_type` is intentionally returned for locked hidden achievements —
  only `name`, `description`, `icon`, `xp_reward`, and `gold_reward` are
  masked

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `achievement-progress`: Add constraint that each user has at most one
  character; the reward approval route resolves a single character per user
  and this is by design, not a gap
- `achievement-badge-display`: Clarify that the `/api/achievements` response
  intentionally includes `criteria_type` for all achievements regardless of
  lock state — only cosmetic fields are redacted for hidden locked achievements

## Impact

- `openspec/specs/achievement-progress/spec.md` — delta spec addition
- `openspec/specs/achievement-badge-display/spec.md` — delta spec addition
- No code changes required; this change is documentation/spec only
