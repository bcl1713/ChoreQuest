"use client";

import {
  Crown,
  Shield,
  Swords,
  Sparkles,
  Target,
  Sword,
  Heart,
  type LucideIcon,
} from "lucide-react";

export const roleDisplayMap: Record<
  string,
  { icon: LucideIcon; label: string }
> = {
  GUILD_MASTER: { icon: Crown, label: "Guild Master" },
  HERO: { icon: Swords, label: "Hero" },
  YOUNG_HERO: { icon: Shield, label: "Young Hero" },
};

export const classDisplayMap: Record<
  string,
  { icon: LucideIcon; label: string }
> = {
  KNIGHT: { icon: Shield, label: "Knight" },
  MAGE: { icon: Sparkles, label: "Mage" },
  RANGER: { icon: Target, label: "Ranger" },
  ROGUE: { icon: Sword, label: "Rogue" },
  HEALER: { icon: Heart, label: "Healer" },
};
