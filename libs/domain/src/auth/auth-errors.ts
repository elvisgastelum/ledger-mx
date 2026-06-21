/**
 * Thrown when user credentials are invalid (wrong email or password).
 */
export class InvalidCredentialsError extends Error {
  constructor(message = "Invalid credentials") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

/**
 * Thrown when attempting to use a revoked session.
 */
export class SessionRevokedError extends Error {
  constructor(message = "Session has been revoked") {
    super(message);
    this.name = "SessionRevokedError";
  }
}

/**
 * Thrown when attempting to use an expired session.
 */
export class SessionExpiredError extends Error {
  constructor(message = "Session has expired") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/**
 * Thrown when token reuse is detected (refresh token used after revocation).
 */
export class TokenReuseDetectedError extends Error {
  constructor(message = "Token reuse detected") {
    super(message);
    this.name = "TokenReuseDetectedError";
  }
}

/**
 * Thrown when attempting to register with an email that already exists.
 */
export class DuplicateEmailError extends Error {
  constructor(message = "Email is already registered") {
    super(message);
    this.name = "DuplicateEmailError";
  }
}
