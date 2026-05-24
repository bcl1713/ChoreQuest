import { createSupabaseSeasonResetStore } from "@/lib/admin/start-season-reset-store";

describe("Supabase start-season reset store", () => {
  it("lists families without selecting schema-dependent active_season_id", async () => {
    const familiesQuery = createQuery([
      { id: "family-1", name: "Lucas" },
      { id: "family-2", name: "Another" },
    ]);
    const seasonsQuery = createQuery([{ id: "season-old", family_id: "family-1" }], { resolveOnEq: true });
    const client = createClient({ families: familiesQuery, seasons: seasonsQuery });

    const store = createSupabaseSeasonResetStore(client);

    await expect(store.listFamilies()).resolves.toEqual([
      { id: "family-1", name: "Lucas", active_season_id: "season-old" },
      { id: "family-2", name: "Another", active_season_id: null },
    ]);
    expect(familiesQuery.select).toHaveBeenCalledWith("id, name");
    expect(seasonsQuery.select).toHaveBeenCalledWith("id, family_id");
    expect(seasonsQuery.eq).toHaveBeenCalledWith("is_active", true);
  });

  it("loads a family without requiring active_season_id on the families table", async () => {
    const familiesQuery = createQuery({ id: "family-1", name: "Lucas" });
    const client = createClient({ families: familiesQuery });

    const store = createSupabaseSeasonResetStore(client);

    await expect(store.loadFamily("family-1")).resolves.toEqual({
      id: "family-1",
      name: "Lucas",
      active_season_id: null,
    });
    expect(familiesQuery.select).toHaveBeenCalledWith("id, name");
    expect(familiesQuery.eq).toHaveBeenCalledWith("id", "family-1");
  });
});

function createClient(queries: Record<string, ReturnType<typeof createQuery>>) {
  return {
    from: jest.fn((table: string) => queries[table]),
  } as never;
}

function createQuery(data: unknown, options: { resolveOnEq?: boolean } = {}) {
  const query = {
    select: jest.fn(() => query),
    order: jest.fn(() => Promise.resolve({ data, error: null })),
    eq: jest.fn(() => (options.resolveOnEq ? Promise.resolve({ data, error: null }) : query)),
    maybeSingle: jest.fn(() => Promise.resolve({ data, error: null })),
  };
  return query;
}
