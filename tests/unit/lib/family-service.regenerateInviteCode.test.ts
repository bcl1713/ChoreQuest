import { createFamilyService, applyDefaultFamilyMocks, mockFamilyId } from "./__fixtures__/family-service.fixtures";

describe("FamilyService - regenerateInviteCode", () => {
  let service: any;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    ({ service, mockFrom } = createFamilyService());
    applyDefaultFamilyMocks(mockFrom);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should update family invite code", async () => {
    const result = await service.regenerateInviteCode(mockFamilyId);
    expect(result).toEqual({ code: "NEWCODE8" });
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
      return { select: jest.fn() };
    });
    await expect(service.regenerateInviteCode(mockFamilyId)).rejects.toThrow(
      "Failed to regenerate family invite code: Update failed"
    );
  });
});
