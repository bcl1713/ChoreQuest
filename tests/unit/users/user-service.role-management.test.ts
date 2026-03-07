import { userService } from "@/lib/user-service";
import { supabase } from "@/lib/supabase";
import {
  mockFamilyId,
  mockTargetUserId,
  mockToken,
  mockUserId,
  resetAuth,
  setupAuth,
} from "./__fixtures__/user-service.fixtures";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

global.fetch = jest.fn();

describe("UserService - role management", () => {
  beforeEach(() => {
    setupAuth();
    jest.clearAllMocks();
  });

  afterEach(() => {
    resetAuth();
  });

  describe("promoteToGuildMaster", () => {
    it("should successfully promote a user to Guild Master", async () => {
      const mockResponse = {
        success: true,
        user: {
          id: mockTargetUserId,
          email: "target@example.com",
          name: "Target User",
          family_id: mockFamilyId,
          role: "GUILD_MASTER",
          created_at: "2025-10-01T00:00:00Z",
          updated_at: "2025-10-02T00:00:00Z",
        },
        message: "Target User has been promoted to Guild Master",
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      const result = await userService.promoteToGuildMaster(mockTargetUserId);
      expect(global.fetch).toHaveBeenCalledWith(`/api/users/${mockTargetUserId}/promote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mockToken}`,
          "Content-Type": "application/json",
        },
      });
      expect(result.id).toBe(mockTargetUserId);
      expect(result.role).toBe("GUILD_MASTER");
    });

    it("should throw error if user is already a Guild Master", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "User is already a Guild Master" }),
      });
      await expect(userService.promoteToGuildMaster(mockTargetUserId)).rejects.toThrow(
        "User is already a Guild Master"
      );
    });

    it("should throw error if not authenticated", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: null },
      });
      await expect(userService.promoteToGuildMaster(mockTargetUserId)).rejects.toThrow(
        "Authentication required"
      );
    });

    it("should throw error if requester is not a Guild Master", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Only Guild Masters can promote users" }),
      });
      await expect(userService.promoteToGuildMaster(mockTargetUserId)).rejects.toThrow(
        "Only Guild Masters can promote users"
      );
    });
  });

  describe("demoteToHero", () => {
    it("should successfully demote a Guild Master to Hero", async () => {
      const mockResponse = {
        success: true,
        user: {
          id: mockTargetUserId,
          email: "target@example.com",
          name: "Target User",
          family_id: mockFamilyId,
          role: "HERO",
          created_at: "2025-10-01T00:00:00Z",
          updated_at: "2025-10-02T00:00:00Z",
        },
        message: "Target User has been demoted to Hero",
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      const result = await userService.demoteToHero(mockTargetUserId);
      expect(global.fetch).toHaveBeenCalledWith(`/api/users/${mockTargetUserId}/demote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mockToken}`,
          "Content-Type": "application/json",
        },
      });
      expect(result.role).toBe("HERO");
    });

    it("should throw error if attempting self-demotion", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Cannot demote yourself" }),
      });
      await expect(userService.demoteToHero(mockUserId)).rejects.toThrow("Cannot demote yourself");
    });

    it("should throw error if trying to demote last Guild Master", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: "Cannot demote the last Guild Master. Promote another family member first.",
        }),
      });
      await expect(userService.demoteToHero(mockTargetUserId)).rejects.toThrow(
        "Cannot demote the last Guild Master"
      );
    });

    it("should throw error if not authenticated", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: null },
      });
      await expect(userService.demoteToHero(mockTargetUserId)).rejects.toThrow(
        "Authentication required"
      );
    });

    it("should throw error if target is not a Guild Master", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "User is not a Guild Master" }),
      });
      await expect(userService.demoteToHero(mockTargetUserId)).rejects.toThrow(
        "User is not a Guild Master"
      );
    });
  });
});
