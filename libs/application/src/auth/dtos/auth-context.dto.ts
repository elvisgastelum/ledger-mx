/**
 * Authentication request context containing device/client information.
 * Passed from API layer to use cases for session tracking and audit.
 */
export interface AuthRequestContext {
  /** Optional device name for session tracking */
  deviceName?: string;
  /** Optional IP address of the client */
  ipAddress?: string;
  /** Optional user agent of the client */
  userAgent?: string;
  /** Whether to extend session expiry (remember me) */
  rememberMe?: boolean;
}
