/**
 * API client for authentication endpoints using @ts-rest/core.
 * All requests use credentials: 'include' for httpOnly cookie support.
 * Refresh deduplication is handled in AuthContext using useRef.
 */
import type {
	AuthSuccessResponse,
	LoginRequest,
	LogoutResponse,
	RegisterRequest,
} from "@ledger-mx/contracts";
import { contract } from "@ledger-mx/contracts";
import { initClient } from "@ts-rest/core";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

/**
 * Creates a ts-rest client for auth endpoints with credentials: 'include'.
 */
const authClient = initClient(contract, {
	baseUrl,
	baseHeaders: {},
	credentials: "include" as RequestCredentials,
});

/**
 * Registers a new user.
 * POST /api/v1/auth/register
 */
export async function registerApi(
	data: RegisterRequest,
): Promise<AuthSuccessResponse> {
	const result = await authClient.auth.register({ body: data });

	if (result.status === 201) {
		return result.body;
	}

	if (result.status === 400 || result.status === 409) {
		const body = result.body;

		throw new Error(
			body?.message || `Request failed with status ${result.status}`,
		);
	}

	throw new Error(`Request failed with status ${result.status}`);
}

/**
 * Logs in an existing user.
 * POST /api/v1/auth/login
 */
export async function loginApi(
	data: LoginRequest,
): Promise<AuthSuccessResponse> {
	const result = await authClient.auth.login({ body: data });

	if (result.status === 200) {
		return result.body;
	}

	if (result.status === 400 || result.status === 401) {
		const body = result.body;
		throw new Error(
			body?.message || `Request failed with status ${result.status}`,
		);
	}

	throw new Error(`Request failed with status ${result.status}`);
}

/**
 * Refreshes the access token using the httpOnly refresh token cookie.
 * POST /api/v1/auth/refresh
 * Note: Deduplication is now handled in AuthContext with useRef.
 */
export async function refreshApi(): Promise<AuthSuccessResponse> {
	const result = await authClient.auth.refresh({ body: undefined });

	if (result.status === 200) {
		return result.body;
	}

	if (result.status === 401) {
		const body = result.body;
		throw new Error(
			body?.message || `Request failed with status ${result.status}`,
		);
	}

	throw new Error(`Request failed with status ${result.status}`);
}

/**
 * Logs out the current session.
 * POST /api/v1/auth/logout
 */
export async function logoutApi(): Promise<LogoutResponse> {
	const result = await authClient.auth.logout({ body: undefined });

	if (result.status === 200) {
		return result.body;
	}

	if (result.status === 401) {
		const body = result.body;
		throw new Error(
			body?.message || `Request failed with status ${result.status}`,
		);
	}

	throw new Error(`Request failed with status ${result.status}`);
}
