import {
  createStatisticsService,
  mockFamilyId,
  mockFamilyMembers,
  now,
} from "./statistics-service.fixtures";

describe("StatisticsService - getFamilyStatistics errors", () => {
  let service: any;
  let mockFrom: jest.Mock;
  const mockSelect = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    ({ service, mockFrom } = createStatisticsService());
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("should throw error when family members query fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        mockSelect.mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({
            data: null,
            error: { message: "Database error" },
          }),
        });
      }
      return { select: mockSelect };
    });
    await expect(service.getFamilyStatistics(mockFamilyId)).rejects.toThrow(
      "Failed to fetch family members: Database error"
    );
  });

  it("should throw error when completed quests query fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        mockSelect.mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({ data: mockFamilyMembers, error: null }),
        });
      } else if (table === "quest_instances") {
        mockSelect.mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockResolvedValueOnce({
              data: null,
              error: { message: "Quest query error" },
            }),
          }),
        });
      }
      return { select: mockSelect };
    });
    await expect(service.getFamilyStatistics(mockFamilyId)).rejects.toThrow(
      "Failed to fetch completed quests: Quest query error"
    );
  });
});
