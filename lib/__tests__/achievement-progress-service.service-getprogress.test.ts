import { AchievementProgressService } from "../achievement-progress-service";
import {
  makeReadClient,
  CHARACTER_ID,
  ACHIEVEMENT_ID,
} from "./achievement-progress-service.fixtures";

const mockWriteClient = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

describe("AchievementProgressService - service level", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 8.10 getProgress
  describe("getProgress", () => {
    it("returns joined progress records for character with existing progress", async () => {
      const progressData = [
        {
          character_id: CHARACTER_ID,
          achievement_id: ACHIEVEMENT_ID,
          unlocked_at: null,
          progress: { current: 3, threshold: 10 },
          notified: false,
          achievements: {
            id: ACHIEVEMENT_ID,
            name: "First Quest",
            description: "Complete your first quest",
            criteria_type: "quest_complete",
            criteria_config: { threshold: 10 },
          },
        },
      ];

      const charAchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: progressData, error: null }),
        }),
      };

      const readClient = makeReadClient({
        character_achievements: charAchChain,
      });

      const service = new AchievementProgressService(readClient as never);
      const result = await service.getProgress(CHARACTER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].achievement.name).toBe("First Quest");
      expect(result[0].progress).toEqual({ current: 3, threshold: 10 });
    });

    it("returns empty array when character has no progress", async () => {
      const charAchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const readClient = makeReadClient({
        character_achievements: charAchChain,
      });

      const service = new AchievementProgressService(readClient as never);
      const result = await service.getProgress(CHARACTER_ID);

      expect(result).toEqual([]);
    });
  });
});
