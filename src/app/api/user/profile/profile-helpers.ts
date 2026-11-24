/**
 * Module architecture and API reference for `src/app/api/user/profile/profile-helpers.ts`.
 *
 * Exported symbols:
 * - `profileError` (Function): profile error definition.
 * - `hasValidatedShahadahFor` (Function): has validated shahadah for definition.
 * - `serializeSafeProfile` (Function): serialize safe profile definition.
 * - `applyBasicProfileUpdates` (Function): apply basic profile updates definition.
 * - `applyPasswordChange` (Function): apply password change definition.
 * - `maybePromoteToNewMuslim` (Function): maybe promote to new muslim definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/security/password`
 * - `@/lib/security/password-policy`
 * - `@/lib/services/auth-service`
 * - `@/lib/db/types`
 *
 * @module app/api/user/profile/profile-helpers
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Server-side helper module supporting the `/api/user/profile` API route.
 * Isolates validation, payload mapping, and domain orchestration from HTTP transport logic.
 * @module app/api/user/profile/profile-helpers
 * @exports profileError, hasValidatedShahadahFor, serializeSafeProfile,
 *   applyBasicProfileUpdates, applyPasswordChange, maybePromoteToNewMuslim
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { hashPassword, verifyPassword } from '@/lib/security/password';
import { evaluatePassword } from '@/lib/security/password-policy';
import { calculateAge } from '@/lib/services/auth-service';
import type { Gender, SupportedLanguage, User } from '@/lib/db/types';

/**
 * Constant definition for allowed genders.
 */
const ALLOWED_GENDERS: Gender[] = ['MALE', 'FEMALE'];

/** Returns a standardized JSON error response for profile route handlers. */
export function profileError(
  status: number,
  error: string,
  message: string,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({ ok: false, error, message, ...extra }, { status });
}

/** Checks whether the user has at least one validated Shahadah submission. */
export function hasValidatedShahadahFor(userId: string): boolean {
  return db.shahadahSubmissions.some(
    (s) => s.nonMuslimId === userId && s.status === 'VALIDATED'
  );
}

/** Projects a user record into a safe client-facing profile object without secrets. */
export function serializeSafeProfile(
  user: User,
  hasValidatedShahadah: boolean,
  extra?: Record<string, unknown>
) {
  return {
    id: user.id,
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    surname: user.surname,
    role: user.role,
    status: user.status,
    preferredLanguage: user.preferredLanguage,
    dateOfBirth: user.dateOfBirth,
    nationality: user.nationality || null,
    gender: user.gender || null,
    phoneNumber: user.phoneNumber || null,
    conversionDate: user.conversionDate || null,
    hasValidatedShahadah,
    title: user.title || null,
    createdAt: user.createdAt,
    ...extra,
  };
}

/** Validates and applies name, language, DOB (18+), and demographic updates to `user`. */
export function applyBasicProfileUpdates(
  user: User,
  body: Record<string, any>
): NextResponse | null {
  if (body.firstName !== undefined) {
    if (!body.firstName?.trim()) {
      return profileError(400, 'INVALID_NAME', 'First name cannot be empty');
    }
    user.firstName = body.firstName.trim();
  }
  if (body.surname !== undefined) {
    if (!body.surname?.trim()) {
      return profileError(400, 'INVALID_NAME', 'Surname cannot be empty');
    }
    user.surname = body.surname.trim();
  }
  if (body.preferredLanguage === 'en' || body.preferredLanguage === 'fr') {
    user.preferredLanguage = body.preferredLanguage as SupportedLanguage;
  }
  if (body.dateOfBirth) {
    if (calculateAge(body.dateOfBirth) < 18) {
      return profileError(400, 'AGE_GATE_REJECTED', 'User must be 18 years or older', {
        minAge: 18,
      });
    }
    user.dateOfBirth =
      typeof body.dateOfBirth === 'string'
        ? body.dateOfBirth
        : new Date(body.dateOfBirth).toISOString().slice(0, 10);
  }
  if (body.nationality !== undefined) user.nationality = body.nationality?.trim() || null;
  if (body.gender !== undefined && ALLOWED_GENDERS.includes(body.gender)) {
    user.gender = body.gender as Gender;
  }
  if (body.phoneNumber !== undefined) user.phoneNumber = body.phoneNumber?.trim() || null;
  return null;
}

/** Verifies current password and applies a policy-compliant new password hash. */
export async function applyPasswordChange(
  user: User,
  newPassword: string,
  currentPassword: unknown
): Promise<NextResponse | null> {
  if (!currentPassword || typeof currentPassword !== 'string') {
    return profileError(
      400,
      'CURRENT_PASSWORD_REQUIRED',
      'Current password is required to update your password'
    );
  }
  const isMatch = await verifyPassword(currentPassword.trim(), user.passwordHash);
  if (!isMatch) {
    return profileError(400, 'INVALID_CURRENT_PASSWORD', 'Current password does not match');
  }
  const evaluation = evaluatePassword(newPassword.trim());
  if (!evaluation.hasMinLength) {
    return profileError(400, 'PASSWORD_TOO_SHORT', 'Password must be at least 8 characters long');
  }
  if (!evaluation.isValid) {
    return profileError(
      400,
      'PASSWORD_TOO_WEAK',
      evaluation.errorMessageEn || 'Password must contain a combination of letters and numbers'
    );
  }
  user.passwordHash = await hashPassword(newPassword.trim());
  return null;
}

/** Promotes a validated Non-Muslim seeker to New Muslim once mandatory fields are present. */
export function maybePromoteToNewMuslim(
  user: User,
  hasValidatedShahadah: boolean
): boolean {
  const ready =
    user.role === 'NON_MUSLIM' &&
    hasValidatedShahadah &&
    Boolean(user.nationality) &&
    (user.gender === 'MALE' || user.gender === 'FEMALE') &&
    Boolean(user.phoneNumber);

  if (!ready) return false;
  user.role = 'NEW_MUSLIM';
  user.conversionDate = user.conversionDate || new Date().toISOString();
  db.ensureLearningProgress(user.id);
  db.activeDemoUserId = user.id;
  return true;
}
