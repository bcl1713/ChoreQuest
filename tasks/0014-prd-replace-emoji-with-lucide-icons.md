# PRD-0014: Replace All Emoji with Lucide Icons

## Introduction/Overview

Replace all emoji characters used in the codebase and UI with Lucide icons to improve consistency, maintainability, and visual quality across the ChoreQuest application. Emojis in Markdown documentation files and comments can remain, but all emojis in actual code (TypeScript, TSX, JavaScript) must be replaced with appropriate Lucide icons.

**Problem Statement:** The current codebase uses emoji characters (🔮, 🗡️, 🛡️, ✨, 🏹, 💰, ⭐, 📱, etc.) throughout UI components, constants, and even test files. While emojis provide quick visual indicators, they create inconsistencies across platforms, lack customization options (sizing, coloring), and don't align with the application's fantasy theme aesthetic.

**Goal:** Eliminate all emoji from production code while maintaining or improving the visual communication and user experience through consistent, customizable Lucide icon components.

## Goals

1. **Complete Emoji Removal**: Replace 100% of emoji characters in all TypeScript, TSX, JavaScript, and JSX files with appropriate Lucide icons
2. **Visual Consistency**: Establish standardized icon sizing and usage patterns across the entire application
3. **Semantic Clarity**: Select icons based on semantic meaning rather than visual similarity to emojis
4. **Maintainability**: Create a reference mapping document for future development and consistency
5. **Zero Regression**: Ensure all existing tests pass and functionality remains unchanged after replacement

## User Stories

1. **As a developer**, I want consistent icon usage throughout the codebase so that I can easily understand and maintain UI components without dealing with emoji rendering inconsistencies.

2. **As a user**, I want visually consistent icons across all devices so that the application looks professional and polished regardless of my operating system or browser.

3. **As a designer**, I want customizable icon sizes and colors so that I can maintain visual hierarchy and brand consistency throughout the interface.

4. **As a new contributor**, I want clear documentation on icon mappings so that I can maintain consistency when adding new features.

5. **As a QA tester**, I want test files to match production code patterns so that tests accurately represent the actual user experience.

## Functional Requirements

### FR-1: Icon Size Standardization
The system must define and implement four standard icon sizes:
- `sm`: 16px (for inline text, badges, small UI elements)
- `md`: 20px (default size for most UI elements)
- `lg`: 24px (for prominent buttons, headers)
- `xl`: 32px (for hero sections, large feature displays)

### FR-2: Character Class Icons
Replace the following emoji in `lib/constants/character-classes.ts`:
- 🔮 (MAGE) → `Sparkles` icon
- 🗡️ (ROGUE) → `Sword` icon
- 🛡️ (KNIGHT) → `Shield` icon
- ✨ (HEALER) → `Heart` icon
- 🏹 (RANGER) → `Target` icon

### FR-3: Reward Type Icons
Replace reward type emojis in `components/rewards/reward-store/reward-card.tsx` and related files:
- 📱 (SCREEN_TIME) → `Smartphone` icon
- ⭐ (PRIVILEGE) → `Star` icon
- 💰 (PURCHASE) → `Coins` icon
- 🎈 (EXPERIENCE) → `PartyPopper` icon

### FR-4: Status and Action Icons
Replace common UI emojis throughout the application:
- ⏳ (Pending) → `Clock` icon
- 🔒 (Locked/Insufficient) → `Lock` icon
- ⚡ (Action/Redeem) → `Zap` icon
- 💰 (Gold/Currency) → `Coins` icon

### FR-5: Comprehensive Code Scan
Must identify and replace emojis in all of the following file types:
- Production components (*.tsx, *.ts)
- Test files (*.test.tsx, *.test.ts)
- Utility functions (lib/utils/*.ts)
- API routes (app/api/**/route.ts)
- Hook implementations (hooks/*.ts)
- Constants and configuration files

### FR-6: Icon Component Consistency
All Lucide icons must be imported and used consistently:
```typescript
import { IconName } from 'lucide-react';

<IconName size={20} className="..." />
```

### FR-7: Mapping Documentation
Create a comprehensive mapping document at `/docs/emoji-to-icon-mapping.md` containing:
- Original emoji character
- Context/usage location
- Replacement Lucide icon name
- Size used
- Rationale for selection

### FR-8: Test File Updates
All test files must be updated to:
- Replace emoji assertions with icon component checks
- Update snapshots if applicable
- Verify icon props (size, className) are correct

### FR-9: Preserve Documentation Emojis
Must NOT replace emojis in:
- Markdown files (*.md)
- Code comments (// and /* */ blocks)
- Commit messages
- Documentation strings

### FR-10: Backwards Compatibility
The replacement must maintain:
- All existing functionality
- Current visual hierarchy
- User workflows
- Accessibility attributes

## Non-Goals (Out of Scope)

1. **Custom Icon Design**: This PRD does not include creating custom SVG icons; only Lucide icons will be used
2. **Animation Changes**: Icon replacements should not introduce new animations unless the emoji had implicit animation
3. **Layout Restructuring**: The replacement should not require major layout changes; icons should fit in existing layouts
4. **Emoji in Git History**: No changes to historical commit messages or documentation in git history
5. **External Dependencies**: No replacement of emojis in third-party libraries or node_modules
6. **Database Content**: Emojis stored in database content (user-generated text, quest descriptions) are out of scope

## Design Considerations

### Icon Selection Principles
1. **Semantic Priority**: Choose icons that best represent the meaning/function
2. **Clarity Over Similarity**: Prioritize clear, recognizable icons over visual emoji similarity
3. **Fantasy Theme Alignment**: Where possible, select icons that enhance the fantasy/medieval theme
4. **Lucide Library First**: All icons must come from the Lucide React library

### Size Guidelines
- Use `sm` (16px) for: inline text indicators, table cells, badges
- Use `md` (20px) for: standard buttons, list items, form labels (default)
- Use `lg` (24px) for: prominent buttons, section headers, navigation
- Use `xl` (32px) for: hero sections, large feature cards, character class displays

### Color and Styling
- Icons should respect existing color schemes (text color, theme colors)
- Use Tailwind classes for consistent styling
- Maintain accessibility contrast ratios

## Technical Considerations

### Dependencies
- **lucide-react**: Already installed and used in the project
- No additional dependencies required

### Implementation Strategy
1. Create a centralized icon size constant/utility for standardization
2. Replace character class icons first (high visibility, well-defined)
3. Replace reward type icons second (repeated usage pattern)
4. Perform systematic search and replace for remaining emojis
5. Update all test files to match production changes
6. Generate mapping documentation as replacements are made

### File Scope
Based on initial scan, approximately 209 files contain emojis that need review:
- Components: ~80 files
- Tests: ~60 files
- Lib/Utils: ~40 files
- API routes: ~15 files
- Other (hooks, config, etc.): ~14 files

### Migration Approach
Use the following search patterns to identify emojis:
```bash
# Regex pattern for emoji detection
[\p{Emoji_Presentation}\p{Emoji}\x{FE0F}]
```

Exclude from search:
- `*.md` files
- Comment blocks
- String literals in documentation

## Success Metrics

### Quantitative Metrics
1. **Complete Removal**: 0 emoji characters remain in .ts, .tsx, .js, .jsx files
2. **Test Coverage**: 100% of existing tests updated and passing
3. **Build Success**: Zero compilation errors or warnings related to changes
4. **Lint Clean**: No new linting errors introduced

### Qualitative Metrics
1. **Visual Consistency**: Icons appear uniform across different browsers and operating systems
2. **Developer Satisfaction**: Team feedback indicates improved code maintainability
3. **User Experience**: No negative user feedback regarding visual changes
4. **Documentation Quality**: Mapping document provides clear guidance for future development

## Open Questions

1. **Icon Color Variations**: Should we establish standard color variants (e.g., success, warning, error) for common icons?
   - *Suggested Resolution*: Follow existing Tailwind color patterns in current components

2. **Icon Animation**: Should any icons have hover effects or transitions that emojis didn't have?
   - *Suggested Resolution*: Maintain existing behavior; add animations only if UX benefit is clear

3. **Accessibility Labels**: Should all icons include aria-label attributes?
   - *Suggested Resolution*: Yes, add descriptive aria-labels to all standalone icons for screen readers

4. **Icon Wrapper Component**: Should we create a centralized `<Icon>` wrapper component for standardization?
   - *Suggested Resolution*: Evaluate after initial replacements; create if pattern emerges

## Acceptance Criteria

- [ ] All 209+ files containing emojis have been reviewed
- [ ] All emoji characters in production code (.ts, .tsx, .js, .jsx) have been replaced with Lucide icons
- [ ] All emoji characters in test files have been replaced with Lucide icons
- [ ] Standardized icon sizes (sm, md, lg, xl) are defined and consistently used
- [ ] `/docs/emoji-to-icon-mapping.md` document is created with comprehensive mappings
- [ ] All unit tests pass (`npm run test`)
- [ ] All integration tests pass
- [ ] Build completes without errors (`npm run build`)
- [ ] Lint passes without warnings (`npm run lint`)
- [ ] No emojis remain in code files (verified by grep search)
- [ ] Emojis in .md files and comments remain unchanged
- [ ] Visual regression testing shows no unexpected UI changes
- [ ] Accessibility testing confirms icons have appropriate labels
- [ ] Code review confirms semantic icon choices are appropriate

## Implementation Notes

### Priority Order
1. **Phase 1**: Character class icons (highest visibility)
2. **Phase 2**: Reward type icons (repeated pattern)
3. **Phase 3**: Status and action icons (UI consistency)
4. **Phase 4**: Remaining utility and helper emojis
5. **Phase 5**: Test file updates
6. **Phase 6**: Documentation and verification

### Testing Strategy
- Update test snapshots as needed
- Verify icon components render correctly
- Check icon props (size, className, aria-label)
- Ensure test assertions check for icon presence, not emoji strings

### Documentation Requirements
- Update component documentation with new icon usage
- Create migration guide for future icon additions
- Document any deviations from standard size guidelines
