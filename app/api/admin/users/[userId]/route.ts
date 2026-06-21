import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import {
  authenticateAndFetchUserProfile,
  extractBearerToken,
} from "@/lib/api-auth-helpers";
import { adminUserDetailService } from "@/lib/admin-user-detail-service";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const token = extractBearerToken(request);
    const supabase = createServerSupabaseClient(token);
    const requesterProfile = await authenticateAndFetchUserProfile(
      supabase,
      token,
    );

    const detail = await adminUserDetailService.getUserDetail(
      supabase,
      requesterProfile,
      userId,
    );

    return NextResponse.json({ success: true, detail });
  } catch (error) {
    return handleRouteError(error);
  }
}
