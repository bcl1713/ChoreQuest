import type {
  SeasonResetFamily,
  SeasonResetFamilyUser,
  SeasonResetStore,
  StartSeasonDiscoveryMode,
  StartSeasonResetOptions,
} from "./start-season-reset";

export function parseStartSeasonResetArgs(args: string[]): StartSeasonResetOptions {
  const values = new Map<string, string[]>();
  const aliases = new Map([["--reset-user", "--user-id"]]);
  const flags = new Set<string>();

  for (let i = 0; i < args.length; i += 1) {
    const rawArg = args[i];
    const arg = aliases.get(rawArg) ?? rawArg;
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }

    if (isFlagArg(arg)) {
      flags.add(arg);
      continue;
    }

    const next = args[i + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }

    const current = values.get(arg) ?? [];
    current.push(next);
    values.set(arg, current);
    i += 1;
  }

  const optional = (name: string): string | null => values.get(name)?.[0] ?? null;
  const required = (name: string): string => {
    const value = optional(name);
    if (!value) throw new Error(`Missing required argument ${name}`);
    return value;
  };

  const userIds = values.get("--user-id") ?? [];
  const allUsers = flags.has("--all-users");
  const apply = flags.has("--apply");
  const confirm = flags.has("--confirm-start-season-reset");
  const discovery = getDiscoveryMode(flags);

  if (discovery) {
    return parseDiscoveryOptions({ apply, confirm, userIds, allUsers, familyId: optional("--family-id"), discovery });
  }

  const familyId = required("--family-id");
  const name = required("--name");
  const startsAtRaw = required("--starts-at");
  const dryRun = !apply || flags.has("--dry-run");
  const startsAt = startsAtRaw === "now" ? new Date().toISOString() : startsAtRaw;

  if (Number.isNaN(Date.parse(startsAt))) {
    throw new Error("--starts-at must be an ISO date/time or 'now'");
  }

  if (userIds.length === 0 && !allUsers) {
    throw new Error("Provide at least one --user-id or pass --all-users explicitly");
  }

  if (userIds.length > 0 && allUsers) {
    throw new Error("Use either --user-id targets or --all-users, not both");
  }

  if (apply && !confirm) {
    throw new Error("Apply mode requires --confirm-start-season-reset");
  }

  return {
    familyId,
    name,
    startsAt: new Date(startsAt).toISOString(),
    theme: values.get("--theme")?.[0] ?? null,
    description: values.get("--description")?.[0] ?? null,
    userIds,
    allUsers,
    dryRun,
    apply,
    confirm,
    discovery: null,
  };
}

function isFlagArg(arg: string): boolean {
  return [
    "--dry-run",
    "--apply",
    "--confirm-start-season-reset",
    "--all-users",
    "--list-families",
    "--list-family-users",
  ].includes(arg);
}

function getDiscoveryMode(flags: Set<string>): StartSeasonDiscoveryMode | null {
  const listFamilies = flags.has("--list-families");
  const listFamilyUsers = flags.has("--list-family-users");
  if (listFamilies && listFamilyUsers) {
    throw new Error("Use only one discovery helper at a time");
  }
  if (listFamilies) return "families";
  if (listFamilyUsers) return "family-users";
  return null;
}

function parseDiscoveryOptions(input: {
  apply: boolean;
  confirm: boolean;
  userIds: string[];
  allUsers: boolean;
  familyId: string | null;
  discovery: StartSeasonDiscoveryMode;
}): StartSeasonResetOptions {
  if (input.apply || input.confirm) {
    throw new Error("Discovery mode is dry-run only; remove --apply and --confirm-start-season-reset");
  }
  if (input.userIds.length > 0 || input.allUsers) {
    throw new Error("Discovery mode does not accept reset targets");
  }
  if (input.discovery === "family-users" && !input.familyId) {
    throw new Error("--list-family-users requires --family-id <uuid>");
  }

  return {
    familyId: input.familyId,
    name: null,
    startsAt: null,
    theme: null,
    description: null,
    userIds: [],
    allUsers: false,
    dryRun: true,
    apply: false,
    confirm: false,
    discovery: input.discovery,
  };
}

export type SeasonResetDiscoveryResult =
  | { mode: "families"; families: SeasonResetFamily[] }
  | { mode: "family-users"; familyId: string; users: SeasonResetFamilyUser[] };

export async function runStartSeasonDiscovery(
  store: SeasonResetStore,
  options: StartSeasonResetOptions,
): Promise<SeasonResetDiscoveryResult> {
  if (options.apply || options.confirm || !options.dryRun) {
    throw new Error("Discovery mode is dry-run only");
  }

  if (options.discovery === "families") {
    return { mode: "families", families: await store.listFamilies() };
  }

  if (options.discovery === "family-users") {
    if (!options.familyId) throw new Error("--list-family-users requires --family-id <uuid>");
    return { mode: "family-users", familyId: options.familyId, users: await store.listFamilyUsers(options.familyId) };
  }

  throw new Error("No discovery helper requested");
}

export function formatStartSeasonDiscoveryAudit(result: SeasonResetDiscoveryResult): string {
  if (result.mode === "families") {
    return [
      "=== Admin Start-Season Discovery: Families ===",
      result.families.length === 0 ? "No families found." : result.families.map(formatFamily).join("\n"),
    ].join("\n");
  }

  return [
    `=== Admin Start-Season Discovery: Family Users (${result.familyId}) ===`,
    result.users.length === 0 ? "No users found for family." : result.users.map(formatFamilyUser).join("\n"),
  ].join("\n");
}

function formatFamily(family: SeasonResetFamily): string {
  return `- ${family.name ?? "Unnamed family"} (${family.id}) activeSeason=${family.active_season_id ?? "none"}`;
}

function formatFamilyUser(user: SeasonResetFamilyUser): string {
  return (
    `- ${user.user_name ?? user.user_email ?? "Unnamed user"} user=${user.user_id} ` +
    `character=${user.character_id ?? "none"}` +
    (user.character_name ? ` characterName=${user.character_name}` : "")
  );
}
