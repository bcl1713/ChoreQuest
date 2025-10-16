import { NextRequest, NextResponse } from "next/server";
import { QuestInstanceService } from "@/lib/quest-instance-service";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createServerSupabaseClient(token);

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser(token);
    const user = authData?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("family_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Failed to load user profile" },
        { status: 500 }
      );
    }

    if (!["HERO", "YOUNG_HERO", "GUILD_MASTER"].includes(profile.role ?? "")) {
      return NextResponse.json(
        { error: "Only heroes can claim quests" },
        { status: 403 }
      );
    }

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id")
      .eq("id", questId)
      .maybeSingle();

    if (questError) {
      return NextResponse.json(
        { error: `Failed to fetch quest: ${questError.message}` },
        { status: 400 }
      );
    }

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    if (quest.family_id !== profile.family_id) {
      return NextResponse.json(
        { error: "Cannot claim quests for another family" },
        { status: 403 }
      );
    }

    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (characterError) {
      return NextResponse.json(
        { error: `Failed to fetch character: ${characterError.message}` },
        { status: 400 }
      );
    }

    if (!character) {
      return NextResponse.json(
        { error: "No character found for this hero" },
        { status: 400 }
      );
    }

    const questInstanceService = new QuestInstanceService(supabase);
    const claimedQuest = await questInstanceService.claimQuest(
      questId,
      character.id
    );

    return NextResponse.json(
      {
        success: true,
        quest: claimedQuest,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      !(
        message.includes("Quest is not available") ||
        message.includes("Only FAMILY quests can be claimed") ||
        message.includes("Failed to fetch character") ||
        message.includes("Hero already has an active family quest")
      )
    ) {
      console.error("Error claiming quest:", error);
    }

    const status =
      message.startsWith("Failed to fetch quest") ||
      message.startsWith("Hero already has") ||
      message.startsWith("Quest is not available") ||
      message.startsWith("Only FAMILY quests")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
