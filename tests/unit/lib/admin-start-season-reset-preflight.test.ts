import {
  buildLocalSupabasePreflightMessage,
  createLocalSupabasePreflightPlan,
  isMissingSeasonsMigrationError,
} from "@/lib/admin/start-season-reset-preflight";

describe("local Supabase migration preflight", () => {
  it("requires a seasons-table check for local Supabase URLs", () => {
    const plan = createLocalSupabasePreflightPlan({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(plan).toEqual({
      action: "check",
      url: "http://127.0.0.1:54321",
      key: "anon-key",
    });
  });

  it("skips remote Supabase URLs so dev startup does not probe staging or production", () => {
    const plan = createLocalSupabasePreflightPlan({
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example.com",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(plan).toEqual({
      action: "skip",
      reason: "Supabase URL is not local; migration preflight is local-dev only.",
    });
  });

  it("lets developers bypass the predev check explicitly", () => {
    const plan = createLocalSupabasePreflightPlan({
      CHOREQUEST_SKIP_SUPABASE_PREFLIGHT: "1",
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(plan).toEqual({
      action: "skip",
      reason: "CHOREQUEST_SKIP_SUPABASE_PREFLIGHT is set.",
    });
  });

  it("classifies missing seasons schema-cache errors as the migration prerequisite", () => {
    expect(isMissingSeasonsMigrationError({ message: "Could not find the table 'public.seasons' in the schema cache" })).toBe(
      true,
    );
  });

  it("prints the exact non-destructive migration command when seasons is missing", () => {
    expect(buildLocalSupabasePreflightMessage()).toContain("npm run db:migrate:local");
    expect(buildLocalSupabasePreflightMessage()).toContain("supabase/migrations/20260326000001_add_seasons.sql");
  });
});
