/**
 * Collapsible mobile navigation drawer for role-aware links and account actions.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/layout/mobile-nav-drawer.tsx`.
 *
 * Exported symbols:
 * - `MobileNavDrawer` (Function): mobile nav drawer definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/button`
 * - `./nav-config`
 *
 * @module components/layout/mobile-nav-drawer
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import type { SupportedLanguage, UserRole, UserSession } from '@/lib/db/types';
import { buttonVariants } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  LogOut,
  MessageSquare,
  ShieldCheck,
  User,
} from 'lucide-react';
import { DIALOGUE_NAV_ROLES, NAV_COPY } from './nav-config';

/**
 * Type contract defining mobile nav drawer props.
 */
interface MobileNavDrawerProps {
  /** pathname property. */
  pathname: string;
  /** language property. */
  language: SupportedLanguage;
  /** active role property. */
  activeRole: UserRole;
  /** is staff property. */
  isStaff: boolean;
  /** is authenticated property. */
  isAuthenticated: boolean;
  /** current user property. */
  currentUser: UserSession | null;
  /** workspace href property. */
  workspaceHref: string;
  /** workspace label property. */
  workspaceLabel: string;
  /** role label property. */
  roleLabel: string;
  /** on close property. */
  onClose: () => void;
  /** on logout property. */
  onLogout: () => void;
}

/** Builds active/inactive utility classes for standard mobile nav links. */
function mobileLinkClass(active: boolean): string {
  const base = 'min-h-[44px] rounded-xl px-3.5 flex items-center gap-2 transition-colors';
  return `${base} ${
    active ? 'bg-[#006C9C]/10 text-[#006C9C] font-bold' : 'text-[#082233] hover:bg-slate-100'
  }`;
}

/** Builds active/inactive utility classes for gold-accent mobile nav links. */
function mobileGoldClass(active: boolean, idleExtra: string): string {
  const base = 'min-h-[44px] rounded-xl px-3.5 flex items-center gap-2 transition-colors';
  return `${base} ${active ? 'bg-[#BC9C5C] text-[#082233] font-bold' : idleExtra}`;
}

/** Renders the responsive mobile navigation menu with role-based routes and auth controls. */
export function MobileNavDrawer({
  pathname,
  language,
  activeRole,
  isStaff,
  isAuthenticated,
  currentUser,
  workspaceHref,
  workspaceLabel,
  roleLabel,
  onClose,
  onLogout,
}: MobileNavDrawerProps) {
  const copy = NAV_COPY[language];
  const showDialogue = DIALOGUE_NAV_ROLES.has(activeRole);

  return (
    <div
      id="mobile-primary-nav"
      className="md:hidden border-t border-[#E2E8F0] bg-white px-4 py-3 space-y-2 shadow-lg max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
    >
      <div className="grid grid-cols-1 gap-1.5 text-sm font-semibold">
        <Link href="/" onClick={onClose} className={mobileLinkClass(pathname === '/')}>
          {copy.home}
        </Link>
        <Link
          href="/resources"
          onClick={onClose}
          className={mobileLinkClass(pathname.startsWith('/resources'))}
        >
          <BookOpen className="w-4 h-4 text-[#006C9C]" />
          {copy.library}
        </Link>
        {showDialogue && (
          <Link
            href="/dialogue"
            onClick={onClose}
            className={mobileLinkClass(pathname.startsWith('/dialogue'))}
          >
            <MessageSquare className="w-4 h-4 text-[#006C9C]" />
            {copy.dialogue}
          </Link>
        )}
        {activeRole === 'NEW_MUSLIM' && (
          <Link
            href="/academy"
            onClick={onClose}
            className={mobileGoldClass(
              pathname.startsWith('/academy'),
              'text-[#735724] bg-[#BC9C5C]/15'
            )}
          >
            <GraduationCap className="w-4 h-4" />
            {copy.academy}
          </Link>
        )}
        {isStaff && (
          <Link
            href="/staff"
            onClick={onClose}
            className={mobileGoldClass(
              pathname.startsWith('/staff'),
              'text-[#7A5E2A] bg-[#BC9C5C]/20 font-semibold'
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            {copy.staff}
          </Link>
        )}
      </div>

      <div className="pt-2 border-t border-[#E2E8F0]">
        {isAuthenticated ? (
          <div className="space-y-2">
            <div className="px-1 flex items-center justify-between text-xs">
              <span className="font-bold text-[#082233]">
                {currentUser?.firstName} {currentUser?.surname}
              </span>
              <span className="text-[#006C9C] font-semibold">{roleLabel}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Link
                href={workspaceHref}
                onClick={onClose}
                className={buttonVariants({
                  variant: 'primary',
                  className: 'w-full justify-center font-bold',
                })}
              >
                <span>{workspaceLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/profile"
                  onClick={onClose}
                  className={buttonVariants({
                    variant: 'outline',
                    className: 'w-full justify-center text-xs text-[#082233]',
                  })}
                >
                  <User className="w-4 h-4 text-[#006C9C]" />
                  <span>{copy.profileShort}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className={buttonVariants({
                    variant: 'outline',
                    className:
                      'w-full justify-center text-xs text-red-700 border-red-200 hover:bg-red-50',
                  })}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{copy.logoutShort}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={onClose}
              className={buttonVariants({
                variant: 'outline',
                className: 'w-full justify-center text-sm text-[#082233]',
              })}
            >
              {copy.login}
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className={buttonVariants({
                variant: 'primary',
                className: 'w-full justify-center text-sm font-bold',
              })}
            >
              {copy.register}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
