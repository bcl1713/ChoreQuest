import { createSupabaseSeasonResetStore } from "./start-season-reset-store";

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

  it("fails with a migration preflight message when the seasons table is missing", async () => {
    const familiesQuery = createQuery([{ id: "family-1", name: "Lucas" }]);
    const seasonsQuery = createQuery(null, {
      eqError: { message: "Could not find the table 'public.seasons' in the schema cache" },
      resolveOnEq: true,
    });
    const client = createClient({ families: familiesQuery, seasons: seasonsQuery });

    const store = createSupabaseSeasonResetStore(client);

    await expect(store.listFamilies()).rejects.toThrow(
      "Seasons table is missing; apply Supabase migration supabase/migrations/20260326000001_add_seasons.sql",
    );
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

  it("treats a missing active_season_id column as an optional pointer during apply", async () => {
    const familiesQuery = createQuery(null, {
      updateError: { message: "column families.active_season_id does not exist" },
    });
    const client = createClient({ families: familiesQuery });

    const store = createSupabaseSeasonResetStore(client);

    await expect(store.setFamilyActiveSeason("family-1", "season-new")).resolves.toBe(false);
    expect(familiesQuery.update).toHaveBeenCalledWith({ active_season_id: "season-new" });
  });
});

function createClient(queries: Record<string, ReturnType<typeof createQuery>>) {
  return {
    from: jest.fn((table: string) => queries[table]),
  } as never;
}

function createQuery(
  data: unknown,
  options: { resolveOnEq?: boolean; eqError?: { message: string } | null; updateError?: { message: string } | null } = {},
) {
  const query = {
    select: jest.fn(() => query),
    order: jest.fn(() => Promise.resolve({ data, error: null })),
    eq: jest.fn(() => (options.resolveOnEq ? Promise.resolve({ data, error: options.eqError ?? null }) : query)),
    maybeSingle: jest.fn(() => Promise.resolve({ data, error: null })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: options.updateError ?? null })),
    })),
  };
  return query;
}
