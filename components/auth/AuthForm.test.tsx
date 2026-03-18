import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuthForm from "./AuthForm";

jest.mock("@/components/ui", () => ({
  FantasyButton: ({
    children,
    isLoading,
    ...rest
  }: {
    children: React.ReactNode;
    isLoading?: boolean;
    [key: string]: unknown;
  }) => (
    <button disabled={isLoading} {...rest}>
      {children}
    </button>
  ),
}));

/** Fill a controlled input by firing a change event */
const fill = (testId: string, value: string) =>
  fireEvent.change(screen.getByTestId(testId), {
    target: { value },
  });

describe("AuthForm", () => {
  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe("field rendering", () => {
    it("renders email and password fields for login type", () => {
      render(<AuthForm type="login" onSubmit={mockOnSubmit} />);
      expect(screen.getByTestId("input-email")).toBeInTheDocument();
      expect(screen.getByTestId("input-password")).toBeInTheDocument();
      expect(screen.queryByTestId("input-name")).not.toBeInTheDocument();
      expect(screen.queryByTestId("input-familyCode")).not.toBeInTheDocument();
    });

    it("renders name, email, password, and familyCode for register type", () => {
      render(<AuthForm type="register" onSubmit={mockOnSubmit} />);
      expect(screen.getByTestId("input-name")).toBeInTheDocument();
      expect(screen.getByTestId("input-email")).toBeInTheDocument();
      expect(screen.getByTestId("input-password")).toBeInTheDocument();
      expect(screen.getByTestId("input-familyCode")).toBeInTheDocument();
    });

    it("renders name, userName, email, and password for create-family type", () => {
      render(<AuthForm type="create-family" onSubmit={mockOnSubmit} />);
      expect(screen.getByTestId("input-name")).toBeInTheDocument();
      expect(screen.getByTestId("input-userName")).toBeInTheDocument();
      expect(screen.getByTestId("input-email")).toBeInTheDocument();
      expect(screen.getByTestId("input-password")).toBeInTheDocument();
      expect(screen.queryByTestId("input-familyCode")).not.toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows email validation error on invalid email for login", async () => {
      const { container } = render(
        <AuthForm type="login" onSubmit={mockOnSubmit} />,
      );
      fill("input-email", "not-an-email");
      fill("input-password", "password123");
      fireEvent.submit(container.querySelector("form")!);
      expect(
        await screen.findByText("Invalid email address"),
      ).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("shows password validation error when too short on register", async () => {
      render(<AuthForm type="register" onSubmit={mockOnSubmit} />);
      fill("input-name", "Sir Galahad");
      fill("input-email", "hero@example.com");
      fill("input-password", "abc");
      fill("input-familyCode", "GUILD123");
      fireEvent.click(screen.getByTestId("auth-submit-button"));
      expect(
        await screen.findByText("Password must be at least 6 characters"),
      ).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("shows familyCode validation error when empty on register", async () => {
      const { container } = render(
        <AuthForm type="register" onSubmit={mockOnSubmit} />,
      );
      fill("input-name", "Sir Galahad");
      fill("input-email", "hero@example.com");
      fill("input-password", "password123");
      // Type then clear to ensure onChange fires and sets familyCode: ""
      fill("input-familyCode", "temp");
      fill("input-familyCode", "");
      fireEvent.submit(container.querySelector("form")!);
      expect(
        await screen.findByText("Family code is required"),
      ).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("calls onSubmit with valid data for login", async () => {
      render(<AuthForm type="login" onSubmit={mockOnSubmit} />);
      fill("input-email", "hero@example.com");
      fill("input-password", "password123");
      fireEvent.click(screen.getByTestId("auth-submit-button"));
      await waitFor(() =>
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: "hero@example.com",
          password: "password123",
        }),
      );
    });

    it("calls onSubmit with valid data for register", async () => {
      render(<AuthForm type="register" onSubmit={mockOnSubmit} />);
      fill("input-name", "Sir Galahad");
      fill("input-email", "hero@example.com");
      fill("input-password", "password123");
      fill("input-familyCode", "GUILD123");
      fireEvent.click(screen.getByTestId("auth-submit-button"));
      await waitFor(() =>
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: "Sir Galahad",
          email: "hero@example.com",
          password: "password123",
          familyCode: "GUILD123",
        }),
      );
    });
  });

  describe("loading and error states", () => {
    it("disables all inputs when isLoading is true", () => {
      render(<AuthForm type="login" onSubmit={mockOnSubmit} isLoading />);
      expect(screen.getByTestId("input-email")).toBeDisabled();
      expect(screen.getByTestId("input-password")).toBeDisabled();
    });

    it("disables submit button when isLoading is true", () => {
      render(<AuthForm type="login" onSubmit={mockOnSubmit} isLoading />);
      expect(screen.getByTestId("auth-submit-button")).toBeDisabled();
    });

    it("shows Processing text in button when isLoading is true", () => {
      render(<AuthForm type="login" onSubmit={mockOnSubmit} isLoading />);
      expect(screen.getByTestId("auth-submit-button")).toHaveTextContent(
        "Processing...",
      );
    });

    it("displays error message when error prop is provided", () => {
      render(
        <AuthForm
          type="login"
          onSubmit={mockOnSubmit}
          error="Invalid credentials"
        />,
      );
      expect(screen.getByTestId("auth-error-message")).toHaveTextContent(
        "Invalid credentials",
      );
    });

    it("does not show error banner when error prop is null", () => {
      render(<AuthForm type="login" onSubmit={mockOnSubmit} error={null} />);
      expect(
        screen.queryByTestId("auth-error-message"),
      ).not.toBeInTheDocument();
    });
  });
});
