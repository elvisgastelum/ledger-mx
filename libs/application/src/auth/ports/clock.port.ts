/**
 * Port for getting the current time.
 * Allows injecting a mock clock in tests.
 */
export interface Clock {
  /**
   * Returns the current time.
   * @returns The current date/time
   */
  now(): Date;
}

/**
 * System clock implementation using the real system time.
 * Safe for use in production; dependency-free.
 */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
