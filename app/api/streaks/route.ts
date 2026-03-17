import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import { ValidationError } from "@/lib/errors";
import { streakService } from "@/lib/streak-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId");

  if (!characterId) {
    return handleRouteError(
      new ValidationError("characterId is required", "CHARACTER_ID_REQUIRED"),
    );
  }

  try {
    const streaks = await streakService.getCharacterStreaks(characterId);
    return NextResponse.json({ streaks });
  } catch (error) {
    return handleRouteError(error);
  }
}
