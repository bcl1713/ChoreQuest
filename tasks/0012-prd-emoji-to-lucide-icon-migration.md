# PRD 0012: Emoji to Lucide Icon Migration

## 1. Introduction/Overview

ChoreQuest currently uses emoji characters throughout the UI, tests, and documentation. This PRD outlines the migration from emoji to Lucide icons for improved consistency, maintainability, and visual polish across the application. Lucide icons provide better control over sizing, styling, accessibility, and cross-platform rendering compared to emoji characters.

**Problem:** Emoji characters have inconsistent rendering across platforms, limited styling options, and accessibility challenges.

**Solution:** Systematically replace all emoji with semantically appropriate Lucide icons from the `lucide-react` library.

## 2. Goals

1. Replace all emoji in the UI with corresponding Lucide icons
2. Update test assertions that expect emoji to use Lucide icons instead
3. Migrate documentation to use icon references where possible
4. Improve accessibility with proper aria-labels for all icons
5. Maintain visual consistency and user experience throughout migration
6. Establish patterns and guidelines for future icon usage

## 3. User Stories

**As a user**, I want consistent icon rendering across all devices so that the app looks professional regardless of my platform.

**As a user with screen reader**, I want icons to have proper labels so that I can understand what each icon represents.

**As a developer**, I want a clear icon component pattern so that I can easily add icons without worrying about inconsistencies.

**As a designer**, I want control over icon styling (size, color, stroke) so that icons integrate seamlessly with the design system.

## 4. Functional Requirements

### 4.1 Icon Replacement

**FR-1:** All emoji characters in UI components MUST be replaced with corresponding Lucide icons according to the mapping in `tasks/emoji-to-lucide-icon-mapping.md`

**FR-2:** All emoji in test files that assert on UI content MUST be updated to expect Lucide icon components or their rendered output

**FR-3:** Documentation markdown files SHOULD replace emoji with text references to icons (e.g., "Settings icon" instead of ⚙️) where emoji cannot be replaced with actual Lucide components

**FR-4:** User-generated content areas MUST preserve emoji support (not replaced with icons)

### 4.2 Component Architecture

**FR-5:** The implementation SHOULD follow existing patterns in the codebase for icon usage (direct Lucide component imports)

**FR-6:** Icon components MUST be imported from `lucide-react` library

**FR-7:** Common icon patterns MAY be extracted into reusable wrapper components if it improves maintainability (e.g., class icons, currency icons)

### 4.3 Styling & Consistency

**FR-8:** Icons MUST maintain appropriate sizing for their context:
- Inline text icons: 16px
- Button icons: 18px
- Header/section icons: 20-24px
- Large display icons: 32px

**FR-9:** Icons MUST inherit text color by default unless specific color is semantically important

**FR-10:** Icon spacing relative to adjacent text MUST remain visually consistent with current emoji spacing

### 4.4 Accessibility

**FR-11:** All meaningful icons MUST include `aria-label` attributes describing their purpose

**FR-12:** Purely decorative icons MUST be marked with `aria-hidden="true"`

**FR-13:** Icon implementations SHOULD follow WCAG 2.1 AA guidelines for color contrast where applicable

### 4.5 Migration Strategy

**FR-14:** Migration MUST be performed incrementally by feature area in this order:
1. Dashboard & character system
2. Quest system
3. Reward system
4. Admin panel
5. Documentation

**FR-15:** Each feature area migration MUST be completed in a single focused commit

**FR-16:** All tests MUST pass after each incremental migration before proceeding to next area

## 5. Non-Goals (Out of Scope)

**NG-1:** This migration will NOT create custom icon components or icon library beyond what Lucide provides

**NG-2:** This migration will NOT change the semantic meaning or purpose of existing icons (no UX redesign)

**NG-3:** This migration will NOT add unit tests to verify emoji absence (manual verification only)

**NG-4:** This migration will NOT replace emoji in user-generated content (chat, comments, custom quest descriptions)

**NG-5:** This migration will NOT add new icons or icon usage beyond replacing existing emoji

## 6. Design Considerations

### 6.1 Icon Component Pattern

Follow existing Lucide React patterns in the codebase:

```tsx
import { Star, Coins, Shield } from 'lucide-react'

// Inline icon with text
<span className="flex items-center gap-2">
  <Star size={16} aria-label="XP reward" />
  <span>50 XP</span>
</span>

// Decorative icon
<Trophy size={24} aria-hidden="true" className="text-yellow-500" />
```

### 6.2 Sizing Guidelines

Based on context and existing emoji sizes:
- **Small (16px):** Inline with text, table cells, small badges
- **Medium (18-20px):** Buttons, form labels, cards
- **Large (24-32px):** Page headers, feature icons, empty states

### 6.3 Color Strategy

- Inherit parent text color by default
- Use semantic colors for status icons (green for success, red for error, yellow for warning)
- Use theme colors for branded elements (gold coins, gem icons)

### 6.4 Component Extraction (Optional)

If repeated patterns emerge, consider extracting:
- `<CurrencyIcon type="gold" | "gem" />` wrapper
- `<ClassIcon class={CharacterClass} />` wrapper
- `<StatusIcon status="success" | "error" | "warning" />` wrapper

## 7. Technical Considerations

### 7.1 Dependencies

- `lucide-react` is already installed and in use
- No new dependencies required

### 7.2 Import Strategy

Replace emoji strings with Lucide imports at the top of each file:

```tsx
// Before
const rewardIcon = "🎁"

// After
import { Gift } from 'lucide-react'
// Use: <Gift size={20} />
```

### 7.3 Test Updates

Update tests expecting emoji to work with Lucide components:

```tsx
// Before
expect(screen.getByText(/🏆/)).toBeInTheDocument()

// After
expect(screen.getByLabelText('Achievement trophy')).toBeInTheDocument()
// or
expect(container.querySelector('[data-lucide="trophy"]')).toBeInTheDocument()
```

### 7.4 File Priority

Reference `tasks/emoji-to-lucide-icon-mapping.md` section "Files Requiring Attention" for prioritized file list.

## 8. Success Metrics

**SM-1:** Zero emoji characters remain in UI component source code (verified by manual review)

**SM-2:** All UI screens display Lucide icons instead of emoji (verified by manual QA)

**SM-3:** All test suites pass after migration (`npm run test`)

**SM-4:** Build completes with zero errors (`npm run build`)

**SM-5:** Lint passes with zero warnings (`npm run lint`)

**SM-6:** Visual regression testing shows no unintended layout shifts or visual breaks

**SM-7:** Documentation updated with icon usage guidelines

**SM-8:** Accessibility audit shows all icons have proper labels or aria-hidden attributes

## 9. Acceptance Criteria

- [ ] All High Priority files migrated (dashboard, landing, admin tabs, reward store, quest cards)
- [ ] All Medium Priority files migrated (activity feed, statistics, character classes, tests)
- [ ] All Lower Priority files migrated (documentation)
- [ ] Manual QA checklist completed for each feature area
- [ ] Visual regression testing completed
- [ ] All quality gates pass (build, lint, test)
- [ ] Developer documentation updated with icon usage guidelines
- [ ] Design system documentation updated with icon reference guide
- [ ] All meaningful icons have aria-labels
- [ ] All decorative icons marked aria-hidden

## 10. Open Questions

**Q1:** Should we add any custom icon animations (e.g., spinning loader, pulsing streak fire)?
- *Deferred to implementation phase - use Lucide defaults initially*

**Q2:** Should currency icons (Coins, Gem) have specific theme colors or inherit text color?
- *Recommend: gold for Coins (#F59E0B), cyan for Gem (#06B6D4) to maintain visual recognition*

**Q3:** Do we need fallback strategy if Lucide icon renders incorrectly?
- *No fallback needed - Lucide is stable and well-supported*

**Q4:** Should the mapping document be kept in sync or archived after migration?
- *Keep as reference documentation for future icon decisions*

---

## Appendix: Reference Documents

- **Icon Mapping:** `/tasks/emoji-to-lucide-icon-mapping.md`
- **Lucide React Docs:** https://lucide.dev/guide/packages/lucide-react
- **WCAG Color Contrast:** https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
