# Design: Clarify Single-Character and Hidden Achievement Specs

## Context

Two spec gaps are causing reviewers to flag correct code as bugs:

1. The `achievement-progress` spec describes the reward approval flow
   as resolving "the redeemer's character" but never states that a user
   has exactly one character. The approve route uses `characters?.[0]`,
   which reviewers read as accidentally ignoring additional characters.
2. The `achievement-badge-display` spec describes which fields are masked
   for locked hidden achievements but does not explicitly address
   `criteria_type`. Reviewers compare the behavior to the family
   achievement route, which nulls `criteria_type`, and assume the
   character achievement route is inconsistent.

Both behaviors are intentional and correct. No code changes are needed —
only spec language additions.

## Goals / Non-Goals

**Goals:**

- Add a single-character-per-user requirement to the
  `achievement-progress` spec so the one-character assumption is
  explicit and documented
- Add a requirement to the `achievement-badge-display` spec that
  explicitly states `criteria_type` is returned for all achievements
  regardless of lock state

**Non-Goals:**

- Changing any application code
- Modifying family achievement API behavior
- Adding multi-character support

## Decisions

**Delta specs over in-place edits**: New requirements are added as
delta spec files (`specs/<name>/delta-*.md`) alongside the existing
`spec.md`. This preserves the original spec history and makes the
intent of this change traceable.

**Placement in achievement-progress spec**: The single-character
constraint belongs in the "Reward approval integration" requirement
because that is where the character lookup occurs. A new scenario
makes the one-character assumption explicit and testable.

**Placement in achievement-badge-display spec**: The `criteria_type`
exposure belongs in the "Achievement data API" requirement as a new
scenario clarifying the exact masking boundary for locked hidden
achievements.

## Risks / Trade-offs

No code risks — this is documentation only.

[Future scope creep] If multi-character support is ever added, the
single-character constraint in the spec will need to be revisited.
→ Mitigation: The spec language should use "by design" wording so
  future engineers know to update it deliberately, not accidentally.
