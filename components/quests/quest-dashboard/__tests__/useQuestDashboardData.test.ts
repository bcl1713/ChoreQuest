import { renderHook } from "@testing-library/react";
import { useQuestDashboardData } from "../useQuestDashboardData";
import { useAuth } from "@/lib/auth-context";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useCharacter } from "@/hooks/useCharacter";
import { useQuests } from "@/hooks/useQuests";
import { useBossQuests } from "@/hooks/useBossQuests";
import { createMockQuest } from "./quest-helpers.fixtures";

jest.mock("@/lib/auth-context");
jest.mock("@/hooks/useFamilyMembers");
jest.mock("@/hooks/useCharacter");
jest.mock("@/hooks/useQuests");
jest.mock("@/hooks/useBossQuests");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseFamilyMembers = useFamilyMembers as jest.MockedFunction<
  typeof useFamilyMembers
>;
const mockUseCharacter = useCharacter as jest.MockedFunction<
  typeof useCharacter
>;
const mockUseQuests = useQuests as jest.MockedFunction<typeof useQuests>;
const mockUseBossQuests = useBossQuests as jest.MockedFunction<
  typeof useBossQuests
>;

const makeDefaultMocks = () => {
  mockUseAuth.mockReturnValue({
    user: { id: "user-1", email: "test@test.com" },
    profile: {
      id: "user-1",
      role: "MEMBER",
      family_id: "fam-1",
      name: "Test",
      email: "test@test.com",
      created_at: "",
      updated_at: "",
    },
    session: null,
    loading: false,
    signOut: jest.fn(),
    signInWithPassword: jest.fn(),
    signUpWithPassword: jest.fn(),
  });

  mockUseFamilyMembers.mockReturnValue({
    familyMembers: [],
    familyCharacters: [],
    loading: false,
    error: null,
    reload: jest.fn().mockResolvedValue(undefined),
  });

  mockUseCharacter.mockReturnValue({
    character: null,
    loading: false,
    error: null,
    reload: jest.fn().mockResolvedValue(undefined),
  });

  mockUseQuests.mockReturnValue({
    quests: [],
    loading: false,
    error: null,
    reload: jest.fn().mockResolvedValue(undefined),
  });

  mockUseBossQuests.mockReturnValue({
    bossQuests: [],
    loading: false,
    error: null,
    reload: jest.fn().mockResolvedValue(undefined),
  });
};

describe("useQuestDashboardData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    makeDefaultMocks();
  });

  describe("combined loading state", () => {
    it("returns loading=true when any sub-hook is loading", () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: true,
        error: null,
        reload: jest.fn(),
      });

      const { result } = renderHook(() =>
        useQuestDashboardData({ onError: jest.fn() }),
      );

      expect(result.current.loading).toBe(true);
    });

    it("returns loading=false when all sub-hooks are done", () => {
      const { result } = renderHook(() =>
        useQuestDashboardData({ onError: jest.fn() }),
      );

      expect(result.current.loading).toBe(false);
    });
  });

  describe("combined error state", () => {
    it("returns first error from any sub-hook", () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: false,
        error: "Quest fetch failed",
        reload: jest.fn(),
      });

      const { result } = renderHook(() =>
        useQuestDashboardData({ onError: jest.fn() }),
      );

      expect(result.current.error).toBe("Quest fetch failed");
    });

    it("calls onError when error is present", () => {
      const onError = jest.fn();
      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [],
        familyCharacters: [],
        loading: false,
        error: "Family error",
        reload: jest.fn(),
      });

      renderHook(() => useQuestDashboardData({ onError }));

      expect(onError).toHaveBeenCalledWith("Family error");
    });
  });

  describe("memoized quest filtering", () => {
    it("filters myActiveQuests for the current user", () => {
      const userQuest = createMockQuest({
        id: "q1",
        assigned_to_id: "user-1",
        status: "PENDING",
      });
      const otherQuest = createMockQuest({
        id: "q2",
        assigned_to_id: "user-2",
        status: "PENDING",
      });

      mockUseQuests.mockReturnValue({
        quests: [userQuest, otherQuest],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      const { result } = renderHook(() =>
        useQuestDashboardData({ onError: jest.fn() }),
      );

      expect(result.current.myActiveQuests).toHaveLength(1);
      expect(result.current.myActiveQuests[0].id).toBe("q1");
    });

    it("filters pendingApprovalQuests from all quest instances", () => {
      const completedQuest = createMockQuest({
        id: "q-completed",
        status: "COMPLETED",
        assigned_to_id: "user-2",
      });
      const pendingQuest = createMockQuest({
        id: "q-pending",
        status: "PENDING",
      });

      mockUseQuests.mockReturnValue({
        quests: [completedQuest, pendingQuest],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      const { result } = renderHook(() =>
        useQuestDashboardData({ onError: jest.fn() }),
      );

      expect(result.current.pendingApprovalQuests).toHaveLength(1);
      expect(result.current.pendingApprovalQuests[0].id).toBe("q-completed");
    });

    it("filters bossHistoryQuests for DEFEATED status", () => {
      mockUseBossQuests.mockReturnValue({
        bossQuests: [
          { id: "b1", status: "ACTIVE" } as Parameters<
            typeof mockUseBossQuests
          >[0]["bossQuests"][0],
          { id: "b2", status: "DEFEATED" } as Parameters<
            typeof mockUseBossQuests
          >[0]["bossQuests"][0],
        ],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      const { result } = renderHook(() =>
        useQuestDashboardData({ onError: jest.fn() }),
      );

      expect(result.current.bossHistoryQuests).toHaveLength(1);
      expect(result.current.bossHistoryQuests[0].id).toBe("b2");
    });
  });

  describe("isGuildMaster", () => {
    it("returns true when profile role is GUILD_MASTER", () => {
      mockUseAuth.mockReturnValue({
        user: { id: "user-1", email: "test@test.com" },
        profile: {
          id: "user-1",
          role: "GUILD_MASTER",
          family_id: "fam-1",
          name: "Test",
          email: "test@test.com",
          created_at: "",
          updated_at: "",
        },
        session: null,
        loading: false,
        signOut: jest.fn(),
        signInWithPassword: jest.fn(),
        signUpWithPassword: jest.fn(),
      });

      const { result } = renderHook(() =>
        useQuestDashboardData({ onError: jest.fn() }),
      );

      expect(result.current.isGuildMaster).toBe(true);
    });

    it("returns false when profile role is MEMBER", () => {
      const { result } = renderHook(() =>
        useQuestDashboardData({ onError: jest.fn() }),
      );

      expect(result.current.isGuildMaster).toBe(false);
    });
  });

  describe("combined reload", () => {
    it("exposes loadData that calls all sub-hook reloads", async () => {
      const reloadFamily = jest.fn().mockResolvedValue(undefined);
      const reloadCharacter = jest.fn().mockResolvedValue(undefined);
      const reloadQuests = jest.fn().mockResolvedValue(undefined);
      const reloadBossQuests = jest.fn().mockResolvedValue(undefined);

      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [],
        familyCharacters: [],
        loading: false,
        error: null,
        reload: reloadFamily,
      });
      mockUseCharacter.mockReturnValue({
        character: null,
        loading: false,
        error: null,
        reload: reloadCharacter,
      });
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: false,
        error: null,
        reload: reloadQuests,
      });
      mockUseBossQuests.mockReturnValue({
        bossQuests: [],
        loading: false,
        error: null,
        reload: reloadBossQuests,
      });

      const { result } = renderHook(() =>
        useQuestDashboardData({ onError: jest.fn() }),
      );

      await result.current.loadData();

      expect(reloadFamily).toHaveBeenCalled();
      expect(reloadCharacter).toHaveBeenCalled();
      expect(reloadQuests).toHaveBeenCalled();
      expect(reloadBossQuests).toHaveBeenCalled();
    });
  });
});
