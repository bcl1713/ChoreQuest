# Tasks: Emoji to Lucide Icon Migration

Generated from: `0012-prd-emoji-to-lucide-icon-migration.md`

## Relevant Files

### Phase 1: Dashboard & Character System
- `app/dashboard/page.tsx` - Main dashboard with quest/reward tabs (already uses some Lucide)
- `app/page.tsx` - Landing page
- `lib/constants/character-classes.ts` - Character class definitions with emoji icons
- `components/character/CharacterCreation.tsx` - Character creation UI
- `tests/unit/components/character-creation.test.tsx` - Tests expecting emoji in character classes

### Phase 2: Quest System
- `components/quests/quest-card/index.tsx` - Individual quest display (XP, gold, streak emoji)
- `components/quests/quest-card/__tests__/index.test.tsx` - Quest card tests
- `components/quests/quest-dashboard/index.tsx` - Quest management dashboard
- `components/quests/quest-dashboard/quest-stats.tsx` - Quest statistics display
- `components/quests/quest-create-modal/index.tsx` - Quest creation modal
- `components/quests/quest-create-modal/template-quest-form.tsx` - Template quest form
- `components/quests/quest-create-modal/__tests__/template-quest-form.test.tsx` - Template form tests
- `components/quest-card.test.tsx` - Legacy quest card test

### Phase 3: Reward System
- `components/rewards/reward-store/index.tsx` - Reward store main component
- `components/rewards/reward-store/reward-card.tsx` - Individual reward cards
- `components/rewards/reward-store/redemption-history.tsx` - Redemption history
- `components/rewards/reward-store/__tests__/reward-card.test.tsx` - Reward card tests
- `components/rewards/reward-store/__tests__/redemption-history.test.tsx` - Redemption history tests
- `components/rewards/reward-manager/index.tsx` - Reward manager main
- `components/rewards/reward-manager/reward-form.tsx` - Reward creation/edit form
- `components/rewards/reward-manager/reward-item.tsx` - Reward item display
- `components/rewards/reward-manager/reward-list.tsx` - Reward list view
- `components/rewards/reward-manager/__tests__/reward-form.test.tsx` - Form tests
- `components/rewards/reward-manager/__tests__/reward-item.test.tsx` - Item tests
- `components/rewards/reward-manager/__tests__/reward-list.test.tsx` - List tests

### Phase 4: Admin Panel
- `app/admin/page.tsx` - Admin page
- `components/admin/admin-dashboard.tsx` - Admin dashboard with tabs
- `components/admin/activity-feed.tsx` - Activity feed with event icons
- `components/admin/statistics-panel.tsx` - Statistics display
- `components/admin/guild-master-manager.tsx` - Guild master management
- `tests/unit/components/admin-dashboard.test.tsx` - Admin dashboard tests
- `tests/unit/components/statistics-panel.test.tsx` - Statistics panel tests
- `tests/unit/components/guild-master-manager.test.tsx` - GM manager tests

### Phase 5: Supporting Components & Utilities
- `components/family/family-management.tsx` - Family management UI
- `components/family/family-settings.tsx` - Family settings
- `components/family/family-quest-claiming.test.tsx` - Family quest tests
- `components/layout/site-footer.tsx` - Site footer
- `components/migration/UserMigrationNotice.tsx` - Migration notice
- `components/ui/ConfirmationModal.tsx` - Confirmation modal
- `components/ui/FantasyButton.test.tsx` - Button tests
- `components/auth/AuthForm.tsx` - Authentication form
- `app/auth/create-family/page.tsx` - Family creation page
- `hooks/useTabNavigation.ts` - Tab navigation hook
- `hooks/useTabNavigation.test.ts` - Tab navigation tests
- `tests/unit/components/site-footer.test.tsx` - Footer tests
- `tests/unit/components/family-settings.test.tsx` - Family settings tests

### Phase 6: Documentation
- `CLAUDE.md` - Development workflow documentation
- `PLANNING.md` - Project planning documentation
- `README.md` - Project README
- `docs/` - All markdown files in docs directory
- `components/*/README.md` - Component-specific documentation
- `tasks/emoji-to-lucide-icon-mapping.md` - Mapping reference (keep as-is)

### Notes

- Unit tests should typically be placed alongside the code files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests
- Use `npm run test` to run all tests
- Use `npm run build` and `npm run lint` after each phase to verify no regressions

## Tasks

- [x] 1.0 Phase 1: Migrate Dashboard & Character System
  - [x] 1.1 Update `lib/constants/character-classes.ts` to replace emoji icon strings with Lucide icon name references (e.g., `icon: "Wand"` instead of `icon: "🔮"`). Document that consumers will need to import the actual icon component.
  - [x] 1.2 Update `components/character/CharacterCreation.tsx` to import Lucide icons (Wand, Sword, Shield, Sparkles, Crosshair) and render them instead of emoji strings from character class data. Apply size 24px for class selection icons with aria-labels.
  - [x] 1.3 Update `app/page.tsx` (landing page) to replace any emoji with appropriate Lucide icons. Check for castle (Castle), swords (Swords), or other thematic icons. Add imports and ensure proper sizing (32px for hero icons).
  - [x] 1.4 Review `app/dashboard/page.tsx` - verify existing Lucide icon usage (Sword, Store) is consistent. Replace any remaining emoji with Lucide icons. Ensure tab icons are 20px with proper aria-labels.
  - [x] 1.5 Update test file `tests/unit/components/character-creation.test.tsx` to expect Lucide icon components instead of emoji strings. Use `getByLabelText` or check for icon data attributes.
  - [x] 1.6 Run `npm run test` to verify character creation tests pass. Run `npm run build` and `npm run lint` to check for errors.

- [x] 2.0 Phase 2: Migrate Quest System Components
  - [x] 2.1 Update `components/quests/quest-card/index.tsx` to replace inline emoji (⚡ XP, 💰 Gold, 🔥 streak, 👤 assigned) with Lucide icons (Zap, Coins, Flame, User). Import icons, apply size 16px for inline usage, add aria-labels where meaningful or aria-hidden for decorative use.
  - [x] 2.2 Update `components/quests/quest-dashboard/index.tsx` to replace any emoji in headers, buttons, or status displays with appropriate Lucide icons. Use Target for goals, Swords for battles, etc. Size 20px for section headers.
  - [x] 2.3 Update `components/quests/quest-dashboard/quest-stats.tsx` to replace emoji in statistics display (trophy, target, chart icons) with Lucide equivalents (Trophy, Target, BarChart3). Size 24px for stat icons.
  - [x] 2.4 Update `components/quests/quest-create-modal/index.tsx` and `template-quest-form.tsx` to replace emoji in form labels, placeholders, or buttons with Lucide icons (Zap, Coins, FileText, etc.). Size 18px for form icons.
  - [x] 2.5 Update test files: `components/quests/quest-card/__tests__/index.test.tsx`, `components/quests/quest-create-modal/__tests__/template-quest-form.test.tsx`, and `components/quest-card.test.tsx` to expect Lucide icons instead of emoji. Update assertions to use aria-labels or icon test IDs.
  - [x] 2.6 Run `npm run test -- quest` to verify quest-related tests pass. Fix any failing tests.
  - [x] 2.7 Run `npm run build` and `npm run lint` to verify no regressions in quest system.

- [x] 3.0 Phase 3: Migrate Reward System Components (Complete)
  - [x] 3.1 Update `components/rewards/reward-store/index.tsx` to replace emoji (🎁 rewards, 💎 gems, 🏆 trophy) with Lucide icons (Gift, Gem, Trophy). Size 24px for store section icons with aria-labels.
  - [x] 3.2 Update `components/rewards/reward-store/reward-card.tsx` to replace emoji in reward display (💰 cost, ✅ redeemed, 🎁 reward) with Lucide icons (Coins, Check, Gift). Size 18px for card icons.
  - [x] 3.3 Update `components/rewards/reward-store/redemption-history.tsx` to replace emoji in history entries (✅ success, ❌ failed, ⏳ pending) with Lucide icons (Check, X, Clock). Size 16px for inline status icons with appropriate aria-labels.
  - [x] 3.4 Update `components/rewards/reward-manager/index.tsx`, `reward-form.tsx`, `reward-item.tsx`, and `reward-list.tsx` to replace emoji with Lucide icons. Use Edit2 for edit, Trash2 for delete, Gift for rewards. Size 18px for action buttons, 16px for inline display.
  - [x] 3.5 Update test files: `components/rewards/reward-store/__tests__/reward-card.test.tsx`, `redemption-history.test.tsx`, and `reward-manager/__tests__/` tests to expect Lucide icons. Update assertions to query by aria-label or test ID.
  - [x] 3.6 Run `npm run test -- reward` to verify reward-related tests pass. Fix any failing tests.
  - [x] 3.7 Run `npm run build` and `npm run lint` to verify no regressions in reward system.

- [x] 4.0 Phase 4: Migrate Admin Panel Components (Complete)
  - [x] 4.1 Update `components/admin/admin-dashboard.tsx` to replace emoji in tab labels (⚙️ settings, 📊 stats, 👑 guild masters) with Lucide icons (Settings, BarChart3, Crown). Size 20px for tab icons with aria-labels.
  - [x] 4.2 Update `components/admin/activity-feed.tsx` to replace emoji in activity events (⚡ quest created, ✅ completed, 🎁 redeemed, etc.) with contextually appropriate Lucide icons. Create a mapping function if needed. Size 16px for event icons with descriptive aria-labels.
  - [x] 4.3 Update `components/admin/statistics-panel.tsx` to replace emoji in stat displays (📈 trending, 📊 charts, ⭐ highlights) with Lucide icons (TrendingUp, BarChart3, Star). Size 24px for stat section icons.
  - [x] 4.4 Update `components/admin/guild-master-manager.tsx` to replace emoji (👑 crown, ⚡ actions, ✅/❌ status) with Lucide icons (Crown, Zap, Check/X). Size 18px for action icons.
  - [x] 4.5 Update `app/admin/page.tsx` to replace any remaining emoji with Lucide icons. Verify consistency with admin dashboard tabs.
  - [x] 4.6 Update test files: `tests/unit/components/admin-dashboard.test.tsx`, `statistics-panel.test.tsx`, and `guild-master-manager.test.tsx` to expect Lucide icons instead of emoji.
  - [x] 4.7 Run `npm run test -- admin` to verify admin-related tests pass. Fix any failing tests.
  - [x] 4.8 Run `npm run build` and `npm run lint` to verify no regressions in admin panel.

- [x] 5.0 Phase 5: Migrate Supporting Components & Utilities
  - [x] 5.1 Update `components/family/family-management.tsx` and `family-settings.tsx` to replace emoji (🏰 family, ⚙️ settings, 👤 members) with Lucide icons (Castle, Settings, Users). Size contextually appropriate (16-24px).
  - [ ] 5.2 Update `components/layout/site-footer.tsx` to replace emoji (🏷️ version tag, ℹ️ info) with Lucide icons (Tag, Info). Size 16px for footer icons with aria-hidden if purely decorative.
  - [ ] 5.3 Update `components/ui/ConfirmationModal.tsx` to replace emoji (⚠️ warning, ✅ confirm, ❌ cancel) with Lucide icons (AlertTriangle, Check, X). Size 24px for modal icons with aria-labels.
  - [x] 5.4 Update `components/migration/UserMigrationNotice.tsx` to replace emoji with appropriate Lucide icons (Info, AlertTriangle). Size 20px.
  - [x] 5.5 Update `components/auth/AuthForm.tsx` to replace any emoji with Lucide icons. Check for shields, locks, or user icons. Size 20px for auth form icons.
  - [x] 5.6 Update `app/auth/create-family/page.tsx` to replace emoji (🏰 castle, ⚔️ swords) with Lucide icons (Castle, Swords). Size 32px for page hero icons.
  - [x] 5.7 Update `hooks/useTabNavigation.ts` if it contains emoji in tab definitions or returns emoji data. Replace with icon name references.
  - [ ] 5.8 Update test files: `components/family/family-quest-claiming.test.tsx`, `tests/unit/components/site-footer.test.tsx`, `family-settings.test.tsx`, `ui/FantasyButton.test.tsx`, and `hooks/useTabNavigation.test.ts` to expect Lucide icons.
  - [ ] 5.9 Run `npm run test` to verify all supporting component tests pass. Fix any failing tests.
  - [ ] 5.10 Run `npm run build` and `npm run lint` to verify no regressions.

- [ ] 6.0 Phase 6: Update Documentation
  - [ ] 6.1 Update `CLAUDE.md` to replace emoji in headings and text with descriptive text (e.g., "🔧 Development Commands" becomes "Development Commands" or uses "Wrench icon" in text). Maintain readability.
  - [ ] 6.2 Update `PLANNING.md` to replace emoji with text references. No actual Lucide components can be rendered in markdown, so use descriptive text (e.g., "✅ Complete" becomes "Complete ✓" or "[✓] Complete").
  - [ ] 6.3 Update `README.md` to replace emoji with text or unicode equivalents that are more widely supported. Focus on clarity over decoration.
  - [ ] 6.4 Update all markdown files in `docs/` directory to replace emoji with text references. Review `docs/202508291550-Technical-Design-Document.md` and `docs/202508291552-Game-Design-Document.md` specifically.
  - [ ] 6.5 Update component-specific `README.md` files in `components/admin/`, `components/family/`, `components/quests/`, and `components/rewards/` to replace emoji with text.
  - [ ] 6.6 Keep `tasks/emoji-to-lucide-icon-mapping.md` as-is for reference. This document should maintain its emoji for mapping purposes.
  - [ ] 6.7 Create or update developer documentation with icon usage guidelines: when to use which Lucide icon, sizing standards, accessibility requirements (aria-labels vs aria-hidden).

- [ ] 7.0 Final Quality Assurance & Cleanup
  - [ ] 7.1 Run comprehensive visual QA - manually test all screens in browser to verify icons display correctly: Dashboard, Quests (card, creation, stats), Rewards (store, redemption), Admin (dashboard, activity feed, statistics), Character creation, Landing page.
  - [ ] 7.2 Verify responsive design - check icon display at mobile (320px), tablet (768px), and desktop (1024px+) breakpoints. Ensure icons don't overflow or break layout.
  - [ ] 7.3 Perform accessibility audit - verify all meaningful icons have aria-labels, decorative icons are aria-hidden. Use browser dev tools or axe DevTools to check.
  - [ ] 7.4 Run full test suite: `npm run test` - all tests must pass. Fix any remaining test failures.
  - [ ] 7.5 Run build verification: `npm run build` - must complete with zero errors.
  - [ ] 7.6 Run lint verification: `npm run lint` - must pass with zero warnings.
  - [ ] 7.7 Perform manual regression testing checklist:
    - [ ] Character creation displays class icons correctly
    - [ ] Quest cards show XP/gold/streak icons properly
    - [ ] Reward store displays reward/gem/coin icons
    - [ ] Admin dashboard tabs render correctly
    - [ ] Activity feed events have appropriate icons
    - [ ] All buttons and actions have proper icons
  - [ ] 7.8 Review all changed files for consistency - verify icon sizing, spacing, and color usage follows established patterns.
  - [ ] 7.9 Search codebase for any remaining emoji: `grep -r "[🎁💰💎🪙⭐⚡✅❌⏳⚠️✏️🗑️🎯🛡️🗡️🏆👑🔥🎖️✨🔮🏹ℹ️⚙️📊📈📝🏷️📜🏰⚔️🚀🔧🎉🎪]" --include="*.tsx" --include="*.ts" --exclude-dir=node_modules`. Verify any findings are intentional (user content fields, example data, etc.).
  - [ ] 7.10 Update TASKS.md with completion notes and any lessons learned for future icon migrations.
