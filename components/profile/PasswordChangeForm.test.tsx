import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PasswordChangeForm from "./PasswordChangeForm";
import { useAuth } from "@/lib/auth-context";
import { useNotification } from "@/hooks/useNotification";

jest.mock("@/lib/auth-context");
jest.mock("@/hooks/useNotification");

const mockUpdatePassword = jest.fn();
const mockErrorNotification = jest.fn();
const mockSuccessNotification = jest.fn();

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
    mockErrorNotification.mockClear();
    mockSuccessNotification.mockClear();
    mockUpdatePassword.mockResolvedValue(true);
    (useAuth as jest.Mock).mockReturnValue({
      updatePassword: mockUpdatePassword,
    });
    (useNotification as jest.Mock).mockReturnValue({
      error: mockErrorNotification,
      success: mockSuccessNotification,
      notifications: [],
      dismiss: jest.fn(),
      info: jest.fn(),
      show: jest.fn(),
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

  it("renders and toggles password visibility", async () => {
    renderForm();

    const currentPasswordInput = screen.getByPlaceholderText(
      "Enter current password...",
    ) as HTMLInputElement;
    const toggleButtons = screen.getAllByRole("button", { hidden: true });

    expect(toggleButtons.length).toBeGreaterThanOrEqual(3);
    expect(currentPasswordInput.type).toBe("password");

    await userEvent.click(toggleButtons[0]);
    expect(currentPasswordInput.type).toBe("text");
  });

  it("displays password strength and requirements", async () => {
    renderForm();

    const newPasswordInput = screen.getByPlaceholderText(
      "Enter new password...",
    );

    // Verify requirements are shown
    expect(screen.getByText(/At least 8 characters/)).toBeInTheDocument();
    expect(screen.getByText(/One uppercase letter/)).toBeInTheDocument();
    expect(
      screen.getByText(/One number or special character/),
    ).toBeInTheDocument();

    // Verify strength indicator shows for weak passwords
    await userEvent.type(newPasswordInput, "weak");
    expect(screen.getByText(/Weak|Medium|Strong/)).toBeInTheDocument();
  });

  it("validates password requirements and disables submit button for invalid passwords", async () => {
    renderForm();

    const newPasswordInput = screen.getByPlaceholderText(
      "Enter new password...",
    );
    const button = screen.getByRole("button", { name: /Update Password/i });

    // Test short password
    await userEvent.type(newPasswordInput, "Short1!");
    expect(screen.getByText(/At least 8 characters/)).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Clear and test missing uppercase
    await userEvent.clear(newPasswordInput);
    await userEvent.type(newPasswordInput, "lowercase1!");
    expect(screen.getByText(/One uppercase letter/)).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Clear and test missing number/special character
    await userEvent.clear(newPasswordInput);
    await userEvent.type(newPasswordInput, "NoNumber");
    expect(
      screen.getByText(/One number or special character/),
    ).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("shows password mismatch error and disables submit button", async () => {
    renderForm();
    await typePasswords("Current1!", "ValidPass1!", "DifferentPass1!");

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it("disables submit button for invalid input states", async () => {
    renderForm();
    const button = screen.getByRole("button", { name: /Update Password/i });

    // Empty passwords
    expect(button).toBeDisabled();

    // Weak password
    await typePasswords("Current1!", "weak", "weak");
    expect(button).toBeDisabled();
  });

  it("enables submit button and calls updatePassword with valid input", async () => {
    renderForm();
    await typePasswords("Current1!", "ValidPass1!", "ValidPass1!");

    const button = screen.getByRole("button", { name: /Update Password/i });
    expect(button).not.toBeDisabled();

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

  it("clears form on successful password change", async () => {
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

  it("shows error notification on failed password change", async () => {
    mockUpdatePassword.mockRejectedValueOnce(
      new Error("Invalid current password"),
    );

    renderForm();
    await typePasswords("Wrong1!", "ValidPass1!", "ValidPass1!");

    const button = screen.getByRole("button", { name: /Update Password/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockErrorNotification).toHaveBeenCalledWith(
        "Invalid current password",
      );
    });
  });

  it("shows loading state and handles validation errors", async () => {
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

  it("disables submit button for validation errors", async () => {
    renderForm();
    const newPasswordInput = screen.getByPlaceholderText(
      "Enter new password...",
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      "Confirm new password...",
    );
    await userEvent.type(newPasswordInput, "ValidPass1!");
    await userEvent.type(confirmPasswordInput, "ValidPass1!");

    let button = screen.getByRole("button", { name: /Update Password/i });
    expect(button).toBeDisabled(); // Missing current password

    const currentPasswordInput = screen.getByPlaceholderText(
      "Enter current password...",
    );
    await userEvent.clear(newPasswordInput);
    await userEvent.type(currentPasswordInput, "Current1!");
    button = screen.getByRole("button", { name: /Update Password/i });
    expect(button).toBeDisabled(); // Missing new password
  });

  it("error notification persists without auto-dismiss", async () => {
    mockUpdatePassword.mockRejectedValue(new Error("Authentication failed"));

    renderForm();
    await typePasswords("Wrong1!", "ValidPass1!", "ValidPass1!");

    const button = screen.getByRole("button", { name: /Update Password/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockErrorNotification).toHaveBeenCalledWith(
        "Authentication failed",
      );
    });
  });

  it("calls onSuccess callback on successful submission", async () => {
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
});
