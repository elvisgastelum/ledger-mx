/**
 * Utility functions for the web app.
 * Includes cn() for conditional className merging.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names conditionally using clsx and tailwind-merge.
 * Handles Tailwind class conflicts properly.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
