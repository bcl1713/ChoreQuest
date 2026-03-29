# Delta Spec: achievement-badge-display

## ADDED Requirements

### Requirement: criteria_type always exposed in achievement API response

The `/api/achievements` endpoint SHALL return `criteria_type` for
all achievements regardless of lock state or hidden status. Only
cosmetic and reward fields are masked for locked hidden achievements:
`name`, `description`, `icon`, `xp_reward`, and `gold_reward`.
The `criteria_type` field is intentionally included in all responses
so the client can render category groupings and filter UIs correctly.
This differs from the family achievement route by design — the
family route is more conservative in its masking, but the character
achievement route exposes `criteria_type` intentionally.

#### Scenario: criteria_type returned for locked hidden achievement

- **WHEN** the `/api/achievements` response includes a hidden
  achievement whose `unlocked_at` is null
- **THEN** the response object SHALL include the real
  `criteria_type` value
- **AND** `name` SHALL be `"???"`, `description` SHALL be `"???"`
  `icon` SHALL be null, `xp_reward` SHALL be null, and
  `gold_reward` SHALL be null

#### Scenario: criteria_type returned for unlocked hidden achievement

- **WHEN** the `/api/achievements` response includes a hidden
  achievement whose `unlocked_at` is non-null
- **THEN** the response object SHALL include the real
  `criteria_type` value alongside all unmasked fields
