# PRD: Enhanced Character Creation with Class Bonus Display

## Introduction/Overview

Currently, ChoreQuest asks users for their character name twice: once during family creation/join, and again during character creation. This creates a poor user experience with redundant input. Additionally, users currently select their character class without understanding the mechanical benefits each class provides, leading to uninformed decisions.

This feature will:
1. Streamline the character name collection to ask only once during family creation/join, then pre-fill it (editably) in character creation
2. Display class bonus information during character creation so users can make informed decisions
3. Provide a mobile-friendly, touch-optimized class selection experience

**Problem Solved:** Reduces user friction during onboarding and enables informed class selection decisions.

## Goals

1. Eliminate duplicate character name input during user onboarding flow
2. Display accurate class bonus information during character creation
3. Pre-fill character name from family creation/join into character creation dialog (editable)
4. Create mobile-responsive class selection UI with horizontal swipe cards
5. Update all E2E tests to reflect the new flow without breaking existing test coverage
6. Maintain backward compatibility - no changes required to existing characters

## User Stories

**As a new user creating a family,**
I want to enter my character name once during family creation,
So that I don't have to redundantly type it again during character creation.

**As a new user joining an existing family,**
I want to enter my character name once during the join process,
So that I can quickly complete onboarding without repetitive input.

**As a user creating my character,**
I want to see what bonuses each class provides,
So that I can make an informed decision about which class fits my playstyle.

**As a mobile user selecting a character class,**
I want to swipe through class options in a card-based interface,
So that I can easily explore all classes on my touchscreen device.

**As a user in the character creation dialog,**
I want to be able to edit the pre-filled character name,
So that I can correct typos or change my mind without restarting the flow.

## Functional Requirements

### Name Collection Flow

1. The family creation dialog MUST include a "Character Name" input field.
2. The join family dialog MUST include a "Character Name" input field.
3. When a user completes family creation, the character name MUST be stored temporarily and passed to the character creation dialog.
4. When a user completes family join, the character name MUST be stored temporarily and passed to the character creation dialog.
5. The character creation dialog MUST pre-fill the character name field with the value from family creation/join.
6. The pre-filled character name field in character creation MUST be editable by the user.
7. The character creation dialog MUST NOT require the user to re-type their character name if it was already provided.
8. If the character name field is empty in character creation (edge case), it MUST still be required and validated.

### Class Bonus Display

9. The character creation dialog MUST display class bonus information for each available class.
10. Class bonus information MUST accurately reflect the current static bonuses implemented in the codebase (as of implementation time).
11. Each class option MUST show:
    - Class name
    - Class icon/visual identifier
    - List of bonuses as fixed multipliers (e.g., "+20% XP on all quests", "+15% Gold on all quests")
    - Brief class description
12. The class bonus display MUST be mobile-responsive with horizontal swipe cards.
13. On desktop, class options MAY be displayed in a grid or list format.
14. On mobile (viewport < 768px), class options MUST be displayed as horizontally scrollable/swipeable cards.
15. The selected class MUST be visually highlighted to indicate active selection.
16. Class selection MUST update the preview of bonuses in real-time as the user explores options.

### Mobile-Responsive Design

17. The class selection UI MUST support touch gestures (swipe) on mobile devices.
18. Class cards MUST be large enough for comfortable touch interaction (minimum 44px touch targets).
19. The character creation dialog MUST remain fully functional on mobile viewports (down to 320px width).
20. Scrollable class cards MUST have visual indicators showing there are more options to swipe to.

### Testing & Quality

21. All existing E2E tests MUST be updated to match the new character name flow.
22. New E2E tests MUST cover:
    - Character name pre-filling from family creation
    - Character name pre-filling from family join
    - Character name editing in character creation
    - Class bonus information display
    - Mobile swipe interaction for class selection
23. Unit tests MUST cover character name state management and passing between dialogs.
24. Visual regression tests SHOULD cover the new class selection UI on both mobile and desktop.

## Non-Goals (Out of Scope)

1. **Quest Type Implementation** - This feature will NOT implement quest types or dynamic class bonuses based on quest types. Class bonuses will display current static bonuses only.
2. **Class Change Feature** - Users will NOT be able to change their character class after creation. This may be a future feature.
3. **Character Editing** - The enhanced creation experience will NOT apply to editing existing characters, only new character creation.
4. **Migration/Retroactive Updates** - Existing characters created before this feature will NOT require updates or changes.
5. **Extended Demo Families** - This feature will NOT create additional demo families. One demo family with a GM and Hero is sufficient.
6. **Character Prompts for Existing Users** - Users who already have characters will NOT see notifications or prompts about the new class information.
7. **Dynamic Bonus Calculation** - Bonuses will NOT be calculated from family quest templates. They will be static values reflecting current game mechanics.

## Design Considerations

### Character Name Flow
- Family creation/join dialogs should clearly label the character name field
- Character creation dialog should show the pre-filled name with a subtle indicator it came from the previous step (e.g., placeholder text or help text)
- Edit icon or clear indication that the name is editable despite being pre-filled

### Class Selection UI (Mobile)
- Horizontal scrollable card layout for mobile
- Each card should be full-width or near full-width to focus attention
- Snap-to-grid scrolling for smooth card transitions
- Visual "dot" indicators showing current position in card carousel
- Smooth animations when swiping between class options

### Class Selection UI (Desktop)
- Grid layout (2-3 columns) or vertical list
- Hover states to preview class information
- Click to select with clear visual feedback

### Class Bonus Display Format
Based on the current `RewardCalculator.getClassBonus()` implementation, bonuses are **fixed multipliers applied to all quests**, not quest-type-specific.

Example format for each class:

**Mage:**
```
🔮 MAGE
"Masters of arcane knowledge and wisdom"

Bonuses on ALL quests:
• +20% XP
• No gold bonus
• No honor bonus
• No gems bonus
```

**Rogue:**
```
🗡️ ROGUE
"Masters of cunning and fortune"

Bonuses on ALL quests:
• +15% Gold
• No XP bonus
• No honor bonus
• No gems bonus
```

**Knight:**
```
🛡️ KNIGHT
"Balanced warriors of honor"

Bonuses on ALL quests:
• +5% XP
• +5% Gold
• No honor bonus
• No gems bonus
```

**Healer:**
```
✨ HEALER
"Supportive heroes who strengthen the family"

Bonuses on ALL quests:
• +10% XP
• +25% Honor Points
• No gold bonus
• No gems bonus
```

**Ranger:**
```
🏹 RANGER
"Seekers of rare treasures"

Bonuses on ALL quests:
• +30% Gems
• No XP bonus
• No gold bonus
• No honor bonus
```

**Note:** These bonuses apply as multipliers to quest rewards, regardless of quest type.

## Technical Considerations

### State Management
- Character name should be stored in component state or React Context during the onboarding flow
- Consider using URL query parameters or session storage if dialogs are separate routes
- Ensure state persists across dialog transitions (family creation → character creation)

### Existing Code Integration
- Character creation dialog component will need props for pre-filled name
- Family creation and join family dialogs will need to pass character name to character creation
- Review existing character creation service/API to ensure name parameter is properly handled

### Data Source for Class Bonuses
- Class bonuses are already implemented in `lib/reward-calculator.ts` in the `RewardCalculator.getClassBonus()` method
- Create a constant/configuration file (e.g., `constants/characterClasses.ts`) that:
  - Imports or duplicates the bonus values from `RewardCalculator.getClassBonus()`
  - Adds UI metadata (name, description, icon) for each class
  - Keeps bonus values in sync with the actual reward calculation logic
- Example structure:
  ```typescript
  interface CharacterClassInfo {
    id: CharacterClass; // 'MAGE' | 'ROGUE' | 'KNIGHT' | 'HEALER' | 'RANGER'
    name: string;
    description: string;
    icon: string;
    bonuses: {
      xp: number;      // Multiplier (1.0 = no bonus, 1.2 = +20%)
      gold: number;    // Multiplier
      honor: number;   // Multiplier
      gems: number;    // Multiplier
    };
  }
  ```
- **Important:** Bonus values must match `RewardCalculator.getClassBonus()` exactly to avoid confusion

### Mobile Swipe Implementation
- Consider using a library like `react-swipeable` or `keen-slider` for touch gestures
- Alternatively, implement custom touch event handlers
- Ensure accessibility: swipe should not be the ONLY way to navigate (provide arrows/buttons)

### Testing Strategy
- E2E tests will need to be updated to:
  - Enter character name in family creation/join
  - Verify character name appears pre-filled in character creation
  - Optionally edit the character name
  - Verify character is created with correct name
- Mock character class data for consistent test results
- Test mobile viewport specifically for swipe interactions

## Success Metrics

1. **Reduced Onboarding Friction**: 0% of users need to enter character name twice
2. **Improved Class Selection**: Users spend more time reviewing class options (indicating informed decision-making)
3. **Mobile Usability**: Class selection completion rate on mobile devices matches or exceeds desktop
4. **Test Coverage**: 100% of E2E tests updated and passing with new flow
5. **Zero Regressions**: No existing functionality broken by character name flow changes

## Open Questions

1. **Should we show a "Previous Step" summary in character creation?** (e.g., "Creating character for family: Smith Family")
2. **Should class bonuses be collapsible/expandable on mobile to save space?** (Recommendation: No, keep them always visible for informed selection)
3. **What happens if a user refreshes during character creation?** Should we persist the character name in session storage?
4. **Should we add analytics tracking to measure how long users spend reviewing class bonuses?**
5. **Do we need to support keyboard navigation (arrow keys) for class selection on desktop?**

---

**Next Steps After PRD Approval:**
1. Review and update E2E tests to identify all locations testing character name input
2. Create character class configuration file with current static bonuses
3. Implement character name state passing from family dialogs to character creation
4. Build class bonus display component with mobile swipe functionality
5. Update all affected E2E tests
6. Run full quality gate (build, lint, unit tests, E2E tests)
