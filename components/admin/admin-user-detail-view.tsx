import type { AdminUserDetail } from "@/lib/admin-user-detail-service";

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

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
      <p className="text-2xl font-semibold text-white">{value} {label}</p>
    </div>
  );
}

export function AdminUserDetailView({ detail }: { detail: AdminUserDetail }) {
  const { user, character, questSummary, recentQuests } = detail;

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

      <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
        {detail.goldLedgerNotice}
      </section>
    </div>
  );
}
