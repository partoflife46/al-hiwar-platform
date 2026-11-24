/**
 * Module architecture and API reference for `src/lib/services/auth-helpers.ts`.
 *
 * Exported symbols:
 * - `calculateAge` (Function): calculate age definition.
 * - `isAdult` (Function): is adult definition.
 * - `hashOtp` (Function): hash otp definition.
 * - `hashResetCode` (Function): hash reset code definition.
 * - `validateRegistrationInput` (Function): validate registration input definition.
 * - `validateOtpArgs` (Function): validate otp args definition.
 * - `validateResetParams` (Function): validate reset params definition.
 * - `verifyUserCredentials` (Function): verify user credentials definition.
 * - `buildPendingUserRecord` (Function): build pending user record definition.
 * - `buildUserSession` (Function): build user session definition.
 * - `buildVisitorSession` (Function): build visitor session definition.
 *
 * Internal dependencies:
 * - `@/lib/security/password`
 * - `@/lib/security/password-policy`
 * - `@/lib/security/session-token`
 * - `@/lib/db/types`
 * - `./auth-types`
 *
 * @module lib/services/auth-helpers
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Pure authentication helpers: age verification, OTP hashing, credential checking,
 * registration record construction, and session builders.
 */

import crypto from 'crypto';
import { hashPassword, verifyPassword } from '@/lib/security/password';
import { evaluatePassword } from '@/lib/security/password-policy';
import { GUEST_SESSION_ID, signSessionToken } from '@/lib/security/session-token';
import type { User, UserSession } from '@/lib/db/types';
import type { AuthError, RegisterSeekerInput } from './auth-types';

/**
 * Calculates exact calendar age in whole years from date of birth.
 * Handles leap years (e.g. Feb 29) and exact day-of-month boundaries.
 * @param dateOfBirth - ISO date string or `Date` instance.
 * @param referenceDate - Reference UTC date (defaults to now).
 * @returns Non-negative whole age in years, or `-1` when invalid.
 */
export function calculateAge(
  dateOfBirth: string | Date,
  referenceDate: Date = new Date()
): number {
  const parts = parseDobParts(dateOfBirth);
  if (!parts) return -1;

  let age = referenceDate.getUTCFullYear() - parts.year;
  const monthDiff = referenceDate.getUTCMonth() - parts.month;
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getUTCDate() < parts.day)) {
    age -= 1;
  }
  return age;
}

/** Extracts UTC calendar year, month (0-based), and day from a string or `Date`. */
function parseDobParts(
  dateOfBirth: string | Date
): { year: number; month: number; day: number } | null {
  if (typeof dateOfBirth === 'string') {
    const match = dateOfBirth.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1,
        day: parseInt(match[3], 10),
      };
    }
    const parsed = new Date(dateOfBirth);
    if (isNaN(parsed.getTime())) return null;
    return {
      year: parsed.getUTCFullYear(),
      month: parsed.getUTCMonth(),
      day: parsed.getUTCDate(),
    };
  }
  if (dateOfBirth instanceof Date && !isNaN(dateOfBirth.getTime())) {
    return {
      year: dateOfBirth.getUTCFullYear(),
      month: dateOfBirth.getUTCMonth(),
      day: dateOfBirth.getUTCDate(),
    };
  }
  return null;
}

/** Returns true when the person born on `dateOfBirth` is at least 18 years old. */
export function isAdult(dateOfBirth: string | Date, referenceDate?: Date): boolean {
  return calculateAge(dateOfBirth, referenceDate) >= 18;
}

/** Computes a per-user salted SHA-256 hash of a 6-digit verification OTP. */
export function hashOtp(otp: string, userId: string): string {
  return crypto.createHash('sha256').update(`${otp}:${userId}`).digest('hex');
}

/** Computes a SHA-256 hex digest for a single-use password reset code. */
export function hashResetCode(rawCode: string): string {
  return crypto.createHash('sha256').update(rawCode.trim()).digest('hex');
}

/** Validates mandatory registration fields, password policy, and 18+ age gate. */
export function validateRegistrationInput(input: RegisterSeekerInput): AuthError | null {
  if (
    !input.firstName?.trim() ||
    !input.surname?.trim() ||
    !input.email?.trim() ||
    !input.dateOfBirth
  ) {
    return { code: 'MISSING_FIELDS', message: 'All registration fields are required' };
  }

  if (typeof input.password === 'string' && input.password.trim().length > 0) {
    const evaluation = evaluatePassword(input.password);
    if (!evaluation.hasMinLength) {
      return {
        code: 'PASSWORD_TOO_SHORT',
        message: 'Password must be at least 8 characters long.',
      };
    }
    if (!evaluation.isValid) {
      return {
        code: 'PASSWORD_TOO_WEAK',
        message:
          evaluation.errorMessageEn ||
          'Password must contain a combination of letters and numbers.',
      };
    }
  }

  const age = calculateAge(input.dateOfBirth);
  if (age < 0) {
    return { code: 'INVALID_DOB_FORMAT', message: 'Invalid date of birth provided' };
  }
  if (age < 18) {
    return {
      code: 'AGE_GATE_REJECTED',
      message: 'You must be 18 years or older to register and chat with a specialist.',
      minAge: 18,
    };
  }
  return null;
}

/**
 * Validates incoming OTP verification arguments before querying the user store.
 * @param userId - Candidate pending user ID.
 * @param otpCode - Submitted 6-digit OTP code.
 * @returns `AuthError` on malformed inputs, or `null` when structurally valid.
 */
export function validateOtpArgs(userId: string, otpCode: string): AuthError | null {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return { code: 'USER_NOT_FOUND', message: 'User record not found' };
  }
  if (typeof otpCode !== 'string' || typeof otpCode.trim !== 'function') {
    return { code: 'INVALID_OTP_FORMAT', message: 'Verification code must be a string' };
  }
  if (userId.includes('@')) {
    return {
      code: 'INVALID_OTP',
      message: 'Invalid or expired verification code. Please check your inbox and try again.',
    };
  }
  return null;
}

/**
 * Validates a reset-password request's required parameters and password strength policy.
 * @param email - Target account email.
 * @param code - Reset code from the emailed link.
 * @param newPassphrase - Candidate replacement password.
 * @returns `AuthError` on validation failure, or `null` when valid.
 */
export function validateResetParams(
  email: string,
  code: string,
  newPassphrase: string
): AuthError | null {
  if (!email || !code || !newPassphrase || newPassphrase.trim().length < 8) {
    return {
      code: 'MISSING_FIELDS',
      message: 'Email, token, and a new password with at least 8 characters are required.',
    };
  }
  const evaluation = evaluatePassword(newPassphrase);
  if (!evaluation.isValid) {
    return {
      code: 'PASSWORD_TOO_WEAK',
      message:
        evaluation.errorMessageEn ||
        'Password must contain a combination of letters and numbers.',
    };
  }
  return null;
}

/**
 * Verifies login credentials against a persisted user's scrypt or legacy hash,
 * transparently upgrading non-scrypt hashes upon successful match.
 * @param user - Stored user entity.
 * @param credentials - Supplied password or pre-hashed credential.
 * @returns `AuthError` on mismatch, or `null` when authenticated.
 */
export async function verifyUserCredentials(
  user: User,
  credentials: { password?: string; passwordHash?: string }
): Promise<AuthError | null> {
  if (credentials.password) {
    const trimmed = credentials.password.trim();
    const isMatch = await verifyPassword(trimmed, user.passwordHash);
    if (!isMatch) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid password. Please check your credentials and try again.',
      };
    }
    if (!user.passwordHash.startsWith('scrypt:')) {
      user.passwordHash = await hashPassword(trimmed);
    }
    return null;
  }
  if (credentials.passwordHash) {
    if (user.passwordHash !== credentials.passwordHash) {
      return { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials.' };
    }
    return null;
  }
  return { code: 'INVALID_CREDENTIALS', message: 'Password is required.' };
}

/**
 * Constructs a newly registered `User` record awaiting 6-digit OTP activation.
 * @param params - Normalized registration fields, hashed password, and OTP metadata.
 * @returns Persisted `User` record in `PENDING_VERIFICATION` status.
 */
export function buildPendingUserRecord(params: {
  userId: string;
  email: string;
  passwordHash: string;
  input: RegisterSeekerInput;
  isFirstUser: boolean;
  otp: string;
  expiresAt: string;
  lastSentAt: string;
}): User {
  const { userId, email, passwordHash, input, isFirstUser, otp, expiresAt, lastSentAt } = params;
  const dobStr =
    typeof input.dateOfBirth === 'string'
      ? input.dateOfBirth
      : input.dateOfBirth.toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  return {
    id: userId,
    email,
    passwordHash,
    firstName: input.firstName.trim(),
    surname: input.surname.trim(),
    dateOfBirth: dobStr,
    role: isFirstUser ? 'ADMINISTRATOR' : 'NON_MUSLIM',
    status: 'PENDING_VERIFICATION',
    preferredLanguage: input.preferredLanguage || 'en',
    emailVerified: false,
    verificationOtp: otp,
    otpHash: hashOtp(otp, userId),
    otpExpiresAt: expiresAt,
    otpAttempts: 0,
    otpLastSentAt: lastSentAt,
    title: isFirstUser ? 'Platform Administrator' : 'Inquirer',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/** Builds a signed authenticated `UserSession` from a persisted user record. */
export function buildUserSession(user: User, token?: string): UserSession {
  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    surname: user.surname,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    token: token ?? signSessionToken(user.id),
  };
}

/** Builds the canonical unauthenticated visitor session descriptor. */
export function buildVisitorSession(): UserSession {
  return {
    userId: 'visitor',
    email: 'visitor@example.com',
    firstName: 'Visitor',
    surname: 'Guest',
    role: 'VISITOR',
    preferredLanguage: 'en',
    token: GUEST_SESSION_ID,
  };
}
