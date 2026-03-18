import { NextRequest } from "next/server";

export const VALID_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
export const INVALID_ID = "not-a-uuid";
export const GM_USER_ID = "user-gm-1";
export const HERO_USER_ID = "user-hero-1";
export const FAMILY_ID = "fam-1";
export const OTHER_FAMILY_ID = "fam-other";

export const makeRequest = (
  method: string,
  body?: unknown,
  auth: string | null = "Bearer token",
) => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (auth !== null) headers["authorization"] = auth;
  return new NextRequest("http://localhost/test", {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

export const params = (id: string) => ({ params: Promise.resolve({ id }) });

/** Returns a chainable mock for .from(...).select().eq().single() */
export const singleResult = (data: unknown, error: unknown = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data, error }),
  maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
});

/** Returns a setupAuth function bound to the given getUser mock */
export const makeSetupAuth =
  (mockGetUser: jest.Mock) =>
  (role: "GUILD_MASTER" | "HERO", familyId = FAMILY_ID) => {
    const userId = role === "GUILD_MASTER" ? GM_USER_ID : HERO_USER_ID;
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });
    return { userId, role, familyId };
  };
