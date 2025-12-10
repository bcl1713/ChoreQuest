# Character Level Backfill

Use this one-time script to recalculate character levels from their stored XP when legacy data has stale levels (e.g., heroes stuck at level 1 with hundreds of XP).

## Prerequisites
- `.env.local` (or `.env`) contains the Supabase service role credentials required by `createServiceSupabaseClient`.
- Run from the repository root.

## Run
```bash
npx tsx scripts/backfill-character-levels.ts
```

The script:
- Reads `id, name, xp, level` from `characters`
- Computes the correct level from total XP and only updates when the derived level exceeds the stored value
- Logs each update and prints a summary
