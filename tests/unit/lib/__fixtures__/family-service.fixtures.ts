import { FamilyService } from "@/lib/family-service";
import { supabase } from "@/lib/supabase";

export const mockFamilyId = "family-123";

export const mockFamily = {
  id: mockFamilyId,
  name: "The Smith Family",
  code: "ABC12345",
  created_at: "2025-01-01T10:00:00Z",
};

export const mockMembers = [
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
    characters: null,
  },
];

export const createFamilyService = () => {
  const service = new FamilyService();
  const mockFrom = jest.fn();
  (supabase.from as jest.Mock) = mockFrom;
  return { service, mockFrom };
};

export const applyDefaultFamilyMocks = (mockFrom: jest.Mock) => {
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
    }
    if (table === "user_profiles") {
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
};
