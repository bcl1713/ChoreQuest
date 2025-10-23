# Emoji to Lucide Icon Mapping Document

This document provides a systematic mapping of all emoji used in the ChoreQuest codebase to their corresponding lucide icons for consistent replacement.

## Mapping Reference

| Emoji | Lucide Icon | Category | Context | Notes |
|-------|-------------|----------|---------|-------|
| 💰 | `Coins` | Currency | Gold rewards, costs, resource display | Primary currency indicator |
| 💎 | `Gem` | Currency | Gem/premium currency | Secondary currency |
| 🪙 | `Coins` | Currency | Alternative coin display | Use same as gold (💰) |
| 🎁 | `Gift` | Rewards | Reward boxes, reward store, redemption | Celebration of rewards |
| ⭐ | `Star` | Status | XP rewards, privilege designation, character roles | Achievement marker |
| ⚡ | `Zap` | Action | Quick actions (Create, Edit), XP rewards | Energy/speed indicator |
| ✅ | `Check` | Status | Completion status, approvals, redemption success | Positive confirmation |
| ❌ | `X` | Status | Denial/rejection, error states, failures | Negative state |
| ⏳ | `Loader` | Status | Loading/pending states, waiting for action | Use Loader for animation or Clock for time |
| ⚠️ | `AlertTriangle` | Status | Warning messages, confirmations, alerts | Caution indicator |
| ✏️ | `Edit2` | Action | Edit buttons, edit forms | Text editing action |
| 🗑️ | `Trash2` | Action | Delete buttons, remove actions | Destructive action |
| 🎯 | `Target` | Goal | Achievement goals, quest objectives | Target/aim marker |
| 🛡️ | `Shield` | Character | Knight class icon, Hero/Young Hero badges | Defense/protection |
| 🗡️ | `Sword` | Character | Rogue class icon, quest system markers | Offense/damage |
| 🏆 | `Trophy` | Achievement | Reward system, achievements, rewards tab | Excellence/winning |
| 👑 | `Crown` | Role | Guild Master role designation | Royalty/leadership |
| 🔥 | `Flame` | Streak | Streak counter, bonus streak display | Fire/passion/hot |
| 🎖️ | `Award` | Achievement | Prestige/honor display, achievements | Medal/honor |
| ✨ | `Sparkles` | Character | Healer class icon, special effects, magic | Magic/special effects |
| 🔮 | `Wand` | Character | Mage class icon, magic system | Magic/mystical |
| 🏹 | `Crosshair` | Character | Ranger class icon, precision targeting | Aim/precision |
| ℹ️ | `Info` | UI | Information icons, help messages | Information provider |
| ⚙️ | `Settings` | UI | Settings/configuration, admin options | Configuration/setup |
| 📊 | `BarChart3` | UI | Statistics/overview sections, data display | Data representation |
| 📈 | `TrendingUp` | UI | Statistics, completion rates, progress | Growth/upward trend |
| 📝 | `FileText` | UI | Documentation, creation forms, forms | Document/text |
| 🏷️ | `Tag` | UI | Labels, version display, tags | Tagging/labeling |
| 📜 | `ScrollText` | UI | Quest templates tab, historical data | Scrolled/archived data |
| 🏰 | `Castle` | Fantasy | Guild/realm, landing page, family creation | Fantasy stronghold |
| ⚔️ | `Swords` | Fantasy | Quest/battle system, join guild action | Combat/battle |
| 🚀 | `Rocket` | Dev | Documentation headers, PR workflow | Launch/speed/development |
| 🔧 | `Wrench` | Dev | Documentation headers, development tools | Tools/configuration |
| 🎉 | `PartyPopper` | Celebration | Level-up celebrations, achievements | Party/celebration |
| 🎪 | `Smile` | Activity | Activity feed event type (use context-appropriate icon) | Alternate: `Zap` for fun events |

## Category Groupings

### Currency Icons (3)
- 💰 → `Coins`
- 💎 → `Gem`
- 🪙 → `Coins`

### Status Icons (5)
- ✅ → `Check`
- ❌ → `X`
- ⏳ → `Loader` or `Clock`
- ⚠️ → `AlertTriangle`
- 🎯 → `Target`

### Action Icons (3)
- ⚡ → `Zap`
- ✏️ → `Edit2`
- 🗑️ → `Trash2`

### Achievement/Reward Icons (4)
- 🎁 → `Gift`
- 🏆 → `Trophy`
- 🎖️ → `Award`
- 🔥 → `Flame`

### Character Class Icons (5)
- 🛡️ → `Shield` (Knight)
- 🗡️ → `Sword` (Rogue)
- ✨ → `Sparkles` (Healer)
- 🔮 → `Wand` (Mage)
- 🏹 → `Crosshair` (Ranger)

### Role/Status Icons (2)
- ⭐ → `Star`
- 👑 → `Crown`

### UI/Interface Icons (6)
- ⚙️ → `Settings`
- 📊 → `BarChart3`
- 📈 → `TrendingUp`
- 📝 → `FileText`
- 🏷️ → `Tag`
- 📜 → `ScrollText`

### Information Icons (1)
- ℹ️ → `Info`

### Fantasy/Thematic Icons (3)
- 🏰 → `Castle`
- ⚔️ → `Swords`
- 🎉 → `PartyPopper`

### Development/Documentation Icons (2)
- 🚀 → `Rocket`
- 🔧 → `Wrench`

## Implementation Notes

1. **Lucide Icons Library**: ChoreQuest uses `lucide-react` for icon rendering. All replacements should use components from this library.

2. **Icon Sizing**: Apply consistent sizing:
   - Inline text icons: `size={16}` (16x16px)
   - Button icons: `size={18}` (18x18px)
   - Header/section icons: `size={20}` or `size={24}` (20x24px)
   - Large display icons: `size={32}` (32x32px)

3. **Color/Styling**: Replace emoji inline with styled icon components. Follow existing component patterns for color and styling.

4. **Animation**: If emoji had animation context (like ⏳ for loading), use lucide icons with appropriate animations or `Loader` component variants.

5. **Accessibility**: Ensure all icons have proper `aria-label` attributes where they convey meaning beyond decorative purposes.

6. **Documentation Updates**:
   - Update all `.md` files to use icon references instead of emoji in headings
   - Update code examples and comments
   - Maintain consistency in documentation style

## Files Requiring Attention

### High Priority (UI-facing)
- `app/dashboard/page.tsx` - Character dashboard
- `app/page.tsx` - Landing page
- `components/admin/admin-dashboard.tsx` - Admin tabs
- `components/rewards/reward-store/index.tsx` - Reward store
- `components/quests/quest-card/index.tsx` - Quest display

### Medium Priority (Component logic)
- `components/admin/activity-feed.tsx` - Activity events
- `components/admin/statistics-panel.tsx` - Stats display
- `lib/constants/character-classes.ts` - Class definitions
- Test files containing emoji assertions

### Lower Priority (Documentation)
- `CLAUDE.md` - Development docs
- `PLANNING.md` - Project planning docs
- `docs/` directory markdown files

## Testing Considerations

1. **Visual Regression**: Update any visual tests or screenshots to show new icons
2. **Responsive Design**: Verify icons display correctly at all breakpoints
3. **Icon Sizing**: Test icons appear proportional in their contexts
4. **Color Contrast**: Ensure icons meet accessibility standards
5. **Icon Spacing**: Verify spacing between icons and text remains consistent

## Success Criteria

- All emoji replaced with lucide icons
- Visual consistency maintained across application
- No regressions in functionality or appearance
- Tests updated to reference new icons
- Documentation updated with icon reference guide
- All accessibility requirements met (proper alt text/aria labels)
