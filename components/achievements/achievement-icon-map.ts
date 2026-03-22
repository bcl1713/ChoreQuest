import {
  Sword,
  Shield,
  Coins,
  Star,
  Flame,
  EyeOff,
  Trophy,
  Lock,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  sword: Sword,
  shield: Shield,
  coins: Coins,
  star: Star,
  flame: Flame,
  "eye-off": EyeOff,
  trophy: Trophy,
  lock: Lock,
};

export function getAchievementIcon(iconName: string | null): LucideIcon {
  if (!iconName) return Trophy;
  return ICON_MAP[iconName] ?? Trophy;
}
