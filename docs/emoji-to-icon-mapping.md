# Emoji to Lucide Icon Mapping

This document tracks the replacement of emoji characters with Lucide icons throughout the ChoreQuest codebase.

## Overview

As part of the v0.5.0 release, all emoji have been replaced with Lucide React icons for:
- Better accessibility
- Improved consistency across the application
- Better maintainability and future icon customization

## Icon Size Guidelines

The application uses the `FantasyIcon` component wrapper with standardized sizes:
- `xs`: 12px (h-3 w-3)
- `sm`: 16px (h-4 w-4)
- `md`: 20px (h-5 w-5) - Default
- `lg`: 24px (h-6 w-6)
- `xl`: 32px (h-8 w-8)

## Mapping by Category

### Character Classes

| Emoji | Lucide Icon | Component | Usage |
|-------|-------------|-----------|-------|
| 🔮 | `Sparkles` | MAGE | Character creation - mage class selection |
| 🗡️ | `Sword` | ROGUE | Character creation - rogue class selection |
| 🛡️ | `Shield` | KNIGHT | Character creation - knight class selection |
| ✨ | `Heart` | HEALER | Character creation - healer class selection |
| 🏹 | `Target` | RANGER | Character creation - ranger class selection |

### Rewards System

| Emoji | Lucide Icon | Component | Usage |
|-------|-------------|-----------|-------|
| 📱 | `Smartphone` | Reward Card | Mobile device reward type |
| ⭐ | `Star` | Reward Card | Premium reward type |
| 🪙 | `Coins` | Reward Card | Currency reward type |
| 🎉 | `PartyPopper` | Reward Card | Special/celebration reward type |
| ⏳ | `Clock` | Reward Card | Request pending status |
| 🔒 | `Lock` | Reward Card | Insufficient gold status |
| ⚡ | `Zap` | Reward Card | Redeem button action |

### Quests System

| Emoji | Lucide Icon | Component | Usage |
|-------|-------------|-----------|-------|
| ⚡ | `Zap` | Quest Card | XP reward indicator |
| 💰 | `Coins` | Quest Card | Gold reward indicator |
| 🔥 | `Flame` | Quest Card | Streak bonus indicator |
| 👤 | `User` | Quest Card | Assigned hero indicator |
| 👑 | `Crown` | Quest Card | Assignment dropdown label |
| 📊 | `BarChart3` | Quest Stats | Total quests count |
| ⏳ | `Clock` | Quest Stats | Pending quests count |
| 🔄 | `RotateCw` | Quest Stats | In-progress quests count |
| ✅ | `CheckCircle` | Quest Stats | Completed quests count |
| 📈 | `TrendingUp` | Quest Stats | Completion rate percentage |
| 👥 | `Users` | Template List | Family quest templates header |

### UI Components & Animations

| Emoji | Lucide Icon | Component | Usage |
|-------|-------------|-----------|-------|
| ✓ | `CheckCircle` | Notifications | Success notification |
| ⚠️ | `AlertTriangle` | Notifications | Warning notification |
| ❌ | `XCircle` | Notifications | Error notification |
| ℹ️ | `Info` | Notifications | Info notification |
| 🎉 | `PartyPopper` | Level Up Modal | Celebration effect |
| ⬆️ | `ArrowUp` | Level Up Modal | Level increase indicator |
| 💎 | `Gem` | Quest Complete Overlay | Reward gem indicator |

### Admin & Activity

| Emoji | Lucide Icon | Component | Usage |
|-------|-------------|-----------|-------|
| 🎉 | `PartyPopper` | Activity Feed | User celebration/achievement |
| ⚔️ | `Swords` | Activity Feed | PvP/battle indicator |
| 🏆 | `Trophy` | Activity Feed | Achievement/ranking |

## Adding New Icons

When adding new icons to the application:

1. **Choose appropriate Lucide icons** from https://lucide.dev/icons
2. **Document the mapping** in this file with usage context
3. **Use FantasyIcon wrapper** for consistency:
   ```tsx
   import { FantasyIcon } from '@/components/icons/FantasyIcon';
   import { Star } from 'lucide-react';

   <FantasyIcon icon={Star} size="md" aria-label="Premium reward" />
   ```
4. **Ensure accessibility** by providing aria-labels for icon-only usage
5. **Consider color context** - use `type` prop for themed colors (gold, xp, gem)

## Migration Timeline

- **Phase 1**: Character Classes (completed)
- **Phase 2**: Rewards System (completed)
- **Phase 3**: Quests System (completed)
- **Phase 4**: UI Components & Animations (completed)
- **Phase 5**: Utility & Hook Functions (completed)
- **Phase 6**: Final emoji scan and cleanup (completed)
