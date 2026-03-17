import { renderHook, act, waitFor } from "@testing-library/react";
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

const makeTemplate = (id: string, overrides = {}) => ({
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

const makeChain = (data: unknown[]) => {
  const chainMock = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  };
  chainMock.eq
    .mockReturnValueOnce(chainMock)
    .mockReturnValueOnce(Promise.resolve({ data, error: null }));
  return chainMock;
};

describe("useQuestTemplates — realtime subscription", () => {
  let capturedListener: ((event: unknown) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedListener = null;
    mockOnQuestTemplateUpdate.mockImplementation((listener) => {
      capturedListener = listener;
      return () => {};
    });
    mockFrom.mockReturnValue(makeChain([]));
  });

  it("subscribes to realtime updates when enabled with familyId", async () => {
    renderHook(() => useQuestTemplates({ familyId: "fam-1", enabled: true }));
    await waitFor(() => expect(mockOnQuestTemplateUpdate).toHaveBeenCalled());
  });

  it("does not subscribe when disabled", () => {
    renderHook(() => useQuestTemplates({ familyId: "fam-1", enabled: false }));
    expect(mockOnQuestTemplateUpdate).not.toHaveBeenCalled();
  });

  it("INSERT event adds an active template to the list", async () => {
    mockFrom.mockReturnValue(makeChain([makeTemplate("t-1")]));

    const { result } = renderHook(() =>
      useQuestTemplates({ familyId: "fam-1", enabled: true }),
    );
    await waitFor(() => expect(result.current.questTemplates).toHaveLength(1));

    act(() => {
      capturedListener?.({ action: "INSERT", record: makeTemplate("t-2") });
    });

    expect(result.current.questTemplates).toHaveLength(2);
  });

  it("INSERT event ignores inactive templates", async () => {
    const { result } = renderHook(() =>
      useQuestTemplates({ familyId: "fam-1", enabled: true }),
    );
    await waitFor(() => expect(mockOnQuestTemplateUpdate).toHaveBeenCalled());

    act(() => {
      capturedListener?.({
        action: "INSERT",
        record: makeTemplate("t-inactive", { is_active: false }),
      });
    });

    expect(result.current.questTemplates).toHaveLength(0);
  });

  it("UPDATE event merges changes into existing template", async () => {
    mockFrom.mockReturnValue(
      makeChain([makeTemplate("t-1", { title: "Old Title" })]),
    );

    const { result } = renderHook(() =>
      useQuestTemplates({ familyId: "fam-1", enabled: true }),
    );
    await waitFor(() => expect(result.current.questTemplates).toHaveLength(1));

    act(() => {
      capturedListener?.({
        action: "UPDATE",
        record: { id: "t-1", title: "New Title", is_active: true },
      });
    });

    expect(result.current.questTemplates[0].title).toBe("New Title");
  });

  it("UPDATE event removes a template that becomes inactive", async () => {
    mockFrom.mockReturnValue(makeChain([makeTemplate("t-1")]));

    const { result } = renderHook(() =>
      useQuestTemplates({ familyId: "fam-1", enabled: true }),
    );
    await waitFor(() => expect(result.current.questTemplates).toHaveLength(1));

    act(() => {
      capturedListener?.({
        action: "UPDATE",
        record: { id: "t-1", is_active: false },
      });
    });

    expect(result.current.questTemplates).toHaveLength(0);
  });

  it("DELETE event removes the template from the list", async () => {
    mockFrom.mockReturnValue(
      makeChain([makeTemplate("t-1"), makeTemplate("t-2")]),
    );

    const { result } = renderHook(() =>
      useQuestTemplates({ familyId: "fam-1", enabled: true }),
    );
    await waitFor(() => expect(result.current.questTemplates).toHaveLength(2));

    act(() => {
      capturedListener?.({ action: "DELETE", old_record: { id: "t-1" } });
    });

    expect(result.current.questTemplates).toHaveLength(1);
    expect(result.current.questTemplates[0].id).toBe("t-2");
  });

  it("calls unsubscribe on unmount", async () => {
    const unsubscribe = jest.fn();
    mockOnQuestTemplateUpdate.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() =>
      useQuestTemplates({ familyId: "fam-1", enabled: true }),
    );
    await waitFor(() => expect(mockOnQuestTemplateUpdate).toHaveBeenCalled());

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
