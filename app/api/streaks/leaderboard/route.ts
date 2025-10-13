import { NextResponse } from "next/server";
import { streakService } from "@/lib/streak-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get("familyId");

  if (!familyId) {
    return NextResponse.json(
      { error: "familyId is required" },
      { status: 400 }
    );
  }

  try {
    const leaderboard = await streakService.getStreakLeaderboard(familyId);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
