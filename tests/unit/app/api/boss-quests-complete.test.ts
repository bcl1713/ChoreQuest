import { applyClassBonusIfApproved, resolveParticipantDecision } from "@/app/api/boss-quests/[id]/complete/route";

describe("resolveParticipantDecision", () => {
  const rewardGold = 50;
  const rewardXp = 100;
  const rewardHonor = 1;

  it("defaults to full approval when no explicit decision is provided", () => {
    const map = new Map<string, any>();

    const result = resolveParticipantDecision("user-missing", map, rewardGold, rewardXp, rewardHonor);

    expect(result).toEqual({
      status: "APPROVED",
      gold: rewardGold,
      xp: rewardXp,
      honor: rewardHonor,
    });
  });

  it("applies partial and denied decisions while leaving others approved", () => {
    const map = new Map<string, any>([
      [
        "user-partial",
        { status: "PARTIAL", gold: 10.9, xp: 5.4, honor: 0 },
      ],
      [
        "user-denied",
        { status: "DENIED" },
      ],
    ]);

    const partial = resolveParticipantDecision("user-partial", map, rewardGold, rewardXp, rewardHonor);
    const denied = resolveParticipantDecision("user-denied", map, rewardGold, rewardXp, rewardHonor);
    const approved = resolveParticipantDecision("user-approved", map, rewardGold, rewardXp, rewardHonor);

    expect(partial).toEqual({
      status: "PARTIAL",
      gold: 10,
      xp: 5,
      honor: 0,
    });
    expect(denied).toEqual({
      status: "DENIED",
      gold: 0,
      xp: 0,
      honor: 0,
    });
    expect(approved).toEqual({
      status: "APPROVED",
      gold: rewardGold,
      xp: rewardXp,
      honor: rewardHonor,
    });
  });
});

describe("applyClassBonusIfApproved", () => {
  it("applies class bonuses only when approved", () => {
    const approved = {
      status: "APPROVED" as const,
      gold: 100,
      xp: 200,
      honor: 2,
    };
    const partial = { ...approved, status: "PARTIAL" as const };

    const mageApproved = applyClassBonusIfApproved(approved, "MAGE");
    const magePartial = applyClassBonusIfApproved(partial, "MAGE");
    const noClassApproved = applyClassBonusIfApproved(approved, null);

    expect(mageApproved).toEqual({
      status: "APPROVED",
      gold: 100,   // Mage has no gold bonus
      xp: 240,     // 200 * 1.2
      honor: 2,    // Mage has no honor bonus
    });
    // Partial decisions should NOT gain bonuses
    expect(magePartial).toEqual(partial);
    // Null/unknown class should behave as neutral multipliers
    expect(noClassApproved).toEqual(approved);
  });
});
