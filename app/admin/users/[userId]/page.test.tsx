import { render, screen, waitFor } from "@testing-library/react";
import AdminUserPage from "./page";
import { supabase } from "@/lib/supabase";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ userId: "hero-1" }),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "gm-1" },
    profile: { id: "gm-1", role: "GUILD_MASTER", family_id: "family-1", name: "GM" },
    family: { id: "family-1", name: "Test Family" },
    isLoading: false,
  }),
}));

jest.mock("@/lib/character-context", () => ({
  useCharacter: () => ({
    character: { id: "gm-char", name: "Guild Master", level: 10, gold: 0, xp: 0 },
    isLoading: false,
  }),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("@/components/layout/authenticated-page-shell", () => ({
  AuthenticatedPageShell: ({ children, title }: React.PropsWithChildren<{ title: string }>) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));

jest.mock("@/components/admin/admin-user-detail-view", () => ({
  AdminUserDetailView: ({ detail }: { detail: { user: { name: string } } }) => (
    <div>Detail for {detail.user.name}</div>
  ),
}));

describe("AdminUserPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "token-1" } },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        detail: {
          user: { id: "hero-1", name: "Towner", role: "HERO" },
          character: null,
          questSummary: { active: 0, pendingApproval: 0, approved: 0, missed: 0, total: 0 },
          recentQuests: [],
          goldLedgerNotice: "Ledger later",
        },
      }),
    });
  });

  it("loads the target user detail through the admin API with the session token", async () => {
    render(<AdminUserPage />);

    expect(screen.getByText("Loading user profile...")).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/users/hero-1",
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
        }),
      );
      expect(screen.getByText("Detail for Towner")).toBeInTheDocument();
    });
  });
});
