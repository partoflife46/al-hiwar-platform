/**
 * 6-digit email OTP verification card displayed after seeker registration.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/auth/register-otp-card.tsx`.
 *
 * Exported symbols:
 * - `RegisterOtpCard` (Function): register otp card definition.
 *
 * Internal dependencies:
 * - `@/components/ui/card`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `./register-copy`
 *
 * @module components/auth/register-otp-card
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { REGISTER_COPY } from './register-copy';

/**
 * Type contract defining register otp card props.
 */
interface RegisterOtpCardProps {
  /** is fr property. */
  isFr: boolean;
  /** email property. */
  email: string;
  /** is verified property. */
  isVerified: boolean;
  /** success msg property. */
  successMsg: string | null;
  /** is email configured property. */
  isEmailConfigured: boolean;
  /** email delivery error property. */
  emailDeliveryError: string | null;
  /** demo otp hint property. */
  demoOtpHint: string | null;
  /** error msg property. */
  errorMsg: string | null;
  /** otp input property. */
  otpInput: string;
  /** is submitting property. */
  isSubmitting: boolean;
  /** on otp change property. */
  onOtpChange: (value: string) => void;
  /** on submit property. */
  onSubmit: (e: React.FormEvent) => void;
}

/** Renders the delivery status callout for the OTP verification step. */
function OtpDeliveryNotice({
  isFr,
  email,
  isEmailConfigured,
  emailDeliveryError,
}: {
  isFr: boolean;
  email: string;
  isEmailConfigured: boolean;
  emailDeliveryError: string | null;
}) {
  const copy = REGISTER_COPY[isFr ? 'fr' : 'en'];

  if (!isEmailConfigured) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-2 text-xs text-amber-950">
        <div className="font-bold flex items-center gap-2 text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span>{copy.mailNotConfiguredTitle}</span>
        </div>
        <p className="text-amber-900 leading-relaxed">{copy.mailNotConfiguredBody}</p>
      </div>
    );
  }

  if (emailDeliveryError) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-1.5 text-xs text-amber-950">
        <div className="font-bold flex items-center gap-2 text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span>{copy.providerNotice}</span>
        </div>
        <p className="text-amber-900 leading-relaxed font-mono text-[11px]">
          {emailDeliveryError}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-1.5 text-xs text-blue-900">
      <div className="font-bold flex items-center gap-2 text-sm text-[#006C9C]">
        <Mail className="w-4 h-4" aria-hidden="true" />
        <span>{copy.codeSentTitle}</span>
      </div>
      <p className="text-[#334155] leading-relaxed">
        {copy.codeSentPrefix}
        <strong className="text-[#082233]">{email}</strong>.{copy.codeSentSuffix}
      </p>
    </div>
  );
}

/** Renders the 6-digit OTP verification card and post-verification success banner. */
export function RegisterOtpCard(props: RegisterOtpCardProps) {
  const {
    isFr,
    email,
    isVerified,
    successMsg,
    isEmailConfigured,
    emailDeliveryError,
    demoOtpHint,
    errorMsg,
    otpInput,
    isSubmitting,
    onOtpChange,
    onSubmit,
  } = props;
  const copy = REGISTER_COPY[isFr ? 'fr' : 'en'];

  return (
    <Card className="p-6 sm:p-8 rounded-3xl border-2 border-[#BC9C5C] bg-white shadow-xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006C9C] text-white">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#082233]">{copy.otpHeading}</h2>
          <p className="text-xs text-[#5F7383]">
            {copy.sentTo}
            <span className="font-semibold text-[#082233]">{email}</span>
          </p>
        </div>
      </div>

      {isVerified ? (
        <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/90 p-6 text-center space-y-3 animate-in fade-in duration-300">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-emerald-950">{copy.verifiedTitle}</h3>
          <p className="text-xs text-emerald-800">
            {successMsg || copy.verifiedFallback(email)}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#006C9C] pt-2">
            <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>{copy.redirecting}</span>
          </div>
        </div>
      ) : (
        <>
          <OtpDeliveryNotice
            isFr={isFr}
            email={email}
            isEmailConfigured={isEmailConfigured}
            emailDeliveryError={emailDeliveryError}
          />

          {demoOtpHint && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950 flex items-center justify-between">
              <span>
                {copy.devPasscodeLabel}
                <strong className="font-mono text-sm tracking-widest text-emerald-800">
                  {demoOtpHint}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => onOtpChange(demoOtpHint)}
                className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
              >
                {copy.autoFill}
              </button>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="register-otp"
                className="block text-xs font-bold text-[#082233]"
              >
                {copy.enterOtpLabel}
              </label>
              <Input
                id="register-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                spellCheck={false}
                pattern="[0-9]*"
                required
                maxLength={6}
                value={otpInput}
                onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="text-center font-mono text-2xl tracking-widest font-bold"
              />
            </div>

            <Button
              type="submit"
              variant="accent"
              disabled={isSubmitting || otpInput.length < 6}
              className="w-full py-3 font-bold gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {copy.verifyBtn}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}
