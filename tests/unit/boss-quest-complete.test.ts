import { buildCharacterRewardUpdate } from "@/app/api/boss-quests/[id]/complete/route";

describe("buildCharacterRewardUpdate", () => {
  it("applies rewards and levels up based on total XP", () => {
    const result = buildCharacterRewardUpdate(
      { gold: 10, xp: 800, honor_points: 1, level: 1 },
      { gold: 5, xp: 15, honor: 1 }
    );

    expect(result.gold).toBe(15);
    expect(result.xp).toBe(815);
    expect(result.honor_points).toBe(2);
    expect(result.level).toBe(5); // 815 total XP -> level 5
  });

  it("does not downgrade level if stored level is higher than derived level", () => {
    const result = buildCharacterRewardUpdate(
      { gold: 0, xp: 900, honor_points: 0, level: 10 },
      { gold: 0, xp: 0, honor: 0 }
    );

    expect(result.level).toBe(10);
  });
});
