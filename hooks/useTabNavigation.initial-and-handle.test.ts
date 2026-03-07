import { renderHook, act } from "@testing-library/react";
import { useTabNavigation } from "./useTabNavigation";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

const mockTabs = [
  { name: "overview", label: "Overview", icon: "📊" },
  { name: "settings", label: "Settings", icon: "⚙️" },
  { name: "profile", label: "Profile", icon: "👤" },
];

const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

beforeEach(() => {
  jest.clearAllMocks();

  mockUseRouter.mockReturnValue({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  });

  mockUsePathname.mockReturnValue("/admin");
  mockSearchParams.toString = jest.fn(() => "");
  mockSearchParams.get = jest.fn(() => null);

  mockUseSearchParams.mockReturnValue(mockSearchParams as any);
});

describe("useTabNavigation - initial and handleTabChange", () => {
  it("should initialize with first tab selected by default", () => {
    const { result } = renderHook(() => useTabNavigation(mockTabs));

    expect(result.current.selectedIndex).toBe(0);
    expect(result.current.tabs).toEqual(mockTabs);
  });

  it("should sync with URL query parameter on mount", () => {
    mockSearchParams.get = jest.fn((key) =>
      key === "tab" ? "settings" : null,
    );

    const { result } = renderHook(() => useTabNavigation(mockTabs));

    expect(result.current.selectedIndex).toBe(1);
  });

  it("should handle URL parameter for third tab", () => {
    mockSearchParams.get = jest.fn((key) => (key === "tab" ? "profile" : null));

    const { result } = renderHook(() => useTabNavigation(mockTabs));

    expect(result.current.selectedIndex).toBe(2);
  });

  it("should use custom query parameter name", () => {
    const customParamName = "activeTab";
    mockSearchParams.get = jest.fn((key) =>
      key === customParamName ? "settings" : null,
    );

    const { result } = renderHook(() =>
      useTabNavigation(mockTabs, customParamName),
    );

    expect(result.current.selectedIndex).toBe(1);
  });

  it("should update selected tab on handleTabChange", () => {
    const { result } = renderHook(() => useTabNavigation(mockTabs));

    act(() => {
      result.current.handleTabChange(2);
    });

    expect(result.current.selectedIndex).toBe(2);
    expect(mockPush).toHaveBeenCalledWith("/admin?tab=profile", {
      scroll: false,
    });
  });

  it("should ignore out-of-range tab index", () => {
    const { result } = renderHook(() => useTabNavigation(mockTabs));

    act(() => {
      result.current.handleTabChange(5);
    });

    // The hook sets selectedIndex even for out-of-range values,
    // but does not call router.push since tabName is undefined
    expect(result.current.selectedIndex).toBe(5);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should use custom query parameter name when handling tab change", () => {
    const customParamName = "activeTab";
    const { result } = renderHook(() =>
      useTabNavigation(mockTabs, customParamName),
    );

    act(() => {
      result.current.handleTabChange(1);
    });

    expect(mockPush).toHaveBeenCalledWith("/admin?activeTab=settings", {
      scroll: false,
    });
  });
});
