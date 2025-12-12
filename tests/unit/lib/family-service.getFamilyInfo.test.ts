import {
  createFamilyService,
  applyDefaultFamilyMocks,
  mockFamilyId,
  mockFamily,
} from "./__fixtures__/family-service.fixtures";

describe("FamilyService - getFamilyInfo", () => {
  let service: any;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    ({ service, mockFrom } = createFamilyService());
    applyDefaultFamilyMocks(mockFrom);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch complete family information with members", async () => {
    const result = await service.getFamilyInfo(mockFamilyId);
    expect(result).toMatchObject({
      id: mockFamilyId,
      name: "The Smith Family",
      code: "ABC12345",
      createdAt: "2025-01-01T10:00:00Z",
    });
    expect(result.members).toHaveLength(3);
  });

  it("should transform member data correctly", async () => {
    const result = await service.getFamilyInfo(mockFamilyId);
    expect(result.members[0]).toMatchObject({
      userId: "user-1",
      email: "alice@example.com",
      displayName: "Alice Smith",
      role: "GUILD_MASTER",
      characterName: "Alice the Knight",
      joinedAt: "2025-01-01T10:00:00Z",
    });
    expect(result.members[1]).toMatchObject({
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
    expect(result.members[2]).toMatchObject({
      userId: "user-3",
      email: "carol@example.com",
      displayName: "Carol Smith",
      role: "HERO",
      characterName: null,
      joinedAt: "2025-01-03T10:00:00Z",
    });
  });

  it("should order members by join date", async () => {
    const result = await service.getFamilyInfo(mockFamilyId);
    expect(result.members.map((m: any) => m.userId)).toEqual([
      "user-1",
      "user-2",
      "user-3",
    ]);
  });

  it("should handle characters as array", async () => {
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
      }
      if (table === "user_profiles") {
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
                    characters: [{ name: "Alice the Knight" }],
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
      }
      if (table === "user_profiles") {
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
});
