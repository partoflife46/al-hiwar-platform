/**
 * Module architecture and API reference for `src/lib/services/auth-service.ts`.
 *
 * Exported symbols:
 * - `AuthServiceImpl` (Class): auth service impl definition.
 * - `authService` (Const): auth service definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/security/password`
 * - `@/lib/security/session-token`
 * - `@/lib/email/email-service`
 * - `@/lib/domain`
 * - `@/lib/db/types`
 * - `./auth-helpers`
 * - `./auth-types`
 *
 * @module lib/services/auth-service
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Authentication service coordinating 18+ seeker registration, 6-digit OTP
 * email verification, scrypt login, password resets, and HMAC session validation.
 */

import crypto from 'crypto';
import { db as defaultDb, type InMemoryDatabaseAdapter } from '@/lib/db/in-memory-adapter';
import { hashPassword } from '@/lib/security/password';
import { verifySessionToken, GUEST_SESSION_ID } from '@/lib/security/session-token';
import { emailService as defaultEmailService, type EmailService } from '@/lib/email/email-service';
import { hydrateUser } from '@/lib/domain';
import { ok, err, type Result, type User, type UserRole, type UserSession } from '@/lib/db/types';
import {
  buildPendingUserRecord,
  buildUserSession,
  buildVisitorSession,
  calculateAge,
  hashOtp,
  hashResetCode,
  isAdult,
  validateOtpArgs,
  validateRegistrationInput,
  validateResetParams,
  verifyUserCredentials,
} from './auth-helpers';
import type {
  AuthError,
  AuthErrorCode,
  AuthService,
  RegisterSeekerInput,
  RegisterSeekerOutput,
} from './auth-types';

export { calculateAge, isAdult, hashOtp };
export type { AuthError, AuthErrorCode, AuthService, RegisterSeekerInput, RegisterSeekerOutput };

/**
 * Constant definition for generic reset msg.
 */
const GENERIC_RESET_MSG =
  'If an account matches that email address, password reset instructions have been sent.';

/**
 * Handles seeker registration with 18+ age verification, 6-digit OTP email activation,
 * scrypt login, password resets, and HMAC-SHA256 session validation.
 */
export class AuthServiceImpl implements AuthService {
  private readonly store: InMemoryDatabaseAdapter;
  private readonly mailer: EmailService;

  /**
   * Initializes the authentication service with injectable persistence and mailer adapters.
   * @param store - In-memory database adapter.
   * @param mailer - Email delivery service for OTP and password reset notices.
   */
  constructor(
    store: InMemoryDatabaseAdapter = defaultDb,
    mailer: EmailService = defaultEmailService
  ) {
    this.store = store;
    this.mailer = mailer;
  }

  /** Calculates exact calendar age in full years. */
  calculateAge(dateOfBirth: string | Date, referenceDate?: Date): number {
    return calculateAge(dateOfBirth, referenceDate);
  }

  /** Returns whether a date of birth satisfies the 18+ age requirement. */
  isAdult(dateOfBirth: string | Date, referenceDate?: Date): boolean {
    return isAdult(dateOfBirth, referenceDate);
  }

  /** Registers a new account or resends OTP for an unverified pending registrant. */
  async registerSeeker(
    input: RegisterSeekerInput
  ): Promise<Result<RegisterSeekerOutput, AuthError>> {
    const validationErr = validateRegistrationInput(input);
    if (validationErr) return err(validationErr);

    const email = input.email.trim().toLowerCase();
    const existing = this.store.findUserByEmail(email);
    const otp = crypto.randomInt(100000, 1000000).toString();
    const now = Date.now();
    const expiresAt = new Date(now + 5 * 60 * 1000).toISOString();
    const lastSentAt = new Date(now).toISOString();

    if (existing) return this.resendPendingOtp(existing, otp, now, expiresAt, lastSentAt);

    const userId = `user-seeker-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const rawCredential = input.password || input.passwordHash || 'demo_hashed_credential';
    const passwordHash = await hashPassword(rawCredential);
    const isFirstUser = !this.store.users.some((u) => u.role === 'ADMINISTRATOR');

    const newUser = buildPendingUserRecord({
      userId,
      email,
      passwordHash,
      input,
      isFirstUser,
      otp,
      expiresAt,
      lastSentAt,
    });
    this.store.users.push(newUser);
    this.store.save();
    return this.dispatchRegistrationOtp(newUser, otp, true);
  }

  /** Verifies a 6-digit OTP code, activates the pending user, and returns a signed session. */
  async verifyEmailOtp(
    userId: string,
    otpCode: string
  ): Promise<Result<UserSession, AuthError>> {
    const argErr = validateOtpArgs(userId, otpCode);
    if (argErr) return err(argErr);

    const user = this.store.findUserById(userId);
    if (!user) return err({ code: 'USER_NOT_FOUND', message: 'User record not found' });

    const attempts = (user.otpAttempts || 0) + 1;
    user.otpAttempts = attempts;
    if (process.env.NODE_ENV !== 'test' && attempts > 5) {
      return err({
        code: 'OTP_MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts exceeded. Please request a new verification code.',
      });
    }
    if (user.otpExpiresAt && Date.now() > new Date(user.otpExpiresAt).getTime()) {
      return err({
        code: 'OTP_EXPIRED',
        message: 'Verification code has expired. Please request a fresh code.',
      });
    }

    const trimmedOtp = otpCode.trim();
    const isMatch =
      user.otpHash === hashOtp(trimmedOtp, user.id) || user.verificationOtp === trimmedOtp;
    if (!isMatch) {
      return err({
        code: 'INVALID_OTP',
        message: 'Invalid or expired verification code. Please check your inbox and try again.',
      });
    }

    Object.assign(user, {
      emailVerified: true,
      status: 'ACTIVE',
      verificationOtp: null,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      updatedAt: new Date().toISOString(),
    });
    this.store.activeDemoUserId = user.id;
    this.store.save();
    return ok(buildUserSession(user));
  }

  /** Authenticates an active user using scrypt verification and issues a signed session. */
  async login(credentials: {
    email: string;
    password?: string;
    passwordHash?: string;
  }): Promise<Result<UserSession, AuthError>> {
    const user = this.store.findUserByEmail(credentials.email);
    if (!user) {
      return err({ code: 'USER_NOT_FOUND', message: 'No account found with this email' });
    }
    if (!hydrateUser(user).login(true)) {
      return err({
        code: 'INVALID_CREDENTIALS',
        message: 'Please verify your email before logging in',
      });
    }

    const pwErr = await verifyUserCredentials(user, credentials);
    if (pwErr) return err(pwErr);

    this.store.activeDemoUserId = user.id;
    return ok(buildUserSession(user));
  }

  /** Generates a 15-minute SHA-256 password reset code and dispatches reset instructions. */
  async requestPasswordReset(
    email: string,
    baseUrl = 'http://localhost:3000'
  ): Promise<Result<{ message: string }, AuthError>> {
    const user = this.store.findUserByEmail(email);
    if (!user) return ok({ message: GENERIC_RESET_MSG });

    const rawCode = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashResetCode(rawCode);
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    user.updatedAt = new Date().toISOString();
    this.store.save();

    const resetUrl = `${baseUrl}/reset-password?token=${rawCode}&email=${encodeURIComponent(user.email)}`;
    await this.mailer.sendPasswordResetEmail(user.email, resetUrl, user.preferredLanguage);
    return ok({ message: GENERIC_RESET_MSG });
  }

  /** Validates a password reset code and updates the stored scrypt password hash. */
  async resetPasswordWithToken(
    email: string,
    token: string,
    newPassword: string
  ): Promise<Result<boolean, AuthError>> {
    const paramErr = validateResetParams(email, token, newPassword);
    if (paramErr) return err(paramErr);

    const user = this.store.findUserByEmail(email);
    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
      return err({
        code: 'INVALID_RESET_TOKEN',
        message: 'Password reset link is invalid or has already been used.',
      });
    }
    if (Date.now() > new Date(user.passwordResetExpiresAt).getTime()) {
      user.passwordResetTokenHash = null;
      user.passwordResetExpiresAt = null;
      return err({
        code: 'PASSWORD_RESET_EXPIRED',
        message: 'Password reset link has expired. Please request a new one.',
      });
    }
    if (hashResetCode(token) !== user.passwordResetTokenHash) {
      return err({ code: 'INVALID_RESET_TOKEN', message: 'Invalid password reset token.' });
    }

    user.passwordHash = await hashPassword(newPassword.trim());
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.updatedAt = new Date().toISOString();
    this.store.save();
    return ok(true);
  }

  /** Switches active test fixture persona (strictly limited to automated test runs). */
  async switchDemoPersona(targetRole: UserRole): Promise<UserSession> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Direct persona switching is disabled in production environments.');
    }
    if (targetRole === 'VISITOR') {
      this.store.activeDemoUserId = null;
      return buildVisitorSession();
    }
    const demoUser = this.store.findDemoUserByRole(targetRole);
    if (!demoUser) {
      throw new Error(`Demo persona for role ${targetRole} not found in seeded database`);
    }
    this.store.activeDemoUserId = demoUser.id;
    return buildUserSession(demoUser);
  }

  /** Validates an HMAC session token and returns the active user session, or null. */
  async validateSession(token: string): Promise<UserSession | null> {
    if (!token) return null;
    if (token === GUEST_SESSION_ID) return buildVisitorSession();

    const userId = verifySessionToken(token);
    if (!userId) return null;

    const user = this.store.findUserById(userId);
    if (!user || user.status !== 'ACTIVE' || !user.emailVerified) return null;
    return buildUserSession(user, token);
  }

  /** Re-issues a verification OTP for an unverified user while enforcing the 60s cooldown. */
  private async resendPendingOtp(
    existing: User,
    otp: string,
    now: number,
    expiresAt: string,
    lastSentAt: string
  ): Promise<Result<RegisterSeekerOutput, AuthError>> {
    if (existing.emailVerified && existing.status === 'ACTIVE') {
      return err({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists.',
      });
    }
    if (process.env.NODE_ENV !== 'test' && existing.otpLastSentAt) {
      const elapsed = now - new Date(existing.otpLastSentAt).getTime();
      if (elapsed < 60_000) {
        return err({
          code: 'OTP_COOLDOWN_ACTIVE',
          message: `Please wait ${Math.ceil((60000 - elapsed) / 1000)} seconds before requesting a new code.`,
        });
      }
    }

    Object.assign(existing, {
      verificationOtp: otp,
      otpHash: hashOtp(otp, existing.id),
      otpExpiresAt: expiresAt,
      otpAttempts: 0,
      otpLastSentAt: lastSentAt,
      updatedAt: new Date().toISOString(),
    });
    this.store.save();
    return this.dispatchRegistrationOtp(existing, otp, false);
  }

  /** Sends the OTP verification email via the configured mailer and formats the response. */
  private async dispatchRegistrationOtp(
    user: User,
    otp: string,
    logPasscode: boolean
  ): Promise<Result<RegisterSeekerOutput, AuthError>> {
    const emailResult = await this.mailer.sendOtpEmail(user.email, otp, user.preferredLanguage);
    if (logPasscode && process.env.NODE_ENV !== 'production') {
      console.log(`[DEMO OTP] Passcode for ${user.email} is: ${otp}`);
    }
    return ok({
      pendingUserId: user.id,
      email: user.email,
      emailDelivered: emailResult.ok,
      emailConfigured: this.mailer.isConfigured(),
      emailDeliveryError: !emailResult.ok ? emailResult.message : undefined,
      demoOtpHint: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  }
}

/**
 * Constant definition for auth service.
 */
export const authService = new AuthServiceImpl();
