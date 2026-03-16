# Spec: Pending Redemption Display

## ADDED Requirements

### Requirement: Pending card shows request timestamp

Each pending redemption card in the admin Reward Management view SHALL
display the `requested_at` timestamp so that the reviewer knows when
the request was made.

The timestamp SHALL be formatted using `toLocaleString()` to match the
format used in the approved and history sections of the same view.

If `requested_at` is null, the card SHALL display "Unknown" in place
of the timestamp.

#### Scenario: Timestamp present

- **WHEN** a pending redemption card is rendered and `requested_at`
  is a valid date string
- **THEN** the card displays the formatted date and time below the
  reward name/cost line

#### Scenario: Timestamp absent

- **WHEN** a pending redemption card is rendered and `requested_at`
  is null
- **THEN** the card displays "Unknown" in place of the timestamp
