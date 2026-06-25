/**
 * Theme Provider Unit Tests
 * Tests theme state management and localStorage persistence.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../components/theme-provider";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear document classes
    document.documentElement.className = "";
  });

  it("should provide default theme", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    });

    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
  });

  it("should update theme", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(localStorage.getItem("ledger-mx-web-theme")).toBe("dark");
  });

  it("should load theme from localStorage", () => {
    localStorage.setItem("ledger-mx-web-theme", "dark");

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    expect(result.current.theme).toBe("dark");
  });
});
