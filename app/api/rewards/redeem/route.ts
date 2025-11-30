import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { extractAndAuthenticateUser, authErrorResponse, isAuthError } from "@/lib/api-auth-helpers";

export async function POST(request: NextRequest) {
  const supabase = createServiceSupabaseClient();
  
  // Authenticate user
  const userOrError = await extractAndAuthenticateUser(request, supabase);
  
  if (isAuthError(userOrError)) {
    return authErrorResponse(userOrError);
  }
  const user = userOrError;

  try {
    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json({ error: "Reward ID is required" }, { status: 400 });
    }

    // Call RPC
    const { data, error } = await supabase.rpc('redeem_reward', {
      p_reward_id: rewardId,
      p_user_id: user.id
    });

    if (error) {
      console.error("RPC Error:", error);
      throw new Error(error.message || "Database error during redemption");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Redemption error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to redeem reward" },
      { status: 500 }
    );
  }
}
