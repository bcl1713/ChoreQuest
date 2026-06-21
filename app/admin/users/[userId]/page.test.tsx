import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  AdminUserDetailView: ({
    detail,
    filters,
    onFiltersChange,
  }: {
    detail: { user: { name: string } };
    filters: { ledgerStartDate: string; ledgerEndDate: string; ledgerEventType: string };
    onFiltersChange: (filters: {
      ledgerStartDate: string;
      ledgerEndDate: string;
      ledgerEventType: string;
    }) => void;
  }) => (
    <div>
      <div>Detail for {detail.user.name}</div>
      <button
        type="button"
        onClick={() =>
          onFiltersChange({
            ...filters,
            ledgerStartDate: "2026-01-01",
            ledgerEndDate: "2026-01-31",
            ledgerEventType: "ADMIN_ADJUSTMENT",
          })
        }
      >
        Apply ledger filters
      </button>
    </div>
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
          goldLedger: {
            entries: [],
            reconciliation: {
              currentGold: 0,
              ledgerBalance: 0,
              difference: 0,
              diverged: false,
            },
          },
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

  it("reloads the admin detail with ledger filter query parameters", async () => {
    const user = userEvent.setup();
    render(<AdminUserPage />);

    await screen.findByText("Detail for Towner");
    await user.click(screen.getByRole("button", { name: "Apply ledger filters" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        "/api/admin/users/hero-1?ledgerStartDate=2026-01-01&ledgerEndDate=2026-01-31&ledgerEventType=ADMIN_ADJUSTMENT",
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
        }),
      );
    });
  });
});
