import { getActiveSeasonForFamily } from "@/lib/seasons/active-season";

type Query = Record<string, jest.Mock>;

function createQuery(result: unknown): Query {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockReturnThis(),
  };
}

describe("getActiveSeasonForFamily", () => {
  it("uses families.active_season_id before falling back to season flags", async () => {
    const familyQuery = createQuery({
      data: { active_season_id: "season-1" },
      error: null,
    });
    const seasonQuery = createQuery({
      data: {
        id: "season-1",
        family_id: "family-1",
        name: "Spring Training",
        theme: "pirates",
        starts_at: "2026-04-01T00:00:00.000Z",
        ends_at: null,
      },
      error: null,
    });
    const client = {
      from: jest.fn((table: string) => {
        if (table === "families") return familyQuery;
        if (table === "seasons") return seasonQuery;
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    await expect(
      getActiveSeasonForFamily(client as never, "family-1"),
    ).resolves.toEqual({
      id: "season-1",
      family_id: "family-1",
      name: "Spring Training",
      theme: "pirates",
      starts_at: "2026-04-01T00:00:00.000Z",
      ends_at: null,
    });

    expect(client.from).toHaveBeenNthCalledWith(1, "families");
    expect(familyQuery.select).toHaveBeenCalledWith("active_season_id");
    expect(familyQuery.eq).toHaveBeenCalledWith("id", "family-1");
    expect(seasonQuery.eq).toHaveBeenCalledWith("id", "season-1");
  });

  it("falls back to the family's is_active season when active_season_id is absent", async () => {
    const familyQuery = createQuery({ data: { active_season_id: null }, error: null });
    const seasonQuery = createQuery({
      data: {
        id: "season-2",
        family_id: "family-1",
        name: "Summer Reset",
        theme: null,
        starts_at: "2026-06-01T00:00:00.000Z",
        ends_at: null,
      },
      error: null,
    });
    const client = {
      from: jest.fn((table: string) =>
        table === "families" ? familyQuery : seasonQuery,
      ),
    };

    await expect(
      getActiveSeasonForFamily(client as never, "family-1"),
    ).resolves.toMatchObject({ id: "season-2" });

    expect(seasonQuery.eq).toHaveBeenCalledWith("family_id", "family-1");
    expect(seasonQuery.eq).toHaveBeenCalledWith("is_active", true);
  });

  it("returns null when the family has no active season", async () => {
    const familyQuery = createQuery({ data: { active_season_id: null }, error: null });
    const seasonQuery = createQuery({ data: null, error: null });
    const client = {
      from: jest.fn((table: string) =>
        table === "families" ? familyQuery : seasonQuery,
      ),
    };

    await expect(
      getActiveSeasonForFamily(client as never, "family-1"),
    ).resolves.toBeNull();
  });
});
