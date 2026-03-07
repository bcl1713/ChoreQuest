import { Character } from "@/lib/types/database";

export interface LevelUpEvent {
  oldLevel: number;
  newLevel: number;
  characterName: string;
  characterClass: string;
}

export type CharacterState = Character | null;
