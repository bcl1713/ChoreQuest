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

describe("useTabNavigation - edge cases and structure", () => {
  it("should handle null tabs array gracefully", () => {
    const { result } = renderHook(() => useTabNavigation([]));

    expect(result.current.tabs).toEqual([]);
    expect(result.current.selectedIndex).toBe(0);
  });

  it("should default to first tab when query param is missing", () => {
    mockSearchParams.get = jest.fn(() => null);

    const { result } = renderHook(() => useTabNavigation(mockTabs));

    expect(result.current.selectedIndex).toBe(0);
  });

  it("should not push navigation when tabs are empty", () => {
    const { result } = renderHook(() => useTabNavigation([]));

    act(() => {
      result.current.handleTabChange(1);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should return expected shape", () => {
    const { result } = renderHook(() => useTabNavigation(mockTabs));

    expect(result.current).toHaveProperty("tabs");
    expect(result.current).toHaveProperty("selectedIndex");
    expect(typeof result.current.handleTabChange).toBe("function");
  });
});
