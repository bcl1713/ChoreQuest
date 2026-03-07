# Tasks: Fix Button Icon + Text Layout

## 1. Fix FantasyButton Children Layout

- [x] 1.1 Add `inline-flex items-center` to the children
  `<span>` wrapper in `FantasyButton.tsx` (line 108)
- [x] 1.2 Update existing FantasyButton tests to verify
  icon + text children render on the same line

## 2. Verify All Button Consumers

- [x] 2.1 Verify AuthForm buttons (Enter Realm, Join
  Guild, Found Guild) render correctly at `size="lg"`
- [x] 2.2 Spot-check other FantasyButton consumers
  (CharacterCreation, ClassChangeForm, PasswordChangeForm)
  for correct icon + text layout
- [x] 2.3 Confirm buttons using the `icon` prop still
  render correctly

## 3. Quality Gate

- [x] 3.1 Run `npm run build` with zero errors
- [x] 3.2 Run `npm run lint` with zero errors
- [x] 3.3 Run `npm run test` with all tests passing
