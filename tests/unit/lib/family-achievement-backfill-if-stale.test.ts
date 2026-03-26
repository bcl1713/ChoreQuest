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

    const result = await service.backfillIfStale(
      "fam-1",
      false,
      [3],
      [],
      false,
    );
    expect(result).toBe(false);
    expect(service.backfillProgress).not.toHaveBeenCalled();
  });

  it("backfills and returns true when hasMissingProgress is true", async () => {
    const result = await service.backfillIfStale("fam-1", true, [], [], false);
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

    const result = await service.backfillIfStale(
      "fam-1",
      false,
      [3],
      [],
      false,
    );
    expect(result).toBe(true);
    expect(service.backfillProgress).toHaveBeenCalledWith("fam-1");
  });

  it("backfills when all rows are legacy (no roster snapshots, no missing rows)", async () => {
    // All progress rows pre-date member_count persistence — hasLegacyRows=true.
    const result = await service.backfillIfStale("fam-1", false, [], [], true);
    expect(result).toBe(true);
    expect(service.backfillProgress).toHaveBeenCalledWith("fam-1");
  });

  it("backfills in mixed state where some rows have snapshots and some are legacy", async () => {
    // A subset of rows have member_count snapshots; others are legacy.
    // The snapshot comparison would pass (counts match), but legacy rows must
    // still trigger a backfill — hasLegacyRows takes priority.
    const readClient = {
      from: jest.fn().mockImplementation(() =>
        makeChain({
          eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
        }),
      ),
    };
    service = new FamilyAchievementProgressService(readClient as never);
    jest.spyOn(service, "backfillProgress").mockResolvedValue(undefined);

    const result = await service.backfillIfStale(
      "fam-1",
      false,
      [3], // snapshot from new-style row — matches current count
      [],
      true, // but another row has no snapshot
    );
    expect(result).toBe(true);
    expect(service.backfillProgress).toHaveBeenCalledWith("fam-1");
  });
});
