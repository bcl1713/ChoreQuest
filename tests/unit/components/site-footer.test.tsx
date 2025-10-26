import { render, screen } from "@testing-library/react";
import SiteFooter from "@/components/layout/site-footer";

describe("SiteFooter", () => {
  it("renders branch metadata when provided", () => {
    render(<SiteFooter gitReference={{ type: "branch", value: "feature/ui-polish" }} />);

    expect(screen.getByText(/Built with Next\.js/i)).toBeInTheDocument();
    expect(screen.getByText(/Branch: feature\/ui-polish/i)).toBeInTheDocument();
  });

  it("renders tag metadata when provided", () => {
    render(<SiteFooter gitReference={{ type: "tag", value: "v0.4.0" }} />);

    expect(screen.getByText(/Tag: v0\.4\.0/i)).toBeInTheDocument();
  });

  it("hides git metadata when not available", () => {
    render(<SiteFooter gitReference={null} />);

    expect(screen.queryByText(/Branch:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tag:/)).not.toBeInTheDocument();
  });
});
