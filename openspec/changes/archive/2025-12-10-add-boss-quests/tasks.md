## 1. Implementation
- [x] 1.1 Add boss quest creation inputs for GM (title/details, rewards, optional join window with 60-minute default) and surface the countdown to family members.
- [x] 1.2 Enforce join cutoff after the window expires; block late joins and reflect status in UI and API responses.
- [x] 1.3 Implement GM completion flow to mark boss defeated and award configured gold/xp to all participants plus 1 honor point each.
- [x] 1.4 Persist participation records and reward events for auditing and future honor-point use.

## 2. Testing
- [ ] 2.1 Unit/integration coverage for join window defaults, custom durations, and cutoff enforcement.
- [ ] 2.2 Unit/integration coverage for completion rewards: per-participant gold/xp + 1 honor point, idempotent against double submissions.
