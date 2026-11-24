/**
 * Primary institutional navigation bar with role-based workspace links and language switcher.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/layout/platform-nav.tsx`.
 *
 * Exported symbols:
 * - `PlatformNav` (Function): platform nav definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/brand-pattern`
 * - `@/lib/context/language-context`
 * - `./nav-config`
 * - `./nav-controls`
 * - `./mobile-nav-drawer`
 *
 * @module components/layout/platform-nav
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { UserRole, UserSession } from '@/lib/db/types';
import { BrandPatternMark } from '@/components/ui/brand-pattern';
import { GraduationCap, Menu, MessageSquare, ShieldCheck, X } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import {
  DIALOGUE_NAV_ROLES,
  getLocalizedRoleMeta,
  NAV_COPY,
  STAFF_NAV_ROLES,
} from './nav-config';
import { DesktopAuthSection, LanguageToggle } from './nav-controls';
import { MobileNavDrawer } from './mobile-nav-drawer';

/**
 * Constant definition for visitor fallback.
 */
const VISITOR_FALLBACK: UserSession = {
  userId: 'visitor',
  email: 'visitor@example.com',
  firstName: 'Visitor',
  surname: 'Guest',
  role: 'VISITOR',
  preferredLanguage: 'en',
  token: '',
};

/** Computes desktop nav link styling for standard links. */
function desktopLinkClass(active: boolean): string {
  const base =
    'rounded-lg px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]';
  return `${base} ${
    active
      ? 'bg-[#006C9C]/10 text-[#006C9C] font-bold'
      : 'text-[#082233] hover:bg-[#006C9C]/10 hover:text-[#006C9C]'
  }`;
}

/** Computes desktop nav link styling for gold-accented workspace links. */
function desktopGoldClass(active: boolean, idleClass: string): string {
  const base =
    'rounded-lg px-3 py-2 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]';
  return `${base} ${active ? 'bg-[#BC9C5C] text-[#082233] font-bold shadow-sm' : idleClass}`;
}

/** Renders the sticky Al Hiwar header navigation across desktop and mobile viewports. */
export function PlatformNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, isFr } = useLanguage();
  const copy = NAV_COPY[language];
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => setMobileMenuOpen(false), [pathname]);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    /** Handles on key down interaction. */
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  /**
   * Memoized handler/selector for fetch session.
   */
  const fetchSession = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setCurrentUser(json.data);
      }
    } catch {
      // ignore offline session check
    }
  }, []);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    fetchSession();
    /**
     * Executes on role changed logic.
     * @param e - E value (`Event`).
     */
    const onRoleChanged = (e: Event) => {
      const detail = (e as CustomEvent<UserSession>).detail;
      if (detail) setCurrentUser(detail);
      else fetchSession();
    };
    window.addEventListener('alhiwar:role-changed', onRoleChanged);
    return () => window.removeEventListener('alhiwar:role-changed', onRoleChanged);
  }, [fetchSession]);

  const activeRole: UserRole = currentUser?.role || 'VISITOR';
  const { workspaceHref, workspaceLabel, roleLabel } = getLocalizedRoleMeta(
    activeRole,
    isFr
  );
  const isStaff = STAFF_NAV_ROLES.has(activeRole);
  const isAuthenticated = activeRole !== 'VISITOR';

  /**
   * Asynchronously executes handle logout logic.
   */
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(VISITOR_FALLBACK);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('alhiwar:role-changed', { detail: VISITOR_FALLBACK })
        );
      }
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav
      aria-label="Primary Institutional Navigation"
      className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md shadow-sm transition-shadow pt-[env(safe-area-inset-top,0px)]"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 sm:px-5 py-2.5 min-h-[4rem]">
        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3 group min-w-0 min-h-[44px] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
        >
          <div className="relative p-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm transition-transform group-hover:scale-105 shrink-0">
            <BrandPatternMark className="h-8 w-8 sm:h-9 sm:w-9" decorative />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold tracking-tight text-[#082233] group-hover:text-[#006C9C] transition-colors truncate">
              <span className="lg:hidden" translate="no">AL HIWAR</span>
              <span className="hidden lg:inline">
                {isFr ? (
                  <>
                    PLATEFORME NUMÉRIQUE DE DA’WAH &amp; D’ENSEIGNEMENT{' '}
                    <span translate="no">AL HIWAR</span>
                  </>
                ) : (
                  <>
                    <span translate="no">AL HIWAR</span> DIGITAL DA&apos;WAH &amp;
                    LEARNING PLATFORM
                  </>
                )}
              </span>
            </div>
            <div className="text-[11px] font-bold text-[#6B4E16] truncate">
              {copy.tagline}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 md:hidden shrink-0">
          <LanguageToggle language={language} setLanguage={setLanguage} compact />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-primary-nav"
            aria-label={copy.toggleMenu}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#CBD5E1] bg-white text-[#082233] active:scale-[0.96] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="hidden md:flex flex-wrap items-center gap-1.5 text-xs font-semibold shrink-0">
          <Link href="/" className={desktopLinkClass(pathname === '/')}>
            {copy.home}
          </Link>
          <Link
            href="/resources"
            className={desktopLinkClass(pathname.startsWith('/resources'))}
          >
            {copy.library}
          </Link>
          {DIALOGUE_NAV_ROLES.has(activeRole) && (
            <Link
              href="/dialogue"
              className={`${desktopLinkClass(pathname.startsWith('/dialogue'))} flex items-center gap-1.5`}
            >
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              {copy.dialogue}
            </Link>
          )}
          {activeRole === 'NEW_MUSLIM' && (
            <Link
              href="/academy"
              className={desktopGoldClass(
                pathname.startsWith('/academy'),
                'text-[#735724] bg-[#BC9C5C]/15 hover:bg-[#BC9C5C]/25'
              )}
            >
              <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
              <span translate="no">{copy.academy}</span>
            </Link>
          )}
          {isStaff && (
            <Link
              href="/staff"
              className={desktopGoldClass(
                pathname.startsWith('/staff'),
                'text-[#7A5E2A] bg-[#BC9C5C]/20 hover:bg-[#BC9C5C]/35 font-semibold'
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              {copy.staff}
            </Link>
          )}
          <LanguageToggle language={language} setLanguage={setLanguage} />
          <DesktopAuthSection
            isAuthenticated={isAuthenticated}
            language={language}
            currentUser={currentUser}
            workspaceHref={workspaceHref}
            workspaceLabel={workspaceLabel}
            roleLabel={roleLabel}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {mobileMenuOpen && (
        <MobileNavDrawer
          pathname={pathname}
          language={language}
          activeRole={activeRole}
          isStaff={isStaff}
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          workspaceHref={workspaceHref}
          workspaceLabel={workspaceLabel}
          roleLabel={roleLabel}
          onClose={() => setMobileMenuOpen(false)}
          onLogout={handleLogout}
        />
      )}
    </nav>
  );
}
