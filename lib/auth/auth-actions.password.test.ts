import { SupabaseClient } from "@supabase/supabase-js";
import { updatePasswordFlow } from "@/lib/auth/auth-actions";
import { Database } from "@/lib/types/database-generated";

jest.mock("@/lib/supabase", () => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  supabase: {},
}));

function createUpdatePasswordMockSupabase(
  options: {
    signInError?: { message: string } | null;
    session?: { access_token: string } | null;
  } = {},
): SupabaseClient<Database> {
  return {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        error: options.signInError ?? null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: {
          session:
            options.session !== undefined
              ? options.session
              : { access_token: "test-access-token" },
        },
      }),
    },
  } as unknown as SupabaseClient<Database>;
}

describe("updatePasswordFlow", () => {
  let setError: jest.Mock;
  let setIsLoading: jest.Mock;
  const mockUser = { email: "hero@example.com" };

  beforeEach(() => {
    setError = jest.fn();
    setIsLoading = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  it("throws when no user is logged in (null user)", async () => {
    const supabase = createUpdatePasswordMockSupabase();
    await expect(
      updatePasswordFlow(supabase, null, "old", "new", setError, setIsLoading),
    ).rejects.toThrow("No user logged in");
    expect(setError).toHaveBeenCalledWith("No user logged in");
  });

  it("throws when user has no email", async () => {
    const supabase = createUpdatePasswordMockSupabase();
    await expect(
      updatePasswordFlow(supabase, {}, "old", "new", setError, setIsLoading),
    ).rejects.toThrow("No user logged in");
  });

  it("throws specific message when current password is incorrect", async () => {
    const supabase = createUpdatePasswordMockSupabase({
      signInError: { message: "Invalid login credentials" },
    });
    await expect(
      updatePasswordFlow(
        supabase,
        mockUser,
        "wrong",
        "new",
        setError,
        setIsLoading,
      ),
    ).rejects.toThrow("Current password is incorrect");
    expect(setError).toHaveBeenCalledWith("Current password is incorrect");
  });

  it("sends PUT request to Supabase auth endpoint with new password", async () => {
    const supabase = createUpdatePasswordMockSupabase();
    await updatePasswordFlow(
      supabase,
      mockUser,
      "correct",
      "newpassword",
      setError,
      setIsLoading,
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "https://test.supabase.co/auth/v1/user",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ password: "newpassword" }),
      }),
    );
  });

  it("throws when fetch response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ message: "Password too weak" }),
    });
    const supabase = createUpdatePasswordMockSupabase();
    await expect(
      updatePasswordFlow(
        supabase,
        mockUser,
        "correct",
        "weak",
        setError,
        setIsLoading,
      ),
    ).rejects.toThrow("Password too weak");
    expect(setError).toHaveBeenCalledWith("Password too weak");
  });

  it("sets isLoading true then false in successful flow", async () => {
    const supabase = createUpdatePasswordMockSupabase();
    await updatePasswordFlow(
      supabase,
      mockUser,
      "correct",
      "newpassword",
      setError,
      setIsLoading,
    );
    expect(setIsLoading).toHaveBeenCalledWith(true);
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it("sets isLoading false in finally even on error", async () => {
    const supabase = createUpdatePasswordMockSupabase({
      signInError: { message: "Wrong password" },
    });
    await expect(
      updatePasswordFlow(
        supabase,
        mockUser,
        "wrong",
        "new",
        setError,
        setIsLoading,
      ),
    ).rejects.toThrow();
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });
});
