import React from "react";
import { QuestInstance, QuestStatus, UserProfile } from "@/lib/types/database";
import { useAuth } from "@/lib/auth-context";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useQuests } from "@/hooks/useQuests";

jest.mock("@/hooks/useQuests", () => ({
  useQuests: jest.fn(),
}));
jest.mock("@/hooks/useFamilyMembers", () => ({
  useFamilyMembers: jest.fn(),
}));
jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

interface MockQuestCardProps {
  quest: QuestInstance;
  viewMode: string;
}
jest.mock("@/components/quests/quest-card", () => {
  return function MockQuestCard({ quest, viewMode }: MockQuestCardProps) {
    return (
      <div data-testid={`quest-card-${quest.id}`} data-view-mode={viewMode}>
        {quest.title}
      </div>
    );
  };
});

interface MockMotionDivProps {
  children: React.ReactNode;
  [key: string]: unknown;
}
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: MockMotionDivProps) => <div {...props}>{children}</div>,
  },
}));

jest.mock("@/components/ui/LoadingSpinner", () => ({
  LoadingSpinner: function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  },
}));

jest.mock("@/lib/animations/variants", () => ({
  staggerContainer: {},
}));

jest.mock("@/components/ui/NotificationContainer", () => ({
  NotificationContainer: function MockNotificationContainer() {
    return <div data-testid="notification-container" />;
  },
}));

jest.mock("@/components/ui/ConfirmationModal", () => ({
  ConfirmationModal: function MockConfirmationModal({
    isOpen,
    onConfirm,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
  }) {
    return isOpen ? (
      <div data-testid="confirmation-modal">
        <button data-testid="confirm-button" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    ) : null;
  },
}));

jest.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    notifications: [],
    dismiss: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

export const mockUseQuests = jest.mocked(useQuests);
export const mockUseFamilyMembers = jest.mocked(useFamilyMembers);
export const mockUseAuth = jest.mocked(useAuth);

export const createMockQuest = (overrides: Partial<QuestInstance> = {}): QuestInstance => ({
  id: "quest-1",
  title: "Test Quest",
  description: "Test Description",
  difficulty: "EASY",
  status: "PENDING" as QuestStatus,
  xp_reward: 100,
  gold_reward: 50,
  category: "DAILY",
  created_by_id: "user-1",
  due_date: "2025-01-15",
  created_at: "2025-01-10",
  updated_at: "2025-01-10",
  recurrence_pattern: "DAILY",
  assigned_to_id: null,
  completed_at: null,
  approved_at: null,
  streak_bonus: null,
  streak_count: null,
  volunteer_bonus: null,
  volunteered_by: null,
  template_id: null,
  quest_type: null,
  cycle_start_date: null,
  cycle_end_date: null,
  family_id: "family-1",
  ...overrides,
});

export const createMockFamilyMember = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: "user-1",
  email: "user@example.com",
  name: "John Doe",
  family_id: "family-1",
  role: "GUILD_MASTER",
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
  ...overrides,
});

export const resetQuestManagementMocks = () => {
  jest.clearAllMocks();
};

export const setupFamilyMembers = (familyMembers = [createMockFamilyMember()], familyCharacters = []) =>
  mockUseFamilyMembers.mockReturnValue({
    familyMembers,
    familyCharacters,
    loading: false,
    error: null,
    reload: jest.fn(),
  });

export const setupAuthProfile = (profileOverrides: Partial<UserProfile> = {}) =>
  mockUseAuth.mockReturnValue({
    user: null,
    profile: createMockFamilyMember(profileOverrides),
    family: null,
    session: null,
    login: jest.fn(),
    register: jest.fn(),
    createFamily: jest.fn(),
    logout: jest.fn(),
    updatePassword: jest.fn(),
    isLoading: false,
    error: null,
    characterName: "",
    setCharacterName: jest.fn(),
  });

export const setupQuestData = (quests: QuestInstance[] = [], overrides: Partial<ReturnType<typeof mockUseQuests>> = {}) =>
  mockUseQuests.mockReturnValue({
    quests,
    loading: false,
    error: null,
    reload: jest.fn(),
    ...overrides,
  });
