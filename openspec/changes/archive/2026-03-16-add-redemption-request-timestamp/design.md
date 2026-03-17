# Design: Add Redemption Request Timestamp to Pending Cards

## Context

The admin Reward Management page displays pending redemptions in
`components/rewards/reward-manager/redemption-list.tsx`. Each card shows
the requester's name and reward name/cost, but omits when the request
was made.

The `requested_at` field is already present in the database schema and
returned by `getRedemptionsForFamily()`. The approved and history
sections already render it via `toLocaleString()`. The pending section
simply never wired it up.

## Goals / Non-Goals

**Goals:**

- Show `requested_at` on each pending redemption card
- Match the timestamp format used in the approved/history sections

**Non-Goals:**

- Changing timestamp format across the app
- Adding timestamps to the user-facing reward store views
- Any backend or API changes

## Decisions

**Use `toLocaleString()` (not `toLocaleDateString()`)**
The approved section already uses `toLocaleString()` for full
date+time. Pending cards should match so the format is consistent
within the admin view. The user-facing store uses date-only — that
difference is intentional and unchanged.

**Graceful fallback for null `requested_at`**
The field is nullable in the schema. Render "Unknown" if null,
consistent with how other timestamp fields are handled in the file.

## Risks / Trade-offs

- Locale-formatted strings are not sortable — acceptable since the list
  is already ordered by `requested_at DESC` from the query.
