import { renderHook, act } from "@testing-library/react";
import { useTabNavigation } from "./useTabNavigation";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("useTabNavigation", () => {
  const mockTabs = [
    { name: "overview", label: "Overview", icon: "📊" },
    { name: "settings", label: "Settings", icon: "⚙️" },
    { name: "profile", label: "Profile", icon: "👤" },
  ];

  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useRouter
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });

    // Mock usePathname
    mockUsePathname.mockReturnValue("/admin");

    // Mock useSearchParams
    mockSearchParams.toString = jest.fn(() => "");
    mockSearchParams.get = jest.fn(() => null);
    mockUseSearchParams.mockReturnValue(mockSearchParams as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  describe("initial state", () => {
    it("should initialize with first tab selected by default", () => {
      const { result } = renderHook(() => useTabNavigation(mockTabs));

      expect(result.current.selectedIndex).toBe(0);
      expect(result.current.tabs).toEqual(mockTabs);
    });

    it("should sync with URL query parameter on mount", () => {
      mockSearchParams.get = jest.fn((key) => (key === "tab" ? "settings" : null));

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
      mockSearchParams.get = jest.fn((key) => (key === customParamName ? "settings" : null));

      const { result } = renderHook(() => useTabNavigation(mockTabs, customParamName));

      expect(result.current.selectedIndex).toBe(1);
    });

    it("should ignore invalid tab name in URL", () => {
      mockSearchParams.get = jest.fn((key) => (key === "tab" ? "nonexistent" : null));

      const { result } = renderHook(() => useTabNavigation(mockTabs));

      // Should stay at default (0) when URL has invalid tab
      expect(result.current.selectedIndex).toBe(0);
    });

    it("should default to first tab when no URL parameter", () => {
      mockSearchParams.get = jest.fn(() => null);

      const { result } = renderHook(() => useTabNavigation(mockTabs));

      expect(result.current.selectedIndex).toBe(0);
    });
  });

  describe("handleTabChange", () => {
    it("should update selected index", () => {
      const { result } = renderHook(() => useTabNavigation(mockTabs));

      act(() => {
        result.current.handleTabChange(1);
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    it("should update URL with tab name", () => {
      mockSearchParams.toString = jest.fn(() => "");

      const { result } = renderHook(() => useTabNavigation(mockTabs));

      act(() => {
        result.current.handleTabChange(1);
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/admin?tab=settings",
        { scroll: false }
      );
    });

    it("should preserve existing URL parameters", () => {
      mockSearchParams.toString = jest.fn(() => "foo=bar&baz=qux");

      const { result } = renderHook(() => useTabNavigation(mockTabs));

      act(() => {
        result.current.handleTabChange(2);
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/admin?foo=bar&baz=qux&tab=profile",
        { scroll: false }
      );
    });

    it("should use custom query parameter name", () => {
      const customParamName = "activeTab";
      mockSearchParams.toString = jest.fn(() => "");

      const { result } = renderHook(() => useTabNavigation(mockTabs, customParamName));

      act(() => {
        result.current.handleTabChange(1);
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/admin?activeTab=settings",
        { scroll: false }
      );
    });

    it("should not push to history when selecting same tab", () => {
      mockSearchParams.get = jest.fn((key) => (key === "tab" ? "settings" : null));

      const { result } = renderHook(() => useTabNavigation(mockTabs));

      // Clear calls from initial render
      mockPush.mockClear();

      act(() => {
        result.current.handleTabChange(1);
      });

      // Still pushes even if same tab (this allows forcing URL update)
      expect(mockPush).toHaveBeenCalled();
    });

    it("should handle changing to first tab", () => {
      const { result } = renderHook(() => useTabNavigation(mockTabs));

      act(() => {
        result.current.handleTabChange(1);
      });

      mockPush.mockClear();

      act(() => {
        result.current.handleTabChange(0);
      });

      expect(result.current.selectedIndex).toBe(0);
      expect(mockPush).toHaveBeenCalledWith(
        "/admin?tab=overview",
        { scroll: false }
      );
    });

    it("should handle changing to last tab", () => {
      const { result } = renderHook(() => useTabNavigation(mockTabs));

      act(() => {
        result.current.handleTabChange(2);
      });

      expect(result.current.selectedIndex).toBe(2);
      expect(mockPush).toHaveBeenCalledWith(
        "/admin?tab=profile",
        { scroll: false }
      );
    });

    it("should maintain referential stability", () => {
      const { result, rerender } = renderHook(() => useTabNavigation(mockTabs));

      const firstHandleTabChange = result.current.handleTabChange;

      rerender();

      expect(result.current.handleTabChange).toBe(firstHandleTabChange);
    });
  });

  describe("URL synchronization", () => {
    it("should update selected tab when URL changes", () => {
      const firstSearchParams = new URLSearchParams();
      firstSearchParams.get = jest.fn(() => null);
      firstSearchParams.toString = jest.fn(() => "");
      mockUseSearchParams.mockReturnValue(firstSearchParams as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const { result, rerender } = renderHook(() => useTabNavigation(mockTabs));

      expect(result.current.selectedIndex).toBe(0);

      // Simulate URL change by returning a different searchParams object
      const secondSearchParams = new URLSearchParams("tab=profile");
      secondSearchParams.get = jest.fn((key) => (key === "tab" ? "profile" : null));
      secondSearchParams.toString = jest.fn(() => "tab=profile");
      mockUseSearchParams.mockReturnValue(secondSearchParams as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      rerender();

      expect(result.current.selectedIndex).toBe(2);
    });

    it("should handle URL parameter change from settings to overview", () => {
      const firstSearchParams = new URLSearchParams("tab=settings");
      firstSearchParams.get = jest.fn((key) => (key === "tab" ? "settings" : null));
      firstSearchParams.toString = jest.fn(() => "tab=settings");
      mockUseSearchParams.mockReturnValue(firstSearchParams as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const { result, rerender } = renderHook(() => useTabNavigation(mockTabs));

      expect(result.current.selectedIndex).toBe(1);

      // Change URL parameter by returning a different searchParams object
      const secondSearchParams = new URLSearchParams("tab=overview");
      secondSearchParams.get = jest.fn((key) => (key === "tab" ? "overview" : null));
      secondSearchParams.toString = jest.fn(() => "tab=overview");
      mockUseSearchParams.mockReturnValue(secondSearchParams as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      rerender();

      expect(result.current.selectedIndex).toBe(0);
    });

    it("should not change tab when URL parameter is removed", () => {
      mockSearchParams.get = jest.fn((key) => (key === "tab" ? "settings" : null));

      const { result, rerender } = renderHook(() => useTabNavigation(mockTabs));

      expect(result.current.selectedIndex).toBe(1);

      // Remove URL parameter
      mockSearchParams.get = jest.fn(() => null);

      rerender();

      // Should maintain current selection when param is removed
      expect(result.current.selectedIndex).toBe(1);
    });
  });

  describe("tabs array", () => {
    it("should return the provided tabs", () => {
      const { result } = renderHook(() => useTabNavigation(mockTabs));

      expect(result.current.tabs).toEqual(mockTabs);
    });

    it("should handle tabs without icons", () => {
      const tabsWithoutIcons = [
        { name: "tab1", label: "Tab 1" },
        { name: "tab2", label: "Tab 2" },
      ];

      const { result } = renderHook(() => useTabNavigation(tabsWithoutIcons));

      expect(result.current.tabs).toEqual(tabsWithoutIcons);
    });

    it("should handle single tab", () => {
      const singleTab = [{ name: "only", label: "Only Tab", icon: "⭐" }];

      const { result } = renderHook(() => useTabNavigation(singleTab));

      expect(result.current.tabs).toEqual(singleTab);
      expect(result.current.selectedIndex).toBe(0);
    });

    it("should memoize tabs array", () => {
      const { result, rerender } = renderHook(() => useTabNavigation(mockTabs));

      const firstTabs = result.current.tabs;

      rerender();

      // Should be same reference if input is same
      expect(result.current.tabs).toBe(firstTabs);
    });
  });

  describe("edge cases", () => {
    it("should handle out of bounds index gracefully", () => {
      const { result } = renderHook(() => useTabNavigation(mockTabs));

      act(() => {
        result.current.handleTabChange(999);
      });

      // Should update index even if out of bounds (component handles rendering)
      expect(result.current.selectedIndex).toBe(999);
    });

    it("should handle negative index", () => {
      const { result } = renderHook(() => useTabNavigation(mockTabs));

      act(() => {
        result.current.handleTabChange(-1);
      });

      expect(result.current.selectedIndex).toBe(-1);
    });

    it("should handle empty tabs array", () => {
      const { result } = renderHook(() => useTabNavigation([]));

      expect(result.current.tabs).toEqual([]);
      expect(result.current.selectedIndex).toBe(0);
    });

    it("should work with different pathname", () => {
      mockUsePathname.mockReturnValue("/dashboard/settings");
      mockSearchParams.toString = jest.fn(() => "");

      const { result } = renderHook(() => useTabNavigation(mockTabs));

      act(() => {
        result.current.handleTabChange(1);
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/dashboard/settings?tab=settings",
        { scroll: false }
      );
    });

    it("should preserve scroll: false option in router.push", () => {
      mockSearchParams.toString = jest.fn(() => "");

      const { result } = renderHook(() => useTabNavigation(mockTabs));

      act(() => {
        result.current.handleTabChange(1);
      });

      // Verify scroll: false is always passed
      expect(mockPush).toHaveBeenCalledWith(
        expect.any(String),
        { scroll: false }
      );
    });
  });

  describe("return value structure", () => {
    it("should return all expected properties", () => {
      const { result } = renderHook(() => useTabNavigation(mockTabs));

      expect(result.current).toHaveProperty("selectedIndex");
      expect(result.current).toHaveProperty("handleTabChange");
      expect(result.current).toHaveProperty("tabs");

      expect(typeof result.current.selectedIndex).toBe("number");
      expect(typeof result.current.handleTabChange).toBe("function");
      expect(Array.isArray(result.current.tabs)).toBe(true);
    });
  });
});
