# Button Consolidation - Task Checklist

**Last Updated:** 2025-11-07

## Phase 1: Enhance Button Component (2-3 hours)

### 1.1 Add Motion Support
- [ ] Import Framer Motion in Button.tsx
- [ ] Import useReducedMotion hook
- [ ] Import ANIMATION_DURATION constant
- [ ] Wrap button with motion.button element
- [ ] Implement useReducedMotion hook
- [ ] Add whileHover animation (scale 1.05)
- [ ] Add whileTap animation (scale 0.95)
- [ ] Set animation duration to ANIMATION_DURATION.QUICK
- [ ] Handle disabled state (no animations when disabled)
- [ ] Verify animations trigger correctly

### 1.2 Add Accessibility Features
- [ ] Add touch-target class support for mobile accessibility
- [ ] Verify all variants have visible focus rings
- [ ] Ensure keyboard navigation works on all variants
- [ ] Check aria attributes are appropriate
- [ ] Verify focus order is logical
- [ ] Test with screen reader (if available)
- [ ] Verify WCAG 2.1 AA compliance

### 1.3 Write Animation Tests
- [ ] Test whileHover animation triggers
- [ ] Test whileTap animation triggers
- [ ] Verify animation scale values (1.05, 0.95)
- [ ] Test reduced motion preference respected
- [ ] Verify no animations when prefers-reduced-motion set
- [ ] Test disabled state doesn't animate
- [ ] Test loading state behavior
- [ ] Add 100% coverage for animation code

### 1.4 Quality Gates for Phase 1
- [ ] npm run build - Zero errors
- [ ] npm run lint - Zero warnings
- [ ] npm run test - All tests pass
- [ ] All new animation tests pass
- [ ] Button.test.tsx updated with animation tests

**Acceptance Criteria Met:**
- [ ] Button has Framer Motion animations on ALL variants
- [ ] Animations respect reduced motion preference
- [ ] All existing Button tests pass
- [ ] New animation tests pass for all variants
- [ ] Accessibility enhancements verified
- [ ] Zero build/lint errors

---

## Phase 2: Migrate Components (4-5 hours)

### 2.1 Simple Migrations (6 files - 2-3 hours)

#### 2.1.1 CharacterNameForm.tsx
- [ ] Update import: FantasyButton → Button
- [ ] Change `<FantasyButton>` → `<Button>`
- [ ] Verify button text unchanged
- [ ] Test form submission
- [ ] Verify styling matches before (now has animations)
- [ ] Commit changes

#### 2.1.2 ClassChangeForm.tsx
- [ ] Update import: FantasyButton → Button
- [ ] Change `<FantasyButton>` → `<Button>`
- [ ] Verify button text unchanged
- [ ] Test form submission
- [ ] Verify styling matches before (now has animations)
- [ ] Commit changes

#### 2.1.3 PasswordChangeForm.tsx
- [ ] Update import: FantasyButton → Button
- [ ] Change `<FantasyButton>` → `<Button>`
- [ ] Verify button text unchanged
- [ ] Test form submission
- [ ] Verify styling matches before (now has animations)
- [ ] Commit changes

#### 2.1.4 CharacterCreation.tsx
- [ ] Update import: FantasyButton → Button
- [ ] Change `<FantasyButton>` → `<Button>`
- [ ] Verify button text unchanged
- [ ] Test form submission
- [ ] Verify styling matches before (now has animations)
- [ ] Commit changes

#### 2.1.5 LevelUpModal.tsx
- [ ] Update import: FantasyButton → Button
- [ ] Change `<FantasyButton>` → `<Button>`
- [ ] Verify button text unchanged
- [ ] Test modal dismiss functionality
- [ ] Verify styling matches before (now has animations)
- [ ] Commit changes

#### 2.1.6 QuestCompleteOverlay.tsx
- [ ] Update import: FantasyButton → Button
- [ ] Change `<FantasyButton>` → `<Button>`
- [ ] Verify button text unchanged
- [ ] Test overlay dismiss functionality
- [ ] Verify styling matches before (now has animations)
- [ ] Commit changes

### 2.2 Complex Migration: AuthForm.tsx (2-3 hours)

#### 2.2.1 Refactor Structure
- [ ] Update import: FantasyButton → Button
- [ ] Extract button label logic (separate from icon logic)
- [ ] Create icon selection logic:
  - [ ] Login: Castle icon
  - [ ] Register: Swords icon
  - [ ] Create Family: Crown icon
- [ ] Create button label selection logic:
  - [ ] Login: "Enter Realm"
  - [ ] Register: "Join Guild"
  - [ ] Create Family: "Found Guild"

#### 2.2.2 Update Button Structure
- [ ] Change `<FantasyButton>` → `<Button variant="primary">`
- [ ] Move icon logic to startIcon prop
- [ ] Move text logic to children
- [ ] Remove className="mr-2" from icons
- [ ] Verify w-full and other props still work

#### 2.2.3 Test Each Button Type
- [ ] Test Login button:
  - [ ] Castle icon displays on left
  - [ ] "Enter Realm" text displays on right
  - [ ] Icon and text aligned horizontally (NOT vertically)
  - [ ] Spacing correct (no overlap)
  - [ ] Form submission works
- [ ] Test Register button:
  - [ ] Swords icon displays on left
  - [ ] "Join Guild" text displays on right
  - [ ] Icon and text aligned horizontally
  - [ ] Spacing correct
  - [ ] Form submission works
- [ ] Test Create Family button:
  - [ ] Crown icon displays on left
  - [ ] "Found Guild" text displays on right
  - [ ] Icon and text aligned horizontally
  - [ ] Spacing correct
  - [ ] Form submission works

#### 2.2.4 Test Loading States
- [ ] Loading state shows spinner
- [ ] Spinner replaces icon (or appears in icon position)
- [ ] Loading text displays correctly ("Processing...")
- [ ] Button disabled while loading
- [ ] Form submission triggers loading state

#### 2.2.5 Test Animations
- [ ] Hover animation works
- [ ] Tap animation works
- [ ] Animations respect reduced motion preference
- [ ] Visual feedback on interaction

#### 2.2.6 Commit Changes
- [ ] All changes committed with clear message

### 2.3 Post-Migration Testing
- [ ] npm run build - Zero errors
- [ ] npm run lint - Zero warnings
- [ ] npm run test - All tests pass
- [ ] No TypeScript errors in migrated files

**Acceptance Criteria Met:**
- [ ] All 7 files migrated
- [ ] Icons render beside text (Issue #112 FIXED)
- [ ] All buttons function correctly
- [ ] All tests pass
- [ ] Forms submit successfully
- [ ] Zero build/lint errors

---

## Phase 3: Verify and Test (1-2 hours)

### 3.1 Quality Gates
- [ ] npm run build - Zero TypeScript errors
- [ ] npm run lint - Zero linting errors
- [ ] npm run test - All tests pass
- [ ] No new warnings introduced

### 3.2 Manual Testing - Desktop
- [ ] Profile → Character Name: Form works, button animates
- [ ] Profile → Class Change: Form works, button animates
- [ ] Profile → Password Change: Form works, button animates
- [ ] Character Creation: All screens work, buttons animate
- [ ] Level Up Modal: Appears and dismisses correctly
- [ ] Quest Complete Overlay: Appears and dismisses correctly
- [ ] Auth Flow - Login: Enters Realm correctly
- [ ] Auth Flow - Register: Joins Guild correctly
- [ ] Auth Flow - Create Family: Creates family correctly

### 3.3 Manual Testing - Mobile
- [ ] Test all above on mobile viewport (375px width)
- [ ] Buttons responsive and tappable
- [ ] Icons and text properly spaced
- [ ] No overflow or layout issues
- [ ] Touch targets at least 44px

### 3.4 Manual Testing - Interactions
- [ ] Hover states visible (desktop):
  - [ ] Shadow transitions work
  - [ ] Scale animation triggers (1.05)
  - [ ] Color transitions smooth
- [ ] Active/tap states visible (mobile):
  - [ ] Scale animation (0.95) visible
  - [ ] Feedback immediate
- [ ] Disabled states look correct
- [ ] Loading states show spinner

### 3.5 Accessibility Testing
- [ ] Keyboard Tab navigation works
- [ ] Enter key triggers buttons
- [ ] Focus ring visible on all buttons
- [ ] Focus order logical
- [ ] Screen reader announces buttons correctly
- [ ] aria-busy set during loading

### 3.6 Visual Regression
- [ ] Compare button appearance before/after migration
- [ ] Icons positioned correctly (beside text, not above)
- [ ] Colors match design
- [ ] Shadow effects work
- [ ] Animations smooth and not jarring
- [ ] No visual regressions on existing buttons

### 3.7 Cross-Browser Testing (if possible)
- [ ] Chrome/Edge: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Mobile browsers: All features work

**Acceptance Criteria Met:**
- [ ] Build passes (zero errors)
- [ ] Lint passes (zero warnings)
- [ ] Tests pass (100%)
- [ ] All components render correctly
- [ ] Animations work smoothly
- [ ] Forms submit successfully
- [ ] No visual regressions
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Screen reader compatible

---

## Phase 4: Cleanup & Deprecation (1 hour)

### 4.1 Add Deprecation Notice
- [ ] Open FantasyButton.tsx
- [ ] Add JSDoc deprecation comment at top of file
- [ ] Include migration instructions
- [ ] Add console warning in dev mode
- [ ] Document that component will be removed in next major version

### 4.2 Document Migration Path
- [ ] Update component documentation (if exists)
- [ ] Add migration guide comment to FantasyButton
- [ ] Add troubleshooting note to dev docs (if needed)
- [ ] Document prop mapping for future developers

### 4.3 Plan Future Removal
- [ ] Create note about removing FantasyButton.tsx in next major version
- [ ] Create note about removing FantasyButton.test.tsx
- [ ] Update globals.css comments if fantasy button CSS is removed
- [ ] Plan archive of component for historical reference

### 4.4 Final Cleanup
- [ ] Search codebase for any remaining FantasyButton imports
- [ ] Verify no new FantasyButton usages exist
- [ ] Clean up any unused CSS classes from globals.css
- [ ] Update component exports (if needed)

**Acceptance Criteria Met:**
- [ ] Deprecation notice added
- [ ] Migration path documented
- [ ] No new FantasyButton usages possible
- [ ] Future removal planned

---

## Final Verification

### Pre-Merge Checklist
- [ ] All 4 phases complete
- [ ] All acceptance criteria met
- [ ] Zero build errors
- [ ] Zero lint warnings
- [ ] All tests passing
- [ ] Issue #112 resolved (icons beside text)
- [ ] No visual regressions
- [ ] Mobile responsive
- [ ] Keyboard accessible

### Merge Preparation
- [ ] Create feature branch: `feature/button-consolidation`
- [ ] All commits have clear messages
- [ ] Code review complete (if applicable)
- [ ] Ready for merge to develop

---

## Notes

### Progress Tracking
- Update this file as tasks complete
- Mark complete with `[x]` instead of `[ ]`
- Add notes for blockers or issues discovered
- Timestamp major milestones

### Known Gotchas
- AuthForm.tsx has 3 different button types - test all three
- Icons must be exactly 18px in AuthForm for correct alignment
- Fantasy variant needs to match FantasyButton styling closely
- Animations must respect prefers-reduced-motion for accessibility

### Testing Priority
1. **Critical:** Icon alignment (Issue #112) - must render beside text
2. **Critical:** Form submissions work
3. **High:** Animations work smoothly
4. **High:** Mobile responsive
5. **Medium:** Visual appearance matches
6. **Medium:** Accessibility features

---

**Status: Ready to begin Phase 1**
