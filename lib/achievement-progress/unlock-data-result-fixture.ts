export type MockChain = Record<string, jest.Mock>;

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
