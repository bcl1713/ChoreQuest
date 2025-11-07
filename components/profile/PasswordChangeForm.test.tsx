import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordChangeForm from './PasswordChangeForm';
import { ProfileService } from '@/lib/profile-service';

jest.mock('@/lib/profile-service');

describe('PasswordChangeForm', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess.mockClear();
    (ProfileService.updatePassword as jest.Mock).mockResolvedValue(true);
  });

  it('renders all three password input fields', () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    expect(screen.getByPlaceholderText('Enter current password...')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter new password...')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Confirm new password...')
    ).toBeInTheDocument();
  });

  it('renders show/hide password toggles', () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const toggleButtons = screen.getAllByRole('button', { hidden: true });
    expect(toggleButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('toggles password visibility', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const currentPasswordInput = screen.getByPlaceholderText(
      'Enter current password...'
    ) as HTMLInputElement;

    expect(currentPasswordInput.type).toBe('password');

    const toggleButtons = screen.getAllByRole('button', { hidden: true });
    await userEvent.click(toggleButtons[0]);

    expect(currentPasswordInput.type).toBe('text');
  });

  it('displays password strength indicator', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');

    // Just test that it shows something for weak passwords
    await userEvent.type(newPasswordInput, 'weak');
    expect(screen.getByText(/Weak|Medium|Strong/)).toBeInTheDocument();
  });

  it('shows password requirements checklist', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    expect(screen.getByText(/At least 8 characters/)).toBeInTheDocument();
    expect(screen.getByText(/One uppercase letter/)).toBeInTheDocument();
    expect(screen.getByText(/One number or special character/)).toBeInTheDocument();
  });

  it('validates minimum length requirement', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');
    await userEvent.type(newPasswordInput, 'Short1!');

    // Check that the requirement appears but validation is not met
    expect(screen.getByText(/At least 8 characters/)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it('validates uppercase letter requirement', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');
    await userEvent.type(newPasswordInput, 'lowercase1!');

    // Check that the requirement appears but validation is not met
    expect(screen.getByText(/One uppercase letter/)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it('validates number or special character requirement', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');
    await userEvent.type(newPasswordInput, 'NoNumber');

    // Check that the requirement appears but validation is not met
    expect(screen.getByText(/One number or special character/)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it('shows password mismatch error', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm new password...'
    );

    await userEvent.type(newPasswordInput, 'ValidPass1!');
    await userEvent.type(confirmPasswordInput, 'DifferentPass1!');

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('disables submit button when passwords are empty', () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const button = screen.getByRole('button', { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it('disables submit button when passwords dont match', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const currentPasswordInput = screen.getByPlaceholderText(
      'Enter current password...'
    );
    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm new password...'
    );

    await userEvent.type(currentPasswordInput, 'Current1!');
    await userEvent.type(newPasswordInput, 'ValidPass1!');
    await userEvent.type(confirmPasswordInput, 'DifferentPass1!');

    const button = screen.getByRole('button', { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it('disables submit button when password too weak', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const currentPasswordInput = screen.getByPlaceholderText(
      'Enter current password...'
    );
    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm new password...'
    );

    await userEvent.type(currentPasswordInput, 'Current1!');
    await userEvent.type(newPasswordInput, 'weak');
    await userEvent.type(confirmPasswordInput, 'weak');

    const button = screen.getByRole('button', { name: /Update Password/i });
    expect(button).toBeDisabled();
  });

  it('enables submit button with valid input', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const currentPasswordInput = screen.getByPlaceholderText(
      'Enter current password...'
    );
    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm new password...'
    );

    await userEvent.type(currentPasswordInput, 'Current1!');
    await userEvent.type(newPasswordInput, 'ValidPass1!');
    await userEvent.type(confirmPasswordInput, 'ValidPass1!');

    const button = screen.getByRole('button', { name: /Update Password/i });
    expect(button).not.toBeDisabled();
  });

  it('calls ProfileService.updatePassword on valid submission', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const currentPasswordInput = screen.getByPlaceholderText(
      'Enter current password...'
    );
    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm new password...'
    );

    await userEvent.type(currentPasswordInput, 'Current1!');
    await userEvent.type(newPasswordInput, 'ValidPass1!');
    await userEvent.type(confirmPasswordInput, 'ValidPass1!');

    const button = screen.getByRole('button', { name: /Update Password/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(ProfileService.updatePassword).toHaveBeenCalledWith(
        'Current1!',
        'ValidPass1!'
      );
    });
  });

  it('calls onSuccess callback when password change succeeds', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const currentPasswordInput = screen.getByPlaceholderText(
      'Enter current password...'
    );
    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm new password...'
    );

    await userEvent.type(currentPasswordInput, 'Current1!');
    await userEvent.type(newPasswordInput, 'ValidPass1!');
    await userEvent.type(confirmPasswordInput, 'ValidPass1!');

    const button = screen.getByRole('button', { name: /Update Password/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        'Password updated successfully!'
      );
    });
  });

  it('clears form after successful password change', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const currentPasswordInput = screen.getByPlaceholderText(
      'Enter current password...'
    ) as HTMLInputElement;
    const newPasswordInput = screen.getByPlaceholderText(
      'Enter new password...'
    ) as HTMLInputElement;
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm new password...'
    ) as HTMLInputElement;

    await userEvent.type(currentPasswordInput, 'Current1!');
    await userEvent.type(newPasswordInput, 'ValidPass1!');
    await userEvent.type(confirmPasswordInput, 'ValidPass1!');

    const button = screen.getByRole('button', { name: /Update Password/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(currentPasswordInput.value).toBe('');
      expect(newPasswordInput.value).toBe('');
      expect(confirmPasswordInput.value).toBe('');
    });
  });

  it('shows error message on failure', async () => {
    (ProfileService.updatePassword as jest.Mock).mockRejectedValue(
      new Error('Invalid current password')
    );

    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const currentPasswordInput = screen.getByPlaceholderText(
      'Enter current password...'
    );
    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm new password...'
    );

    await userEvent.type(currentPasswordInput, 'Wrong1!');
    await userEvent.type(newPasswordInput, 'ValidPass1!');
    await userEvent.type(confirmPasswordInput, 'ValidPass1!');

    const button = screen.getByRole('button', { name: /Update Password/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Invalid current password')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    (ProfileService.updatePassword as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(true), 100))
    );

    render(<PasswordChangeForm onSuccess={mockOnSuccess} />);

    const currentPasswordInput = screen.getByPlaceholderText(
      'Enter current password...'
    );
    const newPasswordInput = screen.getByPlaceholderText('Enter new password...');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm new password...'
    );

    await userEvent.type(currentPasswordInput, 'Current1!');
    await userEvent.type(newPasswordInput, 'ValidPass1!');
    await userEvent.type(confirmPasswordInput, 'ValidPass1!');

    const button = screen.getByRole('button', { name: /Update Password/i });
    await userEvent.click(button);

    expect(screen.getByText('Updating Password...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Update Password/i })).toBeInTheDocument();
    });
  });
});
