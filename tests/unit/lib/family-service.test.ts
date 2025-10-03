/**
 * Unit tests for FamilyService
 * Tests family info retrieval and invite code management
 */

import { FamilyService } from "@/lib/family-service";
import { supabase } from "@/lib/supabase";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("FamilyService", () => {
  let service: FamilyService;
  let mockFrom: jest.Mock;

  const mockFamilyId = "family-123";

  const mockFamily = {
    id: "family-123",
    name: "The Smith Family",
    code: "ABC12345",
    created_at: "2025-01-01T10:00:00Z",
  };

  const mockMembers = [
    {
      id: "user-1",
      email: "alice@example.com",
      name: "Alice Smith",
      role: "GUILD_MASTER",
      created_at: "2025-01-01T10:00:00Z",
      characters: {
        name: "Alice the Knight",
      },
    },
    {
      id: "user-2",
      email: "bob@example.com",
      name: "Bob Smith",
      role: "HERO",
      created_at: "2025-01-02T10:00:00Z",
      characters: {
        name: "Bob the Mage",
      },
    },
    {
      id: "user-3",
      email: "carol@example.com",
      name: "Carol Smith",
      role: "HERO",
      created_at: "2025-01-03T10:00:00Z",
      characters: null, // No character yet
    },
  ];

  beforeEach(() => {
    service = new FamilyService();
    mockFrom = jest.fn();
    (supabase.from as jest.Mock) = mockFrom;

    // Setup default mocks
    setupDefaultMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function setupDefaultMocks() {
    mockFrom.mockImplementation((table: string) => {
      if (table === "families") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockFamily,
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { code: "NEWCODE8" },
                  error: null,
                }),
              }),
            }),
          }),
        };
      } else if (table === "user_profiles") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockMembers,
                error: null,
              }),
            }),
          }),
        };
      }

      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    });
  }

  describe("getFamilyInfo", () => {
    it("should fetch complete family information with members", async () => {
      const result = await service.getFamilyInfo(mockFamilyId);

      expect(result).toMatchObject({
        id: "family-123",
        name: "The Smith Family",
        code: "ABC12345",
        createdAt: "2025-01-01T10:00:00Z",
      });

      expect(result.members).toHaveLength(3);
    });

    it("should transform member data correctly", async () => {
      const result = await service.getFamilyInfo(mockFamilyId);

      const alice = result.members[0];
      expect(alice).toMatchObject({
        userId: "user-1",
        email: "alice@example.com",
        displayName: "Alice Smith",
        role: "GUILD_MASTER",
        characterName: "Alice the Knight",
        joinedAt: "2025-01-01T10:00:00Z",
      });

      const bob = result.members[1];
      expect(bob).toMatchObject({
        userId: "user-2",
        email: "bob@example.com",
        displayName: "Bob Smith",
        role: "HERO",
        characterName: "Bob the Mage",
        joinedAt: "2025-01-02T10:00:00Z",
      });
    });

    it("should handle members without characters", async () => {
      const result = await service.getFamilyInfo(mockFamilyId);

      const carol = result.members[2];
      expect(carol).toMatchObject({
        userId: "user-3",
        email: "carol@example.com",
        displayName: "Carol Smith",
        role: "HERO",
        characterName: null,
        joinedAt: "2025-01-03T10:00:00Z",
      });
    });

    it("should order members by join date (created_at ascending)", async () => {
      const result = await service.getFamilyInfo(mockFamilyId);

      expect(result.members[0].userId).toBe("user-1"); // First to join
      expect(result.members[1].userId).toBe("user-2"); // Second
      expect(result.members[2].userId).toBe("user-3"); // Third
    });

    it("should handle characters as array (single element)", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "families") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockFamily,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === "user_profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: "user-1",
                      email: "alice@example.com",
                      name: "Alice Smith",
                      role: "GUILD_MASTER",
                      created_at: "2025-01-01T10:00:00Z",
                      characters: [{ name: "Alice the Knight" }], // Array format
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const result = await service.getFamilyInfo(mockFamilyId);

      expect(result.members[0].characterName).toBe("Alice the Knight");
    });

    it("should handle empty members list", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "families") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockFamily,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === "user_profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const result = await service.getFamilyInfo(mockFamilyId);

      expect(result.members).toEqual([]);
    });

    it("should throw error when family query fails", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "families") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Database error" },
                }),
              }),
            }),
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      await expect(service.getFamilyInfo(mockFamilyId)).rejects.toThrow(
        "Failed to fetch family info: Database error"
      );
    });

    it("should throw error when family is not found", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "families") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      await expect(service.getFamilyInfo(mockFamilyId)).rejects.toThrow(
        "Family not found"
      );
    });

    it("should throw error when members query fails", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "families") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockFamily,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === "user_profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Members query error" },
                }),
              }),
            }),
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      await expect(service.getFamilyInfo(mockFamilyId)).rejects.toThrow(
        "Failed to fetch family members: Members query error"
      );
    });
  });

  describe("regenerateInviteCode", () => {
    it("should generate and return a new invite code", async () => {
      const result = await service.regenerateInviteCode(mockFamilyId);

      expect(result).toBe("NEWCODE8");
    });

    it("should call update with generated code", async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { code: "TESTCODE" },
              error: null,
            }),
          }),
        }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "families") {
          return {
            update: mockUpdate,
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      await service.regenerateInviteCode(mockFamilyId);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ code: expect.any(String) })
      );
    });

    it("should generate 8-character alphanumeric codes", async () => {
      // Spy on the private method indirectly by calling regenerateInviteCode multiple times
      const codes: string[] = [];

      for (let i = 0; i < 10; i++) {
        const mockUpdate = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { code: `CODE${i}XXX` },
                error: null,
              }),
            }),
          }),
        });

        mockFrom.mockImplementation((table: string) => {
          if (table === "families") {
            return {
              update: mockUpdate,
            };
          }

          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        });

        await service.regenerateInviteCode(mockFamilyId);

        // Extract the code that was passed to update
        const callArgs = mockUpdate.mock.calls[0][0];
        codes.push(callArgs.code);
      }

      // Verify all codes are 8 characters
      codes.forEach((code) => {
        expect(code).toHaveLength(8);
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it("should throw error when update fails", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "families") {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Update failed" },
                  }),
                }),
              }),
            }),
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      await expect(service.regenerateInviteCode(mockFamilyId)).rejects.toThrow(
        "Failed to regenerate invite code: Update failed"
      );
    });

    it("should throw error when new code is not returned", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "families") {
          return {
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
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      await expect(service.regenerateInviteCode(mockFamilyId)).rejects.toThrow(
        "Failed to retrieve new invite code"
      );
    });
  });
});
