import { NextRequest } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { AppError, AuthError } from "@/lib/errors";

/**
 * Represents the authenticated user and their profile information
 */
export interface AuthenticatedUser {
  id: string;
  role: "GUILD_MASTER" | "HERO" | "YOUNG_HERO";
  family_id: string;
}

/**
 * Extracts and validates the Bearer token from the request Authorization header
 *
 * @param request - The Next.js request object
 * @returns The token string
 */
export function extractBearerToken(
  request: NextRequest
): string {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError(
      "Missing or invalid authorization header",
      "AUTH_HEADER_INVALID",
    );
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
 * @returns The authenticated user with profile data
 */
export async function authenticateAndFetchUserProfile(
  supabase: SupabaseClient,
  token: string
): Promise<AuthenticatedUser> {
  // Step 1: Validate the token
  const { data: authData, error: authError } = await supabase.auth.getUser(
    token
  );
  const user = authData?.user;

  if (authError || !user) {
    throw new AuthError("Authentication failed", "AUTH_ERROR");
  }

  // Step 2: Fetch user profile
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role, family_id")
    .eq("id", user.id)
    .single();

  if (profileError || !userProfile) {
    throw new AppError("Failed to load user profile", 500, "PROFILE_LOAD_FAILED");
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
 * @returns The authenticated user with profile data
 */
export async function extractAndAuthenticateUser(
  request: NextRequest,
  supabase: SupabaseClient
): Promise<AuthenticatedUser> {
  const token = extractBearerToken(request);
  return authenticateAndFetchUserProfile(supabase, token);
}
