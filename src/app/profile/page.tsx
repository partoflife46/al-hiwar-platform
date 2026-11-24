/**
 * Authenticated user profile management page allowing updates to personal
 * identity, preferred language, 18+ verified date of birth, demographics, and password.
 */

'use client';

/**
 * Module architecture and API reference for `src/app/profile/page.tsx`.
 *
 * Exported symbols:
 * - `ProfilePage` (Function): profile page definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-profile-page`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `@/components/profile/profile-copy`
 * - `@/components/profile/profile-status-banners`
 * - `@/components/profile/profile-form-sections`
 *
 * @module app/profile/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import { useProfilePage } from '@/hooks/use-profile-page';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, Mail, RefreshCw, Save } from 'lucide-react';
import { PROFILE_COPY, PROFILE_ROLE_META } from '@/components/profile/profile-copy';
import { ProfileStatusBanners } from '@/components/profile/profile-status-banners';
import {
  ProfileDemographicsFields,
  ProfilePasswordSection,
} from '@/components/profile/profile-form-sections';

/**
 * Renders the authenticated account profile form with 18+ age verification
 * and optional password rotation.
 * @returns Profile management page JSX.
 */
export default function ProfilePage() {
  const {
    language,
    isFr,
    profile,
    firstName,
    setFirstName,
    surname,
    setSurname,
    profilePreferredLanguage,
    setProfilePreferredLanguage,
    dateOfBirth,
    setDateOfBirth,
    nationality,
    setNationality,
    gender,
    setGender,
    phoneNumber,
    setPhoneNumber,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    isSaving,
    successMsg,
    errorMsg,
    liveAge,
    isUnderage,
    handleSubmit,
  } = useProfilePage();

  const copy = PROFILE_COPY[isFr ? 'fr' : 'en'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="flex items-center gap-2 text-sm text-[#5F7383]"
          role="status"
          aria-live="polite"
        >
          <RefreshCw className="w-4 h-4 animate-spin text-[#006C9C]" aria-hidden="true" />
          <span>{copy.loading}</span>
        </div>
      </div>
    );
  }

  const currentRoleInfo = profile ? PROFILE_ROLE_META[profile.role] : null;
  const backHref =
    profile?.role === 'NON_MUSLIM' || profile?.role === 'DIALOGIST' ? '/dialogue' : '/';

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'gap-1.5 text-xs text-[#5F7383] hover:text-[#082233]',
          })}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{copy.back}</span>
        </Link>
      </div>

      <Card className="rounded-3xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#006C9C]/10 text-[#006C9C] flex items-center justify-center font-extrabold text-xl shadow-inner">
              {firstName.slice(0, 1) || 'U'}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#082233]">
                {copy.heading}
              </h1>
              <p className="text-xs text-[#5F7383] mt-0.5">{copy.subtitle}</p>
            </div>
          </div>
          {currentRoleInfo && (
            <Badge
              variant="default"
              className={`text-xs px-3 py-1 font-semibold ${currentRoleInfo.color}`}
            >
              {isFr ? currentRoleInfo.fr : currentRoleInfo.en}
            </Badge>
          )}
        </div>

        <ProfileStatusBanners
          isFr={isFr}
          role={profile?.role}
          hasValidatedShahadah={profile?.hasValidatedShahadah}
          successMsg={successMsg}
          errorMsg={errorMsg}
        />

        {/* Form landmark */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label
              htmlFor="profile-email"
              className="text-xs font-bold text-[#082233] flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-[#006C9C]" aria-hidden="true" />
              <span>{copy.emailVerified}</span>
            </label>
            <Input
              id="profile-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              disabled
              value={profile?.email || ''}
              className="bg-slate-100 text-[#082233]/85 border-[#CBD5E1] cursor-not-allowed text-base sm:text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="profile-first-name"
                className="block text-xs font-bold text-[#082233]"
              >
                {copy.firstNameReq}
              </label>
              <Input
                id="profile-first-name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={copy.firstNamePh}
                className="text-base sm:text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="profile-surname"
                className="block text-xs font-bold text-[#082233]"
              >
                {copy.surnameReq}
              </label>
              <Input
                id="profile-surname"
                name="surname"
                type="text"
                autoComplete="family-name"
                required
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder={copy.surnamePh}
                className="text-base sm:text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-bold text-[#082233]">{copy.prefLangLabel}</span>
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
                  aria-pressed={profilePreferredLanguage === opt.id}
                  onClick={() => setProfilePreferredLanguage(opt.id)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${
                    profilePreferredLanguage === opt.id
                      ? 'border-[#006C9C] bg-[#006C9C] text-white'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#082233]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label
                htmlFor="profile-dob"
                className="text-xs font-bold text-[#082233] flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-[#006C9C]" aria-hidden="true" />
                <span>{copy.dobLabel}</span>
              </label>
              {liveAge >= 0 && (
                <Badge
                  variant={isUnderage ? 'danger' : 'approved'}
                  className="text-[11px] tabular-nums"
                >
                  {liveAge} {copy.yearsUnit}
                </Badge>
              )}
            </div>
            <Input
              id="profile-dob"
              name="dateOfBirth"
              type="date"
              autoComplete="bday"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="bg-white text-base sm:text-xs"
            />
            {isUnderage && (
              <p
                role="alert"
                aria-live="polite"
                className="text-[11px] text-red-600 font-semibold"
              >
                {copy.under18Alert}
              </p>
            )}
          </div>

          <ProfileDemographicsFields
            isFr={isFr}
            nationality={nationality}
            setNationality={setNationality}
            gender={gender}
            setGender={setGender}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
          />

          <ProfilePasswordSection
            isFr={isFr}
            language={language}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving || isUnderage}
              className="gap-2 font-bold px-6 py-2.5 shadow-sm"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{copy.saving}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" aria-hidden="true" />
                  <span>{copy.saveChanges}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
