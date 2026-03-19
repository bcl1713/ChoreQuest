import { ProfileService } from "../profile-service";
jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      updateUser: jest.fn(),
    },
  },
}));

import { supabase } from "../supabase";

const mockFrom = supabase.from as jest.Mock;

describe("ProfileService - class changes and history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("canChangeClass", () => {
    it("should return true (cooldown not yet implemented)", async () => {
      const result = await ProfileService.canChangeClass();
      expect(result).toBe(true);
    });
  });

  describe("changeCharacterClass", () => {
    const characterData = {
      id: "char-1",
      user_id: "user-1",
      name: "Hero",
      class: "WARRIOR",
      level: 10,
      gold: 500,
      last_class_change_at: null,
    };

    it("should successfully change class", async () => {
      const updatedCharacter = { ...characterData, class: "MAGE" };
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedCharacter,
                error: null,
              }),
            }),
          }),
        }),
      });
      const result = await ProfileService.changeCharacterClass(
        "char-1",
        "MAGE",
      );
      expect(result.class).toBe("MAGE");
      expect(mockFrom).toHaveBeenCalledWith("characters");
    });

    it("should throw on database error", async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Insufficient gold. Need 250, have 100" },
              }),
            }),
          }),
        }),
      });
      await expect(
        ProfileService.changeCharacterClass("char-1", "MAGE"),
      ).rejects.toThrow("Insufficient gold");
    });

    it("should throw when no data returned", async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });
      await expect(
        ProfileService.changeCharacterClass("char-1", "MAGE"),
      ).rejects.toThrow("Failed to retrieve updated character");
    });

    it("should call from with characters table", async () => {
      const updatedCharacter = { ...characterData, class: "MAGE" };
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedCharacter,
                error: null,
              }),
            }),
          }),
        }),
      });
      await ProfileService.changeCharacterClass("char-1", "MAGE");
      expect(mockFrom).toHaveBeenCalledWith("characters");
    });
  });

  describe("getChangeHistory", () => {
    it("should return empty array (not yet implemented)", async () => {
      const result = await ProfileService.getChangeHistory();
      expect(result).toEqual([]);
    });
  });
});
