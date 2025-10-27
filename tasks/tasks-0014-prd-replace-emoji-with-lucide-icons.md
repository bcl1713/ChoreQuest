# Tasks: Replace All Emoji with Lucide Icons

**PRD Reference:** `tasks/0014-prd-replace-emoji-with-lucide-icons.md`

## Relevant Files

### Core Infrastructure
- `lib/constants/icon-sizes.ts` - NEW: Centralized icon size constants (sm=16, md=20, lg=24, xl=32)
- `lib/constants/icon-sizes.test.ts` - NEW: Unit tests for icon size constants

### Character Classes (Phase 1)
- `lib/constants/character-classes.ts` - Replace emoji icons with Lucide icon names
- `lib/constants/character-classes.test.ts` - Update tests to verify Lucide icon names
- `components/character/CharacterCreation.tsx` - Update character class rendering to use Lucide icons
- `components/character/CharacterCreation.test.tsx` - Update tests for Lucide icon rendering
- `app/character/create/page.tsx` - Update character creation page icon rendering

### Reward System (Phase 2)
- `components/rewards/reward-store/reward-card.tsx` - Replace REWARD_TYPE_ICONS emoji with Lucide icons
- `components/rewards/reward-store/reward-card.test.tsx` - Update tests for icon components
- `components/rewards/reward-store/redemption-history.tsx` - Replace emoji with Lucide icons
- `components/rewards/reward-store/redemption-history.test.tsx` - Update tests for icon components
- `components/rewards/reward-manager/reward-form.tsx` - Replace emoji with Lucide icons
- `components/rewards/reward-manager/reward-form.test.tsx` - Update tests for icon components
- `components/rewards/reward-manager/reward-item.tsx` - Replace emoji with Lucide icons
- `components/rewards/reward-manager/reward-item.test.tsx` - Update tests for icon components

### Quest System (Phase 3)
- `components/quests/quest-card/index.tsx` - Replace status emoji with Lucide icons
- `components/quests/quest-card/index.test.tsx` - Update tests for icon components
- `components/quests/quest-dashboard/quest-stats.tsx` - Replace emoji with Lucide icons
- `components/quests/quest-dashboard/quest-stats.test.tsx` - Update tests for icon components
- `components/quests/quest-create-modal/index.tsx` - Replace emoji with Lucide icons
- `components/quests/quest-template-manager/template-item.tsx` - Replace emoji with Lucide icons

### Admin/UI Components (Phase 4)
- `components/admin/admin-dashboard.tsx` - Replace emoji with Lucide icons
- `components/admin/admin-dashboard.test.tsx` - Update tests for icon components
- `components/admin/statistics-panel.tsx` - Replace emoji with Lucide icons
- `components/admin/statistics-panel.test.tsx` - Update tests for icon components
- `components/admin/activity-feed.tsx` - Replace emoji with Lucide icons
- `components/admin/activity-feed.test.tsx` - Update tests for icon components
- `components/ui/Button.tsx` - Replace any emoji with Lucide icons
- `components/ui/Button.test.tsx` - Update tests for icon components
- `components/ui/NotificationContainer.tsx` - Replace emoji with Lucide icons
- `components/animations/LevelUpModal.tsx` - Replace emoji with Lucide icons
- `components/animations/QuestCompleteOverlay.tsx` - Replace emoji with Lucide icons

### Utility Functions (Phase 5)
- `lib/utils/formatting.ts` - Replace emoji in formatting functions
- `lib/utils/formatting.test.ts` - Update tests for icon-based formatting
- `hooks/useNotification.ts` - Replace emoji with Lucide icons in notifications
- `hooks/useNotification.test.ts` - Update tests for icon components

### Documentation (Phase 6)
- `docs/emoji-to-icon-mapping.md` - NEW: Create comprehensive emoji → icon mapping reference

### Notes
- The project already has a `FantasyIcon` component that wraps Lucide icons with proper sizing (xs, sm, md, lg, xl)
- `FantasyIcon` sizes are: xs=12px, sm=16px, md=20px, lg=24px, xl=32px (close to PRD requirements)
- We can leverage the existing `FantasyIcon` component for consistency
- Use `npx jest [path/to/test/file]` to run specific test files during development
- Run `npm run test` to run all tests after completing each phase
- Run `npm run build` and `npm run lint` after each phase to ensure no errors

## Tasks

- [x] 1.0 Setup: Create branch and establish icon infrastructure
  - [x] 1.1 Check current git branch with `git branch --show-current` (should show "main")
  - [x] 1.2 Create feature branch: `git checkout -b feature/replace-emoji-with-lucide-icons`
  - [x] 1.3 Verify branch created: `git branch --show-current` (should show "feature/replace-emoji-with-lucide-icons")
  - [x] 1.4 Read existing `components/icons/FantasyIcon.tsx` to understand how it wraps Lucide icons
  - [x] 1.5 Review Lucide React documentation to understand available icons: https://lucide.dev/icons
  - [x] 1.6 Create initial tracking document at `docs/emoji-to-icon-mapping.md` with header structure
  - [x] 1.7 Commit initial setup: `git add -A && git commit -m "Setup: Create branch and documentation structure for emoji replacement"`

- [ ] 2.0 Phase 1: Replace character class emojis with Lucide icons
  - [ ] 2.1 Open `lib/constants/character-classes.ts` and locate the CHARACTER_CLASSES array
  - [ ] 2.2 Change MAGE icon from "🔮" to "Sparkles" (string, not component)
  - [ ] 2.3 Change ROGUE icon from "🗡️" to "Sword" (string, not component)
  - [ ] 2.4 Change KNIGHT icon from "🛡️" to "Shield" (string, not component)
  - [ ] 2.5 Change HEALER icon from "✨" to "Heart" (string, not component)
  - [ ] 2.6 Change RANGER icon from "🏹" to "Target" (string, not component)
  - [ ] 2.7 Update `CharacterClassInfo` interface to clarify icon type (change comment to "Lucide icon name")
  - [ ] 2.8 Document these 5 mappings in `docs/emoji-to-icon-mapping.md`
  - [ ] 2.9 Open `components/character/CharacterCreation.tsx` and find where character icons are rendered
  - [ ] 2.10 Import required Lucide icons at top: `import { Sparkles, Sword, Shield, Heart, Target } from 'lucide-react'`
  - [ ] 2.11 Create icon mapping object: `const CLASS_ICONS = { Sparkles, Sword, Shield, Heart, Target }`
  - [ ] 2.12 Replace emoji rendering with: `const IconComponent = CLASS_ICONS[classInfo.icon as keyof typeof CLASS_ICONS]; return <IconComponent size={32} />`
  - [ ] 2.13 Run character class tests: `npx jest lib/constants/character-classes.test.ts`
  - [ ] 2.14 Open `lib/constants/character-classes.test.ts` and update assertions to check for icon names instead of emoji
  - [ ] 2.15 Run tests again to ensure they pass: `npx jest lib/constants/character-classes.test.ts`
  - [ ] 2.16 Run character creation component tests: `npx jest components/character/CharacterCreation.test.tsx`
  - [ ] 2.17 Update test file to check for Lucide icon components instead of emoji strings
  - [ ] 2.18 Run tests again to ensure they pass: `npx jest components/character/CharacterCreation.test.tsx`
  - [ ] 2.19 Check `app/character/create/page.tsx` for any emoji usage, update if needed
  - [ ] 2.20 Run all tests: `npm run test` to ensure nothing broke
  - [ ] 2.21 Commit Phase 1: `git add -A && git commit -m "Phase 1: Replace character class emojis with Lucide icons"`

- [ ] 3.0 Phase 2: Replace reward system emojis with Lucide icons
  - [ ] 3.1 Open `components/rewards/reward-store/reward-card.tsx`
  - [ ] 3.2 Locate REWARD_TYPE_ICONS constant (around line 17)
  - [ ] 3.3 Import Lucide icons: `import { Smartphone, Star, Coins, PartyPopper } from 'lucide-react'`
  - [ ] 3.4 Replace REWARD_TYPE_ICONS object to use React components instead of emoji strings
  - [ ] 3.5 Update line 65 rendering from `<span className="text-3xl">{REWARD_TYPE_ICONS[reward.type]}</span>` to render icon component with size={24}
  - [ ] 3.6 Find emoji at line 45: "⏳ Request Pending" - add Clock icon before text
  - [ ] 3.7 Find emoji at line 47: "🔒 Insufficient Gold" - add Lock icon before text
  - [ ] 3.8 Find emoji at line 48: "⚡ Redeem Reward" - add Zap icon before text
  - [ ] 3.9 Find emoji at line 88: "💰 {reward.cost} gold" - replace with <Coins size={20} /> component
  - [ ] 3.10 Document these 7 emoji replacements in `docs/emoji-to-icon-mapping.md`
  - [ ] 3.11 Run tests: `npx jest components/rewards/reward-store/reward-card.test.tsx`
  - [ ] 3.12 Update test file assertions to check for icon components instead of emoji
  - [ ] 3.13 Run tests again to verify: `npx jest components/rewards/reward-store/reward-card.test.tsx`
  - [ ] 3.14 Open `components/rewards/reward-store/redemption-history.tsx`
  - [ ] 3.15 Replace REWARD_TYPE_ICONS (lines 25-28) with same Lucide icon components
  - [ ] 3.16 Update rendering to use icon components instead of emoji spans
  - [ ] 3.17 Run tests: `npx jest components/rewards/reward-store/redemption-history.test.tsx`
  - [ ] 3.18 Update test assertions and re-run tests
  - [ ] 3.19 Open `components/rewards/reward-manager/reward-form.tsx` and replace any emoji
  - [ ] 3.20 Open `components/rewards/reward-manager/reward-item.tsx` and replace any emoji
  - [ ] 3.21 Run all reward tests: `npx jest components/rewards/`
  - [ ] 3.22 Fix any failing tests by updating assertions
  - [ ] 3.23 Run full test suite: `npm run test`
  - [ ] 3.24 Commit Phase 2: `git add -A && git commit -m "Phase 2: Replace reward system emojis with Lucide icons"`

- [ ] 4.0 Phase 3: Replace quest system emojis with Lucide icons
  - [ ] 4.1 Search for emoji in quest components: `grep -r "[\p{Emoji}]" components/quests/ --include="*.tsx" | grep -v test`
  - [ ] 4.2 Open `components/quests/quest-card/index.tsx` and search for emoji characters
  - [ ] 4.3 Replace any status emoji (✓, ⏳, ❌, etc.) with appropriate Lucide icons (CheckCircle, Clock, XCircle)
  - [ ] 4.4 Import needed icons from 'lucide-react' at top of file
  - [ ] 4.5 Document replacements in `docs/emoji-to-icon-mapping.md`
  - [ ] 4.6 Run tests: `npx jest components/quests/quest-card/index.test.tsx`
  - [ ] 4.7 Update test assertions for icon components
  - [ ] 4.8 Open `components/quests/quest-dashboard/quest-stats.tsx` and replace emoji
  - [ ] 4.9 Look for stat emoji like 📊, 🎯, ⭐ and replace with BarChart, Target, Star icons
  - [ ] 4.10 Run tests: `npx jest components/quests/quest-dashboard/quest-stats.test.tsx`
  - [ ] 4.11 Update test assertions
  - [ ] 4.12 Open `components/quests/quest-create-modal/index.tsx` and replace emoji
  - [ ] 4.13 Common modal emoji: ➕ (Plus), ✏️ (Edit), 🗑️ (Trash2) - replace with Lucide equivalents
  - [ ] 4.14 Open `components/quests/quest-template-manager/template-item.tsx` and replace emoji
  - [ ] 4.15 Run all quest tests: `npx jest components/quests/`
  - [ ] 4.16 Fix any failing tests
  - [ ] 4.17 Run full test suite: `npm run test`
  - [ ] 4.18 Commit Phase 3: `git add -A && git commit -m "Phase 3: Replace quest system emojis with Lucide icons"`

- [ ] 5.0 Phase 4: Replace remaining UI component emojis with Lucide icons
  - [ ] 5.1 Open `components/admin/admin-dashboard.tsx` and search for emoji
  - [ ] 5.2 Replace any emoji with appropriate Lucide icons (Settings, Users, BarChart, etc.)
  - [ ] 5.3 Document replacements in mapping file
  - [ ] 5.4 Run tests: `npx jest components/admin/admin-dashboard.test.tsx`
  - [ ] 5.5 Update test assertions
  - [ ] 5.6 Open `components/admin/statistics-panel.tsx` and replace emoji
  - [ ] 5.7 Look for stat emoji and replace with appropriate icons
  - [ ] 5.8 Run tests: `npx jest components/admin/statistics-panel.test.tsx`
  - [ ] 5.9 Open `components/admin/activity-feed.tsx` and replace emoji
  - [ ] 5.10 Activity emoji (🎉, ⚔️, 🏆) - replace with PartyPopper, Swords, Trophy
  - [ ] 5.11 Run tests: `npx jest components/admin/activity-feed.test.tsx`
  - [ ] 5.12 Open `components/ui/Button.tsx` and check for any emoji
  - [ ] 5.13 Replace any found emoji with Lucide icons
  - [ ] 5.14 Run tests: `npx jest components/ui/Button.test.tsx`
  - [ ] 5.15 Open `components/ui/NotificationContainer.tsx` and replace emoji
  - [ ] 5.16 Notification emoji (✓, ⚠️, ❌, ℹ️) - replace with CheckCircle, AlertTriangle, XCircle, Info
  - [ ] 5.17 Open `components/animations/LevelUpModal.tsx` and replace emoji
  - [ ] 5.18 Level up emoji (🎉, ⬆️, ⭐) - replace with PartyPopper, ArrowUp, Star
  - [ ] 5.19 Run tests: `npx jest components/animations/LevelUpModal.test.tsx`
  - [ ] 5.20 Open `components/animations/QuestCompleteOverlay.tsx` and replace emoji
  - [ ] 5.21 Quest complete emoji (✓, 🎉, 💎, 💰) - replace with CheckCircle, PartyPopper, Gem, Coins
  - [ ] 5.22 Run tests: `npx jest components/animations/QuestCompleteOverlay.test.tsx`
  - [ ] 5.23 Run all UI component tests: `npx jest components/ui/ components/admin/ components/animations/`
  - [ ] 5.24 Fix any failing tests
  - [ ] 5.25 Run full test suite: `npm run test`
  - [ ] 5.26 Commit Phase 4: `git add -A && git commit -m "Phase 4: Replace UI component emojis with Lucide icons"`

- [ ] 6.0 Phase 5: Replace utility and helper function emojis with Lucide icons
  - [ ] 6.1 Open `lib/utils/formatting.ts` and search for emoji
  - [ ] 6.2 If formatters return emoji strings, consider returning icon names instead
  - [ ] 6.3 Document approach for utility functions in mapping file
  - [ ] 6.4 Run tests: `npx jest lib/utils/formatting.test.ts`
  - [ ] 6.5 Update tests to verify icon names/components instead of emoji
  - [ ] 6.6 Open `hooks/useNotification.ts` and check for emoji in notification messages
  - [ ] 6.7 Replace emoji with Lucide icon references
  - [ ] 6.8 Run tests: `npx jest hooks/useNotification.test.ts`
  - [ ] 6.9 Check `lib/utils/validation.ts` for emoji (validators might use emoji in error messages)
  - [ ] 6.10 Check `lib/utils/data.ts` for emoji
  - [ ] 6.11 Check `lib/utils/colors.ts` for emoji
  - [ ] 6.12 Run all utility tests: `npx jest lib/utils/`
  - [ ] 6.13 Run all hook tests: `npx jest hooks/`
  - [ ] 6.14 Fix any failing tests
  - [ ] 6.15 Run full test suite: `npm run test`
  - [ ] 6.16 Commit Phase 5: `git add -A && git commit -m "Phase 5: Replace utility and hook emojis with Lucide icons"`

- [ ] 7.0 Phase 6: Scan for remaining emojis and update all test files
  - [ ] 7.1 Run comprehensive emoji search: `grep -r "[\p{Emoji_Presentation}\p{Emoji}]" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next > emoji-scan.txt`
  - [ ] 7.2 Review `emoji-scan.txt` for any remaining emoji in code files
  - [ ] 7.3 For each remaining emoji found, identify its location and purpose
  - [ ] 7.4 Replace remaining emoji systematically, file by file
  - [ ] 7.5 Focus on test files that might have been missed
  - [ ] 7.6 Check `lib/preset-templates.ts` for emoji in quest templates
  - [ ] 7.7 Check API routes: `grep -r "[\p{Emoji}]" app/api/ --include="*.ts"`
  - [ ] 7.8 Replace any emoji found in API routes with appropriate text or icon references
  - [ ] 7.9 Run all tests: `npm run test`
  - [ ] 7.10 Fix any remaining test failures
  - [ ] 7.11 Run emoji search again to verify: `grep -r "[\p{Emoji}]" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next`
  - [ ] 7.12 Verify only .md files and comments contain emoji
  - [ ] 7.13 Delete `emoji-scan.txt` temporary file
  - [ ] 7.14 Commit Phase 6: `git add -A && git commit -m "Phase 6: Remove remaining emojis from all code files"`

- [ ] 8.0 Phase 7: Create documentation and verify completion
  - [ ] 8.1 Complete `docs/emoji-to-icon-mapping.md` with all recorded mappings
  - [ ] 8.2 Add introduction section explaining the replacement rationale
  - [ ] 8.3 Organize mappings by category (Character Classes, Rewards, Quests, UI, etc.)
  - [ ] 8.4 Include code examples showing before/after patterns
  - [ ] 8.5 Add "Icon Size Guidelines" section referencing PRD standards
  - [ ] 8.6 Add "Adding New Icons" section with best practices
  - [ ] 8.7 Include table of common emoji → Lucide icon mappings
  - [ ] 8.8 Review all acceptance criteria from PRD to ensure completion
  - [ ] 8.9 Commit documentation: `git add docs/emoji-to-icon-mapping.md && git commit -m "Docs: Complete emoji to icon mapping documentation"`

- [ ] 9.0 Quality Gate: Run all tests, build, and lint checks
  - [ ] 9.1 Run full test suite: `npm run test` (must pass with 0 failures)
  - [ ] 9.2 Run build: `npm run build` (must complete with 0 errors)
  - [ ] 9.3 Run linter: `npm run lint` (must pass with 0 errors/warnings)
  - [ ] 9.4 If any errors found, fix them and re-run all three commands
  - [ ] 9.5 Verify no emoji in code: `grep -r "[\p{Emoji}]" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next | grep -v ".md" | grep -v "//"`
  - [ ] 9.6 Manually test character creation page in browser to verify icons display correctly
  - [ ] 9.7 Manually test reward store to verify icons display correctly
  - [ ] 9.8 Manually test quest dashboard to verify icons display correctly
  - [ ] 9.9 Check browser console for any icon-related errors
  - [ ] 9.10 Verify accessibility: icons should have proper aria-labels or aria-hidden attributes
  - [ ] 9.11 Take screenshots if needed for documentation
  - [ ] 9.12 All quality gates must pass before proceeding

- [ ] 10.0 Final: Create pull request and merge
  - [ ] 10.1 Ensure all previous tasks are completed and checked off
  - [ ] 10.2 Push branch to remote: `git push -u origin feature/replace-emoji-with-lucide-icons`
  - [ ] 10.3 Create PR: `gh pr create --title "Replace all emoji with Lucide icons" --body "$(cat <<'EOF'`
  - [ ] 10.4 PR body should include: Summary of changes, link to issue #97, list of phases completed, confirmation of quality gates passing
  - [ ] 10.5 Include in PR body: "Closes #97" to auto-close the issue
  - [ ] 10.6 Add testing notes: "All 608+ tests passing, build clean, lint clean"
  - [ ] 10.7 Add reference to documentation: "See docs/emoji-to-icon-mapping.md for complete mapping"
  - [ ] 10.8 Include acceptance criteria checklist in PR body
  - [ ] 10.9 Submit PR and wait for review/CI checks
  - [ ] 10.10 Once approved, merge PR: `gh pr merge --squash --delete-branch`
