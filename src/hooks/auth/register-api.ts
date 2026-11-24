/**
 * Server API and local-fallback helpers for seeker registration and OTP verification.
 */

import { authService } from '@/lib/services/auth-service';
import type { SupportedLanguage, UserSession } from '@/lib/db/types';

/**
 * Constant definition for register hook copy.
 */
export const REGISTER_HOOK_COPY = {
  en: {
    pwdWeak: 'Password does not meet security requirements.',
    pwdMismatch: 'Passwords do not match. Please re-enter identical passwords.',
    regFailed: 'Registration failed',
    regInitFailed:
      'Unable to initiate registration. Please check your details and try again.',
    verifyFailed: 'Verification failed',
    verifyNetErr: 'Network error during verification',
    adminActivated: (name: string) =>
      `Administrator account activated successfully! Welcome, ${name}.`,
    seekerVerified: (name: string) =>
      `Email verified successfully! Welcome, ${name}.`,
    defaultSeeker: 'Seeker',
  },
  fr: {
    pwdWeak: 'Le mot de passe ne respecte pas les critères de sécurité.',
    pwdMismatch: 'Les mots de passe ne correspondent pas.',
    regFailed: 'Échec de l’inscription',
    regInitFailed:
      'Impossible de démarrer l’inscription. Vérifiez vos informations et réessayez.',
    verifyFailed: 'Échec de vérification du code.',
    verifyNetErr: 'Erreur réseau lors de la vérification',
    adminActivated: (name: string) =>
      `Compte Administrateur activé avec succès ! Bienvenue, ${name}.`,
    seekerVerified: (name: string) =>
      `E-mail vérifié avec succès ! Bienvenue, ${name}.`,
    defaultSeeker: 'Chercheur',
  },
} as const;

/**
 * Type contract defining registration payload.
 * Includes fields/members: firstName, surname, email, password, dateOfBirth,
 * preferredLanguage.
 */
export interface RegistrationPayload {
  /** first name property. */
  firstName: string;
  /** surname property. */
  surname: string;
  /** email property. */
  email: string;
  /** password property. */
  password: string;
  /** date of birth property. */
  dateOfBirth: string;
  /** preferred language property. */
  preferredLanguage: SupportedLanguage;
}

/**
 * Type contract defining registration outcome.
 * Includes fields/members: ok, pendingUserId, emailConfigured, emailDeliveryError,
 * demoOtpHint, errorMessage.
 */
export interface RegistrationOutcome {
  /** ok property. */
  ok: boolean;
  /** Optional pending user id property. */
  pendingUserId?: string;
  /** Optional email configured property. */
  emailConfigured?: boolean;
  /** Optional email delivery error property. */
  emailDeliveryError?: string;
  /** Optional demo otp hint property. */
  demoOtpHint?: string;
  /** Optional error message property. */
  errorMessage?: string;
}

/** Submits seeker registration to `/api/auth/register` with local `authService` fallback. */
export async function executeSeekerRegistration(
  payload: RegistrationPayload,
  isFr: boolean
): Promise<RegistrationOutcome> {
  const copy = REGISTER_HOOK_COPY[isFr ? 'fr' : 'en'];

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      if (json.error === 'OTP_COOLDOWN_ACTIVE' && json.pendingUserId) {
        return {
          ok: false,
          pendingUserId: json.pendingUserId,
          emailConfigured:
            typeof json.emailConfigured === 'boolean'
              ? json.emailConfigured
              : undefined,
          emailDeliveryError: json.emailDeliveryError,
          errorMessage: json.message,
        };
      }
      return { ok: false, errorMessage: json.message || copy.regFailed };
    }
    const d = json.data;
    return {
      ok: true,
      pendingUserId: d?.pendingUserId,
      emailConfigured:
        typeof d?.emailConfigured === 'boolean' ? d.emailConfigured : undefined,
      emailDeliveryError: d?.emailDeliveryError,
      demoOtpHint: d?.demoOtpHint,
    };
  } catch {
    // Fall back to client service in offline/unit-test environments
  }

  try {
    const clientRes = await authService.registerSeeker(payload);
    if (clientRes.ok && clientRes.data?.pendingUserId) {
      return { ok: true, pendingUserId: clientRes.data.pendingUserId };
    }
    return {
      ok: false,
      errorMessage:
        (!clientRes.ok && clientRes.error?.message) || copy.regInitFailed,
    };
  } catch {
    return { ok: false, errorMessage: copy.regInitFailed };
  }
}

/** Verifies a 6-digit OTP via `/api/auth/verify-otp` with local `authService` fallback. */
export async function executeOtpVerification(
  userId: string,
  otpCode: string,
  isFr: boolean
): Promise<{ ok: boolean; session?: UserSession; errorMessage?: string }> {
  const copy = REGISTER_HOOK_COPY[isFr ? 'fr' : 'en'];

  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otpCode }),
    });
    const json = await res.json();
    if (res.ok && json.ok) return { ok: true, session: json.data };
    if (json?.message) return { ok: false, errorMessage: json.message };
  } catch {
    // Fall back to local service below
  }

  try {
    const clientRes = await authService.verifyEmailOtp(userId, otpCode);
    if (clientRes.ok) return { ok: true, session: clientRes.data };
    return {
      ok: false,
      errorMessage: clientRes.error?.message || copy.verifyFailed,
    };
  } catch {
    return { ok: false, errorMessage: copy.verifyFailed };
  }
}
