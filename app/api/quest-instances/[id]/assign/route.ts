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

    const body = await request.json().catch(() => null);
    const characterId = body?.characterId as string | undefined;

    if (!characterId) {
      return NextResponse.json(
        { error: "Character ID is required" },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
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

    if (requesterProfile.role !== "GUILD_MASTER") {
      return NextResponse.json(
        { error: "Only Guild Masters can assign family quests" },
        { status: 403 }
      );
    }

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id, quest_type")
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

    if (quest.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: "Cannot assign quests outside your family" },
        { status: 403 }
      );
    }

    if (quest.quest_type !== "FAMILY") {
      return NextResponse.json(
        { error: "Only family quests support GM assignment" },
        { status: 400 }
      );
    }

    const questInstanceService = new QuestInstanceService(supabase);
    const assignedQuest = await questInstanceService.assignQuest(
      questId,
      characterId,
      user.id
    );

    return NextResponse.json(
      {
        success: true,
        quest: assignedQuest,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      !(
        message.includes("Quest is not available for assignment") ||
        message.includes("Only FAMILY quests can be assigned") ||
        message.includes("Hero already has an active family quest")
      )
    ) {
      console.error("Error assigning quest:", error);
    }

    const status =
      message.startsWith("Quest is not available") ||
      message.startsWith("Only FAMILY quests") ||
      message.startsWith("Hero already has")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
