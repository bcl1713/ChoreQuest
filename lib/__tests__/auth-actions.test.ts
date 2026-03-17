import { SupabaseClient } from "@supabase/supabase-js";
import { loginUser } from "@/lib/auth/auth-actions";
import { Database } from "@/lib/types/database-generated";

function createMockSupabase(
  overrides: {
    signInError?: Error | { message: string } | null;
  } = {},
): SupabaseClient<Database> {
  return {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        error: overrides.signInError ?? null,
      }),
    },
  } as unknown as SupabaseClient<Database>;
}

describe("loginUser", () => {
  let setError: jest.Mock;
  let setIsLoading: jest.Mock;

  beforeEach(() => {
    setError = jest.fn();
    setIsLoading = jest.fn();
  });

  it("clears error and sets loading on start, then clears loading on success", async () => {
    const supabase = createMockSupabase();
    await loginUser(
      supabase,
      { email: "hero@example.com", password: "correct" },
      setError,
      setIsLoading,
    );

    expect(setError).toHaveBeenCalledWith(null);
    expect(setIsLoading).toHaveBeenCalledWith(true);
    expect(setIsLoading).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledTimes(1); // only the initial clear
  });

  it("calls setError with the error message when signInWithPassword returns an error", async () => {
    const authError = new Error("Invalid login credentials");
    const supabase = createMockSupabase({ signInError: authError });

    await expect(
      loginUser(
        supabase,
        { email: "hero@example.com", password: "wrong" },
        setError,
        setIsLoading,
      ),
    ).rejects.toThrow("Invalid login credentials");

    expect(setError).toHaveBeenCalledWith("Invalid login credentials");
  });

  it("re-throws after calling setError so callers can handle the rejection", async () => {
    const authError = new Error("Invalid login credentials");
    const supabase = createMockSupabase({ signInError: authError });

    const promise = loginUser(
      supabase,
      { email: "hero@example.com", password: "wrong" },
      setError,
      setIsLoading,
    );

    await expect(promise).rejects.toThrow();
    expect(setError).toHaveBeenCalled();
  });

  it("sets isLoading false even when an error occurs", async () => {
    const authError = new Error("Invalid login credentials");
    const supabase = createMockSupabase({ signInError: authError });

    await expect(
      loginUser(
        supabase,
        { email: "hero@example.com", password: "wrong" },
        setError,
        setIsLoading,
      ),
    ).rejects.toThrow();

    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it("uses fallback message when thrown value is not an Error instance", async () => {
    // Non-Error object thrown — simulate by making signInWithPassword reject
    const supabaseThrows = {
      auth: {
        signInWithPassword: jest.fn().mockRejectedValue("string error"),
      },
    } as unknown as SupabaseClient<Database>;

    await expect(
      loginUser(
        supabaseThrows,
        { email: "hero@example.com", password: "wrong" },
        setError,
        setIsLoading,
      ),
    ).rejects.toBe("string error");

    expect(setError).toHaveBeenCalledWith("Login failed");
  });
});
