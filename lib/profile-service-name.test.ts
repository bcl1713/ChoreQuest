import { ProfileService } from "./profile-service";
jest.mock("./supabase", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      updateUser: jest.fn(),
    },
  },
}));
import { supabase } from "./supabase";

const mockFrom = supabase.from as jest.Mock;

describe("ProfileService - naming", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getClassChangeCost", () => {
    it("should return tiered costs based on level", () => {
      expect(ProfileService.getClassChangeCost(1)).toBe(100);
      expect(ProfileService.getClassChangeCost(5)).toBe(100);
      expect(ProfileService.getClassChangeCost(6)).toBe(250);
      expect(ProfileService.getClassChangeCost(10)).toBe(250);
      expect(ProfileService.getClassChangeCost(11)).toBe(500);
      expect(ProfileService.getClassChangeCost(15)).toBe(500);
      expect(ProfileService.getClassChangeCost(16)).toBe(1000);
      expect(ProfileService.getClassChangeCost(20)).toBe(1000);
      expect(ProfileService.getClassChangeCost(21)).toBe(2000);
      expect(ProfileService.getClassChangeCost(100)).toBe(2000);
    });
  });

  describe("changeCharacterName", () => {
    it("should successfully change character name", async () => {
      const eqMock1 = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { name: "OldName" },
          error: null,
        }),
      });
      const eqMock2 = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "char-1", name: "NewName" },
            error: null,
          }),
        }),
      });
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "history-1" },
            error: null,
          }),
        }),
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === "characters") {
          return {
            select: jest.fn().mockReturnValue({
              eq: eqMock1,
            }),
            update: jest.fn().mockReturnValue({
              eq: eqMock2,
            }),
          };
        }
        if (table === "character_change_history") {
          return { insert: mockInsert };
        }
        return {};
      });
      const result = await ProfileService.changeCharacterName(
        "char-1",
        "NewName",
      );
      expect(result).toEqual({ id: "char-1", name: "NewName" });
    });

    it("should reject empty name", async () => {
      await expect(
        ProfileService.changeCharacterName("char-1", ""),
      ).rejects.toThrow("Character name cannot be empty");
    });

    it("should reject whitespace-only name", async () => {
      await expect(
        ProfileService.changeCharacterName("char-1", "   "),
      ).rejects.toThrow("Character name cannot be empty");
    });

    it("should reject name longer than 50 characters", async () => {
      const longName = "a".repeat(51);
      await expect(
        ProfileService.changeCharacterName("char-1", longName),
      ).rejects.toThrow("Character name must be 50 characters or less");
    });

    it("should not record change in history (not yet implemented)", async () => {
      // History recording is a TODO in the source - verify it completes without calling insert
      mockFrom.mockImplementation((table: string) => {
        if (table === "characters") {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: "char-1", name: "NewName" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });
      const result = await ProfileService.changeCharacterName(
        "char-1",
        "NewName",
      );
      expect(result).toEqual({ id: "char-1", name: "NewName" });
      // character_change_history table is not called because history recording is TODO
      expect(mockFrom).not.toHaveBeenCalledWith("character_change_history");
    });
  });
});
