/**
 * Quest Approval API
 * Allows Guild Masters to approve quest instances and trigger streak integration.
 */

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

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const user = authData?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role, family_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Failed to load user profile" },
        { status: 500 }
      );
    }

    if (profile.role !== "GUILD_MASTER") {
      return NextResponse.json(
        { error: "Only Guild Masters can approve quests" },
        { status: 403 }
      );
    }

    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .select("id, family_id")
      .eq("id", questId)
      .maybeSingle();

    if (questError) {
      return NextResponse.json({ error: `Failed to fetch quest: ${questError.message}` }, { status: 400 });
    }

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    if (quest.family_id !== profile.family_id) {
      return NextResponse.json(
        { error: "Cannot approve quests for other families" },
        { status: 403 }
      );
    }

    const questInstanceService = new QuestInstanceService(supabase);
    const approvedQuest = await questInstanceService.approveQuest(questId);

    return NextResponse.json(
      {
        success: true,
        quest: approvedQuest,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const isClientError =
      message.includes("already approved") ||
      message.includes("assigned to a hero") ||
      message.includes("not associated") ||
      message.includes("Failed to fetch assigned character") ||
      message.includes("Failed to fetch quest");

    if (!isClientError) {
      console.error("Error approving quest:", error);
    }

    return NextResponse.json(
      { error: message },
      { status: isClientError ? 400 : 500 }
    );
  }
}
