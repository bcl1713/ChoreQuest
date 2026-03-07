import { supabase } from "@/lib/supabase";

export const mockToken = "mock-auth-token";
export const mockFamilyId = "family-123";
export const mockUserId = "user-456";
export const mockTargetUserId = "user-789";

export const setupAuth = () => {
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: {
      session: {
        access_token: mockToken,
        user: { id: mockUserId },
      },
    },
  });
  localStorage.setItem(
    "chorequest-auth",
    JSON.stringify({ token: mockToken })
  );
};

export const resetAuth = () => {
  localStorage.clear();
};
