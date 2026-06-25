/**
 * Auth utility functions for secure authentication-related operations.
 */

/**
 * Validates and sanitizes a redirect URL to prevent open redirect vulnerabilities.
 * Only allows safe same-origin app paths:
 * - String starts with exactly one `/` (not `//`)
 * - Does not include a protocol like `http:`, `https:`, or `javascript:`
 * - Falls back to `/onboarding` otherwise
 */
export function getSafeRedirect(redirect: unknown): string {
  // Must be a string
  if (typeof redirect !== "string") {
    return "/onboarding";
  }

  // Must start with exactly one `/` (not `//` which could be protocol-relative)
  if (!redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/onboarding";
  }

  // Check for dangerous protocols in the path
  const lowerRedirect = redirect.toLowerCase();

  // Reject javascript: protocol (could be in various cases)
  if (lowerRedirect.includes("javascript:")) {
    return "/onboarding";
  }

  // Reject if it looks like it contains a protocol (http:, https:, ftp:, etc.)
  // A safe path should not contain ":" after the first character (except as part of query string)
  const firstChar = redirect[0];
  const restOfPath = redirect.slice(1);
  if (restOfPath.includes(":")) {
    // Could be a protocol like http:, https:, etc.
    // Allow common safe characters but reject if it looks like a protocol
    return "/onboarding";
  }

  // URL is safe, return it
  return redirect;
}
