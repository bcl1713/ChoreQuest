# FantasyButton Removal Plan - v1.0.0

**Document Version:** 1.0
**Created:** 2025-11-07
**Status:** Planning for v1.0.0 Release
**Priority:** High

---

## Executive Summary

This document outlines the plan to completely remove the deprecated `FantasyButton` component in the v1.0.0 major release. This will complete the button consolidation effort that began in v0.3.x.

---

## Timeline & Milestones

### v0.3.x (Current) - Deprecation Phase
**Status:** ✅ In Progress
- [x] Add `@deprecated` JSDoc comments
- [x] Add console warnings in development mode
- [x] Create migration guide for developers
- [x] Mark in TASKS.md for tracking
- **Target:** 2025-11-07

### v0.4.0 - Consolidation Phase (Next Release)
**Status:** ⏳ Planned
- [ ] Review all migrations completed in v0.3.x
- [ ] Audit codebase for any remaining FantasyButton usage
- [ ] Update documentation with migration deadline
- [ ] Plan any edge cases or special migrations
- **Target:** 2025-12-01

### v0.5.0 - Final Warning Phase
**Status:** ⏳ Planned
- [ ] Last chance for developers to migrate
- [ ] Prominent warnings in release notes
- [ ] PR template reminder about migration
- [ ] One final audit for FantasyButton usage
- **Target:** 2025-01-01

### v1.0.0 - Removal Phase
**Status:** ⏳ Planned
- [ ] Remove FantasyButton.tsx file
- [ ] Remove FantasyButton exports from index files
- [ ] Update CHANGELOG.md with BREAKING CHANGES
- [ ] Update README.md component documentation
- [ ] Remove from component storybook (if exists)
- [ ] Final test suite validation
- **Target:** 2025-03-01

---

## Pre-Removal Checklist

Before v1.0.0, ensure the following conditions are met:

### Code Audit
- [ ] Run final grep/rg to find any remaining FantasyButton imports
- [ ] Ensure all matches are either:
  - Tests that can be updated
  - Examples that can be updated
  - Storybook that can be removed
- [ ] Zero production usage of FantasyButton

### Documentation
- [ ] TASKS.md updated with completion status
- [ ] Migration guide linked from main README
- [ ] CHANGELOG.md includes BREAKING CHANGES section
- [ ] Component docs updated to remove FantasyButton

### Testing
- [ ] All tests pass without FantasyButton
- [ ] Build succeeds after removal
- [ ] No import errors in application
- [ ] Type checking passes

### Release Notes
- [ ] Clear explanation of breaking change
- [ ] Link to migration guide in release notes
- [ ] Update install/setup instructions if needed

---

## File Removal Steps

### Step 1: Identify All Files to Remove

```bash
# Find the component file
find . -name "FantasyButton.tsx" -type f

# Find test files
find . -name "*FantasyButton*.test.tsx" -o -name "*FantasyButton*.spec.tsx"

# Find storybook stories
find . -name "*FantasyButton*.stories.tsx"
```

### Step 2: Remove Component File

**Files to delete:**
- `components/ui/FantasyButton.tsx`
- `components/ui/__tests__/FantasyButton.test.tsx` (if exists)
- `components/ui/stories/FantasyButton.stories.tsx` (if exists)

**Command:**
```bash
git rm components/ui/FantasyButton.tsx
git rm components/ui/__tests__/FantasyButton.test.tsx
git rm components/ui/stories/FantasyButton.stories.tsx
```

### Step 3: Remove Exports

**File:** `components/ui/index.ts` (or similar barrel export)

Remove these lines:
```tsx
export { FantasyButton, type FantasyButtonProps, type FantasyButtonVariant, type FantasyButtonSize } from './FantasyButton';
```

### Step 4: Update Type Definitions

If FantasyButton types are exported in a types file:
```tsx
// Remove from any type definition files
types/FantasyButtonProps.ts (if it exists)
```

### Step 5: Search and Clean

```bash
# Search for any remaining references
rg "FantasyButton" --type ts --type tsx

# Should return: (only in git history, not in active code)
# [no results]
```

---

## Validation After Removal

### Build Validation
```bash
npm run build
# Expected: ✅ Successful compilation, 0 TypeScript errors
```

### Test Validation
```bash
npm run test
# Expected: ✅ All tests pass
```

### Lint Validation
```bash
npm run lint
# Expected: ✅ No warnings, no errors
```

### Type Checking
```bash
npx tsc --noEmit
# Expected: ✅ No type errors
```

---

## Migration Audit Commands

Use these commands to verify completion before removal:

```bash
# Find all FantasyButton usage
rg "FantasyButton" --type ts --type tsx

# Find all Fantasy-related classes (CSS)
rg "fantasy-button" --type tsx --type ts

# Ensure no remaining references
rg "from.*FantasyButton" --type ts --type tsx
```

**Expected Result:** Zero matches in source code (only in git history)

---

## CHANGELOG Entry

For v1.0.0 release notes:

```markdown
## Breaking Changes

### Component Removals

#### FantasyButton Component Deprecated
- **Removed:** `FantasyButton` component (`components/ui/FantasyButton.tsx`)
- **Replacement:** Use `Button` component from `@/components/ui/button`
- **Migration Guide:** See [Button Migration Guide](dev/active/button-consolidation/BUTTON_MIGRATION_GUIDE.md)

**What Changed:**
- The old `FantasyButton` with framer-motion animations has been removed
- All projects using the old Button component must migrate to the new `Button` component
- This was announced as deprecated in v0.3.x with console warnings

**Migration Example:**
```tsx
// Before (v0.3.x and earlier)
import { FantasyButton } from '@/components/ui/FantasyButton';
<FantasyButton icon={<Icon />}>Click me</FantasyButton>

// After (v1.0.0)
import { Button } from '@/components/ui/button';
<Button startIcon={<Icon />}>Click me</Button>
```

**Why This Change:**
- Reduced bundle size (no unnecessary animations)
- Improved accessibility
- Better prop API consistency
- Cleaner codebase maintenance
- Faster performance
```

---

## Rollback Plan

If issues arise after removal in v1.0.0:

1. **For Critical Issues:** Create hotfix branch from main
2. **Restore Process:**
   ```bash
   git show <hash-before-removal>:components/ui/FantasyButton.tsx > components/ui/FantasyButton.tsx
   git add components/ui/FantasyButton.tsx
   ```
3. **Release as patch (v1.0.1)** if critical

---

## Success Criteria

The removal is considered successful when:

- ✅ Zero FantasyButton imports in codebase
- ✅ All tests pass without modification
- ✅ Build succeeds with no errors
- ✅ No runtime errors in application
- ✅ All components render correctly
- ✅ No console warnings related to FantasyButton
- ✅ CHANGELOG clearly documents breaking change
- ✅ Developers can easily find migration guide

---

## Related Documentation

- **Migration Guide:** `dev/active/button-consolidation/BUTTON_MIGRATION_GUIDE.md`
- **Button Consolidation Plan:** `dev/active/button-consolidation/button-consolidation-plan.md`
- **Component Reference:** `components/ui/button.tsx`

---

## Dependencies to Verify

Before final removal, check if any external packages depend on FantasyButton:

```bash
# Check npm packages
npm ls | grep -i fantasy

# Check git history for who used it
git log --all --grep="FantasyButton"
```

Expected: No external dependencies

---

## Communication Plan

### Internal Team
- [ ] Announce deprecation in team standup
- [ ] Post migration guide in development wiki/docs
- [ ] Create PR template reminder about Button migration

### External (if applicable)
- [ ] Update README with new Button component
- [ ] Update getting started guide
- [ ] Create migration guide PR

---

## Notes & Observations

### Why Remove in v1.0.0?

1. **Semantic Versioning:** Major version (v1.0.0) is appropriate for breaking changes
2. **Sufficient Notice:** Deprecation warnings in v0.3.x+ provide 3+ months notice
3. **Clear Migration Path:** Button Migration Guide provides clear steps
4. **Bundle Size:** Removal reduces bundle by ~3-5KB (framer-motion unused exports)
5. **Codebase Health:** Consolidating to single Button component improves maintainability

### Lessons Learned

This deprecation process demonstrates best practices for component migrations:
- JSDoc deprecation comments in IDE
- Console warnings in development
- Comprehensive migration guide with examples
- Clear timeline and communication
- Proper semantic versioning

---

**Document Status:** Ready for v1.0.0 Planning Phase
**Last Updated:** 2025-11-07
**Next Review:** v0.4.0 Planning Meeting
