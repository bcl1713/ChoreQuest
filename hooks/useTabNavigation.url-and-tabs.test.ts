import { renderHook, act } from "@testing-library/react";
import { useTabNavigation } from "./useTabNavigation";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
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

describe("useTabNavigation - URL sync and tabs array", () => {
  it("should update URL when tab changes", () => {
    const { result } = renderHook(() => useTabNavigation(mockTabs));

    act(() => {
      result.current.handleTabChange(1);
    });

    expect(mockPush).toHaveBeenCalledWith("/admin?tab=settings");
  });

  it("should preserve existing query parameters when updating tab", () => {
    mockSearchParams.get = jest.fn((key) => (key === "foo" ? "bar" : null));
    mockSearchParams.toString = jest.fn(() => "foo=bar");

    const { result } = renderHook(() => useTabNavigation(mockTabs));

    act(() => {
      result.current.handleTabChange(1);
    });

    expect(mockPush).toHaveBeenCalledWith("/admin?foo=bar&tab=settings");
  });

  it("should preserve path when using router push", () => {
    mockUsePathname.mockReturnValue("/quests");
    const { result } = renderHook(() => useTabNavigation(mockTabs));

    act(() => {
      result.current.handleTabChange(2);
    });

    expect(mockPush).toHaveBeenCalledWith("/quests?tab=profile");
  });

  it("should expose tabs with labels and icons", () => {
    const { result } = renderHook(() => useTabNavigation(mockTabs));

    expect(result.current.tabs).toEqual(mockTabs);
  });

  it("should default selectedIndex to 0 when query param is invalid", () => {
    mockSearchParams.get = jest.fn((key) => (key === "tab" ? "invalid" : null));

    const { result } = renderHook(() => useTabNavigation(mockTabs));

    expect(result.current.selectedIndex).toBe(0);
  });
});
