import type {
  AdminUserDetail,
  AdminUserGoldLedgerFilterOptions,
} from "@/lib/admin-user-detail-service";

function titleCase(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const GOLD_LEDGER_EVENT_TYPES = [
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
] as const;

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
      <p className="text-2xl font-semibold text-white">{value} {label}</p>
    </div>
  );
}

function formatGold(delta: number): string {
  const prefix = delta > 0 ? "+" : "";
  return `${prefix}${delta} Gold`;
}

function formatActor(actor: { name: string } | null): string {
  return actor?.name ?? "System / automatic";
}

export function AdminUserDetailView({
  detail,
  filters = { ledgerStartDate: "", ledgerEndDate: "", ledgerEventType: "ALL" },
  onFiltersChange,
}: {
  detail: AdminUserDetail;
  filters?: AdminUserGoldLedgerFilterOptions;
  onFiltersChange?: (filters: AdminUserGoldLedgerFilterOptions) => void;
}) {
  const { user, character, questSummary, recentQuests, goldLedger } = detail;

  const updateFilter = (key: keyof AdminUserGoldLedgerFilterOptions, value: string) => {
    onFiltersChange?.({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6" data-testid="admin-user-detail-view">
      <section className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-fantasy text-white">{user.name}</h1>
            <p className="mt-1 text-sm text-gray-400">{user.email}</p>
          </div>
          <span className="inline-flex w-fit rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-sm font-medium text-gold-300">
            {titleCase(user.role)}
          </span>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Joined</dt>
            <dd className="text-gray-200">{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Updated</dt>
            <dd className="text-gray-200">{formatDate(user.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Character Summary</h2>
        {character ? (
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-semibold text-white">{character.name}</p>
              <p className="text-gray-400">{titleCase(character.class)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg bg-gray-900/50 p-3 text-gray-200">Level {character.level}</div>
              <div className="rounded-lg bg-gray-900/50 p-3 text-gray-200">{character.xp} XP</div>
              <div className="rounded-lg bg-gray-900/50 p-3 text-gray-200">{character.gold} Gold</div>
              <div className="rounded-lg bg-gray-900/50 p-3 text-gray-200">{character.gems} Gems</div>
              <div className="rounded-lg bg-gray-900/50 p-3 text-gray-200">{character.honor} Honor</div>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-600 bg-gray-900/40 p-4 text-gray-300">
            No character has been created for this user yet. Profile details are still available.
          </p>
        )}
      </section>

      <section
        className="rounded-lg border border-gray-700 bg-gray-800/50 p-6"
        data-testid="admin-user-progression-snapshot"
      >
        <h2 className="mb-4 text-xl font-semibold text-white">Progression Snapshot</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatPill label="Active" value={questSummary.active} />
          <StatPill label="Awaiting Approval" value={questSummary.pendingApproval} />
          <StatPill label="Approved" value={questSummary.approved} />
          <StatPill label="Missed/Expired" value={questSummary.missed} />
        </div>
      </section>

      <section className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Recent Approved Quests</h2>
        {recentQuests.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {recentQuests.map((quest) => (
              <li key={quest.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{quest.title}</p>
                    <p className="text-sm text-gray-400">
                      {titleCase(quest.status)} • {quest.xpReward} XP • {quest.goldReward} Gold
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {quest.approvedAt
                      ? `Approved ${formatDate(quest.approvedAt)}`
                      : quest.completedAt
                        ? `Completed ${formatDate(quest.completedAt)}`
                        : quest.dueDate
                          ? `Due ${formatDate(quest.dueDate)}`
                          : "No date"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-600 bg-gray-900/40 p-4 text-gray-300">
            No recent quests found for this user.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Gold Ledger</h2>
            <p className="mt-1 text-sm text-gray-400">
              Chronological gold movements for this character. Opening, migration, and correction rows are explicit ledger controls, not claims of perfect historical provenance. Filters change which rows are displayed; each running balance remains the true ledger balance at that row.
            </p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-3 text-sm text-gray-200">
            <p>Ledger balance: {goldLedger.reconciliation.ledgerBalance} Gold</p>
            <p>Current character gold: {goldLedger.reconciliation.currentGold ?? "—"} Gold</p>
          </div>
        </div>

        {goldLedger.reconciliation.diverged ? (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            Ledger balance differs from current character gold by {goldLedger.reconciliation.difference} Gold. Review reconciliation or correction entries before treating the ledger as settled truth.
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <label className="text-sm text-gray-300">
            Start date
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100"
              value={filters.ledgerStartDate ?? ""}
              onChange={(event) => updateFilter("ledgerStartDate", event.target.value)}
            />
          </label>
          <label className="text-sm text-gray-300">
            End date
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100"
              value={filters.ledgerEndDate ?? ""}
              onChange={(event) => updateFilter("ledgerEndDate", event.target.value)}
            />
          </label>
          <label className="text-sm text-gray-300">
            Event type
            <select
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100"
              value={filters.ledgerEventType ?? "ALL"}
              onChange={(event) => updateFilter("ledgerEventType", event.target.value)}
            >
              <option value="ALL">All event types</option>
              {GOLD_LEDGER_EVENT_TYPES.map((eventType) => (
                <option key={eventType} value={eventType}>
                  {titleCase(eventType)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          {goldLedger.entries.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-700 text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Timestamp</th>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Credit / Debit</th>
                  <th className="py-2 pr-4">Running balance</th>
                  <th className="py-2 pr-4">Actor / source</th>
                  <th className="py-2 pr-4">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {goldLedger.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 pr-4 text-gray-400">{formatDate(entry.createdAt)}</td>
                    <td className="py-3 pr-4 font-medium text-white">{titleCase(entry.eventType)}</td>
                    <td className="py-3 pr-4">{entry.description}</td>
                    <td className={entry.direction === "debit" ? "py-3 pr-4 text-red-300" : "py-3 pr-4 text-emerald-300"}>
                      {formatGold(entry.goldDelta)}
                    </td>
                    <td className="py-3 pr-4">{entry.runningBalance} Gold</td>
                    <td className="py-3 pr-4">{formatActor(entry.actor)}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-400">{entry.referenceLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rounded-lg border border-dashed border-gray-600 bg-gray-900/40 p-4 text-gray-300">
              No ledger entries match the selected filters.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
