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

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id, volunteered_by")
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
        { error: "Cannot release quests for another family" },
        { status: 403 }
      );
    }

    let characterIdForRelease: string | null = null;

    if (profile.role === "GUILD_MASTER") {
      characterIdForRelease = quest.volunteered_by ?? null;
    } else {
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

      characterIdForRelease = character?.id ?? null;
    }

    if (!characterIdForRelease) {
      return NextResponse.json(
        { error: "Unable to determine which character should release this quest" },
        { status: 400 }
      );
    }

    const questInstanceService = new QuestInstanceService(supabase);
    const releasedQuest = await questInstanceService.releaseQuest(
      questId,
      characterIdForRelease
    );

    return NextResponse.json(
      {
        success: true,
        quest: releasedQuest,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      !(
        message.includes("Quest cannot be released") ||
        message.includes("Only FAMILY quests can be released") ||
        message.includes("Only the hero who claimed this quest can release it")
      )
    ) {
      console.error("Error releasing quest:", error);
    }

    const status =
      message.startsWith("Failed to fetch quest") ||
      message.startsWith("Quest cannot be released") ||
      message.startsWith("Only FAMILY quests") ||
      message.startsWith("Only the hero")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
