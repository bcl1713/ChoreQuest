import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTokenData } from "@/lib/auth";

const questAssignSchema = z.object({
  assigneeId: z.string().min(1, "Assignee ID is required"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: questId } = await params;
    const body = await req.json();
    const validation = questAssignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid assignment data",
          details: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const { assigneeId } = validation.data;

    // Find the quest instance
    const questInstance = await prisma.questInstance.findUnique({
      where: { id: questId },
    });

    if (!questInstance || questInstance.familyId !== tokenData.familyId) {
      return NextResponse.json(
        {
          error: "Quest not found or not accessible",
        },
        { status: 404 },
      );
    }

    // Check if quest is already assigned
    if (
      questInstance.assignedToId &&
      questInstance.assignedToId !== assigneeId
    ) {
      return NextResponse.json(
        {
          error: "Quest is already assigned to another user",
        },
        { status: 409 },
      );
    }

    // Verify assignee is in the same family
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      include: { character: true },
    });

    if (!assignee || assignee.familyId !== tokenData.familyId) {
      return NextResponse.json(
        {
          error: "Assignee not found or not in the same family",
        },
        { status: 404 },
      );
    }

    // Only guild masters can assign quests to others
    // Users can self-assign (pick up) their own quests
    if (assigneeId !== tokenData.userId && tokenData.role !== "GUILD_MASTER") {
      return NextResponse.json(
        {
          error: "Only Guild Masters can assign quests to others",
        },
        { status: 403 },
      );
    }

    // Update quest assignment using relation instead of foreign key
    const updatedInstance = await prisma.questInstance.update({
      where: { id: questId },
      data: {
        assignedTo: {
          connect: { id: assigneeId },
        },
        status: "PENDING",
      },
      include: {
        assignedTo: {
          include: {
            character: true,
          },
        },
        template: true,
      },
    });

    return NextResponse.json({
      success: true,
      instance: updatedInstance,
    });
  } catch (error) {
    console.error("Quest assignment error:", error);
    return NextResponse.json(
      {
        error: "Failed to assign quest",
      },
      { status: 500 },
    );
  }
}

