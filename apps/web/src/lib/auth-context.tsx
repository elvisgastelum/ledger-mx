/**
 * Auth context provider for managing authentication state.
 * Uses in-memory state (no localStorage for tokens).
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
    rememberMe?: boolean
  ) => Promise<void>;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  /**
   * Authenticated fetch wrapper that adds credentials: 'include' and
   * Authorization: Bearer header when accessToken exists.
   * On 401, attempts to refresh token and retry once.
   * If refresh fails, clears auth state and throws.
   */
  authFetch: (
    input: RequestInfo | URL,
    init?: RequestInit
  ) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to always have current accessToken for authFetch
  const accessTokenRef = useRef<string | null>(null);

  // Update ref when accessToken changes
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const isAuthenticated = useMemo(() => user !== null, [user]);

  /**
   * Attempts to restore session by refreshing the access token.
   * Called on mount to check for existing httpOnly refresh token cookie.
   */
  const refreshToken = useCallback(async () => {
    try {
      const response = await refreshApi();
      setAccessToken(response.accessToken);
      setUser(response.user);
    } catch {
      // No valid session, user remains unauthenticated
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Registers a new user and sets auth state on success.
   */
  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string,
      rememberMe?: boolean
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
    []
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
    []
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

  /**
   * Authenticated fetch wrapper.
   * Adds credentials: 'include' and Authorization: Bearer header when token exists.
   * On 401, attempts to refresh token and retry once.
   * If refresh fails, clears auth state and throws.
   */
  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const makeRequest = async (token: string | null): Promise<Response> => {
        const headers = new Headers(init?.headers);
        
        // Add Content-Type if not present and body exists
        if (init?.body && !headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
        
        // Add Authorization header if token exists
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        
        return fetch(input, {
          ...init,
          headers,
          credentials: "include",
        });
      };

      // First attempt
      let response = await makeRequest(accessTokenRef.current);

      // If 401, try to refresh token and retry once
      if (response.status === 401) {
        try {
          const refreshResponse = await refreshApi();
          // Update auth state with new token
          setAccessToken(refreshResponse.accessToken);
          setUser(refreshResponse.user);
          
          // Retry with new token
          response = await makeRequest(refreshResponse.accessToken);
          
          // If retry also returns 401, clear auth state
          if (response.status === 401) {
            setAccessToken(null);
            setUser(null);
            throw new Error("Session expired. Please log in again.");
          }
        } catch (error) {
          // Refresh failed or retry returned 401, clear auth state
          setAccessToken(null);
          setUser(null);
          throw new Error("Session expired. Please log in again.");
        }
      }

      return response;
    },
    []
  );

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
      authFetch,
    }),
    [user, accessToken, isAuthenticated, isLoading, register, login, logout, refreshToken, authFetch]
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
