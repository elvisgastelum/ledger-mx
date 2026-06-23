/**
 * API client for authentication endpoints.
 * All fetches use credentials: 'include' for httpOnly cookie support.
 * Refresh deduplication is handled in AuthContext using useRef.
 */
import type {
  RegisterRequest,
  LoginRequest,
  AuthSuccessResponse,
  LogoutResponse,
  ErrorResponse,
} from "@ledger-mx/contracts";

const API_BASE = "/api/v1/auth";

/**
 * Parses error response from API and returns a useful error message.
 */
async function parseError(response: Response): Promise<string> {
  try {
    const data: ErrorResponse = await response.json();
    return data.message || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

/**
 * Registers a new user.
 * POST /api/v1/auth/register
 */
export async function registerApi(
  data: RegisterRequest,
): Promise<AuthSuccessResponse> {
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

/**
 * Logs in an existing user.
 * POST /api/v1/auth/login
 */
export async function loginApi(
  data: LoginRequest,
): Promise<AuthSuccessResponse> {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

/**
 * Refreshes the access token using the httpOnly refresh token cookie.
 * POST /api/v1/auth/refresh
 * Note: Deduplication is now handled in AuthContext with useRef.
 */
export async function refreshApi(): Promise<AuthSuccessResponse> {
  const response = await fetch(`${API_BASE}/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

/**
 * Logs out the current session.
 * POST /api/v1/auth/logout
 */
export async function logoutApi(): Promise<LogoutResponse> {
  const response = await fetch(`${API_BASE}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}
