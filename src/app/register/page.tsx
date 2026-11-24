/**
 * Public 18+ seeker registration and 6-digit email OTP verification page.
 */

'use client';

/**
 * Module architecture and API reference for `src/app/register/page.tsx`.
 *
 * Exported symbols:
 * - `RegisterSeekerPage` (Function): register seeker page definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-register-seeker`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `@/components/ui/password-strength-meter`
 * - `@/components/auth/register-copy`
 * - `@/components/auth/register-otp-card`
 *
 * @module app/register/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import { useRegisterSeeker } from '@/hooks/use-register-seeker';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Calendar, ShieldCheck } from 'lucide-react';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import {
  confirmInputClass,
  REGISTER_COPY,
  strengthInputClass,
} from '@/components/auth/register-copy';
import { RegisterOtpCard } from '@/components/auth/register-otp-card';

/** Renders the registration form and switches to OTP verification once submitted. */
export default function RegisterSeekerPage() {
  const {
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
    pendingUserId,
    emailDeliveryError,
    isEmailConfigured,
    otpInput,
    setOtpInput,
    isSubmitting,
    isVerified,
    successMsg,
    demoOtpHint,
    liveAge,
    pwEval,
    isUnderage,
    isFr,
    handleRegister,
    handleVerifyOtp,
  } = useRegisterSeeker();

  const copy = REGISTER_COPY[isFr ? 'fr' : 'en'];
  const passwordsMatch = password === confirmPassword;

  return (
    <div className="mx-auto max-w-xl px-5 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="gold" className="text-xs font-bold uppercase tracking-wider">
          Al Hiwar Digital Da&apos;wah &amp; Learning Platform • {copy.badgeSuffix}
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082233]">
          {copy.heading}
        </h1>
        <p className="text-xs sm:text-sm text-[#5F7383]">{copy.subtitle}</p>
      </div>

      {pendingUserId ? (
        <RegisterOtpCard
          isFr={isFr}
          email={email}
          isVerified={isVerified}
          successMsg={successMsg}
          isEmailConfigured={isEmailConfigured}
          emailDeliveryError={emailDeliveryError}
          demoOtpHint={demoOtpHint}
          errorMsg={errorMsg}
          otpInput={otpInput}
          isSubmitting={isSubmitting}
          onOtpChange={setOtpInput}
          onSubmit={handleVerifyOtp}
        />
      ) : (
        <Card className="p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] bg-white shadow-lg space-y-5">
          {errorMsg && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form landmark */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="register-first-name"
                  className="block text-xs font-bold text-[#082233]"
                >
                  {copy.firstNameLabel}
                </label>
                <Input
                  id="register-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={copy.firstNamePh}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="register-surname"
                  className="block text-xs font-bold text-[#082233]"
                >
                  {copy.surnameLabel}
                </label>
                <Input
                  id="register-surname"
                  name="surname"
                  autoComplete="family-name"
                  required
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder={copy.surnamePh}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-email"
                className="block text-xs font-bold text-[#082233]"
              >
                {copy.emailLabel}
              </label>
              <Input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seeker@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-password"
                className="block text-xs font-bold text-[#082233]"
              >
                {copy.pwdLabel}
              </label>
              <Input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={strengthInputClass(password.length > 0, pwEval.level)}
              />
              <PasswordStrengthMeter password={password} lang={preferredLanguage} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="register-confirm-password"
                  className="block text-xs font-bold text-[#082233]"
                >
                  {copy.confirmPwdLabel}
                </label>
                {confirmPassword.length > 0 && (
                  <span
                    className={`text-[11px] font-bold ${
                      passwordsMatch ? 'text-[#0D7A5F]' : 'text-[#DC2626]'
                    }`}
                  >
                    {passwordsMatch ? copy.pwdMatch : copy.pwdMismatch}
                  </span>
                )}
              </div>
              <Input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={confirmInputClass(
                  confirmPassword.length > 0,
                  passwordsMatch
                )}
              />
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label
                  htmlFor="register-dob"
                  className="text-xs font-bold text-[#082233] flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-[#006C9C]" aria-hidden="true" />
                  {copy.dobLabel}
                </label>
                {liveAge >= 0 && (
                  <Badge
                    variant={isUnderage ? 'danger' : 'approved'}
                    className="text-[11px] tabular-nums"
                  >
                    {copy.ageCalc(liveAge)} (
                    {isUnderage ? copy.under18Badge : copy.eligibleBadge})
                  </Badge>
                )}
              </div>
              <Input
                id="register-dob"
                name="dateOfBirth"
                type="date"
                autoComplete="bday"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
              {isUnderage && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="text-xs font-semibold text-red-600 flex items-center gap-1 pt-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  {copy.under18Alert}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-[#082233]">
                {copy.prefLangLabel}
              </span>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: 'en', label: 'English (EN)' },
                    { id: 'fr', label: 'Français (FR)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={preferredLanguage === opt.id}
                    onClick={() => setPreferredLanguage(opt.id)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${
                      preferredLanguage === opt.id
                        ? 'border-[#006C9C] bg-[#006C9C] text-white'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#082233]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full py-3 font-bold gap-2"
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              {isSubmitting ? copy.submitting : copy.submitBtn}
            </Button>
          </form>

          <div className="text-center text-xs text-[#5F7383] pt-2 border-t border-[#E2E8F0]">
            {copy.alreadyReg}
            <Link
              href="/login"
              className="inline-flex items-center min-h-[44px] px-1 font-bold text-[#006C9C] hover:underline"
            >
              {copy.signInLink}
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
