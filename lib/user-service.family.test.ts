import { userService } from "@/lib/user-service";
import { supabase } from "@/lib/supabase";
import { mockFamilyId } from "./user-service.fixtures";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

describe("UserService - family queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      await expect(userService.getFamilyMembers(mockFamilyId)).rejects.toThrow(
        "Failed to load family members: Database error"
      );
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
      expect(mockSelect).toHaveBeenCalledWith("id", { count: "exact", head: true });
      expect(mockEq1).toHaveBeenCalledWith("family_id", mockFamilyId);
      expect(mockEq2).toHaveBeenCalledWith("role", "GUILD_MASTER");
      expect(result).toBe(2);
    });

    it("should return 0 when no Guild Masters or count null", async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn();
      const mockEq1 = jest.fn();
      const mockEq2 = jest.fn();
      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockResolvedValue({ count: 0, error: null });
      (supabase.from as jest.Mock) = mockFrom;
      expect(await userService.countGuildMasters(mockFamilyId)).toBe(0);

      mockEq2.mockResolvedValue({ count: null, error: null });
      expect(await userService.countGuildMasters(mockFamilyId)).toBe(0);
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
      await expect(userService.countGuildMasters(mockFamilyId)).rejects.toThrow(
        "Failed to count Guild Masters: Database error"
      );
    });
  });
});
