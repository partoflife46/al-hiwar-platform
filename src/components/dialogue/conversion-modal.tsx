/**
 * Non-dismissible post-Shahadah demographic profile modal unlocking the Islamic Academy.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/dialogue/conversion-modal.tsx`.
 *
 * Exported symbols:
 * - `ConversionModalProps` (Interface): conversion modal props definition.
 * - `ConversionModal` (Function): conversion modal definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/context/language-context`
 * - `@/lib/constants/countries`
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 * - `./conversion-copy`
 *
 * @module components/dialogue/conversion-modal
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { Gender } from '@/lib/db/types';
import { useLanguage } from '@/lib/context/language-context';
import {
  COUNTRIES,
  COUNTRY_OPTIONS,
  applyCountryDialCode,
  getDialCodeForCountry,
} from '@/lib/constants/countries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe,
  Phone,
  Sparkles,
  User,
} from 'lucide-react';
import {
  CONVERSION_COPY,
  validateConversionFields,
} from './conversion-copy';

/**
 * Type contract defining conversion modal props.
 * Includes fields/members: isOpen, seekerId, seekerName, initialNationality, initialGender,
 * initialPhoneNumber.
 */
export interface ConversionModalProps {
  /** is open property. */
  isOpen: boolean;
  /** seeker id property. */
  seekerId: string;
  /** seeker name property. */
  seekerName: string;
  /** Optional initial nationality property. */
  initialNationality?: string | null;
  /** Optional initial gender property. */
  initialGender?: Gender | null;
  /** Optional initial phone number property. */
  initialPhoneNumber?: string | null;
  /** on submit profile property. */
  onSubmitProfile: (profile: {
    nationality: string;
    gender: Gender;
    phoneNumber: string;
  }) => Promise<void>;
  /** Optional on navigate to academy property. */
  onNavigateToAcademy?: () => void;
}

/** Prevents closing the mandatory onboarding dialog with the Escape key. */
function useBlockEscape(isOpen: boolean) {
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (!isOpen) return;
    /**
     * Executes on key down logic.
     * @param e - E value (`KeyboardEvent`).
     */
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);
}

/** Displays the post-enrollment celebration view with direct Academy entry CTA. */
function ConversionSuccessBody({
  isFr,
  onEnterAcademy,
}: {
  isFr: boolean;
  onEnterAcademy: () => void;
}) {
  const copy = CONVERSION_COPY[isFr ? 'fr' : 'en'];
  return (
    <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-200">
      <div className="mx-auto w-16 h-16 rounded-full bg-[#0D7A5F]/10 text-[#0D7A5F] flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-[#082233]">
          {copy.enrolledHeading}
        </h3>
        <p className="text-xs text-[#5F7383] max-w-sm mx-auto">
          {copy.enrolledDesc}
        </p>
      </div>
      <div className="p-4 rounded-2xl bg-[#006C9C]/5 border border-[#006C9C]/20 flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-[#006C9C]" />
          <div>
            <h4 className="text-xs font-bold text-[#082233]">
              {copy.module1Title}
            </h4>
            <p className="text-[11px] text-[#5F7383]">{copy.module1Sub}</p>
          </div>
        </div>
        <Badge variant="approved">{copy.unlockedBadge}</Badge>
      </div>
      <Button
        type="button"
        variant="primary"
        onClick={onEnterAcademy}
        className="w-full py-3.5 text-sm font-bold shadow-md gap-2"
      >
        {copy.enterAcademyBtn}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

/** Renders the mandatory New Muslim onboarding modal after Shahadah validation. */
export function ConversionModal({
  isOpen,
  seekerName,
  initialNationality = '',
  initialGender = null,
  initialPhoneNumber = '',
  onSubmitProfile,
  onNavigateToAcademy,
}: ConversionModalProps) {
  const { isFr } = useLanguage();
  const copy = CONVERSION_COPY[isFr ? 'fr' : 'en'];

  const [nationality, setNationality] = React.useState(initialNationality || '');
  const [gender, setGender] = React.useState<Gender | null>(initialGender);
  const [phoneNumber, setPhoneNumber] = React.useState(initialPhoneNumber || '');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (initialNationality) setNationality(initialNationality);
  }, [initialNationality]);
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (initialGender) setGender(initialGender);
  }, [initialGender]);
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (initialPhoneNumber) setPhoneNumber(initialPhoneNumber);
  }, [initialPhoneNumber]);

  useBlockEscape(isOpen);
  if (!isOpen) return null;

  /**
   * Asynchronously executes handle submit logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateConversionFields(nationality, gender, phoneNumber, isFr);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitProfile({
        nationality: nationality.trim(),
        gender: gender!,
        phoneNumber: phoneNumber.trim(),
      });
      setIsCompleted(true);
    } catch (err: any) {
      setErrors({ form: err?.message || copy.errSubmit });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Handles handle academy click interaction. */
  const handleAcademyClick = () => {
    if (onNavigateToAcademy) onNavigateToAcademy();
    else window.location.href = '/academy';
  };

  /** Handles input border interaction. */
  const inputBorder = (hasErr?: string) =>
    hasErr
      ? 'border-red-500 focus:ring-red-500'
      : 'border-[#CBD5E1] focus:ring-[#006C9C]';

  /** Handles gender card class interaction. */
  const genderCardClass = (selected: boolean) =>
    selected
      ? 'border-2 border-[#006C9C] bg-[#006C9C]/10 text-[#006C9C] font-bold shadow-sm'
      : 'border-[#CBD5E1] bg-white text-[#5F7383] hover:border-[#006C9C]/50';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversion-modal-title"
      className="fixed inset-0 z-50 !m-0 flex items-start sm:items-center justify-center p-4 overflow-y-auto overscroll-contain backdrop-blur-sm bg-[#082233]/80 animate-in fade-in duration-200 ease-out"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border-2 border-[#BC9C5C] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 ease-out">
        <div className="h-2 w-full bg-gradient-to-r from-[#BC9C5C] via-[#D8BC7C] to-[#006C9C]" />

        <div className="bg-gradient-to-b from-[#F8FAFC] to-white p-6 sm:p-8 text-center space-y-4 border-b border-[#E2E8F0]">
          <div className="space-y-1">
            <p
              className="text-2xl sm:text-3xl font-serif text-[#8C6D32] tracking-wide"
              dir="rtl"
              lang="ar"
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-xs font-semibold italic text-[#8C6D32]">
              “Bismillāhir-Raḥmānir-Raḥīm”
            </p>
            <p className="text-[11px] text-[#5F7383]">{copy.basmalahTrans}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BC9C5C]/15 text-[#8C6D32] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#BC9C5C]" />
            {copy.witnessBadge}
          </div>

          <h2
            id="conversion-modal-title"
            className="text-2xl sm:text-3xl font-extrabold text-[#082233] break-words text-pretty"
          >
            {copy.welcomeHeading(seekerName)}
          </h2>
          <p className="text-xs sm:text-sm text-[#5F7383] max-w-md mx-auto leading-relaxed">
            {copy.welcomeBody}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {isCompleted ? (
            <ConversionSuccessBody isFr={isFr} onEnterAcademy={handleAcademyClick} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#082233]">
                  {copy.formHeading}
                </h3>
                <p className="text-xs text-[#5F7383]">{copy.formDesc}</p>
              </div>

              {errors.form && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="nationality"
                  className="block text-xs font-bold text-[#082233]"
                >
                  {copy.nationalityLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-[#5F7383] absolute left-3 top-3 pointer-events-none" />
                  <select
                    id="nationality"
                    name="nationality"
                    autoComplete="country-name"
                    value={nationality}
                    onChange={(e) => {
                      const nextCountry = e.target.value;
                      setNationality(nextCountry);
                      setPhoneNumber((prev) =>
                        applyCountryDialCode(nextCountry, prev, nationality)
                      );
                    }}
                    className={`w-full min-h-[44px] rounded-xl border bg-white pl-9 pr-3 py-2.5 text-base sm:text-xs text-[#082233] outline-transparent focus-visible:outline-none focus:ring-2 ${inputBorder(
                      errors.nationality
                    )}`}
                  >
                    <option value="">-- Select Country --</option>
                    {nationality && !COUNTRIES.includes(nationality) && (
                      <option value={nationality}>{nationality}</option>
                    )}
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.nationality && (
                  <p className="text-[11px] text-red-600">{errors.nationality}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#082233]">
                  {copy.genderLabel} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { value: 'MALE', label: copy.maleOption },
                      { value: 'FEMALE', label: copy.femaleOption },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={gender === opt.value}
                      onClick={() => setGender(opt.value)}
                      className={`p-3.5 rounded-xl border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] flex flex-col items-center justify-center gap-1.5 ${genderCardClass(
                        gender === opt.value
                      )}`}
                    >
                      <User className="w-5 h-5" aria-hidden="true" />
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <p className="text-[11px] text-red-600">{errors.gender}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="phoneNumber"
                  className="block text-xs font-bold text-[#082233]"
                >
                  {copy.phoneLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#5F7383] absolute left-3 top-3" />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={`e.g. ${getDialCodeForCountry(nationality) || '+33'} 6 12 34 56 78`}
                    className={`w-full min-h-[44px] rounded-xl border bg-white pl-9 pr-3 py-2.5 text-base sm:text-xs text-[#082233] outline-transparent focus-visible:outline-none focus:ring-2 ${inputBorder(
                      errors.phoneNumber
                    )}`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p
                    role="alert"
                    aria-live="polite"
                    className="text-[11px] text-red-600"
                  >
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="accent"
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-bold shadow-md gap-2"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                {isSubmitting ? copy.enrollingBtn : copy.submitBtn}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
