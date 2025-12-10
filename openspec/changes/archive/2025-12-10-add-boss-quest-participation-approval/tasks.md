## 1. Implementation

- [ ] 1.1 Add boss quest creation modal/tab on the create quest screen with
      default rewards prefilled to 50 gold and 100 XP.
- [ ] 1.2 Implement GM post-defeat participation review UI and API to approve,
      partially credit, or deny each participant before payout.
- [ ] 1.3 Apply per-participant rewards based on approvals (including partial
      amounts) and suppress rewards/honor for denied participants while
      recording audit events. Supress honor entirely for partial payouts. Honor
      only rewarded for full participation approval.
- [ ] 1.4 Add realtime subscription for boss quest status/participants so
      join/approval changes reflect live for viewers.
- [ ] 1.5 Surface boss quests in quest history and admin activity feed with
      defeat outcomes and per-participant decisions visible.

## 2. Testing

- [ ] 2.1 Tests for creation flow default rewards and modal/tab UX wiring.
- [ ] 2.2 Tests for approval/partial/deny flows ensuring payouts and honor
      follow decisions and are idempotent.
- [ ] 2.3 Tests for realtime updates when participants join or GM decisions
      change.
- [ ] 2.4 Tests covering boss quest history and admin activity feed entries
      (including approvals/partials/denials).
