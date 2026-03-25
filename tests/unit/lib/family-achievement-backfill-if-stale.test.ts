jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => ({ from: jest.fn() })),
}));

jest.mock("@/lib/family-achievement-progress/family-evaluators", () => ({
  FAMILY_EVALUATOR_REGISTRY: {},
  FAMILY_EVENT_CRITERIA_MAP: {},
  ALL_FAMILY_CRITERIA_TYPES: [],
  isCharBased: jest.fn().mockReturnValue(false),
}));

import { FamilyAchievementProgressService } from "@/lib/family-achievement-progress-service";

function makeChain(overrides: Record<string, jest.Mock> = {}) {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn(),
    eq: jest.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  Object.assign(chain, overrides);
  return chain;
}

describe("FamilyAchievementProgressService.backfillIfStale", () => {
  let service: FamilyAchievementProgressService;

  beforeEach(() => {
    jest.clearAllMocks();
    const readClient = { from: jest.fn().mockReturnValue(makeChain()) };
    service = new FamilyAchievementProgressService(readClient as never);
    jest.spyOn(service, "backfillProgress").mockResolvedValue(undefined);
  });

  it("returns false and skips backfill when counts match and no rows are missing", async () => {
    const readClient = {
      from: jest.fn().mockImplementation(() =>
        makeChain({
          eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
        }),
      ),
    };
    service = new FamilyAchievementProgressService(readClient as never);
    jest.spyOn(service, "backfillProgress").mockResolvedValue(undefined);

    const result = await service.backfillIfStale("fam-1", false, [3], []);
    expect(result).toBe(false);
    expect(service.backfillProgress).not.toHaveBeenCalled();
  });

  it("backfills and returns true when hasMissingProgress is true", async () => {
    const result = await service.backfillIfStale("fam-1", true, [], []);
    expect(result).toBe(true);
    expect(service.backfillProgress).toHaveBeenCalledWith("fam-1");
  });

  it("backfills and returns true when stored member_count differs from current", async () => {
    const readClient = {
      from: jest.fn().mockImplementation(() =>
        makeChain({
          eq: jest.fn().mockResolvedValue({ count: 4, error: null }),
        }),
      ),
    };
    service = new FamilyAchievementProgressService(readClient as never);
    jest.spyOn(service, "backfillProgress").mockResolvedValue(undefined);

    const result = await service.backfillIfStale("fam-1", false, [3], []);
    expect(result).toBe(true);
    expect(service.backfillProgress).toHaveBeenCalledWith("fam-1");
  });

  it("backfills legacy rows that have no roster snapshot (both count arrays empty, no missing rows)", async () => {
    // Simulate existing progress rows that pre-date member_count persistence.
    // hasMissingProgress=false means rows exist, but both count arrays are empty
    // because the stored progress objects lacked member_count fields.
    const result = await service.backfillIfStale("fam-1", false, [], []);
    expect(result).toBe(true);
    expect(service.backfillProgress).toHaveBeenCalledWith("fam-1");
  });
});
