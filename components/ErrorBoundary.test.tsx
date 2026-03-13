const mockUsePathname = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const originalEnv = process.env.NODE_ENV;

function ThrowingComponent() {
  throw new Error("Boom");
}

describe("ErrorBoundary", () => {
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
    mockUsePathname.mockReset();
    mockUseSearchParams.mockReset();
    mockUsePathname.mockReturnValue("/");
  });

  it("renders children when no error occurs", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("renders a fallback in production mode", () => {
    process.env.NODE_ENV = "production";
    mockUsePathname.mockReturnValue("/");
    jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reload page/i })).toBeInTheDocument();
  });

  it("resets after navigation changes", () => {
    process.env.NODE_ENV = "production";
    mockUsePathname.mockReturnValue("/");
    jest.spyOn(console, "error").mockImplementation(() => {});

    const { rerender } = render(
      <ErrorBoundary resetKey="/broken?tab=1">
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKey="/safe?">
        <div>Recovered content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Recovered content")).toBeInTheDocument();
  });

  it("does not read search params for the default reset key", () => {
    mockUsePathname.mockReturnValue("/quests");

    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>,
    );

    expect(mockUseSearchParams).not.toHaveBeenCalled();
  });
});
