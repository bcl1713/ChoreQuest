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
      const mockRpc = supabase.rpc as jest.Mock;
      mockRpc.mockResolvedValue({ data: [updatedCharacter], error: null });

      const result = await ProfileService.changeCharacterClass(
        "char-1",
        "MAGE",
      );
      expect(result.class).toBe("MAGE");
      expect(mockRpc).toHaveBeenCalledWith("fn_change_character_class", {
        p_character_id: "char-1",
        p_new_class: "MAGE",
      });
    });

    it("should throw on database error", async () => {
      const mockRpc = supabase.rpc as jest.Mock;
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "Insufficient gold. Need 250, have 100" },
      });
      await expect(
        ProfileService.changeCharacterClass("char-1", "MAGE"),
      ).rejects.toThrow("Insufficient gold");
    });

    it("should throw when no data returned", async () => {
      const mockRpc = supabase.rpc as jest.Mock;
      mockRpc.mockResolvedValue({ data: [], error: null });
      await expect(
        ProfileService.changeCharacterClass("char-1", "MAGE"),
      ).rejects.toThrow("Failed to retrieve updated character");
    });

    it("should not bypass the canonical class-change RPC with direct character updates", async () => {
      const updatedCharacter = { ...characterData, class: "MAGE" };
      const mockRpc = supabase.rpc as jest.Mock;
      mockRpc.mockResolvedValue({ data: [updatedCharacter], error: null });
      await ProfileService.changeCharacterClass("char-1", "MAGE");
      expect(mockFrom).not.toHaveBeenCalledWith("characters");
    });
  });

  describe("getChangeHistory", () => {
    it("should return empty array (not yet implemented)", async () => {
      const result = await ProfileService.getChangeHistory();
      expect(result).toEqual([]);
    });
  });
});
