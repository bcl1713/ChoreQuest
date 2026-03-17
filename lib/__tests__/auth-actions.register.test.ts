import { SupabaseClient } from "@supabase/supabase-js";
import { registerUser } from "@/lib/auth/auth-actions";
import { Database } from "@/lib/types/database-generated";

jest.mock("@/lib/supabase", () => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  supabase: {},
}));

function createRegisterMockSupabase(
  options: {
    familyData?: { id: string; name: string; code: string } | null;
    familyError?: object | null;
    signUpUser?: { id: string } | null;
    signUpError?: { message: string } | null;
    profileError?: { message: string } | null;
  } = {},
): SupabaseClient<Database> {
  const familyResult = {
    data:
      options.familyData !== undefined
        ? options.familyData
        : { id: "fam-1", name: "Test Family", code: "CODE123" },
    error: options.familyError ?? null,
  };

  const signUpUser =
    options.signUpUser !== undefined
      ? options.signUpUser
      : { id: "user-new-1" };

  const fromMock = jest
    .fn()
    .mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(familyResult),
    }))
    .mockImplementationOnce(() => ({
      insert: jest.fn().mockResolvedValue({
        error: options.profileError ?? null,
      }),
    }));

  return {
    from: fromMock,
    auth: {
      signUp: jest.fn().mockResolvedValue({
        data: { user: signUpUser },
        error: options.signUpError ?? null,
      }),
    },
  } as unknown as SupabaseClient<Database>;
}

describe("registerUser", () => {
  let setError: jest.Mock;
  let setIsLoading: jest.Mock;

  beforeEach(() => {
    setError = jest.fn();
    setIsLoading = jest.fn();
  });

  const validInput = {
    name: "Sir Galahad",
    email: "hero@example.com",
    password: "password123",
    familyCode: "CODE123",
  };

  it("succeeds with valid family code and creates user profile", async () => {
    const supabase = createRegisterMockSupabase();
    await registerUser(supabase, validInput, setError, setIsLoading);
    expect(setError).toHaveBeenCalledWith(null);
    expect(setIsLoading).toHaveBeenCalledWith(true);
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it("inserts user_profiles row with role YOUNG_HERO", async () => {
    const supabase = createRegisterMockSupabase();
    await registerUser(supabase, validInput, setError, setIsLoading);
    const fromMock = supabase.from as jest.Mock;
    const profileInsertCall = fromMock.mock.calls[1];
    expect(profileInsertCall[0]).toBe("user_profiles");
    const insertArg = fromMock.mock.results[1].value.insert.mock.calls[0][0];
    expect(insertArg.role).toBe("YOUNG_HERO");
    expect(insertArg.family_id).toBe("fam-1");
  });

  it("throws and sets error when family code is invalid", async () => {
    const supabase = createRegisterMockSupabase({
      familyData: null,
      familyError: { message: "No rows found" },
    });
    await expect(
      registerUser(supabase, validInput, setError, setIsLoading),
    ).rejects.toThrow("Invalid family code");
    expect(setError).toHaveBeenCalledWith("Invalid family code");
  });

  it("throws and sets error when signUp fails", async () => {
    const supabase = createRegisterMockSupabase({
      signUpUser: null,
      signUpError: { message: "Email already registered" },
    });
    await expect(
      registerUser(supabase, validInput, setError, setIsLoading),
    ).rejects.toThrow("Email already registered");
    expect(setError).toHaveBeenCalledWith("Email already registered");
  });

  it("throws and sets error when profile insert fails", async () => {
    const supabase = createRegisterMockSupabase({
      profileError: { message: "Duplicate key violation" },
    });
    await expect(
      registerUser(supabase, validInput, setError, setIsLoading),
    ).rejects.toThrow("Duplicate key violation");
    expect(setError).toHaveBeenCalledWith("Duplicate key violation");
  });

  it("sets isLoading false in finally even on error", async () => {
    const supabase = createRegisterMockSupabase({
      familyData: null,
      familyError: { message: "No rows found" },
    });
    await expect(
      registerUser(supabase, validInput, setError, setIsLoading),
    ).rejects.toThrow();
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });
});
