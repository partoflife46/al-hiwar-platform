/**
 * Module architecture and API reference for `src/hooks/use-register-seeker.ts`.
 *
 * Exported symbols:
 * - `useRegisterSeeker` (Function): use register seeker definition.
 *
 * Internal dependencies:
 * - `@/lib/services/auth-service`
 * - `@/lib/db/types`
 * - `@/lib/context/language-context`
 * - `@/lib/security/password-policy`
 * - `./auth/register-api`
 *
 * @module hooks/use-register-seeker
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * React hook managing seeker registration form state, 18+ age gate, and OTP verification.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { calculateAge } from '@/lib/services/auth-service';
import type { SupportedLanguage } from '@/lib/db/types';
import { useLanguage } from '@/lib/context/language-context';
import { evaluatePassword } from '@/lib/security/password-policy';
import {
  executeOtpVerification,
  executeSeekerRegistration,
  REGISTER_HOOK_COPY,
} from './auth/register-api';

/** Manages seeker/first-admin registration form, age gate, password policy, and 6-digit OTP flow. */
export function useRegisterSeeker() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();

  const [firstName, setFirstName] = React.useState('');
  const [surname, setSurname] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [preferredLanguage, setPreferredLanguage] =
    React.useState<SupportedLanguage>(language);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => setPreferredLanguage(language), [language]);

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = React.useState<string | null>(null);
  const [emailDeliveryError, setEmailDeliveryError] =
    React.useState<string | null>(null);
  const [isEmailConfigured, setIsEmailConfigured] = React.useState(true);
  const [otpInput, setOtpInput] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [demoOtpHint, setDemoOtpHint] = React.useState<string | null>(null);

  const liveAge = React.useMemo(
    () => (dateOfBirth ? calculateAge(dateOfBirth) : -1),
    [dateOfBirth]
  );
  const pwEval = React.useMemo(() => evaluatePassword(password), [password]);
  const isUnderage = liveAge >= 0 && liveAge < 18;
  const isFr = preferredLanguage === 'fr';
  const copy = REGISTER_HOOK_COPY[isFr ? 'fr' : 'en'];

  /**
   * Asynchronously executes handle register logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pwEval.isValid) {
      const msg = isFr ? pwEval.errorMessageFr : pwEval.errorMessageEn;
      setErrorMsg(msg || copy.pwdWeak);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(copy.pwdMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const outcome = await executeSeekerRegistration(
        { firstName, surname, email, password, dateOfBirth, preferredLanguage },
        isFr
      );
      if (outcome.pendingUserId) setPendingUserId(outcome.pendingUserId);
      if (typeof outcome.emailConfigured === 'boolean') {
        setIsEmailConfigured(outcome.emailConfigured);
      }
      if (outcome.emailDeliveryError) {
        setEmailDeliveryError(outcome.emailDeliveryError);
      }
      if (outcome.demoOtpHint) setDemoOtpHint(outcome.demoOtpHint);
      if (!outcome.ok) {
        setErrorMsg(outcome.errorMessage || copy.regFailed);
        return;
      }
      setOtpInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Asynchronously executes handle verify otp logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const outcome = await executeOtpVerification(pendingUserId, otpInput, isFr);
      if (!outcome.ok || !outcome.session) {
        setErrorMsg(outcome.errorMessage || copy.verifyFailed);
        setIsSubmitting(false);
        return;
      }

      const session = outcome.session;
      const isAdministrator = session.role === 'ADMINISTRATOR';
      const displayName =
        firstName ||
        session.firstName ||
        (isAdministrator ? 'Admin' : copy.defaultSeeker);

      setIsVerified(true);
      setSuccessMsg(
        isAdministrator
          ? copy.adminActivated(displayName)
          : copy.seekerVerified(displayName)
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('alhiwar:role-changed', { detail: session })
        );
      }
      setTimeout(() => router.push(isAdministrator ? '/staff' : '/dialogue'), 1200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : copy.verifyNetErr);
      setIsSubmitting(false);
    }
  };

  return {
    language,
    setLanguage,
    firstName,
    setFirstName,
    surname,
    setSurname,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    dateOfBirth,
    setDateOfBirth,
    preferredLanguage,
    setPreferredLanguage,
    errorMsg,
    setErrorMsg,
    pendingUserId,
    setPendingUserId,
    emailDeliveryError,
    setEmailDeliveryError,
    isEmailConfigured,
    setIsEmailConfigured,
    otpInput,
    setOtpInput,
    isSubmitting,
    setIsSubmitting,
    isVerified,
    setIsVerified,
    successMsg,
    setSuccessMsg,
    demoOtpHint,
    setDemoOtpHint,
    router,
    liveAge,
    pwEval,
    isUnderage,
    isFr,
    handleRegister,
    handleVerifyOtp,
  };
}
