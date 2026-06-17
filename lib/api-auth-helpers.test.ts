import { NextRequest } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  extractBearerToken,
  authenticateAndFetchUserProfile,
  extractAndAuthenticateUser,
  AuthenticatedUser,
} from "@/lib/api-auth-helpers";
import { AppError, AuthError } from "@/lib/errors";

function createMockRequest(authHeader?: string): NextRequest {
  const headers = new Map<string, string>();
  if (authHeader) {
    headers.set("authorization", authHeader);
  }

  return {
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) || null,
    },
  } as unknown as NextRequest;
}

function createMockSupabaseClient(
  overrides: {
    authUser?: { id: string } | null;
    authError?: Error | null;
    userProfile?: { role: string; family_id: string } | null;
    profileError?: Error | null;
  } = {}
): SupabaseClient {
  return {
    auth: {
      getUser: jest.fn(async () => ({
        data: overrides.authUser ? { user: overrides.authUser } : null,
        error: overrides.authError || null,
      })),
    },
    from: jest.fn((table: string) => {
      if (table === "user_profiles") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(async () => ({
                data: overrides.userProfile,
                error: overrides.profileError || null,
              })),
            })),
          })),
        };
      }

      return {} as Record<string, unknown>;
    }),
  } as unknown as SupabaseClient;
}

async function expectAppError(
  promise: Promise<unknown> | (() => unknown),
  expected: {
    klass: typeof AppError;
    message: string;
    code: string;
    statusCode: number;
  }
) {
  try {
    if (typeof promise === "function") {
      promise();
    } else {
      await promise;
    }
    throw new Error("Expected helper to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(expected.klass);
    expect(error).toMatchObject({
      message: expected.message,
      code: expected.code,
      statusCode: expected.statusCode,
    });
  }
}

describe("api-auth-helpers", () => {
  describe("extractBearerToken", () => {
    it("extracts token from a valid Bearer header", () => {
      expect(extractBearerToken(createMockRequest("Bearer my-secret-token"))).toBe(
        "my-secret-token"
      );
    });

    it("throws AuthError when authorization header is missing", async () => {
      await expectAppError(() => extractBearerToken(createMockRequest()), {
        klass: AuthError,
        message: "Missing or invalid authorization header",
        code: "AUTH_HEADER_INVALID",
        statusCode: 401,
      });
    });

    it("throws AuthError when authorization header is not Bearer", async () => {
      await expectAppError(
        () => extractBearerToken(createMockRequest("Basic dGVzdDp0ZXN0")),
        {
          klass: AuthError,
          message: "Missing or invalid authorization header",
          code: "AUTH_HEADER_INVALID",
          statusCode: 401,
        }
      );
    });

    it("allows an empty token after the Bearer prefix", () => {
      expect(extractBearerToken(createMockRequest("Bearer "))).toBe("");
    });
  });

  describe("authenticateAndFetchUserProfile", () => {
    it("returns authenticated user profile when credentials are valid", async () => {
      const supabase = createMockSupabaseClient({
        authUser: { id: "user-123" },
        userProfile: { role: "GUILD_MASTER", family_id: "family-456" },
      });

      await expect(
        authenticateAndFetchUserProfile(supabase, "valid-token")
      ).resolves.toEqual<AuthenticatedUser>({
        id: "user-123",
        role: "GUILD_MASTER",
        family_id: "family-456",
      });
    });

    it("throws AuthError when authentication fails", async () => {
      const supabase = createMockSupabaseClient({
        authUser: null,
        authError: new Error("Invalid token"),
      });

      await expectAppError(
        authenticateAndFetchUserProfile(supabase, "invalid-token"),
        {
          klass: AuthError,
          message: "Authentication failed",
          code: "AUTH_ERROR",
          statusCode: 401,
        }
      );
    });

    it("throws AppError when profile loading fails", async () => {
      const supabase = createMockSupabaseClient({
        authUser: { id: "user-123" },
        userProfile: null,
        profileError: new Error("Profile not found"),
      });

      await expectAppError(
        authenticateAndFetchUserProfile(supabase, "valid-token"),
        {
          klass: AppError,
          message: "Failed to load user profile",
          code: "PROFILE_LOAD_FAILED",
          statusCode: 500,
        }
      );
    });

    it("supports all expected user roles", async () => {
      const roles = ["GUILD_MASTER", "HERO", "YOUNG_HERO"] as const;

      for (const role of roles) {
        const supabase = createMockSupabaseClient({
          authUser: { id: "user-123" },
          userProfile: { role, family_id: "family-456" },
        });

        await expect(
          authenticateAndFetchUserProfile(supabase, "valid-token")
        ).resolves.toMatchObject({ role });
      }
    });
  });

  describe("extractAndAuthenticateUser", () => {
    it("extracts token and authenticates the user", async () => {
      const supabase = createMockSupabaseClient({
        authUser: { id: "user-123" },
        userProfile: { role: "GUILD_MASTER", family_id: "family-456" },
      });

      await expect(
        extractAndAuthenticateUser(createMockRequest("Bearer valid-token"), supabase)
      ).resolves.toEqual<AuthenticatedUser>({
        id: "user-123",
        role: "GUILD_MASTER",
        family_id: "family-456",
      });
    });

    it("throws when token extraction fails", async () => {
      const supabase = createMockSupabaseClient();

      await expectAppError(
        extractAndAuthenticateUser(createMockRequest(), supabase),
        {
          klass: AuthError,
          message: "Missing or invalid authorization header",
          code: "AUTH_HEADER_INVALID",
          statusCode: 401,
        }
      );
    });

    it("throws when user authentication fails", async () => {
      const supabase = createMockSupabaseClient({
        authUser: null,
        authError: new Error("Token expired"),
      });

      await expectAppError(
        extractAndAuthenticateUser(createMockRequest("Bearer expired-token"), supabase),
        {
          klass: AuthError,
          message: "Authentication failed",
          code: "AUTH_ERROR",
          statusCode: 401,
        }
      );
    });
  });
});
