import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PasswordChangeForm from "./PasswordChangeForm";
import { useAuth } from "@/lib/auth-context";

jest.mock("@/lib/auth-context");

const mockUpdatePassword = jest.fn();

describe("PasswordChangeForm", () => {
  const mockOnSuccess = jest.fn();
  const renderForm = () =>
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);
  const typePasswords = async (
    current: string,
    next: string,
    confirm: string,
  ) => {
    const currentPasswordInput = screen.getByPlaceholderText(
      "Enter current password...",
    );
    const newPasswordInput = screen.getByPlaceholderText(
      "Enter new password...",
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      "Confirm new password...",
    );

    await userEvent.type(currentPasswordInput, current);
    await userEvent.type(newPasswordInput, next);
    await userEvent.type(confirmPasswordInput, confirm);

    return { currentPasswordInput, newPasswordInput, confirmPasswordInput };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess.mockClear();
    mockUpdatePassword.mockClear();
    mockUpdatePassword.mockResolvedValue(true);
    (useAuth as jest.Mock).mockReturnValue({
      updatePassword: mockUpdatePassword,
    });
  });

  it("renders all three password input fields", () => {
    renderForm();

    expect(
      screen.getByPlaceholderText("Enter current password..."),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter new password..."),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Confirm new password..."),
    ).toBeInTheDocument();
  });

  it("renders show/hide password toggles", () => {
    renderForm();

    const toggleButtons = screen.getAllByRole("button", { hidden: true });
    expect(toggleButtons.length).toBeGreaterThanOrEqual(3);
  });

  it("toggles password visibility", async () => {
    renderForm();

    const currentPasswordInput = screen.getByPlaceholderText(
      "Enter current password...",
    ) as HTMLInputElement;

    expect(currentPasswordInput.type).toBe("password");

    const toggleButtons = screen.getAllByRole("button", { hidden: true });
    await userEvent.click(toggleButtons[0]);

    expect(currentPasswordInput.type).toBe("text");
  });

  it("displays password strength indicator", async () => {
    renderForm();

    const newPasswordInput = screen.getByPlaceholderText(
      "Enter new password...",
    );

    // Just test that it shows something for weak passwords
    await userEvent.type(newPasswordInput, "weak");
    expect(screen.getByText(/Weak|Medium|Strong/)).toBeInTheDocument();
  });

  it("shows password requirements checklist", async () => {
    renderForm();

    expect(screen.getByText(/At least 8 characters/)).toBeInTheDocument();
    expect(screen.getByText(/One uppercase letter/)).toBeInTheDocument();
    expect(
      screen.getByText(/One number or special character/),
    ).toBeInTheDocument();
  });

  it("validates minimum length requirement", async () => {
    renderForm();

    const newPasswordInput = screen.getByPlaceholderText(
      "Enter new password...",
    );
    await userEvent.type(newPasswordInput, "Short1!");

    // Check that the requirement appears but validation is not met
    expect(screen.getByText(/At least 8 characters/)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it("validates uppercase letter requirement", async () => {
    renderForm();

    const newPasswordInput = screen.getByPlaceholderText(
      "Enter new password...",
    );
    await userEvent.type(newPasswordInput, "lowercase1!");

    // Check that the requirement appears but validation is not met
    expect(screen.getByText(/One uppercase letter/)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it("validates number or special character requirement", async () => {
    renderForm();

    const newPasswordInput = screen.getByPlaceholderText(
      "Enter new password...",
    );
    await userEvent.type(newPasswordInput, "NoNumber");

    // Check that the requirement appears but validation is not met
    expect(
      screen.getByText(/One number or special character/),
    ).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it("shows password mismatch error", async () => {
    renderForm();
    await typePasswords("Current1!", "ValidPass1!", "DifferentPass1!");

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  it("disables submit button when passwords are empty", () => {
    renderForm();

    const button = screen.getByRole("button", { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it("disables submit button when passwords dont match", async () => {
    renderForm();
    await typePasswords("Current1!", "ValidPass1!", "DifferentPass1!");

    const button = screen.getByRole("button", { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it("disables submit button when password too weak", async () => {
    renderForm();
    await typePasswords("Current1!", "weak", "weak");

    const button = screen.getByRole("button", { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it("enables submit button with valid input", async () => {
    renderForm();
    await typePasswords("Current1!", "ValidPass1!", "ValidPass1!");

    const button = screen.getByRole("button", { name: /Update Password/i });
    expect(button).not.toBeDisabled();
  });

  it("calls updatePassword from useAuth on valid submission", async () => {
    renderForm();
    await typePasswords("Current1!", "ValidPass1!", "ValidPass1!");

    const button = screen.getByRole("button", { name: /Update Password/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith(
        "Current1!",
        "ValidPass1!",
      );
    });
  });

  it("calls onSuccess callback when password change succeeds", async () => {
    renderForm();
    await typePasswords("Current1!", "ValidPass1!", "ValidPass1!");

    const button = screen.getByRole("button", { name: /Update Password/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        "Password updated successfully!",
      );
    });
  });

  it("clears form after successful password change", async () => {
    renderForm();
    const { currentPasswordInput, newPasswordInput, confirmPasswordInput } =
      (await typePasswords("Current1!", "ValidPass1!", "ValidPass1!")) as {
        currentPasswordInput: HTMLInputElement;
        newPasswordInput: HTMLInputElement;
        confirmPasswordInput: HTMLInputElement;
      };

    const button = screen.getByRole("button", { name: /Update Password/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(currentPasswordInput.value).toBe("");
      expect(newPasswordInput.value).toBe("");
      expect(confirmPasswordInput.value).toBe("");
    });
  });

  it("shows error message on failure", async () => {
    mockUpdatePassword.mockRejectedValue(new Error("Invalid current password"));

    renderForm();
    await typePasswords("Wrong1!", "ValidPass1!", "ValidPass1!");

    const button = screen.getByRole("button", { name: /Update Password/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Invalid current password")).toBeInTheDocument();
    });
  });

  it("shows loading state during submission", async () => {
    mockUpdatePassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100)),
    );

    renderForm();
    await typePasswords("Current1!", "ValidPass1!", "ValidPass1!");

    const button = screen.getByRole("button", { name: /Update Password/i });
    await userEvent.click(button);

    expect(screen.getByText("Updating Password...")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Update Password/i }),
      ).toBeInTheDocument();
    });
  });
});
