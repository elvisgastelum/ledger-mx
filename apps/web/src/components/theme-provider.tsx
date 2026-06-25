/**
 * Theme Provider - manages light/dark/system theme with localStorage persistence.
 * Applies .light/.dark to document.documentElement.
 * Listens to system changes when theme=system.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeProviderContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeProviderContext = createContext<
  ThemeProviderContextValue | undefined
>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ledger-mx-web-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKey);
      return (stored as Theme) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Apply theme to document
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    root.classList.remove("light", "dark");

    let resolved: "light" | "dark";
    if (newTheme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      resolved = newTheme;
    }

    root.classList.add(resolved);
    setResolvedTheme(resolved);
  }, []);

  // Set theme and persist to localStorage
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, newTheme);
        } catch {
          // Ignore storage errors
        }
      }
      applyTheme(newTheme);
    },
    [storageKey, applyTheme],
  );

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system");
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const value: ThemeProviderContextValue = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme(): ThemeProviderContextValue {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
