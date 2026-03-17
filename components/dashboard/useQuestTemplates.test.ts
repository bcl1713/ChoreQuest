import { renderHook, waitFor } from "@testing-library/react";
import { useQuestTemplates } from "./useQuestTemplates";

const mockFrom = jest.fn();
jest.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

const mockOnQuestTemplateUpdate = jest.fn();
jest.mock("@/lib/realtime-context", () => ({
  useRealtime: () => ({
    onQuestTemplateUpdate: mockOnQuestTemplateUpdate,
  }),
}));

export const makeTemplate = (id: string, overrides = {}) => ({
  id,
  family_id: "fam-1",
  title: `Quest ${id}`,
  description: null,
  is_active: true,
  reward_gold: 10,
  reward_xp: 20,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  ...overrides,
});

describe("useQuestTemplates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnQuestTemplateUpdate.mockReturnValue(() => {});
  });

  describe("initial loading", () => {
    it("loads active templates when enabled with a familyId", async () => {
      const templates = [makeTemplate("t-1"), makeTemplate("t-2")];
      const chainMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chainMock.eq
        .mockReturnValueOnce(chainMock)
        .mockReturnValueOnce(Promise.resolve({ data: templates, error: null }));
      mockFrom.mockReturnValue(chainMock);

      const { result } = renderHook(() =>
        useQuestTemplates({ familyId: "fam-1", enabled: true }),
      );

      await waitFor(() =>
        expect(result.current.questTemplates).toHaveLength(2),
      );
    });

    it("does not load when enabled is false", () => {
      const { result } = renderHook(() =>
        useQuestTemplates({ familyId: "fam-1", enabled: false }),
      );
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result.current.questTemplates).toHaveLength(0);
    });

    it("does not load when familyId is null", () => {
      const { result } = renderHook(() =>
        useQuestTemplates({ familyId: null, enabled: true }),
      );
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result.current.questTemplates).toHaveLength(0);
    });

    it("does not load when familyId is undefined", () => {
      const { result } = renderHook(() =>
        useQuestTemplates({ familyId: undefined, enabled: true }),
      );
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result.current.questTemplates).toHaveLength(0);
    });

    it("handles database error gracefully without throwing", async () => {
      const chainMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chainMock.eq
        .mockReturnValueOnce(chainMock)
        .mockReturnValueOnce(
          Promise.resolve({ data: null, error: { message: "DB error" } }),
        );
      mockFrom.mockReturnValue(chainMock);

      const { result } = renderHook(() =>
        useQuestTemplates({ familyId: "fam-1", enabled: true }),
      );
      await waitFor(() => expect(mockFrom).toHaveBeenCalled());
      expect(result.current.questTemplates).toHaveLength(0);
    });
  });
});
