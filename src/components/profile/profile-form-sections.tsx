/**
 * Modular form fieldsets for the authenticated user profile page:
 * nationality/gender/phone demographics and optional password change panel.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/profile/profile-form-sections.tsx`.
 *
 * Exported symbols:
 * - `ProfileDemographicsFieldsProps` (Interface): profile demographics fields props
 *   definition.
 * - `ProfileDemographicsFields` (Function): profile demographics fields definition.
 * - `ProfilePasswordSectionProps` (Interface): profile password section props definition.
 * - `ProfilePasswordSection` (Function): profile password section definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/constants/countries`
 * - `@/components/ui/input`
 * - `@/components/ui/password-strength-meter`
 * - `./profile-copy`
 *
 * @module components/profile/profile-form-sections
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { Gender, SupportedLanguage } from '@/lib/db/types';
import {
  COUNTRIES,
  COUNTRY_OPTIONS,
  applyCountryDialCode,
  getDialCodeForCountry,
} from '@/lib/constants/countries';
import { Input } from '@/components/ui/input';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { Globe, Lock, Phone } from 'lucide-react';
import { PROFILE_COPY } from './profile-copy';

/** Props for the nationality, gender, and phone number fieldset. */
export interface ProfileDemographicsFieldsProps {
  /** is fr property. */
  isFr: boolean;
  /** nationality property. */
  nationality: string;
  /** set nationality property. */
  setNationality: React.Dispatch<React.SetStateAction<string>>;
  /** gender property. */
  gender: Gender | string;
  /** set gender property. */
  setGender: React.Dispatch<React.SetStateAction<Gender>>;
  /** phone number property. */
  phoneNumber: string;
  /** set phone number property. */
  setPhoneNumber: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Renders the 3-column nationality selector (with automatic dial-code sync),
 * gender selector, and telephone input for the profile form.
 * @param props - Controlled demographic field values and state setters.
 * @returns Responsive 3-column demographic fieldset element.
 */
export function ProfileDemographicsFields({
  isFr,
  nationality,
  setNationality,
  gender,
  setGender,
  phoneNumber,
  setPhoneNumber,
}: ProfileDemographicsFieldsProps) {
  const copy = PROFILE_COPY[isFr ? 'fr' : 'en'];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="space-y-1.5">
        <label
          htmlFor="profile-nationality"
          className="text-xs font-bold text-[#082233] flex items-center gap-1.5"
        >
          <Globe className="w-3.5 h-3.5 text-[#006C9C]" aria-hidden="true" />
          <span>{copy.nationalityLabel}</span>
        </label>
        <select
          id="profile-nationality"
          name="nationality"
          autoComplete="country-name"
          value={nationality}
          onChange={(e) => {
            const nextCountry = e.target.value;
            setNationality(nextCountry);
            setPhoneNumber((prevPhone) =>
              applyCountryDialCode(nextCountry, prevPhone, nationality)
            );
          }}
          className="w-full h-[44px] sm:h-9 rounded-md border border-[#CBD5E1] bg-white text-[#082233] px-3 py-1 text-base sm:text-xs shadow-sm outline-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
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

      <div className="space-y-1.5">
        <label
          htmlFor="profile-gender"
          className="block text-xs font-bold text-[#082233]"
        >
          {copy.genderLabel}
        </label>
        <select
          id="profile-gender"
          name="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          className="w-full h-[44px] sm:h-9 rounded-md border border-[#CBD5E1] bg-white text-[#082233] px-3 py-1 text-base sm:text-xs shadow-sm outline-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
        >
          <option value="MALE">{copy.male}</option>
          <option value="FEMALE">{copy.female}</option>
          <option value="PREFER_NOT_TO_SAY">{copy.preferNot}</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="profile-phone"
          className="text-xs font-bold text-[#082233] flex items-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5 text-[#006C9C]" aria-hidden="true" />
          <span>{copy.phoneLabel}</span>
        </label>
        <Input
          id="profile-phone"
          name="phoneNumber"
          type="tel"
          autoComplete="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={`${getDialCodeForCountry(nationality) || '+33'} 612345678`}
          className="text-base sm:text-xs"
        />
      </div>
    </div>
  );
}

/** Props for the optional new-password and confirmation card on `/profile`. */
export interface ProfilePasswordSectionProps {
  /** is fr property. */
  isFr: boolean;
  /** language property. */
  language: SupportedLanguage;
  /** new password property. */
  newPassword: string;
  /** set new password property. */
  setNewPassword: React.Dispatch<React.SetStateAction<string>>;
  /** confirm password property. */
  confirmPassword: string;
  /** set confirm password property. */
  setConfirmPassword: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Renders the optional password update card with live strength evaluation meter.
 * @param props - Language settings and controlled password input state.
 * @returns Password update panel element.
 */
export function ProfilePasswordSection({
  isFr,
  language,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
}: ProfilePasswordSectionProps) {
  const copy = PROFILE_COPY[isFr ? 'fr' : 'en'];

  return (
    <div className="rounded-2xl border border-[#E2E8F0] p-4 space-y-3 bg-white">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-[#8A672B]" aria-hidden="true" />
        <h3 className="text-xs font-bold text-[#082233]">{copy.changePwdHeading}</h3>
      </div>
      <p className="text-[11px] text-[#5F7383]">{copy.changePwdDesc}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1">
          <label
            htmlFor="profile-new-password"
            className="block text-[11px] font-semibold text-[#082233]"
          >
            {copy.newPwdLabel}
          </label>
          <Input
            id="profile-new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="text-base sm:text-xs"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="profile-confirm-password"
            className="block text-[11px] font-semibold text-[#082233]"
          >
            {copy.confirmPwdLabel}
          </label>
          <Input
            id="profile-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="text-base sm:text-xs"
          />
        </div>
      </div>
      {newPassword && (
        <PasswordStrengthMeter password={newPassword} lang={language} className="mt-2" />
      )}
    </div>
  );
}
