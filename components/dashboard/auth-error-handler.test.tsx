import React from "react";
import { render } from "@testing-library/react";
import { AuthErrorHandler } from "./auth-error-handler";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: jest.fn(),
}));

const { useSearchParams } = jest.requireMock("next/navigation");

describe("AuthErrorHandler", () => {
  let onAuthError: jest.Mock;

  beforeEach(() => {
    onAuthError = jest.fn();
    mockReplace.mockClear();
    useSearchParams.mockReturnValue(new URLSearchParams());
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not call onAuthError when no error param is present", () => {
    useSearchParams.mockReturnValue(new URLSearchParams());
    render(<AuthErrorHandler onAuthError={onAuthError} />);
    expect(onAuthError).not.toHaveBeenCalled();
  });

  it("does not call onAuthError for unrelated error params", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("error=notfound"));
    render(<AuthErrorHandler onAuthError={onAuthError} />);
    expect(onAuthError).not.toHaveBeenCalled();
  });

  it("calls onAuthError with Guild Master message when error=unauthorized", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("error=unauthorized"));
    render(<AuthErrorHandler onAuthError={onAuthError} />);
    expect(onAuthError).toHaveBeenCalledWith(
      "You are not authorized to access the admin dashboard. Only Guild Masters have access.",
    );
  });

  it("redirects to /dashboard when error=unauthorized", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("error=unauthorized"));
    render(<AuthErrorHandler onAuthError={onAuthError} />);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard", { scroll: false });
  });

  it("clears the error by calling onAuthError(null) after 5 seconds", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("error=unauthorized"));
    render(<AuthErrorHandler onAuthError={onAuthError} />);
    expect(onAuthError).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(5000);
    expect(onAuthError).toHaveBeenCalledTimes(2);
    expect(onAuthError).toHaveBeenLastCalledWith(null);
  });

  it("renders null (no DOM output)", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("error=unauthorized"));
    const { container } = render(
      <AuthErrorHandler onAuthError={onAuthError} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
