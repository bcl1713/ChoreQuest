export interface QuestRewards {
  goldReward?: number;
  xpReward?: number;
  gemsReward?: number;
  honorPointsReward?: number;
}
export interface CalculatedRewards {
  gold: number;
  xp: number;
  gems: number;
  honor_points: number;
  levelUp?: {
    newLevel: number;
    previousLevel: number;
  };
}
