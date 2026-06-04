import { render, screen } from "@/tests/utils/test-helpers";
import Home from "./page";

const mockUseAuth = jest.fn();

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("Home landing page", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null });
  });

  it("describes the current gameplay systems instead of an old MVP placeholder", () => {
    render(<Home />);

    expect(
      screen.getByText(/family quest board for recurring chores, approvals, and co-op play/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/track character classes, personal achievements, family achievements, and reward redemptions/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/run boss battles, guild administration, and season resets with live family updates/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/under construction/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/foundation complete .* phase 1 mvp: in development/i),
    ).not.toBeInTheDocument();
  });

  it("calls out the current stack and verification tooling from the repo", () => {
    render(<Home />);

    expect(screen.getByText(/next\.js 15 \+ react 19/i)).toBeInTheDocument();
    expect(screen.getByText(/typescript \+ tailwind css 4/i)).toBeInTheDocument();
    expect(screen.getByText(/supabase auth, postgres, and realtime/i)).toBeInTheDocument();
    expect(screen.getByText(/jest unit\/integration coverage \+ playwright e2e/i)).toBeInTheDocument();
  });
});
