/**
 * Type contracts and error codes for seeker authentication, 18+ registration,
 * OTP email verification, password reset flows, and session validation.
 */

import type { Result, UserRole, UserSession, SupportedLanguage } from '@/lib/db/types';

/** Registration payload for a new seeker (or initial platform administrator). */
export interface RegisterSeekerInput {
  /** first name property. */
  firstName: string;
  /** surname property. */
  surname: string;
  /** email property. */
  email: string;
  /** Optional password property. */
  password?: string;
  /** Optional password hash property. */
  passwordHash?: string;
  /** date of birth property. */
  dateOfBirth: string | Date;
  /** Optional preferred language property. */
  preferredLanguage?: SupportedLanguage;
}

/** Machine-readable error codes returned by `AuthService` operations. */
export type AuthErrorCode =
  | 'AGE_GATE_REJECTED'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'OTP_MAX_ATTEMPTS_EXCEEDED'
  | 'OTP_COOLDOWN_ACTIVE'
  | 'USER_NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_TOO_WEAK'
  | 'MISSING_FIELDS'
  | 'INVALID_DOB_FORMAT'
  | 'EMAIL_DELIVERY_FAILED'
  | 'PASSWORD_RESET_EXPIRED'
  | 'INVALID_RESET_TOKEN'
  | 'INVALID_OTP_FORMAT'
  | 'OPERATION_NOT_ALLOWED';

/** Structured authentication error payload. */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  minAge?: number;
}

/** Registration response payload returned after OTP generation. */
export interface RegisterSeekerOutput {
  /** pending user id property. */
  pendingUserId: string;
  /** email property. */
  email: string;
  /** Optional email delivered property. */
  emailDelivered?: boolean;
  /** Optional email configured property. */
  emailConfigured?: boolean;
  /** Optional email delivery error property. */
  emailDeliveryError?: string;
  /** Optional demo otp hint property. */
  demoOtpHint?: string;
}

/** Authentication, OTP verification, password reset, and session contract. */
export interface AuthService {
  calculateAge(dateOfBirth: string | Date, referenceDate?: Date): number;
  isAdult(dateOfBirth: string | Date, referenceDate?: Date): boolean;
  registerSeeker(input: RegisterSeekerInput): Promise<Result<RegisterSeekerOutput, AuthError>>;
  verifyEmailOtp(userId: string, otpCode: string): Promise<Result<UserSession, AuthError>>;
  login(credentials: {
    email: string;
    password?: string;
    passwordHash?: string;
  }): Promise<Result<UserSession, AuthError>>;
  requestPasswordReset(
    email: string,
    baseUrl?: string
  ): Promise<Result<{ message: string }, AuthError>>;
  resetPasswordWithToken(
    email: string,
    token: string,
    newPassword: string
  ): Promise<Result<boolean, AuthError>>;
  switchDemoPersona(targetRole: UserRole): Promise<UserSession>;
  validateSession(token: string): Promise<UserSession | null>;
}
