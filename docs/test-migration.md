# Migration Guide — move `tests/e2e` to _per-worker family + reused auth state_

This guide is written for your current repository layout (`tests/e2e/...`) and
your schema (you provided `user_profiles`, `families`, `characters`,
`quest_instances`, `quest_templates`, `rewards`, etc.). I’ll give you
copy/pastable TypeScript code, verification commands, and a migration plan you
can follow incrementally. Where I reference Playwright behavior, I include the
relevant docs. ([Playwright][1])

---

## TL;DR (one-paragraph elevator pitch)

Create one isolated **family** (and associated users: GM1, optional GM2,
optional Hero) **per Playwright worker** using Supabase admin APIs; for each
created user save Playwright `storageState` (cookies + localStorage) once, and
have tests reuse those `storageState` files. Tests that must exercise
signup/character creation still do it—they get ephemeral users created for that
specific test. This reduces repeated UI signups from 97 → _#workers_,
dramatically reducing runtime and backend load. Playwright supports the
worker-scoped fixture pattern and storageState reuse as a best practice.
([Playwright][1])

---

## What I’ll produce for you in this guide

1. A **small set of new helper files** under `tests/e2e/helpers/` (seed family,
   ephemeral user, worker fixture).
2. How to **change a single test** as a proof of concept.
3. How to **incrementally migrate** the remaining tests.
4. CI and local cleanup instructions (Option A for CI, Option B locally).
5. Specific adjustments for `character-creation.spec.ts` and tests that assume
   fresh 0 XP.
6. Verification checks you run at every step.

---

## Assumptions (confirmed from our chat)

- You run Playwright locally with `npx playwright test` using Node v24.9.0.
- Supabase is local for development and self-hosted for prod. You have a
  Supabase service-role key for test setup tasks (CI secret).
- Authentication user records are reflected in `user_profiles` (and Supabase
  Auth `users` exist); `user_profiles` has `family_id` linking the user to a
  family. `characters` are connected by `user_id`.
- You keep UI tests that verify signup/character-creation flows — we’ll create
  ephemeral users for those tests so they still exercise the UI but don’t repeat
  heavy family creation everywhere.

If any of the schema assumptions above are _not_ accurate, tell me which
column/table differs and I’ll adjust the code snippets — but based on your
trimmed schema they’re correct.

---

## High-level flow we’ll implement

1. Per worker:
   - create a `families` row
   - create Supabase auth users (3 optional): GM1, GM2, hero (via
     `admin.auth.admin.createUser`)
   - insert corresponding `user_profiles` rows with `family_id` set
   - create `characters` rows for users where appropriate
   - create Playwright `storageState` files for users (gm1 always; gm2/hero
     optionally)

2. Tests:
   - By default use the worker’s GM1 `storageState` for “most” tests
   - If a test needs multi-user interaction, open extra contexts from gm2/hero
     `storageState`s or create ephemeral users in that test

3. Cleanup:
   - Local: delete test families/users by `code` or `email` domain (e.g.
     `@test.local`) — safe and incremental
   - CI: truncate test tables at job start for a pristine environment

Playwright docs: use storageState + worker fixtures for “one account per
parallel worker” — that’s what we’re doing. ([Playwright][1])

---

## Files you will add (all paths are relative to project root)

```
tests/e2e/helpers/
  ├─ createFamilyForWorker.ts
  ├─ createEphemeralUser.ts
  ├─ family-fixture.ts
  ├─ ci-reset-db.ts
  └─ README-migration.md   (optional notes)
```

You will also create a folder for storageState files:

```
tests/e2e/.auth/   # gitignored
```

---

## 1) Seed helper: `createFamilyForWorker.ts`

Create a file `tests/e2e/helpers/createFamilyForWorker.ts`. This uses
`@supabase/supabase-js` service role operations to create a family, users, and
characters. The code below is targeted to your schema: `families`,
`user_profiles`, `characters`. It creates Supabase **Auth** users (so they can
login normally) and then inserts `user_profiles` records linked by `family_id`.

> Save this file and **do not commit secrets**. Use `SUPABASE_SERVICE_ROLE_KEY`
> from CI secrets or `.env.local` in dev (not committed).

```ts
// tests/e2e/helpers/createFamilyForWorker.ts
import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";

export type TestUser = {
  id: string;
  email: string;
  password: string;
  userName: string;
  characterId?: string;
  characterName?: string;
};

export type WorkerFamily = {
  familyId: string;
  familyCode: string;
  gm1: TestUser;
  gm2?: TestUser;
  hero?: TestUser;
};

export async function createFamilyForWorker(
  workerIndex: number,
  opts?: { createGm2?: boolean; createHero?: boolean },
): Promise<WorkerFamily> {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!SUPABASE_URL || !SUPABASE_KEY)
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(SUPABASE_URL, SUPABASE_KEY);

  const familyCode = faker.string.alphanumeric(6).toUpperCase();
  const familyName = `e2e-family-${workerIndex}-${Date.now()}`;
  const { data: family, error: famErr } = await admin
    .from("families")
    .insert({ code: familyCode, name: familyName })
    .select()
    .single();
  if (famErr) throw famErr;

  async function createUser(rolePrefix: string) {
    const email = `${rolePrefix}-${workerIndex}-${Date.now()}@${process.env.TEST_EMAIL_DOMAIN || "test.local"}`;
    const password = "Test1234!";
    // Create auth user
    const { data: authUser, error: authErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (authErr) throw authErr;

    // Create user_profile row (link to family)
    const userName = email.split("@")[0];
    const { data: profile, error: profErr } = await admin
      .from("user_profiles")
      .insert({
        id: authUser.id, // keep same id as auth user
        email,
        name: userName,
        family_id: family.id,
      })
      .select()
      .single();
    if (profErr) throw profErr;

    // Create a character row for this user
    const charName = faker.person.firstName();
    const { data: character, error: charErr } = await admin
      .from("characters")
      .insert({
        user_id: authUser.id,
        name: charName,
        class: "KNIGHT",
      })
      .select()
      .single();
    if (charErr) throw charErr;

    return {
      id: authUser.id,
      email,
      password,
      userName,
      characterId: character.id,
      characterName: character.name,
    } as TestUser;
  }

  const gm1 = await createUser("gm1");
  let gm2: TestUser | undefined = undefined;
  let hero: TestUser | undefined = undefined;
  if (opts?.createGm2) gm2 = await createUser("gm2");
  if (opts?.createHero) hero = await createUser("hero");

  return {
    familyId: family.id,
    familyCode,
    gm1,
    gm2,
    hero,
  };
}
```

**Why create Supabase Auth users**: tests should be able to login the same way
the app does (cookies/localStorage), so we create auth users and `user_profiles`
entries with the same user id. This matches your schema where `user_profiles.id`
corresponds to an auth user and `characters.user_id` links to that user.

**Verify (manual):**

- Run a quick Node script (with env vars present) to call
  `createFamilyForWorker(1,{createGm2:true,createHero:true})` and confirm the
  new rows appear in Supabase DB and you can see `user_profiles` rows with
  `family_id` set.

---

## 2) Ephemeral user for character-creation tests: `createEphemeralUser.ts`

For tests that must exercise **character creation** (signup UI flow), we’ll
create an _auth user_ with no character and a `user_profiles` entry with
`family_id` null or set to the intended family — so the app will redirect the
user to character creation.

File: `tests/e2e/helpers/createEphemeralUser.ts`

```ts
// tests/e2e/helpers/createEphemeralUser.ts
import { createClient } from "@supabase/supabase-js";

export async function createEphemeralUser() {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing envs");

  const admin = createClient(SUPABASE_URL, SUPABASE_KEY);
  const email = `ephemeral-${Date.now()}@${process.env.TEST_EMAIL_DOMAIN || "test.local"}`;
  const password = "Test1234!";

  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authErr) throw authErr;

  // Optionally insert a user_profiles row with no family to cause the UI to show character creation
  await admin
    .from("user_profiles")
    .insert({ id: authUser.id, email, name: email.split("@")[0] });

  return { id: authUser.id, email, password };
}
```

**Use this** in `character-creation.spec.ts` to login and exercise the creation
path without creating families through the UI.

---

## 3) Worker-scoped Playwright fixture (the glue): `family-fixture.ts`

Create `tests/e2e/helpers/family-fixture.ts`. This file **extends Playwright’s
`test`** and establishes two worker-scoped fixtures:

- `workerFamily` (object returned by `createFamilyForWorker`) — created once per
  worker
- `storagePaths` — absolute paths of storageState JSON files for gm1 (and
  optionally gm2/hero). The fixture will create the storageState by launching a
  small Playwright context, performing a login as gm1, and saving the
  storageState file. This happens once per worker.

> Playwright docs: worker-scoped fixtures are the right primitive for set-up
> that’s expensive but reusable across tests and files. They let us create one
> account per worker and reuse it. ([Playwright][2])

```ts
// tests/e2e/helpers/family-fixture.ts
import path from "path";
import fs from "fs";
import { test as base, chromium } from "@playwright/test";
import { createFamilyForWorker, WorkerFamily } from "./createFamilyForWorker";

type StoragePaths = { gm1: string; gm2?: string; hero?: string };

export const test = base.extend<{
  workerFamily: WorkerFamily;
  storagePaths: StoragePaths;
}>({
  workerFamily: [
    async ({}, use, workerInfo) => {
      // create family per worker, create gm2/hero only if you want by default
      const family = await createFamilyForWorker(workerInfo.workerIndex + 1, {
        createGm2: true,
        createHero: true,
      });
      await use(family);
      // optional: leave cleanup out of here — we will provide cleanup scripts separately
    },
    { scope: "worker" },
  ],

  storagePaths: [
    async ({ workerFamily }, use, workerInfo) => {
      const authDir = path.resolve(process.cwd(), "tests/e2e/.auth");
      fs.mkdirSync(authDir, { recursive: true });

      const gm1Path = path.join(
        authDir,
        `worker-${workerInfo.workerIndex + 1}-gm1.json`,
      );
      const gm2Path = path.join(
        authDir,
        `worker-${workerInfo.workerIndex + 1}-gm2.json`,
      );
      const heroPath = path.join(
        authDir,
        `worker-${workerInfo.workerIndex + 1}-hero.json`,
      );

      // Create storage states only if they don't exist (fast reruns)
      if (!fs.existsSync(gm1Path)) {
        const browser = await chromium.launch();
        const ctx = await browser.newContext();
        const page = await ctx.newPage();

        // Do the app login UI (mimics real user)
        await page.goto(
          `${process.env.BASE_URL || "http://localhost:3000"}/login`,
        );
        await page.fill('input[name="email"]', workerFamily.gm1.email);
        await page.fill('input[name="password"]', workerFamily.gm1.password);
        await page.click("button[type=submit]");

        // Wait for something that indicates successful login — update to fit your app
        await page.waitForSelector("text=Dashboard", { timeout: 10000 });

        await ctx.storageState({ path: gm1Path });
        await browser.close();
      }

      // Optionally create gm2 and hero storage state similarly if desired.
      await use({ gm1: gm1Path, gm2: gm2Path, hero: heroPath });
    },
    { scope: "worker" },
  ],
});

export const expect = test.expect;
export default test;
```

**How to use** this file:

- In any test file you want to migrate, replace

  ```ts
  import { test, expect } from "@playwright/test";
  ```

  with

  ```ts
  import test, { expect } from "./helpers/family-fixture";
  ```

  (relative path depends on where the spec file lives).

**Note:** I deliberately do login via the UI in the fixture when generating
storageState so you still exercise a realistic login process once per worker.
You could replace that step with a direct API token creation if your app
supports a faster programmatic auth method.

**Doc reference:** Playwright recommends using one account per worker for tests
that mutate server-side state. That’s the pattern used here. ([Playwright][1])

---

## 4) Minimal proof-of-concept test edit (convert one test)

Pick `tests/e2e/quest-pickup-management.spec.ts`. Modify the top lines to import
the new fixture and change the test pages to use the worker storage state.

**Before (likely):**

```ts
import { test, expect } from "@playwright/test";
```

**After:**

```ts
import test, { expect } from "./helpers/family-fixture";
```

Then inside a test body, create the context from `storagePaths.gm1`:

```ts
test("guild master assigns quest", async ({
  browser,
  workerFamily,
  storagePaths,
}) => {
  const context = await browser.newContext({ storageState: storagePaths.gm1 });
  const page = await context.newPage();
  await page.goto("/");

  // Now call your existing helper that expects `page` to be at the dashboard
  // For example:
  // const { questData } = await setupQuestWorkflow(page, undefined, { workerFamily });
  // await expect(page.getByText(questData.title)).toBeVisible();

  await context.close();
});
```

**Run it (serial, single worker):**

```bash
npx playwright test tests/e2e/quest-pickup-management.spec.ts -w 1 -g "guild master assigns quest"
```

- Expected: the worker fixture will have created the family, saved
  `storageState`, and the test will reuse that logged-in session.

If that passes, try parallel with 2 workers:

```bash
npx playwright test tests/e2e/ -w 2
```

You should see each worker create its own family and storageState files under
`tests/e2e/.auth/worker-1-gm1.json`, `worker-2-gm1.json`, etc.

---

## 5) Modify `setup-helpers.ts` to optionally consume `workerFamily` (non-destructive changes)

You said your `setup-helpers.ts` currently performs the UI flows that create
users/families/characters. We’ll make these helpers accept an optional `opts`
param so they either:

- Use seeded data (fast) when `opts.workerFamily` is provided (return the
  relevant user object), **or**
- Fall back to the UI creation flow (unchanged) when `opts` is not provided.

Example patch pattern (pseudocode):

```ts
// inside helpers/setup-helpers.ts

export async function setupUserWithCharacter(page, prefix, opts = {}) {
  if (opts.workerFamily) {
    const gm = opts.workerFamily.gm1; // or pick gm2/hero
    // If page already uses storageState for this user, you can just return user info
    return {
      userName: gm.userName,
      characterName: gm.characterName,
      email: gm.email,
      password: gm.password,
    };
  }

  // existing UI-driven creation logic (unchanged)
}
```

**Migration tactic:** keep the change additive — tests that don’t pass
`workerFamily` operate exactly as before. Migrate tests incrementally to use
`workerFamily` where appropriate.

---

## 6) `character-creation.spec.ts` (tests that MUST exercise flow)

You want to continue testing character creation. Use `createEphemeralUser()` so
these tests still exercise the UI but avoid heavy family creation:

```ts
import { test, expect } from "@playwright/test";
import { createEphemeralUser } from "./helpers/createEphemeralUser";

test("complete character creation flow", async ({ browser }) => {
  const ephemeral = await createEphemeralUser();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login via UI (we purposely test the character creation path).
  await page.goto("/login");
  await page.fill('input[name="email"]', ephemeral.email);
  await page.fill('input[name="password"]', ephemeral.password);
  await page.click("button[type=submit]");

  // App should route to character creation; continue with existing assertions
  await page.waitForURL(/.*\/character-creation/);
  // ... rest of your character-creation tests ...
});
```

This keeps that test meaningful without forcing general tests to spend time
creating families.

---

## 7) Handling tests that assume pristine XP / gold = 0

You called this out already — good!

Two options:

**(A) Reset baseline in seed (deterministic)** In `createFamilyForWorker()`,
after creating the `characters` row, explicitly set `xp: 0, gold: 0` via a
`update`. This gives deterministic starting state for tests that require it.

**(B) Make assertions relative (robust)** Change assertions to read the _before_
value and assert deltas. Example:

```ts
const xpBefore = await getXpFromUI(page);
await completeQuest(page, questId);
const xpAfter = await getXpFromUI(page);
expect(xpAfter).toBe(xpBefore + expectedDelta);
```

**Guideline:** If a test is explicitly about onboarding and expects `0` XP, use
A. If a test is about behavior (gaining XP), use B.

---

## 8) Clean up strategies

**Local (Option B)** — _incremental cleanup_, safe for manual dev:

- Give your test families or emails a recognizable tag (we used `@test.local` by
  default).
- Provide `tests/e2e/helpers/cleanupTestData.ts` which deletes rows where
  `email LIKE '%@test.local'` or where `families.name LIKE 'e2e-family-%'`.
- You run this manually: `node tests/e2e/helpers/cleanupTestData.js` when you
  want to purge local test data.

**CI (Option A)** — _truncate before run_:

- Add `tests/e2e/helpers/ci-reset-db.ts` that truncates or deletes test tables
  in the proper order (FKs). The CI job runs this as the first step so the run
  is deterministic.
- Truncate order example:
  `quest_instances, transactions, characters, user_profiles, families, ...` (or
  use `TRUNCATE ... CASCADE` carefully).

**Example simple CI reset (JS):**

```ts
// tests/e2e/helpers/ci-reset-db.ts
import { createClient } from "@supabase/supabase-js";
(async function reset() {
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  await admin.from("quest_instances").delete().neq("id", null);
  await admin.from("transactions").delete().neq("id", null);
  await admin.from("characters").delete().neq("id", null);
  await admin.from("user_profiles").delete().neq("id", null);
  await admin.from("families").delete().neq("id", null);

  // remove users via admin/auth list & delete where email domain matches
  const users = await admin.auth.admin.listUsers();
  for (const u of users.data.users) {
    if (
      u.email &&
      u.email.endsWith(`@${process.env.TEST_EMAIL_DOMAIN || "test.local"}`)
    ) {
      await admin.auth.admin.deleteUser(u.id);
    }
  }
  console.log("DB reset done");
})();
```

**Note:** In CI you’ll have `SUPABASE_SERVICE_ROLE_KEY` as secret. Locally, only
run the cleanup when you want to.

---

## 9) Incremental migration plan (step-by-step)

Work in a feature branch. Migrate small groups of tests and verify at each step.

### Phase 0 — Prep

- Add `tests/e2e/.auth` to `.gitignore`.
- Install `@supabase/supabase-js` and `faker` as dev deps.
- Add the helper files described above.

### Phase 1 — Proof-of-concept (1 test)

- Update **one** test (e.g., `quest-pickup-management.spec.ts`) to import
  `family-fixture.ts`.
- Modify its test to create a browser context from `storagePaths.gm1`.
- Run in serial:
  `npx playwright test tests/e2e/quest-pickup-management.spec.ts -w 1`
- If green, run with `-w 2` to confirm both workers create their own families.

### Phase 2 — Small batch (5–10 tests)

- Convert 5–10 tests (pick low-complexity ones) to use the fixture and
  `storagePaths.gm1`.
- Run full e2e folder with `-w 2`. Fix any assumptions about pristine data (use
  relative assertions or reset baseline in seed).

### Phase 3 — Large batch / all tests

- Convert the rest incrementally. Keep tests that exercise signup/character
  creation using `createEphemeralUser`.
- Introduce cleanup scripts and CI reset step.

### Phase 4 — CI onboarding

- Add a CI step to run `node tests/e2e/helpers/ci-reset-db.js` (or equivalent
  SQL function) before running Playwright.
- Tune `workers` in `playwright.config.ts` to match CI parallelism (don’t
  oversubscribe the backend).
- Monitor test time and flakiness.

---

## 10) Tuning & corner cases

- **Session expiration / storageState drift**: if storageState files expire
  (your backend session TTL), ensure your worker fixture can refresh or recreate
  storageState automatically. Creating storageState on-demand (if
  absent/expired) is what `family-fixture.ts` does.
- **Multiple contexts using the same storageState**: Playwright docs caution
  about sharing the _same_ storageState file across workers — prefer one file
  per worker. We generate `worker-1-gm1.json`, `worker-2-gm1.json`, etc.
  ([GitHub][3])
- **Rate-limiting backend**: If parallel workers still overwhelm your DB, reduce
  `workers` or throttle startup (simple
  `await new Promise(r => setTimeout(r, 200*workerIndex));` in fixture) and
  consider adding a small random delay before heavy operations.

---

## 11) Verification checklist (run at each major milestone)

**After adding `createFamilyForWorker`**

```bash
# quick test script (node REPL)
node -e "require('./tests/e2e/helpers/createFamilyForWorker').createFamilyForWorker(1,{createGm2:true,createHero:true}).then(console.log).catch(console.error)"
```

- Expect: printed family object and 3 new auth & profile rows in Supabase.

**After adding `family-fixture.ts` and converting one test**

```bash
npx playwright test tests/e2e/quest-pickup-management.spec.ts -w 1 -g "guild master assigns quest"
```

- Expect: fixture creates family & storageState; test uses logged-in page.

**After migrating a small batch of tests**

```bash
npx playwright test tests/e2e -w 2
```

- Expect: 2 workers, each with own family and storageState files. No conflicting
  DB state.

**CI check**

- Add `ci-reset-db.js` as pre-step and run full pipeline. Tests should be
  deterministic.

---

## 12) References & recommended reading (Playwright docs)

- Authentication / `storageState` and recommended “one account per worker”
  pattern. ([Playwright][1])
- Fixtures (worker-scoped fixtures) and how worker fixtures persist across test
  files. ([Playwright][2])
- Test parallelism overview (how Playwright runs worker processes).
  ([Playwright][4])

Also a few good blog articles and community examples about using `storageState`
and worker fixtures to speed up Playwright suites. See the “Speed Up Playwright
Tests with StorageState” and similar tutorials for additional patterns.
([Checkly][5])

---

## 13) Final professorly advice (short)

- **Migrate slowly.** Convert one test file first; keep fallback behavior in
  helpers so you can revert easily.
- **Prefer seeded setup for speed** (one family per worker), **but keep a few
  tests that exercise the whole signup pipeline** using ephemeral users — that
  gives you full coverage while keeping CI/iteration time sane.
- **Keep cleanup scripts** handy and run them regularly when developing locally.
- **Tune worker count** — being parallel is good, but Don’t DDoS your dev DB.

---

[1]: https://playwright.dev/docs/auth?utm_source=chatgpt.com "Authentication"
[2]: https://playwright.dev/docs/test-fixtures?utm_source=chatgpt.com "Fixtures"
[3]:
  https://github.com/microsoft/playwright/issues/28095?utm_source=chatgpt.com
  "Issue #28095 · microsoft/playwright"
[4]:
  https://playwright.dev/docs/test-parallel?utm_source=chatgpt.com
  "Parallelism"
[5]:
  https://www.checklyhq.com/blog/speed-up-playwright-tests-with-storage-state/?utm_source=chatgpt.com
  "Speed Up Playwright Tests with Shared StorageState"
