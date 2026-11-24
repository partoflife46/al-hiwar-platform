/**
 * Shared platform module for utils utilities and configuration.
 * Exports typed helpers consumed across the Al-Hiwar web application.
 * @module lib/utils
 * @exports cn
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Executes cn logic.
 * @param inputs - Inputs value (`ClassValue[]`).
 * @returns Value of type `string`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
