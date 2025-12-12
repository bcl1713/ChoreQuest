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
    it("should return true if never changed class", async () => {
      const eqMock = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { last_class_change_at: null },
          error: null,
        }),
      });
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: eqMock,
        }),
      });
      const result = await ProfileService.canChangeClass("char-1");
      expect(result).toBe(true);
    });

    it("should return false if within 7 days", async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const eqMock = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { last_class_change_at: yesterday.toISOString() },
          error: null,
        }),
      });
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: eqMock,
        }),
      });
      const result = await ProfileService.canChangeClass("char-1");
      expect(result).toBe(false);
    });

    it("should return true if after 7 days", async () => {
      const now = new Date();
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      const eqMock = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { last_class_change_at: eightDaysAgo.toISOString() },
          error: null,
        }),
      });
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: eqMock,
        }),
      });
      const result = await ProfileService.canChangeClass("char-1");
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
    it("should successfully change class with sufficient gold", async () => {
      const cost = 250;
      const mockRpc = supabase.rpc as jest.Mock;
      mockRpc.mockResolvedValue({
        data: [
          {
            ...characterData,
            class: "MAGE",
            gold: characterData.gold - cost,
            last_class_change_at: new Date().toISOString(),
          },
        ],
        error: null,
      });
      const result = await ProfileService.changeCharacterClass(
        "char-1",
        "MAGE"
      );
      expect(result.class).toBe("MAGE");
      expect(result.gold).toBe(characterData.gold - cost);
      expect(mockRpc).toHaveBeenCalledWith(
        "fn_change_character_class",
        expect.objectContaining({
          p_character_id: "char-1",
          p_new_class: "MAGE",
        })
      );
    });

    it("should reject insufficient gold", async () => {
      const mockRpc = supabase.rpc as jest.Mock;
      mockRpc.mockResolvedValue({
        data: null,
        error: new Error("Insufficient gold. Need 250, have 100"),
      });
      await expect(
        ProfileService.changeCharacterClass("char-1", "MAGE")
      ).rejects.toThrow("Insufficient gold");
    });

    it("should reject if within cooldown", async () => {
      const mockRpc = supabase.rpc as jest.Mock;
      mockRpc.mockResolvedValue({
        data: null,
        error: new Error("Class change is on cooldown. Please try again in 7 days"),
      });
      await expect(
        ProfileService.changeCharacterClass("char-1", "MAGE")
      ).rejects.toThrow("Class change is on cooldown");
    });

    it("should record transaction and change history", async () => {
      const cost = 250;
      const mockRpc = supabase.rpc as jest.Mock;
      mockRpc.mockResolvedValue({
        data: [
          {
            ...characterData,
            class: "MAGE",
            gold: characterData.gold - cost,
            last_class_change_at: new Date().toISOString(),
          },
        ],
        error: null,
      });
      await ProfileService.changeCharacterClass("char-1", "MAGE");
      expect(mockRpc).toHaveBeenCalledWith(
        "fn_change_character_class",
        expect.objectContaining({
          p_character_id: "char-1",
          p_new_class: "MAGE",
        })
      );
      expect(mockRpc).toHaveBeenCalled();
    });
  });

  describe("getChangeHistory", () => {
    it("should retrieve change history for a character", async () => {
      const mockHistory = [
        { id: "1", change_type: "name", created_at: new Date().toISOString() },
        { id: "2", change_type: "class", created_at: new Date().toISOString() },
      ];
      const mockOrderFn = jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: mockHistory,
          error: null,
        }),
      });
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrderFn,
          }),
        }),
      });
      const result = await ProfileService.getChangeHistory("char-1");
      expect(result).toEqual(mockHistory);
    });

    it("should support pagination", async () => {
      const mockOrderFn = jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrderFn,
          }),
        }),
      });
      await ProfileService.getChangeHistory("char-1", 10, 2);
      expect(mockOrderFn).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should return empty array if no changes", async () => {
      const mockOrderFn = jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrderFn,
          }),
        }),
      });
      const result = await ProfileService.getChangeHistory("char-1");
      expect(result).toEqual([]);
    });
  });
});
