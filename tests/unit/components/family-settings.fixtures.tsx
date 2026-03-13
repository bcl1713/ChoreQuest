import { render } from "@testing-library/react";
import FamilySettings from "@/components/family/family-settings";
import { useNotification } from "@/hooks/useNotification";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void } & Record<string, unknown>>) => (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

jest.mock("lucide-react", () => ({
  Copy: () => <span>Copy Icon</span>,
  RefreshCw: () => <span>RefreshCw Icon</span>,
  Users: () => <span>Users Icon</span>,
  Calendar: () => <span>Calendar Icon</span>,
  Shield: () => <span>Shield Icon</span>,
  User: () => <span>User Icon</span>,
  Globe: () => <span>Globe Icon</span>,
  Info: () => <span>Info Icon</span>,
  AlertTriangle: () => <span>AlertTriangle Icon</span>,
}));

export const mockProfile = {
  id: "user-1",
  family_id: "family-123",
  role: "GUILD_MASTER",
  name: "Alice",
};

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    profile: mockProfile,
  }),
}));

export const mockNotificationSuccess = jest.fn();
export const mockNotificationError = jest.fn();

jest.mock("@/hooks/useNotification", () => ({
  useNotification: jest.fn(),
}));

export const mockGetFamilyInfo = jest.fn();
export const mockRegenerateInviteCode = jest.fn();

jest.mock("@/lib/family-service", () => ({
  FamilyService: jest.fn().mockImplementation(() => ({
    getFamilyInfo: mockGetFamilyInfo,
    regenerateInviteCode: mockRegenerateInviteCode,
  })),
}));

export const mockWriteText = jest.fn();

export const mockFamilyInfo = {
  name: "Smith Family",
  code: "ABC123DEF",
  timezone: "America/Chicago",
  members: [
    {
      userId: "user-1",
      displayName: "Alice Smith",
      characterName: "Alice the Knight",
      role: "GUILD_MASTER",
      joinedAt: "2024-01-15T10:00:00.000Z",
    },
    {
      userId: "user-2",
      displayName: "Bob Smith",
      characterName: "Bob the Mage",
      role: "HERO",
      joinedAt: "2024-01-20T14:30:00.000Z",
    },
    {
      userId: "user-3",
      displayName: "Charlie Smith",
      characterName: null,
      role: "HERO",
      joinedAt: "2024-02-01T09:15:00.000Z",
    },
  ],
};

export const setupClipboardMock = () => {
  Object.assign(navigator, {
    clipboard: {
      writeText: mockWriteText,
    },
  });
  mockWriteText.mockResolvedValue(undefined);
};

export const renderFamilySettings = () => render(<FamilySettings />);

export const resetFamilySettingsMocks = () => {
  jest.clearAllMocks();
  setupClipboardMock();
  (useNotification as jest.Mock).mockReturnValue({
    notifications: [],
    dismiss: jest.fn(),
    show: jest.fn(),
    info: jest.fn(),
    success: mockNotificationSuccess,
    error: mockNotificationError,
  });
  mockGetFamilyInfo.mockResolvedValue(mockFamilyInfo);
  mockRegenerateInviteCode.mockResolvedValue("XYZ789GHI");
};
