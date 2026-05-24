import { type SeasonResetStore } from "@/lib/admin/start-season-reset";
import {
  formatStartSeasonDiscoveryAudit,
  parseStartSeasonResetArgs,
  runStartSeasonDiscovery,
} from "@/lib/admin/start-season-reset-cli";

describe("admin start-season reset CLI discovery", () => {
  it("parses list-families discovery without requiring reset arguments", () => {
    const parsed = parseStartSeasonResetArgs(["--list-families"]);

    expect(parsed.discovery).toBe("families");
    expect(parsed.dryRun).toBe(true);
    expect(parsed.apply).toBe(false);
    expect(parsed.familyId).toBeNull();
    expect(parsed.name).toBeNull();
    expect(parsed.userIds).toEqual([]);
  });

  it("parses list-family-users discovery for a specific family without reset targets", () => {
    const parsed = parseStartSeasonResetArgs(["--family-id", "family-1", "--list-family-users"]);

    expect(parsed.discovery).toBe("family-users");
    expect(parsed.familyId).toBe("family-1");
    expect(parsed.dryRun).toBe(true);
    expect(parsed.userIds).toEqual([]);
  });

  it("rejects discovery helpers in apply mode", () => {
    expect(() => parseStartSeasonResetArgs(["--list-families", "--apply"])).toThrow(/Discovery mode is dry-run only/);
  });

  it("lists families and family users for operator setup", async () => {
    const store = createFakeStore();

    const families = await runStartSeasonDiscovery(store, {
      familyId: null,
      name: null,
      theme: null,
      description: null,
      startsAt: null,
      userIds: [],
      dryRun: true,
      apply: false,
      confirm: false,
      discovery: "families",
    });
    expect(formatStartSeasonDiscoveryAudit(families)).toContain("Lucas (family-1) activeSeason=season-old");

    const familyUsers = await runStartSeasonDiscovery(store, {
      familyId: "family-1",
      name: null,
      theme: null,
      description: null,
      startsAt: null,
      userIds: [],
      dryRun: true,
      apply: false,
      confirm: false,
      discovery: "family-users",
    });
    expect(formatStartSeasonDiscoveryAudit(familyUsers)).toContain("Hero One user=user-1 character=character-1");
    expect(store.calls).toEqual(["listFamilies", "listFamilyUsers:family-1"]);
  });
});

function createFakeStore(): SeasonResetStore & { calls: string[] } {
  const calls: string[] = [];
  return {
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
    async loadFamily() {
      throw new Error("not used");
    },
    async loadActiveSeasons() {
      throw new Error("not used");
    },
    async loadCharacters() {
      throw new Error("not used");
    },
    async deactivateActiveSeasons() {
      throw new Error("not used");
    },
    async createSeason() {
      throw new Error("not used");
    },
    async activateSeason() {
      throw new Error("not used");
    },
    async setFamilyActiveSeason() {
      throw new Error("not used");
    },
    async resetCharacter() {
      throw new Error("not used");
    },
    async deleteCharacterQuestStreaks() {
      throw new Error("not used");
    },
    async countCharacterAchievementsForSeason() {
      throw new Error("not used");
    },
    async countFamilyAchievementProgressForSeason() {
      throw new Error("not used");
    },
  };
}
