/**
 * Profile Service Tests
 * Tests for character profile change management (name, class, password)
 */

import { ProfileService } from "./profile-service";

// Mock the supabase client
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      updateUser: jest.fn(),
    },
  },
}));

import { supabase } from "@/lib/supabase";

const mockFrom = supabase.from as jest.Mock;

describe("ProfileService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getClassChangeCost", () => {
    it("should calculate cost as 25 * level", () => {
      expect(ProfileService.getClassChangeCost(10)).toBe(250);
      expect(ProfileService.getClassChangeCost(20)).toBe(500);
      expect(ProfileService.getClassChangeCost(1)).toBe(25);
    });

    it("should handle edge cases", () => {
      expect(ProfileService.getClassChangeCost(0)).toBe(0);
      expect(ProfileService.getClassChangeCost(100)).toBe(2500);
    });
  });

  describe("changeCharacterName", () => {
    it("should successfully change character name", async () => {
      // Mock for fetching current name
      const eqMock1 = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { name: "OldName" },
          error: null,
        }),
      });

      // Mock for updating name
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
        "NewName"
      );

      expect(result).toEqual({ id: "char-1", name: "NewName" });
    });

    it("should reject empty name", async () => {
      await expect(
        ProfileService.changeCharacterName("char-1", "")
      ).rejects.toThrow("Character name cannot be empty");
    });

    it("should reject whitespace-only name", async () => {
      await expect(
        ProfileService.changeCharacterName("char-1", "   ")
      ).rejects.toThrow("Character name cannot be empty");
    });

    it("should reject name longer than 50 characters", async () => {
      const longName = "a".repeat(51);
      await expect(
        ProfileService.changeCharacterName("char-1", longName)
      ).rejects.toThrow("Character name must be 50 characters or less");
    });

    it("should record change in history", async () => {
      // Mock for fetching current name
      const eqMock1 = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { name: "OldName" },
          error: null,
        }),
      });

      // Mock for updating name
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

      await ProfileService.changeCharacterName("char-1", "NewName");

      expect(mockInsert).toHaveBeenCalled();
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.character_id).toBe("char-1");
      expect(insertCall.change_type).toBe("name");
    });
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
      const cost = 250; // 25 * 10
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

      // When using RPC function, transaction and change history are recorded atomically
      // so we just need to mock the RPC response
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

      const result = await ProfileService.changeCharacterClass("char-1", "MAGE");

      expect(mockRpc).toHaveBeenCalledWith(
        "fn_change_character_class",
        expect.objectContaining({
          p_character_id: "char-1",
          p_new_class: "MAGE",
        })
      );
      // Verify the RPC call was made (transaction and history are handled server-side)
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
