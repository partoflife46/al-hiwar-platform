/**
 * Reusable language toggle and desktop authentication controls for the platform navbar.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/layout/nav-controls.tsx`.
 *
 * Exported symbols:
 * - `LanguageToggle` (Function): language toggle definition.
 * - `DesktopAuthSection` (Function): desktop auth section definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/button`
 * - `./nav-config`
 *
 * @module components/layout/nav-controls
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import type { SupportedLanguage, UserSession } from '@/lib/db/types';
import { buttonVariants } from '@/components/ui/button';
import { ArrowRight, LogOut, User } from 'lucide-react';
import { NAV_COPY } from './nav-config';

/**
 * Type contract defining language toggle props.
 * Includes fields/members: language, setLanguage, compact.
 */
interface LanguageToggleProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  compact?: boolean;
}

/** Renders the EN/FR language toggle buttons in desktop or mobile touch sizing. */
export function LanguageToggle({
  language,
  setLanguage,
  compact = false,
}: LanguageToggleProps) {
  const btnSize = compact ? 'min-h-[44px] min-w-[44px] px-2' : 'px-2 py-1.5';
  const wrapClass = compact
    ? 'flex items-center gap-0.5 rounded-xl bg-slate-100 p-0.5 border border-[#E2E8F0] text-xs font-bold'
    : 'flex items-center gap-0.5 rounded-xl bg-slate-100 p-0.5 border border-[#E2E8F0] text-[11px] font-bold mx-1';
  const activeStyle = 'bg-[#006C9C] text-white shadow-sm';
  const idleStyle = 'text-[#4B5E6D] hover:text-[#082233]';

  return (
    <div className={wrapClass}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={`${btnSize} rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${
          language === 'en' ? activeStyle : idleStyle
        }`}
        title="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        aria-pressed={language === 'fr'}
        className={`${btnSize} rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${
          language === 'fr' ? activeStyle : idleStyle
        }`}
        title="Passer en français"
      >
        FR
      </button>
    </div>
  );
}

/**
 * Type contract defining desktop auth section props.
 * Includes fields/members: isAuthenticated, language, currentUser, workspaceHref,
 * workspaceLabel, roleLabel.
 */
interface DesktopAuthSectionProps {
  /** is authenticated property. */
  isAuthenticated: boolean;
  /** language property. */
  language: SupportedLanguage;
  /** current user property. */
  currentUser: UserSession | null;
  /** workspace href property. */
  workspaceHref: string;
  /** workspace label property. */
  workspaceLabel: string;
  /** role label property. */
  roleLabel: string;
  /** on logout property. */
  onLogout: () => void;
}

/** Renders authenticated workspace/profile/logout controls or guest login/register links. */
export function DesktopAuthSection({
  isAuthenticated,
  language,
  currentUser,
  workspaceHref,
  workspaceLabel,
  roleLabel,
  onLogout,
}: DesktopAuthSectionProps) {
  const copy = NAV_COPY[language];

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-1.5 pl-2 border-l border-[#E2E8F0]">
        <Link
          href="/login"
          className="rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#082233] hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
        >
          {copy.login}
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-[#006C9C] px-3.5 py-2 text-white hover:bg-[#005072] transition-colors shadow-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
        >
          {copy.register}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pl-2 border-l border-[#E2E8F0]">
      <Link
        href={workspaceHref}
        className={buttonVariants({
          variant: 'primary',
          size: 'sm',
          className: 'gap-1.5 text-xs font-bold py-1 h-9 min-h-0 shadow-sm',
        })}
      >
        <span>{workspaceLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </Link>
      <Link
        href="/profile"
        title={copy.manageProfileTitle}
        className={buttonVariants({
          variant: 'outline',
          size: 'sm',
          className:
            'gap-1 text-xs font-semibold py-1 h-9 min-h-0 border-[#CBD5E1] text-[#082233] hover:bg-slate-100',
        })}
      >
        <User className="w-3.5 h-3.5 text-[#006C9C]" aria-hidden="true" />
        <span>{copy.manageProfile}</span>
      </Link>
      <div className="hidden lg:flex flex-col text-right">
        <span className="text-[11px] font-bold text-[#082233] leading-none">
          {currentUser?.firstName} {currentUser?.surname}
        </span>
        <span className="text-[11px] text-[#006C9C] font-semibold">{roleLabel}</span>
      </div>
      <button
        type="button"
        onClick={onLogout}
        title={copy.logout}
        className="p-2 rounded-lg text-[#5F7383] hover:text-red-600 hover:bg-red-50 transition-colors ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        aria-label={copy.logout}
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
