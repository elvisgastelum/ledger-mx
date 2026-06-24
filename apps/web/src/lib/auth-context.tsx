/**
 * Auth context provider for managing authentication state.
 * Uses in-memory state (no localStorage for tokens).
 * Integrates with ts-rest client for authenticated API calls.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { AuthSuccessResponse } from "@ledger-mx/contracts";
import { registerApi, loginApi, refreshApi, logoutApi } from "./api-client";
import { registerAuthHandlers } from "./ts-rest-client";

interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  register: (
    email: string,
    password: string,
    displayName?: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to always have current accessToken for ts-rest client
  const accessTokenRef = useRef<string | null>(null);

  // Ref for deduplicating concurrent refresh calls
  const refreshPromiseRef = useRef<Promise<AuthSuccessResponse> | null>(null);

  // Update ref when accessToken changes
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const isAuthenticated = useMemo(() => user !== null, [user]);

  /**
   * Deduplicated refresh API call. Returns the in-flight promise if present,
   * otherwise calls refreshApi() and clears the ref in finally.
   */
  const refreshApiDeduped =
    useCallback(async (): Promise<AuthSuccessResponse> => {
      if (refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      refreshPromiseRef.current = (async () => {
        try {
          return await refreshApi();
        } finally {
          refreshPromiseRef.current = null;
        }
      })();

      return refreshPromiseRef.current;
    }, []);

  /**
   * Register auth handlers for ts-rest client.
   * This wires the ts-rest client to use our auth state and refresh logic.
   */
  useEffect(() => {
    registerAuthHandlers({
      getToken: () => accessTokenRef.current,
      refresh: async () => {
        const result = await refreshApiDeduped();
        setAccessToken(result.accessToken);
        setUser(result.user);
        return result;
      },
      clearAuth: () => {
        setAccessToken(null);
        setUser(null);
      },
    });
  }, [refreshApiDeduped]);

  /**
   * Attempts to restore session by refreshing the access token.
   * Called on mount to check for existing httpOnly refresh token cookie.
   */
  const refreshToken = useCallback(async () => {
    try {
      const response = await refreshApiDeduped();
      setAccessToken(response.accessToken);
      setUser(response.user);
    } catch {
      // No valid session, user remains unauthenticated
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshApiDeduped]);

  /**
   * Registers a new user and sets auth state on success.
   */
  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string,
      rememberMe?: boolean,
    ) => {
      const response = await registerApi({
        email,
        password,
        displayName,
        rememberMe,
        deviceName: "web",
      });
      setAccessToken(response.accessToken);
      setUser(response.user);
    },
    [],
  );

  /**
   * Logs in an existing user and sets auth state on success.
   */
  const login = useCallback(
    async (email: string, password: string, rememberMe?: boolean) => {
      const response = await loginApi({
        email,
        password,
        rememberMe,
        deviceName: "web",
      });
      setAccessToken(response.accessToken);
      setUser(response.user);
    },
    [],
  );

  /**
   * Logs out the current user and clears auth state.
   */
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore errors on logout (e.g., already logged out)
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  // Attempt to restore session on mount
  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated,
      isLoading,
      register,
      login,
      logout,
      refreshToken,
    }),
    [
      user,
      accessToken,
      isAuthenticated,
      isLoading,
      register,
      login,
      logout,
      refreshToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 * Throws if used outside of AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
