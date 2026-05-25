# Tasks: Clarify Single-Character and Hidden Achievement Specs

## 1. Spec Updates

- [x] 1.1 Merge delta spec into `achievement-progress`: add the
  single-character-per-user constraint requirement and its two scenarios
- [x] 1.2 Merge delta spec into `achievement-badge-display`: add the
  `criteria_type` always-exposed requirement and its two scenarios

## 2. Verification

- [x] 2.1 Confirm `openspec/specs/achievement-progress/spec.md` contains
  the new "Single character per user constraint" requirement
- [x] 2.2 Confirm `openspec/specs/achievement-badge-display/spec.md`
  contains the new "criteria_type always exposed" requirement
- [x] 2.3 Run `npm run build && npm run lint && npm run test` to confirm
  no regressions (no code changes, but verify clean baseline)
