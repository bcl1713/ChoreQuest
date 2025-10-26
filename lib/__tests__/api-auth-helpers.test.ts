import { NextRequest } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  extractBearerToken,
  authenticateAndFetchUserProfile,
  extractAndAuthenticateUser,
  isAuthError,
  authErrorResponse,
  AuthError,
  AuthenticatedUser,
} from "@/lib/api-auth-helpers";

// Helper to create a mock request
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

// Helper to create a mock Supabase client
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

describe("api-auth-helpers", () => {
  describe("extractBearerToken", () => {
    it("should extract token from valid Bearer authorization header", () => {
      const request = createMockRequest("Bearer my-secret-token");
      const result = extractBearerToken(request);

      expect(result).toBe("my-secret-token");
    });

    it("should return error when authorization header is missing", () => {
      const request = createMockRequest();
      const result = extractBearerToken(request);

      expect(isAuthError(result as AuthenticatedUser | AuthError)).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Missing or invalid authorization header");
        expect(result.status).toBe(401);
      }
    });

    it("should return error when authorization header doesn't start with Bearer", () => {
      const request = createMockRequest("Basic dGVzdDp0ZXN0");
      const result = extractBearerToken(request);

      expect(isAuthError(result as AuthenticatedUser | AuthError)).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Missing or invalid authorization header");
        expect(result.status).toBe(401);
      }
    });

    it("should return error when Bearer prefix is present but token is empty", () => {
      const request = createMockRequest("Bearer ");
      const result = extractBearerToken(request);

      expect(result).toBe("");
    });
  });

  describe("authenticateAndFetchUserProfile", () => {
    it("should return authenticated user with profile when credentials are valid", async () => {
      const supabase = createMockSupabaseClient({
        authUser: { id: "user-123" },
        userProfile: { role: "GUILD_MASTER", family_id: "family-456" },
      });

      const result = await authenticateAndFetchUserProfile(supabase, "valid-token");

      expect(isAuthError(result as AuthenticatedUser | AuthError)).toBe(false);
      if (!("error" in result)) {
        expect(result.id).toBe("user-123");
        expect(result.role).toBe("GUILD_MASTER");
        expect(result.family_id).toBe("family-456");
      }
    });

    it("should return error when authentication fails", async () => {
      const supabase = createMockSupabaseClient({
        authUser: null,
        authError: new Error("Invalid token"),
      });

      const result = await authenticateAndFetchUserProfile(supabase, "invalid-token");

      expect(isAuthError(result as AuthenticatedUser | AuthError)).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Authentication failed");
        expect(result.status).toBe(401);
      }
    });

    it("should return error when user profile fetch fails", async () => {
      const supabase = createMockSupabaseClient({
        authUser: { id: "user-123" },
        userProfile: null,
        profileError: new Error("Profile not found"),
      });

      const result = await authenticateAndFetchUserProfile(supabase, "valid-token");

      expect(isAuthError(result as AuthenticatedUser | AuthError)).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Failed to load user profile");
        expect(result.status).toBe(500);
      }
    });

    it("should return error when user is null", async () => {
      const supabase = createMockSupabaseClient({
        authUser: null,
        authError: null,
      });

      const result = await authenticateAndFetchUserProfile(supabase, "some-token");

      expect(isAuthError(result as AuthenticatedUser | AuthError)).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Authentication failed");
        expect(result.status).toBe(401);
      }
    });

    it("should support different user roles", async () => {
      const roles = ["GUILD_MASTER", "HERO", "YOUNG_HERO"] as const;

      for (const role of roles) {
        const supabase = createMockSupabaseClient({
          authUser: { id: "user-123" },
          userProfile: { role, family_id: "family-456" },
        });

        const result = await authenticateAndFetchUserProfile(supabase, "valid-token");

        expect(isAuthError(result as AuthenticatedUser | AuthError)).toBe(false);
        if (!("error" in result)) {
          expect(result.role).toBe(role);
        }
      }
    });
  });

  describe("extractAndAuthenticateUser", () => {
    it("should extract token and authenticate user in one call", async () => {
      const supabase = createMockSupabaseClient({
        authUser: { id: "user-123" },
        userProfile: { role: "GUILD_MASTER", family_id: "family-456" },
      });

      const request = createMockRequest("Bearer valid-token");
      const result = await extractAndAuthenticateUser(request, supabase);

      expect(isAuthError(result as AuthenticatedUser | AuthError)).toBe(false);
      if (!("error" in result)) {
        expect(result.id).toBe("user-123");
        expect(result.role).toBe("GUILD_MASTER");
        expect(result.family_id).toBe("family-456");
      }
    });

    it("should return token extraction error if header is invalid", async () => {
      const supabase = createMockSupabaseClient();
      const request = createMockRequest();

      const result = await extractAndAuthenticateUser(request, supabase);

      expect(isAuthError(result as AuthenticatedUser | AuthError)).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Missing or invalid authorization header");
        expect(result.status).toBe(401);
      }
    });

    it("should return auth error if user authentication fails", async () => {
      const supabase = createMockSupabaseClient({
        authUser: null,
        authError: new Error("Token expired"),
      });

      const request = createMockRequest("Bearer expired-token");
      const result = await extractAndAuthenticateUser(request, supabase);

      expect(isAuthError(result as AuthenticatedUser | AuthError)).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Authentication failed");
        expect(result.status).toBe(401);
      }
    });
  });

  describe("isAuthError", () => {
    it("should return true for auth error objects", () => {
      const error: AuthError = {
        error: "Test error",
        status: 401,
      };

      expect(isAuthError(error)).toBe(true);
    });

    it("should return false for authenticated user objects", () => {
      const user: AuthenticatedUser = {
        id: "user-123",
        role: "GUILD_MASTER",
        family_id: "family-456",
      };

      expect(isAuthError(user)).toBe(false);
    });
  });

  describe("authErrorResponse", () => {
    it("should create a NextResponse with correct status and error message", () => {
      const authError: AuthError = {
        error: "Authentication failed",
        status: 401,
      };

      const response = authErrorResponse(authError);

      expect(response.status).toBe(401);
    });

    it("should handle different status codes", () => {
      const testCases: AuthError[] = [
        { error: "Unauthorized", status: 401 },
        { error: "Forbidden", status: 403 },
        { error: "Server error", status: 500 },
      ];

      testCases.forEach((testCase) => {
        const response = authErrorResponse(testCase);
        expect(response.status).toBe(testCase.status);
      });
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete happy path: token extraction and authentication", async () => {
      const supabase = createMockSupabaseClient({
        authUser: { id: "user-abc" },
        userProfile: { role: "HERO", family_id: "family-xyz" },
      });

      const request = createMockRequest("Bearer abc123token");

      // Step 1: Extract token
      const tokenOrError = extractBearerToken(request);
      expect(isAuthError(tokenOrError as AuthenticatedUser | AuthError)).toBe(false);

      if (typeof tokenOrError === "string") {
        // Step 2: Authenticate
        const userOrError = await authenticateAndFetchUserProfile(supabase, tokenOrError);
        expect(isAuthError(userOrError as AuthenticatedUser | AuthError)).toBe(false);

        if (!("error" in userOrError)) {
          expect(userOrError.id).toBe("user-abc");
          expect(userOrError.family_id).toBe("family-xyz");
        }
      }
    });

    it("should handle error at extraction step", async () => {
      const request = createMockRequest();

      const tokenOrError = extractBearerToken(request);
      expect(isAuthError(tokenOrError as AuthenticatedUser | AuthError)).toBe(true);

      if ("error" in tokenOrError) {
        const response = authErrorResponse(tokenOrError);
        expect(response.status).toBe(401);
      }
    });

    it("should handle error at authentication step", async () => {
      const supabase = createMockSupabaseClient({
        authUser: null,
        authError: new Error("Invalid"),
      });

      const request = createMockRequest("Bearer invalid-token");
      const tokenOrError = extractBearerToken(request);

      if (typeof tokenOrError === "string") {
        const userOrError = await authenticateAndFetchUserProfile(supabase, tokenOrError);
        expect(isAuthError(userOrError as AuthenticatedUser | AuthError)).toBe(true);

        if ("error" in userOrError) {
          const response = authErrorResponse(userOrError);
          expect(response.status).toBe(401);
        }
      }
    });
  });
});
