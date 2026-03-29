# Delta Spec: achievement-progress

## ADDED Requirements

### Requirement: Single character per user constraint

Each user SHALL have at most one character. This is a system-level
design constraint, not an implementation gap. The reward approval
route resolves "the redeemer's character" by fetching the user's
characters ordered by `created_at` ascending and taking the first
(and only) result. The use of `characters?.[0]` is intentional and
correct — it is not a bug caused by ignoring additional characters.
No multi-character support exists and none is planned.

#### Scenario: Reward approval resolves single character

- **WHEN** the approve route fetches characters for a redeemer
- **THEN** it SHALL retrieve at most one character row because
  each user has exactly one character by design

#### Scenario: Character lookup uses first-created order

- **WHEN** the approve route queries `characters` for a user
- **THEN** it SHALL order by `created_at` ascending and use
  index `[0]`, which is the user's only character
