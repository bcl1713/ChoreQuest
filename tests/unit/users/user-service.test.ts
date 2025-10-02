/**
 * Unit tests for UserService
 * Tests role management operations: promote, demote, count GMs, get family members
 */

import { userService } from "@/lib/user-service";
import { supabase } from "@/lib/supabase";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("UserService", () => {
  const mockToken = "mock-auth-token";
  const mockFamilyId = "family-123";
  const mockUserId = "user-456";
  const mockTargetUserId = "user-789";

  beforeEach(() => {
    // Mock Supabase auth session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          access_token: mockToken,
          user: { id: mockUserId },
        },
      },
    });

    // Setup localStorage with mock token
    localStorageMock.setItem(
      "chorequest-auth",
      JSON.stringify({ token: mockToken })
    );
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe("getFamilyMembers", () => {
    it("should fetch all family members sorted by role", async () => {
      const mockProfiles = [
        {
          id: "gm-1",
          email: "gm1@example.com",
          name: "Guild Master 1",
          family_id: mockFamilyId,
          role: "GUILD_MASTER",
          created_at: "2025-10-01T00:00:00Z",
          updated_at: "2025-10-01T00:00:00Z",
        },
        {
          id: "hero-1",
          email: "hero1@example.com",
          name: "Hero 1",
          family_id: mockFamilyId,
          role: "HERO",
          created_at: "2025-10-01T00:00:00Z",
          updated_at: "2025-10-01T00:00:00Z",
        },
      ];

      const mockFrom = jest.fn();
      const mockSelect = jest.fn();
      const mockEq = jest.fn();
      const mockOrder = jest.fn();

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({ data: mockProfiles, error: null });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await userService.getFamilyMembers(mockFamilyId);

      expect(mockFrom).toHaveBeenCalledWith("user_profiles");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("family_id", mockFamilyId);
      expect(mockOrder).toHaveBeenCalledWith("role", { ascending: true });
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe("GUILD_MASTER");
      expect(result[1].role).toBe("HERO");
    });

    it("should throw error if query fails", async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn();
      const mockEq = jest.fn();
      const mockOrder = jest.fn();

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      (supabase.from as jest.Mock) = mockFrom;

      await expect(
        userService.getFamilyMembers(mockFamilyId)
      ).rejects.toThrow("Failed to load family members: Database error");
    });
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

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/users/${mockTargetUserId}/promote`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mockToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      expect(result.id).toBe(mockTargetUserId);
      expect(result.role).toBe("GUILD_MASTER");
    });

    it("should throw error if user is already a Guild Master", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "User is already a Guild Master" }),
      });

      await expect(
        userService.promoteToGuildMaster(mockTargetUserId)
      ).rejects.toThrow("User is already a Guild Master");
    });

    it("should throw error if not authenticated", async () => {
      // Mock no session
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: null },
      });

      await expect(
        userService.promoteToGuildMaster(mockTargetUserId)
      ).rejects.toThrow("Authentication required");
    });

    it("should throw error if requester is not a Guild Master", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: "Only Guild Masters can promote users",
        }),
      });

      await expect(
        userService.promoteToGuildMaster(mockTargetUserId)
      ).rejects.toThrow("Only Guild Masters can promote users");
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

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/users/${mockTargetUserId}/demote`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mockToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      expect(result.id).toBe(mockTargetUserId);
      expect(result.role).toBe("HERO");
    });

    it("should throw error if attempting self-demotion", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Cannot demote yourself" }),
      });

      await expect(userService.demoteToHero(mockUserId)).rejects.toThrow(
        "Cannot demote yourself"
      );
    });

    it("should throw error if trying to demote last Guild Master", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error:
            "Cannot demote the last Guild Master. Promote another family member first.",
        }),
      });

      await expect(
        userService.demoteToHero(mockTargetUserId)
      ).rejects.toThrow("Cannot demote the last Guild Master");
    });

    it("should throw error if not authenticated", async () => {
      // Mock no session
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

      await expect(
        userService.demoteToHero(mockTargetUserId)
      ).rejects.toThrow("User is not a Guild Master");
    });
  });

  describe("countGuildMasters", () => {
    it("should return the count of Guild Masters in a family", async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn();
      const mockEq1 = jest.fn();
      const mockEq2 = jest.fn();

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockResolvedValue({ count: 2, error: null });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await userService.countGuildMasters(mockFamilyId);

      expect(mockFrom).toHaveBeenCalledWith("user_profiles");
      expect(mockSelect).toHaveBeenCalledWith("id", {
        count: "exact",
        head: true,
      });
      expect(mockEq1).toHaveBeenCalledWith("family_id", mockFamilyId);
      expect(mockEq2).toHaveBeenCalledWith("role", "GUILD_MASTER");
      expect(result).toBe(2);
    });

    it("should return 0 if no Guild Masters exist", async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn();
      const mockEq1 = jest.fn();
      const mockEq2 = jest.fn();

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockResolvedValue({ count: 0, error: null });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await userService.countGuildMasters(mockFamilyId);

      expect(result).toBe(0);
    });

    it("should return 0 if count is null", async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn();
      const mockEq1 = jest.fn();
      const mockEq2 = jest.fn();

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockResolvedValue({ count: null, error: null });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await userService.countGuildMasters(mockFamilyId);

      expect(result).toBe(0);
    });

    it("should throw error if query fails", async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn();
      const mockEq1 = jest.fn();
      const mockEq2 = jest.fn();

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockResolvedValue({
        count: null,
        error: { message: "Database error" },
      });

      (supabase.from as jest.Mock) = mockFrom;

      await expect(
        userService.countGuildMasters(mockFamilyId)
      ).rejects.toThrow("Failed to count Guild Masters: Database error");
    });
  });
});
