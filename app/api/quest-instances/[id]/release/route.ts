import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { QuestInstanceService } from "@/lib/quest-instance-service";

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

    const body = await request.json().catch(() => ({}));
    const characterId = body?.characterId as string | undefined;

    const { data: authData, error: authError } = await supabase.auth.getUser(
      token
    );
    const user = authData?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const { data: requesterProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role, family_id")
      .eq("id", user.id)
      .single();

    if (profileError || !requesterProfile) {
      return NextResponse.json(
        { error: "Failed to load user profile" },
        { status: 500 }
      );
    }

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id, status, assigned_to_id, quest_type, volunteered_by")
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

    // Check authorization: GM or hero who claimed the quest
    const isGM = requesterProfile.role === "GUILD_MASTER";
    const isQuestClaimer = characterId && quest.volunteered_by === characterId;

    if (!isGM && !isQuestClaimer) {
      return NextResponse.json(
        { error: "You can only release your own claimed quests" },
        { status: 403 }
      );
    }

    // Check family authorization for GMs
    if (isGM && quest.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: "Cannot release quests outside your family" },
        { status: 403 }
      );
    }

    // For family quests, use the service to properly handle character updates
    if (quest.quest_type === "FAMILY" && characterId) {
      const questService = new QuestInstanceService(supabase);
      await questService.releaseQuest(questId, characterId);
    } else {
      // For individual quests or when characterId not provided, just unassign
      const updateData: Record<string, null | string> = {
        assigned_to_id: null,
        status: "AVAILABLE",
      };
      const { error: updateError } = await supabase
        .from("quest_instances")
        .update(updateData)
        .eq("id", questId);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to update quest: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: "Quest released back to available pool" },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    console.error("Error releasing quest:", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
