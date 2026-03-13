import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import { ValidationError } from "@/lib/errors";
import { streakService } from "@/lib/streak-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get("familyId");

  if (!familyId) {
    return handleRouteError(
      new ValidationError("familyId is required", "FAMILY_ID_REQUIRED"),
    );
  }

  try {
    const leaderboard = await streakService.getStreakLeaderboard(familyId);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    return handleRouteError(error);
  }
}
