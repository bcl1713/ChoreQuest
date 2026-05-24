import { buildCharacterResetPatch, runStartSeasonReset, type SeasonResetStore } from "@/lib/admin/start-season-reset";
import { parseStartSeasonResetArgs } from "@/lib/admin/start-season-reset-cli";

describe("admin start-season reset", () => {
  it("resets season-derived character state while preserving spendable gold", () => {
    const patch = buildCharacterResetPatch();

    expect(patch).toEqual({
      xp: 0,
      level: 1,
      gems: 0,
      honor_points: 0,
      active_family_quest_id: null,
    });
    expect(patch).not.toHaveProperty("gold");
  });

  it("requires explicit target users and defaults to dry-run", () => {
    const parsed = parseStartSeasonResetArgs([
      "--family-id",
      "family-1",
      "--name",
      "Summer 2026",
      "--starts-at",
      "2026-06-01T05:00:00.000Z",
      "--user-id",
      "user-1",
    ]);

    expect(parsed.dryRun).toBe(true);
    expect(parsed.userIds).toEqual(["user-1"]);
    expect(parsed.apply).toBe(false);
  });

  it("accepts the issue command alias --reset-user and starts-at now", () => {
    const parsed = parseStartSeasonResetArgs([
      "--family-id",
      "family-1",
      "--name",
      "Summer 2026",
      "--starts-at",
      "now",
      "--reset-user",
      "user-1",
      "--dry-run",
    ]);

    expect(parsed.userIds).toEqual(["user-1"]);
    expect(Number.isNaN(Date.parse(parsed.startsAt))).toBe(false);
    expect(parsed.dryRun).toBe(true);
  });

  it("rejects irreversible apply mode without confirmation", () => {
    expect(() =>
      parseStartSeasonResetArgs([
        "--family-id",
        "family-1",
        "--name",
        "Summer 2026",
        "--starts-at",
        "2026-06-01T05:00:00.000Z",
        "--user-id",
        "user-1",
        "--apply",
      ]),
    ).toThrow(/--confirm-start-season-reset/);
  });

  it("dry-runs without writing but reports intended season and reset counts", async () => {
    const store = createFakeStore();

    const result = await runStartSeasonReset(store, {
      familyId: "family-1",
      name: "Summer 2026",
      theme: "quarterly adventure",
      description: "Reset for summer",
      startsAt: "2026-06-01T05:00:00.000Z",
      userIds: ["user-1", "user-2"],
      dryRun: true,
      apply: false,
      confirm: false,
    });

    expect(result.dryRun).toBe(true);
    expect(result.season.id).toBe("dry-run-season");
    expect(result.characters).toEqual([
      expect.objectContaining({ userId: "user-1", goldBefore: 50, goldAfter: 50 }),
      expect.objectContaining({ userId: "user-2", goldBefore: 375, goldAfter: 375 }),
    ]);
    expect(result.mutations).toEqual({
      seasonsCreated: 0,
      seasonsDeactivated: 1,
      familyActiveSeasonUpdated: 1,
      charactersReset: 2,
      characterAchievementsDeleted: 0,
      characterQuestStreaksDeleted: 2,
      newSeasonCharacterAchievementRows: 0,
      newSeasonFamilyAchievementProgressRows: 0,
    });
    expect(store.calls).toEqual(["loadFamily", "loadActiveSeasons", "loadCharacters"]);
  });

  it("apply mode creates and activates the season before resetting selected characters", async () => {
    const store = createFakeStore();

    const result = await runStartSeasonReset(store, {
      familyId: "family-1",
      name: "Summer 2026",
      theme: null,
      description: null,
      startsAt: "2026-06-01T05:00:00.000Z",
      userIds: ["user-1"],
      dryRun: false,
      apply: true,
      confirm: true,
    });

    expect(result.dryRun).toBe(false);
    expect(result.season.id).toBe("season-new");
    expect(store.calls).toEqual([
      "loadFamily",
      "loadActiveSeasons",
      "loadCharacters",
      "createSeason:false",
      "deactivateActiveSeasons",
      "activateSeason:season-new",
      "setFamilyActiveSeason",
      "resetCharacter:character-1",
      "deleteCharacterQuestStreaks:character-1",
      "loadCharacters",
      "countCharacterAchievementsForSeason:season-new",
      "countFamilyAchievementProgressForSeason:season-new",
    ]);
    expect(result.characters).toEqual([
      expect.objectContaining({ userId: "user-1", goldBefore: 50, goldAfter: 50 }),
    ]);
  });

  it("continues apply mode when the family active-season pointer column is unavailable", async () => {
    const store = createFakeStore({ familyActiveSeasonUpdated: false });

    const result = await runStartSeasonReset(store, {
      familyId: "family-1",
      name: "Summer 2026",
      theme: null,
      description: null,
      startsAt: "2026-06-01T05:00:00.000Z",
      userIds: ["user-1"],
      dryRun: false,
      apply: true,
      confirm: true,
    });

    expect(result.mutations.familyActiveSeasonUpdated).toBe(0);
    expect(store.calls).toContain("setFamilyActiveSeason");
    expect(store.calls).toContain("resetCharacter:character-1");
  });

  it("fails apply mode if a reset changes preserved gold", async () => {
    const store = createFakeStore({ goldAfterByUserId: new Map([["user-1", 49]]) });

    await expect(
      runStartSeasonReset(store, {
        familyId: "family-1",
        name: "Summer 2026",
        theme: null,
        description: null,
        startsAt: "2026-06-01T05:00:00.000Z",
        userIds: ["user-1"],
        dryRun: false,
        apply: true,
        confirm: true,
      }),
    ).rejects.toThrow(/Gold changed unexpectedly/);
  });
});

function createFakeStore(
  options: { familyActiveSeasonUpdated?: boolean; goldAfterByUserId?: Map<string, number> } = {},
): SeasonResetStore & { calls: string[] } {
  const calls: string[] = [];
  const store: SeasonResetStore & { calls: string[] } = {
    calls,
    async listFamilies() {
      calls.push("listFamilies");
      return [{ id: "family-1", name: "Lucas", active_season_id: "season-old" }];
    },
    async listFamilyUsers(familyId) {
      calls.push(`listFamilyUsers:${familyId}`);
      return [
        {
          user_id: "user-1",
          user_name: "Hero One",
          user_email: "hero1@example.test",
          character_id: "character-1",
          character_name: "Hero One",
        },
      ];
    },
    async loadFamily(familyId) {
      calls.push("loadFamily");
      return { id: familyId, name: "Lucas", active_season_id: "season-old" };
    },
    async loadActiveSeasons() {
      calls.push("loadActiveSeasons");
      return [{ id: "season-old", name: "Spring 2026" }];
    },
    async loadCharacters(_familyId, userIds) {
      const callCount = calls.filter((call) => call === "loadCharacters").length;
      calls.push("loadCharacters");
      const rows = [
        {
          id: "character-1",
          user_id: "user-1",
          name: "Hero One",
          xp: 100,
          level: 3,
          gold: 50,
          gems: 2,
          honor_points: 1,
          active_family_quest_id: "quest-1",
        },
        {
          id: "character-2",
          user_id: "user-2",
          name: "Hero Two",
          xp: 900,
          level: 8,
          gold: 375,
          gems: 7,
          honor_points: 3,
          active_family_quest_id: null,
        },
      ];
      if (callCount > 0 && options.goldAfterByUserId) {
        for (const row of rows) {
          row.gold = options.goldAfterByUserId.get(row.user_id) ?? row.gold;
        }
      }

      return rows.filter((row) => userIds.includes(row.user_id));
    },
    async deactivateActiveSeasons() {
      calls.push("deactivateActiveSeasons");
    },
    async createSeason(input) {
      calls.push(`createSeason:${input.is_active}`);
      return { id: "season-new" };
    },
    async activateSeason(seasonId) {
      calls.push(`activateSeason:${seasonId}`);
    },
    async setFamilyActiveSeason() {
      calls.push("setFamilyActiveSeason");
      return options.familyActiveSeasonUpdated ?? true;
    },
    async resetCharacter(characterId) {
      calls.push(`resetCharacter:${characterId}`);
    },
    async deleteCharacterQuestStreaks(characterId) {
      calls.push(`deleteCharacterQuestStreaks:${characterId}`);
      return 2;
    },
    async countCharacterAchievementsForSeason(seasonId) {
      calls.push(`countCharacterAchievementsForSeason:${seasonId}`);
      return 0;
    },
    async countFamilyAchievementProgressForSeason(seasonId) {
      calls.push(`countFamilyAchievementProgressForSeason:${seasonId}`);
      return 0;
    },
  };

  return store;
}
