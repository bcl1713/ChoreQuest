# Tasks for Enhanced Character Creation

Generated from: `tasks/0002-prd-enhanced-character-creation.md`

## Relevant Files

### Configuration & Constants
- `lib/constants/character-classes.ts` - **NEW** Character class configuration with UI metadata and bonuses
- `lib/constants/character-classes.test.ts` - **NEW** Unit tests for character class configuration
- `lib/reward-calculator.ts` - Existing reward calculator with `getClassBonus()` method (reference for bonus values)

### State Management & Context
- `lib/auth-context.tsx` - Auth context that handles family creation and registration (needs to store character name)
- `lib/character-context.tsx` - Character state management context
- `app/auth/create-family/page.tsx` - Family creation page (needs to pass character name)
- `app/auth/register/page.tsx` - Join family/registration page (needs to pass character name)

### Components
- `components/auth/AuthForm.tsx` - Authentication form component (already collects character name)
- `components/character/CharacterCreation.tsx` - Character creation component (needs to accept pre-filled name and display class bonuses)

### E2E Tests
- `tests/e2e/character-creation.spec.ts` - Character creation E2E tests (needs update for pre-filled name)
- `tests/e2e/family-joining.spec.ts` - Family joining E2E tests (needs update for pre-filled name)
- `tests/e2e/helpers/setup-helpers.ts` - Test helper functions (may need adjustments)

### Notes
- Unit tests should be placed alongside code files (e.g., `character-classes.ts` and `character-classes.test.ts` in same directory)
- Use `npx jest [optional/path/to/test/file]` to run tests
- Use `npx playwright test` to run E2E tests

---

## Tasks

- [x] 1.0 Create Character Class Configuration System
  - [x] 1.1 Create `lib/constants/character-classes.ts` with `CharacterClassInfo` type definition matching the five classes (MAGE, ROGUE, KNIGHT, HEALER, RANGER)
  - [x] 1.2 For each class, add UI metadata: `id`, `name`, `description`, `icon` (emoji), and `bonuses` object with multiplier values matching `RewardCalculator.getClassBonus()`
  - [x] 1.3 Export `CHARACTER_CLASSES` array containing all five class configurations
  - [x] 1.4 Create `lib/constants/character-classes.test.ts` with unit tests verifying:
    - All five classes are defined
    - Bonus multipliers match `RewardCalculator.getClassBonus()` exactly (critical for consistency)
    - All required fields (name, description, icon, bonuses) are present
  - [x] 1.5 Run `npx jest lib/constants/character-classes.test.ts` to verify tests pass

- [x] 2.0 Update Character Name Flow (Family Creation/Join → Character Creation)
  - [x] 2.1 Update `lib/auth-context.tsx`:
    - Add `characterName` state to `AuthProvider`
    - Add `setCharacterName(name: string)` method to context
    - Store character name when `createFamily()` is called (from `userName` field)
    - Store character name when `register()` is called (from `name` field)
  - [x] 2.2 Update `app/auth/create-family/page.tsx`:
    - After successful `createFamily()`, call `setCharacterName(data.userName)` before navigation
  - [x] 2.3 Update `app/auth/register/page.tsx`:
    - After successful `register()`, call `setCharacterName(data.name)` before navigation
  - [x] 2.4 Update `components/character/CharacterCreation.tsx`:
    - Add optional `initialCharacterName?: string` prop
    - Pre-fill character name input with `initialCharacterName` if provided
    - Make name field editable (user can change pre-filled value)
    - Validate that name is still required even if pre-filled
  - [x] 2.5 Update character creation page to pass `characterName` from auth context to `CharacterCreation` component

- [ ] 3.0 Build Enhanced Character Creation UI with Class Bonus Display
  - [ ] 3.1 Update `components/character/CharacterCreation.tsx` to import `CHARACTER_CLASSES` from constants
  - [ ] 3.2 Replace hardcoded `characterClasses` array with imported `CHARACTER_CLASSES` configuration
  - [ ] 3.3 Update class card display to show accurate bonus information:
    - Display XP bonus if > 1.0 (e.g., "1.2" → "+20% XP on all quests")
    - Display Gold bonus if > 1.0 (e.g., "1.15" → "+15% Gold on all quests")
    - Display Honor bonus if > 1.0 (e.g., "1.25" → "+25% Honor Points on all quests")
    - Display Gems bonus if > 1.0 (e.g., "1.3" → "+30% Gems on all quests")
    - Show "No [type] bonus" for multipliers = 1.0
  - [ ] 3.4 Update class card layout for mobile responsiveness:
    - Desktop: Grid layout (3 columns for 5 classes)
    - Mobile (<768px): Horizontal scrollable/swipeable card layout
  - [ ] 3.5 Implement mobile swipe functionality:
    - Use CSS `scroll-snap-type: x mandatory` for snap scrolling
    - Add visual scroll indicators (dots or arrows) showing current position
    - Ensure touch-friendly card sizes (minimum 44px touch targets)
  - [ ] 3.6 Add bonus formatting helper function to convert multipliers to percentage display (e.g., `1.2 → "+20%"`)
  - [ ] 3.7 Update class descriptions to be more accurate and remove outdated "quest type" references

- [ ] 4.0 Update E2E Tests for New Character Name Flow
  - [ ] 4.1 Review `tests/e2e/character-creation.spec.ts`:
    - Identify all tests that fill character name input
    - Update assertions to expect pre-filled character name from family creation
    - Verify character name is editable in character creation form
  - [ ] 4.2 Review `tests/e2e/family-joining.spec.ts`:
    - Update character name input expectations for join family flow
    - Verify character name from registration pre-fills into character creation
    - Test editing pre-filled character name before submission
  - [ ] 4.3 Update `tests/e2e/helpers/setup-helpers.ts` if needed:
    - Adjust `setupUserAtCharacterCreation()` helper to handle pre-filled name
    - Adjust `setupUserWithCharacter()` helper if character name flow changed
  - [ ] 4.4 Add new E2E test case: "character name pre-fills from family creation and is editable"
  - [ ] 4.5 Add new E2E test case: "character name pre-fills from family join and is editable"
  - [ ] 4.6 Add new E2E test case: "class bonus information displays correctly on desktop"
  - [ ] 4.7 Add new E2E test case: "class selection swipe works on mobile viewport"
  - [ ] 4.8 Run `npx playwright test tests/e2e/character-creation.spec.ts` to verify all tests pass
  - [ ] 4.9 Run `npx playwright test tests/e2e/family-joining.spec.ts` to verify all tests pass

- [ ] 5.0 Quality Assurance and Documentation
  - [ ] 5.1 Run `npm run build` - verify zero compilation errors
  - [ ] 5.2 Run `npm run lint` - verify zero linting errors/warnings
  - [ ] 5.3 Run `npx jest` - verify all unit tests pass (including new character-classes tests)
  - [ ] 5.4 Run `npx playwright test` - verify all E2E tests pass with new character name flow
  - [ ] 5.5 Manual testing on desktop:
    - Create family, verify character name pre-fills in character creation
    - Edit pre-filled character name before submitting
    - Verify class bonuses display correctly with accurate percentages
    - Join family, verify character name pre-fills
  - [ ] 5.6 Manual testing on mobile viewport:
    - Test class selection swipe/scroll on mobile (use browser dev tools)
    - Verify touch targets are large enough
    - Verify scroll indicators work correctly
  - [ ] 5.7 Create serena memory: `enhanced_character_creation_implementation` documenting:
    - Character class configuration structure
    - Character name flow (family/join → character creation)
    - Class bonus display formatting
    - Mobile swipe implementation details
  - [ ] 5.8 Update TASKS.md to mark enhanced character creation as completed
