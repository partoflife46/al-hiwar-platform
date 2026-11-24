/**
 * Al Hiwar Digital Da'wah & Learning Platform landing page.
 */

'use client';

/**
 * Module architecture and API reference for `src/app/page.tsx`.
 *
 * Exported symbols:
 * - `HomePage` (Function): home page definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/lib/context/language-context`
 * - `@/components/home/home-copy`
 * - `@/components/home/home-sections`
 *
 * @module app/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import type { IslamicResource, UserRole, UserSession } from '@/lib/db/types';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { ArrowRight, UserCheck } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { HOME_COPY, ROLE_ACTIONS } from '@/components/home/home-copy';
import {
  HomeFeaturedResources,
  HomeHeroSection,
  HomeStagesSection,
} from '@/components/home/home-sections';

/** Renders the personalized session strip, institutional hero, journey stages, and resources. */
export default function HomePage() {
  const { language, isFr } = useLanguage();
  const copy = HOME_COPY[language];
  const [featuredResources, setFeaturedResources] = React.useState<
    IslamicResource[]
  >([]);
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
      // ignore offline session check
    }
  }, []);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    /**
     * Asynchronously executes load resources logic.
     * @returns Promise resolving once the operation completes.
     */
    async function loadResources() {
      try {
        const res = await fetch('/api/resources', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          setFeaturedResources(json.data.slice(0, 6));
        }
      } catch {
        // fallback leaves featured list empty
      }
    }

    loadResources();
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
  const roleAction = ROLE_ACTIONS[activeRole] || ROLE_ACTIONS.VISITOR;
  const isAuthenticated = activeRole !== 'VISITOR';

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-6 py-6 sm:py-8 space-y-10">
      {isAuthenticated && (
        <div className="rounded-2xl bg-white border border-[#E2E8F0] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#006C9C]/10 text-[#006C9C]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[#5F7383]">{copy.signedInAs}</div>
              <div className="text-base font-extrabold text-[#082233] flex items-center gap-2">
                <span>
                  {currentUser?.firstName} {currentUser?.surname}
                </span>
                <Badge variant="primary" className="text-[11px] font-mono">
                  {isFr ? roleAction.titleFr : roleAction.titleEn}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={roleAction.primaryActionHref}
              className={buttonVariants({
                variant: 'primary',
                size: 'sm',
                className: 'gap-1.5 font-bold shadow-sm',
              })}
            >
              <span>
                {isFr
                  ? roleAction.primaryActionLabelFr
                  : roleAction.primaryActionLabelEn}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <HomeHeroSection
        language={language}
        isFr={isFr}
        isAuthenticated={isAuthenticated}
        roleAction={roleAction}
      />
      <HomeStagesSection language={language} />
      <HomeFeaturedResources
        language={language}
        isFr={isFr}
        resources={featuredResources}
      />
    </div>
  );
}
