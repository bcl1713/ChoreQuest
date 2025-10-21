import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Represents the authenticated user and their profile information
 */
export interface AuthenticatedUser {
  id: string;
  role: "GUILD_MASTER" | "HERO" | "YOUNG_HERO";
  family_id: string;
}

/**
 * Response type for authentication errors
 */
export interface AuthError {
  error: string;
  status: number;
}

/**
 * Extracts and validates the Bearer token from the request Authorization header
 *
 * @param request - The Next.js request object
 * @returns The token string, or an AuthError if validation fails
 */
export function extractBearerToken(
  request: NextRequest
): string | AuthError {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: "Missing or invalid authorization header",
      status: 401,
    };
  }

  return authHeader.substring(7);
}

/**
 * Authenticates a user and fetches their profile
 *
 * Performs two operations:
 * 1. Validates the Bearer token using Supabase auth
 * 2. Fetches the user's profile to get role and family_id
 *
 * @param supabase - The Supabase client instance (authenticated with the token)
 * @param token - The Bearer token to validate
 * @returns The authenticated user with profile data, or an AuthError
 */
export async function authenticateAndFetchUserProfile(
  supabase: SupabaseClient,
  token: string
): Promise<AuthenticatedUser | AuthError> {
  // Step 1: Validate the token
  const { data: authData, error: authError } = await supabase.auth.getUser(
    token
  );
  const user = authData?.user;

  if (authError || !user) {
    return {
      error: "Authentication failed",
      status: 401,
    };
  }

  // Step 2: Fetch user profile
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role, family_id")
    .eq("id", user.id)
    .single();

  if (profileError || !userProfile) {
    return {
      error: "Failed to load user profile",
      status: 500,
    };
  }

  return {
    id: user.id,
    role: userProfile.role as "GUILD_MASTER" | "HERO" | "YOUNG_HERO",
    family_id: userProfile.family_id,
  };
}

/**
 * Combined helper that extracts token and authenticates user in one call
 *
 * @param request - The Next.js request object
 * @param supabase - The authenticated Supabase client
 * @returns The authenticated user with profile data, or an AuthError
 */
export async function extractAndAuthenticateUser(
  request: NextRequest,
  supabase: SupabaseClient
): Promise<AuthenticatedUser | AuthError> {
  // Extract token
  const tokenOrError = extractBearerToken(request);

  if (isAuthError(tokenOrError)) {
    return tokenOrError;
  }

  // Authenticate and fetch profile
  return authenticateAndFetchUserProfile(supabase, tokenOrError);
}

/**
 * Checks if a value is an AuthError
 *
 * @param value - The value to check
 * @returns true if the value is an AuthError
 */
export function isAuthError(value: unknown): value is AuthError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    "status" in value
  );
}

/**
 * Creates an error response from an AuthError
 *
 * @param authError - The auth error object
 * @returns A NextResponse with appropriate status code
 */
export function authErrorResponse(authError: AuthError): NextResponse {
  return NextResponse.json({ error: authError.error }, { status: authError.status });
}
