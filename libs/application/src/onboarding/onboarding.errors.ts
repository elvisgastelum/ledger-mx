/**
 * Base error class for onboarding application errors.
 */
export abstract class OnboardingApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when existing category groups conflict with the requested layout.
 * This occurs when the user already has active category groups that don't match
 * the requested default layout.
 */
export class CategoryGroupLayoutConflictError extends OnboardingApplicationError {
  constructor(existingGroupNames: string[]) {
    super(
      `Cannot apply layout: user already has existing category groups that don't match the requested layout. ` +
        `Existing groups: ${existingGroupNames.join(", ")}. ` +
        `Delete or reassign existing groups first, or use a different layout.`,
    );
  }
}
