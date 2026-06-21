import { NextRequest } from "next/server";
import { GET } from "./route";
import { adminUserDetailService } from "@/lib/admin-user-detail-service";
import {
  authenticateAndFetchUserProfile,
  extractBearerToken,
} from "@/lib/api-auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NotFoundError } from "@/lib/errors";

jest.mock("@/lib/admin-user-detail-service", () => ({
  adminUserDetailService: {
    getUserDetail: jest.fn(),
  },
}));

jest.mock("@/lib/api-auth-helpers", () => ({
  extractBearerToken: jest.fn(),
  authenticateAndFetchUserProfile: jest.fn(),
}));

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(),
}));

describe("GET /api/admin/users/[userId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (extractBearerToken as jest.Mock).mockReturnValue("token-1");
    (createServerSupabaseClient as jest.Mock).mockReturnValue({ client: true });
    (authenticateAndFetchUserProfile as jest.Mock).mockResolvedValue({
      id: "gm-1",
      role: "GUILD_MASTER",
      family_id: "family-1",
    });
  });

  it("returns an authenticated same-family admin user detail response", async () => {
    const detail = {
      user: { id: "hero-1", name: "Hero", role: "HERO" },
      character: null,
      questSummary: { active: 0, pendingApproval: 0, approved: 0, missed: 0, total: 0 },
      recentQuests: [],
      goldLedger: {
        entries: [],
        reconciliation: { currentGold: null, ledgerBalance: 0, difference: null, diverged: false },
      },
    };
    (adminUserDetailService.getUserDetail as jest.Mock).mockResolvedValue(detail);

    const response = await GET(new NextRequest("http://app.test/api/admin/users/hero-1"), {
      params: Promise.resolve({ userId: "hero-1" }),
    });

    await expect(response.json()).resolves.toEqual({ success: true, detail });
    expect(response.status).toBe(200);
    expect(adminUserDetailService.getUserDetail).toHaveBeenCalledWith(
      { client: true },
      { id: "gm-1", role: "GUILD_MASTER", family_id: "family-1" },
      "hero-1",
      { ledgerEndDate: null, ledgerEventType: null, ledgerStartDate: null },
    );
  });

  it("rejects invalid ledger event type filters", async () => {
    const response = await GET(
      new NextRequest("http://app.test/api/admin/users/hero-1?ledgerEventType=NOPE"),
      { params: Promise.resolve({ userId: "hero-1" }) },
    );

    await expect(response.json()).resolves.toEqual({
      error: "Invalid ledger event type",
      code: "ADMIN_GOLD_LEDGER_INVALID_EVENT_TYPE",
    });
    expect(response.status).toBe(400);
    expect(adminUserDetailService.getUserDetail).not.toHaveBeenCalled();
  });

  it("returns a generic not-found response for missing or cross-family users", async () => {
    (adminUserDetailService.getUserDetail as jest.Mock).mockRejectedValue(
      new NotFoundError("User not found", "ADMIN_USER_DETAIL_NOT_FOUND"),
    );

    const response = await GET(new NextRequest("http://app.test/api/admin/users/other"), {
      params: Promise.resolve({ userId: "other" }),
    });

    await expect(response.json()).resolves.toEqual({
      error: "User not found",
      code: "ADMIN_USER_DETAIL_NOT_FOUND",
    });
    expect(response.status).toBe(404);
  });
});
