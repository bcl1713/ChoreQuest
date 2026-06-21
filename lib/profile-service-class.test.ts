import { ProfileService } from "./profile-service";
jest.mock("./supabase", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      updateUser: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

import { supabase } from "./supabase";

const mockFrom = supabase.from as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;
const mockGetSession = supabase.auth.getSession as jest.Mock;

global.fetch = jest.fn();

describe("ProfileService - class changes and history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
    });
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
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, character: updatedCharacter }),
      });

      const result = await ProfileService.changeCharacterClass(
        "char-1",
        "MAGE",
      );
      expect(result.class).toBe("MAGE");
      expect(global.fetch).toHaveBeenCalledWith("/api/characters/char-1/change-class", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newClass: "MAGE" }),
      });
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("should throw on database error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Insufficient gold. Need 250, have 100" }),
      });
      await expect(
        ProfileService.changeCharacterClass("char-1", "MAGE"),
      ).rejects.toThrow("Insufficient gold");
    });

    it("should throw when no data returned", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      await expect(
        ProfileService.changeCharacterClass("char-1", "MAGE"),
      ).rejects.toThrow("Failed to retrieve updated character");
    });

    it("should throw when no authenticated session is available", async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });
      await expect(
        ProfileService.changeCharacterClass("char-1", "MAGE"),
      ).rejects.toThrow("Authentication required");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should not bypass the canonical class-change RPC with direct character updates", async () => {
      const updatedCharacter = { ...characterData, class: "MAGE" };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, character: updatedCharacter }),
      });
      await ProfileService.changeCharacterClass("char-1", "MAGE");
      expect(mockFrom).not.toHaveBeenCalledWith("characters");
      expect(mockRpc).not.toHaveBeenCalledWith("fn_change_character_class", expect.anything());
    });
  });

  describe("getChangeHistory", () => {
    it("should return empty array (not yet implemented)", async () => {
      const result = await ProfileService.getChangeHistory();
      expect(result).toEqual([]);
    });
  });
});
