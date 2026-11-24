/**
 * Core result helpers, enumerations, user entities, and session contracts.
 */

/** Discriminated result wrapper returned by domain service operations. */
export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/** Wraps a value in a successful `Result`. */
export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

/** Wraps an error payload in a failed `Result`. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Institutional role assigned to each Al Hiwar platform account. */
export type UserRole =
  | 'VISITOR'
  | 'NON_MUSLIM'
  | 'NEW_MUSLIM'
  | 'DIALOGIST'
  | 'INSTRUCTOR'
  | 'SUPERVISOR'
  | 'ADMINISTRATOR';

/** Account lifecycle state governing login and verification access. */
export type UserStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';

/** Demographic gender recorded on post-conversion profiles and certificates. */
export type Gender = 'MALE' | 'FEMALE';

/** Supported platform UI and consultation languages. */
export type SupportedLanguage = 'en' | 'fr';

/** Persistent platform user account record. */
export type User = {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  surname: string;
  dateOfBirth: string;
  role: UserRole;
  status: UserStatus;
  preferredLanguage: SupportedLanguage;
  emailVerified: boolean;
  verificationOtp?: string | null;
  otpHash?: string | null;
  otpExpiresAt?: string | null;
  otpAttempts?: number;
  otpLastSentAt?: string | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: string | null;
  nationality?: string | null;
  gender?: Gender | null;
  phoneNumber?: string | null;
  conversionDate?: string | null;
  title?: string;
  createdAt: string;
  updatedAt: string;
};

/** Client-safe authenticated session projection embedded in signed cookies. */
export interface UserSession {
  /** user id property. */
  userId: string;
  /** email property. */
  email: string;
  /** first name property. */
  firstName: string;
  /** surname property. */
  surname: string;
  /** role property. */
  role: UserRole;
  /** preferred language property. */
  preferredLanguage: SupportedLanguage;
  /** token property. */
  token: string;
}
