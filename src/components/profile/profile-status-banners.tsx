/**
 * Contextual Shahadah progression, Academy enrollment, and feedback banners for the profile page.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/profile/profile-status-banners.tsx`.
 *
 * Exported symbols:
 * - `ProfileStatusBanners` (Function): profile status banners definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/button`
 * - `./profile-copy`
 *
 * @module components/profile/profile-status-banners
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import type { UserRole } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PROFILE_COPY } from './profile-copy';

/**
 * Type contract defining profile status banners props.
 * Includes fields/members: isFr, role, hasValidatedShahadah, successMsg, errorMsg.
 */
interface ProfileStatusBannersProps {
  /** is fr property. */
  isFr: boolean;
  /** Optional role property. */
  role?: UserRole;
  /** Optional has validated shahadah property. */
  hasValidatedShahadah?: boolean;
  /** success msg property. */
  successMsg: string | null;
  /** error msg property. */
  errorMsg: string | null;
}

/** Displays post-Shahadah prompts, active Academy links, and save feedback alerts. */
export function ProfileStatusBanners({
  isFr,
  role,
  hasValidatedShahadah,
  successMsg,
  errorMsg,
}: ProfileStatusBannersProps) {
  const copy = PROFILE_COPY[isFr ? 'fr' : 'en'];

  return (
    <>
      {hasValidatedShahadah && role === 'NON_MUSLIM' && (
        <div className="rounded-2xl border-2 border-[#BC9C5C] bg-gradient-to-r from-[#BC9C5C]/15 to-[#006C9C]/10 p-4 text-xs text-[#082233] flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#8A672B] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold text-sm">
              {copy.shahadahBannerTitle}
            </div>
            <p className="text-[#5F7383]">{copy.shahadahBannerDesc}</p>
          </div>
        </div>
      )}

      {role === 'NEW_MUSLIM' && (
        <div className="rounded-2xl border border-[#0D7A5F]/40 bg-[#0D7A5F]/10 p-4 text-xs text-[#082233] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#0D7A5F] shrink-0" />
            <span className="font-bold">{copy.academyActive}</span>
          </div>
          <Link href="/academy">
            <Button
              type="button"
              variant="accent"
              size="sm"
              className="text-xs font-bold"
            >
              {copy.enterAcademyBtn}
            </Button>
          </Link>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-xs text-green-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}
    </>
  );
}
