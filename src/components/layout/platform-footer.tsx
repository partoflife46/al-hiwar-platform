'use client';

/**
 * Module architecture and API reference for `src/components/layout/platform-footer.tsx`.
 *
 * Exported symbols:
 * - `PlatformFooter` (Function): platform footer definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/context/language-context`
 *
 * @module components/layout/platform-footer
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * UI presentation module for platform footer within the layout workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/layout/platform-footer
 * @exports PlatformFooter
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import type { UserRole, UserSession } from '@/lib/db/types';
import { useLanguage } from '@/lib/context/language-context';

/**
 * Renders the platform footer interface component.
 * @returns Rendered JSX element tree.
 */
export function PlatformFooter() {
  const router = useRouter();
  const { isFr } = useLanguage();
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);

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
      // ignore
    }
  }, []);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    fetchSession();

    /**
     * Executes handle role changed logic.
     * @param e - E value (`Event`).
     */
    const handleRoleChanged = (e: Event) => {
      const detail = (e as CustomEvent<UserSession>).detail;
      if (detail) {
        setCurrentUser(detail);
      } else {
        fetchSession();
      }
    };

    window.addEventListener('alhiwar:role-changed', handleRoleChanged);
    return () => window.removeEventListener('alhiwar:role-changed', handleRoleChanged);
  }, [fetchSession]);

  const activeRole: UserRole = currentUser?.role || 'VISITOR';
  const isAuthenticated = activeRole !== 'VISITOR';
  const canDialogue =
    activeRole === 'NON_MUSLIM' || activeRole === 'DIALOGIST' || activeRole === 'SUPERVISOR';
  const canAcademy = activeRole === 'NEW_MUSLIM';
  const isStaff = ['DIALOGIST', 'INSTRUCTOR', 'SUPERVISOR', 'ADMINISTRATOR'].includes(activeRole);

  /**
   * Asynchronously executes handle logout logic.
   */
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      const visitorSession: UserSession = {
        userId: 'visitor',
        email: 'visitor@example.com',
        firstName: 'Visitor',
        surname: 'Guest',
        role: 'VISITOR',
        preferredLanguage: 'en',
        token: '',
      };
      setCurrentUser(visitorSession);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('alhiwar:role-changed', { detail: visitorSession }));
      }
      router.push('/');
    } catch {
      // ignore
    }
  };

  const linkClass =
    'inline-flex items-center min-h-[44px] sm:min-h-0 py-1 sm:py-0 text-[#082233] hover:text-[#006C9C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] rounded';

  return (
    <footer className="border-t border-[#E2E8F0] bg-white text-[#475569]">
      <div className="mx-auto max-w-6xl px-4 sm:px-5 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#082233]">
            <ShieldCheck className="w-4 h-4 text-[#006C9C]" aria-hidden="true" />
            <span>
              {isFr
                ? 'Plateforme Numérique de Da’wah & d’Enseignement Al Hiwar'
                : 'Al Hiwar Digital Da’wah & Learning Platform'}
            </span>
          </div>
          <p>
            {isFr
              ? 'Supervision académique & Chari’a • © 2026 Al Hiwar. Tous droits réservés.'
              : 'Verified Scholarly & Sharia Oversight • © 2026 Al Hiwar. All rights reserved.'}
          </p>
        </div>

        {/* Nav landmark (Footer navigation) */}
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-4 gap-y-1 font-semibold">
          <Link href="/" className={linkClass}>
            {isFr ? 'Accueil' : 'Home'}
          </Link>
          <Link href="/resources" className={linkClass}>
            {isFr ? 'Bibliothèque' : 'Islamic Library'}
          </Link>

          {!isAuthenticated ? (
            <>
              <Link href="/login" className={linkClass}>
                {isFr ? 'Connexion' : 'Sign In'}
              </Link>
              <Link href="/register" className={linkClass}>
                {isFr ? 'Inscription (18+)' : 'Register (18+)'}
              </Link>
            </>
          ) : (
            <>
              {canDialogue && (
                <Link href="/dialogue" className={linkClass}>
                  {isFr ? 'Dialogue' : 'Dialogue'}
                </Link>
              )}
              {canAcademy && (
                <Link href="/academy" className={linkClass}>
                  {isFr ? 'Académie' : 'Academy'}
                </Link>
              )}
              {isStaff && (
                <Link href="/staff" className={linkClass}>
                  {isFr ? 'Espace Équipe' : 'Staff Console'}
                </Link>
              )}
              <Link href="/profile" className={linkClass}>
                {isFr ? 'Mon Profil' : 'My Profile'}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center min-h-[44px] sm:min-h-0 py-1 sm:py-0 text-[#B91C1C] hover:text-red-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded"
              >
                {isFr ? 'Déconnexion' : 'Log Out'}
              </button>
            </>
          )}
        </nav>
      </div>
    </footer>
  );
}
