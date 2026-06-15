// ─── Fixtures for family achievement progress tests ──────────────────────────

export type MockChain = Record<string, jest.Mock>;

export function makeCountResult(count: number): MockChain {
  const head = jest.fn().mockResolvedValue({ count, error: null });
  const inFn = jest.fn().mockReturnValue({ head });
  const or = jest.fn().mockReturnValue({ head });
  const eq2 = jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({ head }),
    or,
    in: inFn,
    head,
  });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2, or, in: inFn, head });
  const select = jest.fn().mockReturnValue({ eq: eq1, or, in: inFn });
  return { select, eq: eq1, or, in: inFn, head };
}

export function makeDataResult<T>(data: T): {
  select: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  single: jest.Mock;
  or: jest.Mock;
  is: jest.Mock;
} {
  const directData = Array.isArray(data) ? data : [data];
  const resolved = { data: directData, error: null };
  const single = jest.fn().mockResolvedValue({ data, error: null });
  const or = jest.fn().mockResolvedValue(resolved);
  const is = jest.fn().mockResolvedValue(resolved);
  const inFn = jest.fn().mockResolvedValue({ data, error: null });
  // eq returns a thenable that also has chainable methods
  const eq2 = jest
    .fn()
    .mockReturnValue(
      Object.assign(Promise.resolve(resolved), { single, in: inFn }),
    );
  const eq1 = jest.fn().mockReturnValue(
    Object.assign(Promise.resolve(resolved), {
      eq: eq2,
      single,
      in: inFn,
      or,
    }),
  );
  const selectReturn = Object.assign(Promise.resolve(resolved), {
    eq: eq1,
    single,
    in: inFn,
    or,
    is,
  });
  const select = jest.fn().mockReturnValue(selectReturn);
  return { select, eq: eq1, in: inFn, single, or, is };
}

export function makeUpsertResult(error: null | { message: string } = null) {
  return {
    upsert: jest.fn().mockResolvedValue({ error }),
  };
}

export function makeUpdateResult(error: null | { message: string } = null) {
  const isFn = jest.fn().mockResolvedValue({ error });
  const maybeSingleFn = jest
    .fn()
    .mockResolvedValue({ data: null, error: null });
  const selectFn = jest.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
  const chain: MockChain = {
    eq: jest.fn(() => chain),
    is: isFn,
    select: selectFn,
  };
  return {
    update: jest.fn().mockReturnValue(chain),
  };
}

export const FAMILY_ID = "family-001";
export const USER_IDS = ["user-001", "user-002"];
export const CHARACTER_IDS = ["char-001", "char-002"];
export const FAMILY_ACHIEVEMENT_ID = "fach-001";
export const ACTIVE_SEASON_ID = "season-current";
export const ACTIVE_SEASON = {
  id: ACTIVE_SEASON_ID,
  family_id: FAMILY_ID,
  name: "Current Season",
  theme: null,
  starts_at: "2026-01-01T00:00:00.000Z",
  ends_at: null,
};

export function makeActiveSeasonOverrides(): Record<string, MockChain> {
  const activeSeasonFamilies = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: { active_season_id: ACTIVE_SEASON_ID },
          error: null,
        }),
      }),
    }),
  };

  const activeSeasonSeasons = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: ACTIVE_SEASON,
            error: null,
          }),
        }),
      }),
    }),
  };

  return {
    families: activeSeasonFamilies,
    seasons: activeSeasonSeasons,
  };
}

export function makeReadClient(overrides?: Record<string, MockChain>) {
  const noActiveSeasonFamilies = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: { active_season_id: null },
          error: null,
        }),
      }),
    }),
  };
  const noActiveSeasonSeasons = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  };

  const from = jest.fn((table: string) => {
    if (overrides?.[table]) return overrides[table];
    if (table === "families") return noActiveSeasonFamilies;
    if (table === "seasons") return noActiveSeasonSeasons;
    throw new Error(`Unexpected table: ${table}`);
  });
  return { from };
}
