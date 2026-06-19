/**
 * Tests for class change achievement progress integration (task 13.1)
 * Verifies updateProgress is called after a successful class change,
 * failures are non-blocking, and updateProgress is skipped when the
 * history insert fails.
 */
const mockUpdateProgress = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/achievement-progress-service", () => ({
  AchievementProgressService: jest
    .fn()
    .mockImplementation(() => ({ updateProgress: mockUpdateProgress })),
}));

const mockServerSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

const mockServiceSupabase = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockServerSupabase),
  createServiceSupabaseClient: jest.fn(() => mockServiceSupabase),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/characters/[id]/change-class/route";

const VALID_CHARACTER_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const USER_ID = "user-001";

function makeRequest(body: object = { newClass: "KNIGHT" }) {
  return new NextRequest("http://localhost/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer token",
    },
    body: JSON.stringify(body),
  });
}

function params(id: string = VALID_CHARACTER_ID) {
  return { params: Promise.resolve({ id }) };
}

function setupMocks({ historyError = null as object | null } = {}) {
  mockServerSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });

  mockServerSupabase.from.mockImplementation((table: string) => {
    if (table === "user_profiles") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: USER_ID, role: "HERO", family_id: "fam-1" },
          error: null,
        }),
      };
    }
    if (table === "characters") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: VALID_CHARACTER_ID,
            user_id: USER_ID,
            class: "MAGE",
            level: 3,
            gold: 500,
          },
          error: null,
        }),
      };
    }
    throw new Error(`Unexpected table in server mock: ${table}`);
  });

  mockServiceSupabase.from.mockImplementation((table: string) => {
    if (table === "characters") {
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: VALID_CHARACTER_ID,
                  user_id: USER_ID,
                  class: "KNIGHT",
                  level: 3,
                  gold: 400,
                },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "character_change_history") {
      return {
        insert: jest.fn().mockResolvedValue({ error: historyError }),
      };
    }
    throw new Error(`Unexpected table in service mock: ${table}`);
  });
}

describe("class change - achievement progress integration (task 13.1)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls updateProgress with CLASS_CHANGED after a successful class change", async () => {
    setupMocks();

    const res = await POST(makeRequest(), params());

    expect(res.status).toBe(200);
    expect(mockUpdateProgress).toHaveBeenCalledWith(VALID_CHARACTER_ID, {
      type: "CLASS_CHANGED",
    });
  });

  it("does not fail class change when updateProgress throws", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    mockUpdateProgress.mockRejectedValueOnce(new Error("Progress DB error"));
    setupMocks();

    const res = await POST(makeRequest(), params());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("logs a warning when updateProgress fails (non-blocking)", async () => {
    const warnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    mockUpdateProgress.mockRejectedValueOnce(new Error("Progress error"));
    setupMocks();

    await POST(makeRequest(), params());

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Achievement progress update failed"),
      expect.any(String),
      expect.any(Error),
    );
    warnSpy.mockRestore();
  });

  it("does not call updateProgress when the history insert fails", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    setupMocks({ historyError: { message: "insert failed" } });

    const res = await POST(makeRequest(), params());

    expect(res.status).toBe(200);
    expect(mockUpdateProgress).not.toHaveBeenCalled();
  });
});
