export type SeasonResetCharacter = {
  id: string;
  user_id: string;
  name: string | null;
  xp: number | null;
  level: number | null;
  gold: number | null;
  gems: number | null;
  honor_points: number | null;
  active_family_quest_id?: string | null;
};

export type SeasonResetFamily = {
  id: string;
  name: string | null;
  active_season_id: string | null;
};

export type SeasonResetActiveSeason = { id: string; name: string | null };

export type SeasonResetFamilyUser = {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  character_id: string | null;
  character_name: string | null;
};

export type CreatedSeason = { id: string };

export type StartSeasonDiscoveryMode = "families" | "family-users";

export type StartSeasonResetOptions = {
  familyId: string | null;
  name: string | null;
  theme: string | null;
  description: string | null;
  startsAt: string | null;
  userIds: string[];
  allUsers?: boolean;
  dryRun: boolean;
  apply: boolean;
  confirm: boolean;
  discovery?: StartSeasonDiscoveryMode | null;
};

export type CharacterResetPatch = { xp: number; level: number; gems: number; honor_points: number; active_family_quest_id: null };

export type SeasonResetStore = {
  listFamilies(): Promise<SeasonResetFamily[]>;
  listFamilyUsers(familyId: string): Promise<SeasonResetFamilyUser[]>;
  loadFamily(familyId: string): Promise<SeasonResetFamily | null>;
  loadActiveSeasons(familyId: string): Promise<SeasonResetActiveSeason[]>;
  loadCharacters(familyId: string, userIds: string[], allUsers?: boolean): Promise<SeasonResetCharacter[]>;
  deactivateActiveSeasons(familyId: string, endsAt: string): Promise<void>;
  createSeason(input: {
    family_id: string;
    name: string;
    theme: string | null;
    description: string | null;
    starts_at: string;
    is_active: boolean;
  }): Promise<CreatedSeason>;
  activateSeason(seasonId: string): Promise<void>;
  setFamilyActiveSeason(familyId: string, seasonId: string): Promise<void>;
  resetCharacter(characterId: string, patch: CharacterResetPatch): Promise<void>;
  deleteCharacterQuestStreaks(characterId: string): Promise<number>;
  countCharacterAchievementsForSeason(seasonId: string): Promise<number>;
  countFamilyAchievementProgressForSeason(seasonId: string): Promise<number>;
};

export type CharacterResetAudit = {
  characterId: string;
  userId: string;
  name: string | null;
  xpBefore: number;
  levelBefore: number;
  goldBefore: number;
  goldAfter: number;
  gemsBefore: number;
  honorBefore: number;
};

export type SeasonResetResult = {
  dryRun: boolean;
  family: SeasonResetFamily;
  previousActiveSeasonIds: string[];
  season: { id: string; name: string; startsAt: string };
  characters: CharacterResetAudit[];
  mutations: {
    seasonsCreated: number;
    seasonsDeactivated: number;
    familyActiveSeasonUpdated: number;
    charactersReset: number;
    characterAchievementsDeleted: number;
    characterQuestStreaksDeleted: number;
    newSeasonCharacterAchievementRows: number;
    newSeasonFamilyAchievementProgressRows: number;
  };
};

export function buildCharacterResetPatch(): CharacterResetPatch {
  return { xp: 0, level: 1, gems: 0, honor_points: 0, active_family_quest_id: null };
}

export async function runStartSeasonReset(
  store: SeasonResetStore,
  options: StartSeasonResetOptions,
): Promise<SeasonResetResult> {
  if (options.discovery || !options.familyId || !options.name || !options.startsAt) {
    throw new Error("Start-season reset requires --family-id, --name, --starts-at, and reset targets");
  }

  const familyId = options.familyId;
  const seasonName = options.name;
  const startsAt = options.startsAt;

  const family = await store.loadFamily(familyId);
  if (!family) {
    throw new Error(`No family found for ${familyId}`);
  }

  const activeSeasons = await store.loadActiveSeasons(familyId);
  const characters = await store.loadCharacters(familyId, options.userIds, options.allUsers);

  if (characters.length === 0) {
    throw new Error("No matching characters found for requested target users");
  }

  if (!options.dryRun && (!options.apply || !options.confirm)) {
    throw new Error("Refusing irreversible reset without --apply and --confirm-start-season-reset");
  }

  const auditCharacters = characters.map((character) => ({
    characterId: character.id,
    userId: character.user_id,
    name: character.name,
    xpBefore: character.xp ?? 0,
    levelBefore: character.level ?? 1,
    goldBefore: character.gold ?? 0,
    goldAfter: character.gold ?? 0,
    gemsBefore: character.gems ?? 0,
    honorBefore: character.honor_points ?? 0,
  }));

  const result: SeasonResetResult = {
    dryRun: options.dryRun,
    family,
    previousActiveSeasonIds: activeSeasons.map((season) => season.id),
    season: {
      id: options.dryRun ? "dry-run-season" : "",
      name: seasonName,
      startsAt,
    },
    characters: auditCharacters,
    mutations: {
      seasonsCreated: options.dryRun ? 0 : 1,
      seasonsDeactivated: activeSeasons.length,
      familyActiveSeasonUpdated: 1,
      charactersReset: characters.length,
      characterAchievementsDeleted: 0,
      characterQuestStreaksDeleted: 0,
      newSeasonCharacterAchievementRows: 0,
      newSeasonFamilyAchievementProgressRows: 0,
    },
  };

  if (options.dryRun) {
    result.mutations.characterQuestStreaksDeleted = characters.length;
    return result;
  }

  const season = await store.createSeason({
    family_id: familyId,
    name: seasonName,
    theme: options.theme,
    description: options.description,
    starts_at: startsAt,
    is_active: false,
  });
  await store.deactivateActiveSeasons(familyId, startsAt);
  await store.activateSeason(season.id);
  await store.setFamilyActiveSeason(familyId, season.id);
  result.season.id = season.id;

  for (const character of characters) {
    await store.resetCharacter(character.id, buildCharacterResetPatch());
    result.mutations.characterQuestStreaksDeleted += await store.deleteCharacterQuestStreaks(character.id);
  }

  const afterCharacters = await store.loadCharacters(familyId, options.userIds, options.allUsers);
  const afterByUserId = new Map(afterCharacters.map((character) => [character.user_id, character]));

  for (const audit of result.characters) {
    const after = afterByUserId.get(audit.userId);
    if (!after) {
      throw new Error(`Character disappeared after reset for user ${audit.userId}`);
    }

    audit.goldAfter = after.gold ?? 0;
    if (audit.goldAfter !== audit.goldBefore) {
      throw new Error(
        `Gold changed unexpectedly for user ${audit.userId}: ${audit.goldBefore} -> ${audit.goldAfter}`,
      );
    }
  }

  result.mutations.newSeasonCharacterAchievementRows = await store.countCharacterAchievementsForSeason(season.id);
  result.mutations.newSeasonFamilyAchievementProgressRows = await store.countFamilyAchievementProgressForSeason(season.id);

  return result;
}

export function formatStartSeasonResetAudit(result: SeasonResetResult): string {
  const lines = [
    "=== Admin Start-Season Reset Audit ===",
    `Mode: ${result.dryRun ? "DRY RUN - no writes performed" : "APPLY - writes performed"}`,
    `Family: ${result.family.name ?? result.family.id} (${result.family.id})`,
    `New season: ${result.season.name} (${result.season.id})`,
    `Starts at: ${result.season.startsAt}`,
    `Previous active seasons: ${result.previousActiveSeasonIds.length ? result.previousActiveSeasonIds.join(", ") : "none"}`,
    "",
    "Target characters:",
    ...result.characters.map(
      (character) =>
        `- ${character.name ?? character.characterId} user=${character.userId} character=${character.characterId} ` +
        `xp ${character.xpBefore}->0 level ${character.levelBefore}->1 ` +
        `gems ${character.gemsBefore}->0 honor ${character.honorBefore}->0 ` +
        `gold preserved ${character.goldBefore}->${character.goldAfter}`,
    ),
    "",
    "Mutation summary:",
    `- seasons created: ${result.mutations.seasonsCreated}`,
    `- active seasons deactivated: ${result.mutations.seasonsDeactivated}`,
    `- family active season updates: ${result.mutations.familyActiveSeasonUpdated}`,
    `- characters reset: ${result.mutations.charactersReset}`,
    `- character achievement rows deleted: ${result.mutations.characterAchievementsDeleted}`,
    `- character quest streak rows deleted: ${result.mutations.characterQuestStreaksDeleted}`,
    `- new-season character achievement rows remaining: ${result.mutations.newSeasonCharacterAchievementRows}`,
    `- new-season family achievement progress rows remaining: ${result.mutations.newSeasonFamilyAchievementProgressRows}`,
  ];

  return lines.join("\n");
}
