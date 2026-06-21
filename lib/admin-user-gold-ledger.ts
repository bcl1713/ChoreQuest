import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppError } from "@/lib/errors";
import { AppError as AppErrorClass } from "@/lib/errors";
import type { Json } from "@/lib/types/database";
import type { Database } from "@/lib/types/database-generated";

export type GoldLedgerEntryType = Database["public"]["Enums"]["gold_ledger_entry_type"];

export const GOLD_LEDGER_ENTRY_TYPES: readonly GoldLedgerEntryType[] = [
  "QUEST_REWARD",
  "STORE_PURCHASE",
  "REWARD_REFUND",
  "BOSS_REWARD",
  "ACHIEVEMENT_BONUS",
  "ADMIN_ADJUSTMENT",
  "CLASS_CHANGE_COST",
  "OPENING_BALANCE",
  "MIGRATION",
  "CORRECTION",
];

export function isGoldLedgerEntryType(value: string | null): value is GoldLedgerEntryType {
  return GOLD_LEDGER_ENTRY_TYPES.includes(value as GoldLedgerEntryType);
}

export type AdminUserGoldLedgerFilterOptions = {
  ledgerStartDate?: string | null;
  ledgerEndDate?: string | null;
  ledgerEventType?: GoldLedgerEntryType | "ALL" | null;
};

export type AdminUserGoldLedgerActor = {
  id: string;
  name: string;
  email: string | null;
};

export type AdminUserGoldLedgerEntry = {
  id: string;
  createdAt: string;
  eventType: GoldLedgerEntryType;
  description: string;
  goldDelta: number;
  direction: "credit" | "debit" | "neutral";
  balanceBefore: number;
  runningBalance: number;
  actor: AdminUserGoldLedgerActor | null;
  sourceType: string;
  sourceId: string | null;
  referenceLabel: string;
  metadata: Json;
};

export type AdminUserGoldLedger = {
  entries: AdminUserGoldLedgerEntry[];
  reconciliation: {
    currentGold: number | null;
    ledgerBalance: number;
    difference: number | null;
    diverged: boolean;
  };
};

const DISPLAY_LEDGER_ENTRY_LIMIT = 100;

type RawGoldLedgerEntry = {
  id: string;
  created_at: string;
  gold_delta: number | null;
  balance_before: number | null;
  balance_after: number | null;
  entry_type: GoldLedgerEntryType;
  source_type: string;
  source_id: string | null;
  actor_user_id: string | null;
  reason: string | null;
  metadata: Json | null;
};

type RawActorProfile = {
  id: string;
  name: string;
  email: string | null;
};

function titleCase(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toDayStartIso(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

function toDayEndIso(date: string): string {
  return new Date(`${date}T23:59:59.999Z`).toISOString();
}

function ledgerDirection(goldDelta: number): AdminUserGoldLedgerEntry["direction"] {
  if (goldDelta > 0) return "credit";
  if (goldDelta < 0) return "debit";
  return "neutral";
}

function referenceLabel(sourceType: string, sourceId: string | null): string {
  return sourceId ? `${sourceType}: ${sourceId}` : sourceType;
}

function mapLedgerEntries(
  rows: RawGoldLedgerEntry[],
  actorsById: Map<string, RawActorProfile>,
): AdminUserGoldLedgerEntry[] {
  return rows.map((row) => {
    const goldDelta = row.gold_delta ?? 0;
    const actor = row.actor_user_id ? actorsById.get(row.actor_user_id) ?? null : null;

    return {
      id: row.id,
      createdAt: row.created_at,
      eventType: row.entry_type,
      description: row.reason || titleCase(row.entry_type),
      goldDelta,
      direction: ledgerDirection(goldDelta),
      balanceBefore: row.balance_before ?? 0,
      runningBalance: row.balance_after ?? 0,
      actor,
      sourceType: row.source_type,
      sourceId: row.source_id,
      referenceLabel: referenceLabel(row.source_type, row.source_id),
      metadata: row.metadata ?? {},
    };
  });
}

export function buildLedgerReconciliation(
  currentGold: number | null,
  ledgerBalance: number,
): AdminUserGoldLedger["reconciliation"] {
  const difference = currentGold === null ? null : currentGold - ledgerBalance;

  return {
    currentGold,
    ledgerBalance,
    difference,
    diverged: difference !== null && difference !== 0,
  };
}

export async function fetchAdminUserGoldLedger(
  supabase: SupabaseClient,
  characterId: string | null,
  currentGold: number | null,
  options: AdminUserGoldLedgerFilterOptions,
): Promise<AdminUserGoldLedger> {
  if (!characterId) {
    return {
      entries: [],
      reconciliation: buildLedgerReconciliation(null, 0),
    };
  }

  const { data: latestRows, error: latestError } = await supabase
    .from("gold_ledger_entries")
    .select("balance_after")
    .eq("character_id", characterId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (latestError) {
    throw new AppErrorClass(
      "Failed to fetch gold ledger reconciliation",
      500,
      "ADMIN_GOLD_LEDGER_RECONCILIATION_FETCH_FAILED",
    ) as AppError;
  }

  const latestBalance = ((latestRows ?? []) as Array<{ balance_after: number | null }>)[0]
    ?.balance_after ?? 0;

  let ledgerQuery = supabase
    .from("gold_ledger_entries")
    .select(
      "id, created_at, gold_delta, balance_before, balance_after, entry_type, source_type, source_id, actor_user_id, reason, metadata",
    )
    .eq("character_id", characterId);

  if (options.ledgerStartDate) {
    ledgerQuery = ledgerQuery.gte("created_at", toDayStartIso(options.ledgerStartDate));
  }
  if (options.ledgerEndDate) {
    ledgerQuery = ledgerQuery.lte("created_at", toDayEndIso(options.ledgerEndDate));
  }
  if (options.ledgerEventType && options.ledgerEventType !== "ALL") {
    ledgerQuery = ledgerQuery.eq("entry_type", options.ledgerEventType);
  }

  const { data: ledgerRows, error: ledgerError } = await ledgerQuery
    .order("created_at", { ascending: false })
    .limit(DISPLAY_LEDGER_ENTRY_LIMIT);

  if (ledgerError) {
    throw new AppErrorClass(
      "Failed to fetch gold ledger",
      500,
      "ADMIN_GOLD_LEDGER_FETCH_FAILED",
    ) as AppError;
  }

  const rawLedgerRows = [...((ledgerRows ?? []) as RawGoldLedgerEntry[])].reverse();
  const actorIds = Array.from(
    new Set(rawLedgerRows.map((row) => row.actor_user_id).filter((id): id is string => Boolean(id))),
  );
  let actorsById = new Map<string, RawActorProfile>();

  if (actorIds.length > 0) {
    const { data: actorRows, error: actorError } = await supabase
      .from("user_profiles")
      .select("id, name, email")
      .in("id", actorIds);

    if (actorError) {
      throw new AppErrorClass(
        "Failed to fetch gold ledger actor details",
        500,
        "ADMIN_GOLD_LEDGER_ACTOR_FETCH_FAILED",
      ) as AppError;
    }

    actorsById = new Map(
      ((actorRows ?? []) as RawActorProfile[]).map((actor) => [actor.id, actor]),
    );
  }

  const entries = mapLedgerEntries(rawLedgerRows, actorsById);

  return {
    entries,
    reconciliation: buildLedgerReconciliation(currentGold, latestBalance),
  };
}
