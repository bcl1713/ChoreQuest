import { renderHook, waitFor } from "@testing-library/react";
import { useQuestTemplates } from "./useQuestTemplates";
import { makeTemplate } from "./useQuestTemplates.test-utils";

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
      // First .eq() filters by family_id (returns chainMock for chaining),
      // second .eq() filters by is_active=true (returns the resolved promise).
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

    it("fetches templates when familyId is known but character has not yet loaded", async () => {
      // Verifies the hook has no character dependency — templates should load
      // as soon as user + family_id are available (before character resolves).
      const templates = [makeTemplate("t-1")];
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
        expect(result.current.questTemplates).toHaveLength(1),
      );
    });

    it("handles database error gracefully without throwing", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      const chainMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // First .eq() filters by family_id, second .eq() filters by is_active=true.
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
