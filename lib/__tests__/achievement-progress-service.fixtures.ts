// ─── Helpers ──────────────────────────────────────────────────────────────────

export type MockChain = Record<string, jest.Mock>;

export function makeCountResult(count: number): MockChain {
  const head = jest.fn().mockResolvedValue({ count, error: null });
  const eq2 = jest.fn().mockReturnValue({ head });
  const or = jest.fn().mockReturnValue({ head });
  const inFn = jest.fn().mockReturnValue({ head });
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
  const single = jest.fn().mockResolvedValue({ data, error: null });
  const directData = Array.isArray(data) ? data : [data];
  const resolved = { data: directData, error: null };
  const or = jest.fn().mockResolvedValue(resolved);
  const is = jest.fn().mockResolvedValue(resolved);
  const inFn = jest.fn().mockResolvedValue({ data, error: null });
  const eq2 = jest.fn().mockReturnValue({ single, in: inFn });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2, single, in: inFn, or });
  // Make selectReturn both a Promise (for direct await) and chainable (for .eq, .single, etc.)
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

export function makeErrorResult(message: string) {
  const error = { message };
  const single = jest.fn().mockResolvedValue({ data: null, error });
  const or = jest.fn().mockResolvedValue({ data: null, error });
  const head = jest.fn().mockResolvedValue({ count: null, error });
  const inFn = jest.fn().mockResolvedValue({ data: null, error });
  const eq2 = jest.fn().mockReturnValue({ single, in: inFn, head });
  const eq1 = jest
    .fn()
    .mockReturnValue({ eq: eq2, single, in: inFn, or, head });
  const select = jest
    .fn()
    .mockReturnValue({ eq: eq1, single, in: inFn, or, head });
  return { select, eq: eq1, in: inFn, single, or, head };
}

export function makeUpsertResult(error: null | { message: string } = null) {
  return {
    upsert: jest.fn().mockResolvedValue({ error }),
  };
}

export const CHARACTER_ID = "char-001";
export const USER_ID = "user-001";
export const ACHIEVEMENT_ID = "ach-001";

export function makeReadClient(overrides?: Record<string, MockChain>) {
  const from = jest.fn((table: string) => {
    if (overrides?.[table]) return overrides[table];
    throw new Error(`Unexpected table: ${table}`);
  });
  return { from };
}
