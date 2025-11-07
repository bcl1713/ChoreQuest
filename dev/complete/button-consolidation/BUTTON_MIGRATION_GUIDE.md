# Button Migration Guide - FantasyButton to Button

**Document Version:** 1.0
**Last Updated:** 2025-11-07
**Status:** FantasyButton Deprecation - v0.3.x (Removal planned for v1.0.0)

---

## Overview

The `FantasyButton` component is being deprecated in favor of the `Button` component from `@/components/ui/button`. This guide provides a complete migration path for developers working with ChoreQuest.

**Timeline:**
- **v0.3.x**: FantasyButton deprecated with warnings
- **v0.4.0+**: JSDoc deprecation warnings appear in IDEs
- **v1.0.0**: FantasyButton removed entirely

---

## Why Migrate?

### Advantages of the New Button Component

1. **Better Accessibility**
   - Proper ARIA attributes
   - Full keyboard navigation support
   - Screen reader friendly

2. **Enhanced Prop API**
   - Cleaner, more intuitive props
   - `startIcon` and `endIcon` props for icon placement
   - Better responsive sizing with `size="icon-sm"`

3. **Consistency**
   - Used across all dashboard, profile, and authentication components
   - Unified design system
   - Better maintainability

4. **Type Safety**
   - Full TypeScript support with better inference
   - Clear prop documentation in IDE

5. **Performance**
   - Smaller bundle size (no unnecessary animations)
   - No framer-motion dependency required
   - Faster rendering

---

## Migration Steps

### Step 1: Identify Usage

Search for all FantasyButton imports:

```bash
rg "import.*FantasyButton" --type ts --type tsx
rg "FantasyButton" --type ts --type tsx
```

### Step 2: Replace Import

**Before:**
```tsx
import { FantasyButton } from '@/components/ui/FantasyButton';
```

**After:**
```tsx
import { Button } from '@/components/ui/button';
```

### Step 3: Update Component Usage

#### Basic Text Button

**Before:**
```tsx
<FantasyButton variant="primary">
  Click Me
</FantasyButton>
```

**After:**
```tsx
<Button variant="primary">
  Click Me
</Button>
```

#### Button with Icon (Left)

**Before:**
```tsx
<FantasyButton variant="primary" icon={<LockIcon />}>
  Unlock
</FantasyButton>
```

**After:**
```tsx
<Button variant="primary" startIcon={<LockIcon />}>
  Unlock
</Button>
```

#### Button with Icon (Right)

**Before:**
```tsx
<FantasyButton variant="primary" icon={<ArrowIcon />}>
  Next
</FantasyButton>
```

**After:**
```tsx
<Button variant="primary" endIcon={<ArrowIcon />}>
  Next
</Button>
```

#### Icon-Only Button

**Before:**
```tsx
<FantasyButton variant="secondary" size="sm" icon={<SettingsIcon />}>
</FantasyButton>
```

**After:**
```tsx
<Button size="icon-sm" variant="secondary">
  <SettingsIcon />
</Button>
```

Or for responsive icon-only:
```tsx
<Button
  size="icon-sm"
  variant="secondary"
  className="sm:w-auto sm:px-4 sm:py-2.5 sm:h-auto"
>
  <SettingsIcon className="sm:mr-2" />
  <span className="hidden sm:inline">Settings</span>
</Button>
```

#### Loading State

**Before:**
```tsx
<FantasyButton isLoading={true} disabled={loading}>
  Submit
</FantasyButton>
```

**After:**
```tsx
<Button disabled={loading}>
  {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
  Submit
</Button>
```

---

## Prop Mapping Reference

| FantasyButton Prop | Button Prop | Notes |
|------------------|------------|-------|
| `variant` | `variant` | Works the same: `primary`, `secondary`, `danger`, `success` |
| `size` | `size` | `sm` → `sm`, `md` → `md`, `lg` → `lg`, icon-only → `icon-sm` |
| `icon` | `startIcon` or `endIcon` | Use `startIcon` for left, `endIcon` for right |
| `isLoading` | Custom implementation | Show loader inside button children instead |
| `disabled` | `disabled` | Works the same |
| `className` | `className` | Works the same for custom styling |

---

## Examples by Use Case

### Authentication Buttons

**Profile - Character Name Form**

Before:
```tsx
<FantasyButton
  variant="primary"
  icon={<PencilIcon />}
  type="submit"
>
  Update Name
</FantasyButton>
```

After:
```tsx
<Button
  variant="primary"
  startIcon={<PencilIcon />}
  type="submit"
>
  Update Name
</Button>
```

### Dashboard Header Buttons (Responsive)

Before:
```tsx
<FantasyButton
  variant="secondary"
  icon={<AdminIcon />}
  size="sm"
>
  Admin
</FantasyButton>
```

After:
```tsx
<Button
  size="icon-sm"
  className="sm:w-auto sm:px-4 sm:py-2.5 sm:h-auto"
>
  <AdminIcon className="sm:mr-2" />
  <span className="hidden sm:inline">Admin</span>
</Button>
```

### Loading States (Form Submission)

Before:
```tsx
const [loading, setLoading] = useState(false);
return (
  <FantasyButton
    isLoading={loading}
    disabled={loading}
  >
    Submit
  </FantasyButton>
);
```

After:
```tsx
const [loading, setLoading] = useState(false);
return (
  <Button disabled={loading}>
    {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
    Submit
  </Button>
);
```

---

## Testing After Migration

### Unit Tests

Update test snapshots if using snapshot testing:

```bash
npm run test -- --updateSnapshot
```

### Manual Testing

1. **Desktop View**: Verify button appearance and hover states
2. **Mobile View**: Confirm responsive behavior (icon-only on mobile)
3. **Accessibility**: Test keyboard navigation with Tab key
4. **Screen Reader**: Verify button text is announced correctly

### Verification Checklist

- [ ] Button appears correctly on desktop
- [ ] Button is responsive on mobile
- [ ] Icon alignment is correct
- [ ] Hover/active states work
- [ ] Loading state works (if applicable)
- [ ] Disabled state works
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] No console warnings about FantasyButton

---

## Common Issues & Solutions

### Issue: Icon Not Aligned

**Problem:** Icon and text are misaligned using `startIcon`

**Solution:** Make sure the icon component is properly sized. Use `className="h-4 w-4"` for consistency.

```tsx
<Button startIcon={<Icon className="h-4 w-4" />}>
  Label
</Button>
```

### Issue: Responsive Icon-Only Button Breaking

**Problem:** Icon-only button doesn't expand to show text on desktop

**Solution:** Add responsive classes explicitly:

```tsx
<Button
  size="icon-sm"
  className="sm:w-auto sm:px-4 sm:py-2.5 sm:h-auto"
>
  <Icon className="sm:mr-2" />
  <span className="hidden sm:inline">Label</span>
</Button>
```

### Issue: No Loading Spinner

**Problem:** Button has no loading indicator

**Solution:** Import and use Loader component from react-icons or add spinner manually:

```tsx
import { Loader } from 'lucide-react';

<Button disabled={isLoading}>
  {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
  Submit
</Button>
```

---

## Development Notes

### Console Warning in Development

When working on the codebase, you'll see deprecation warnings in the browser console:

```
[DEPRECATION] FantasyButton is deprecated and will be removed in v1.0.0.
Please use the Button component from @/components/ui/button instead.
```

This warning is only shown in development mode (`process.env.NODE_ENV === 'development'`).

### IDE Autocomplete

When using FantasyButton, your IDE will show the `@deprecated` JSDoc annotation. Click "Quick Fix" to get migration suggestions.

---

## Migration Checklist

Use this checklist to track your migration:

- [ ] Identified all FantasyButton usages
- [ ] Replaced imports from `FantasyButton` to `Button`
- [ ] Updated component props:
  - [ ] `icon` → `startIcon` or `endIcon`
  - [ ] `isLoading` → custom loader implementation
- [ ] Added responsive styling if needed
- [ ] Tested on desktop view
- [ ] Tested on mobile view
- [ ] Verified keyboard navigation
- [ ] Ran unit tests: `npm run test`
- [ ] No console warnings in dev mode

---

## Getting Help

If you encounter issues during migration:

1. Check the examples above for your use case
2. Review the Button component props: `components/ui/button.tsx`
3. Look at existing implementations (Profile, Dashboard) for patterns
4. Create an issue on GitHub with the specific problem

---

## Deprecation Timeline

### Current Release (v0.3.x)
- ✅ FantasyButton works but shows deprecation warning
- ✅ JSDoc annotations guide developers
- ✅ Migration guide available

### Next Release (v0.4.0+)
- ⏳ FantasyButton still present but heavily discouraged
- ⏳ More prominent warnings in documentation
- ⏳ Deadline for migration: v0.5.0

### Major Release (v1.0.0)
- ❌ FantasyButton removed entirely
- ❌ Any remaining imports will cause build errors

---

## Related Issues

- **#112** - Home page button alignment (Fixed with Button migration)
- **#114** - Dashboard tab refactoring (Future enhancement)

---

**Last Updated:** 2025-11-07
**Deprecation Notice Added:** Session 4
**Next Review:** v0.4.0 planning
