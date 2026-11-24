/**
 * Al Hiwar Islamic Academy sequential learning roadmap page.
 */

'use client';

/**
 * Module architecture and API reference for `src/app/academy/page.tsx`.
 *
 * Exported symbols:
 * - `AcademyRoadmapPage` (Function): academy roadmap page definition.
 *
 * Internal dependencies:
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/hooks/use-academy-roadmap`
 * - `@/components/academy/roadmap-copy`
 * - `@/components/academy/roadmap-module-card`
 *
 * @module app/academy/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { useAcademyRoadmap } from '@/hooks/use-academy-roadmap';
import { ROADMAP_COPY } from '@/components/academy/roadmap-copy';
import {
  CapstoneExamCard,
  RoadmapModuleCard,
} from '@/components/academy/roadmap-module-card';

/** Renders the 7-module linear curriculum roadmap and capstone exam entry point. */
export default function AcademyRoadmapPage() {
  const {
    isFr,
    currentUser,
    progress,
    lessons,
    certificate,
    unlockedLesson,
    completedCount,
    progressPercent,
    isFinalExamEligible,
  } = useAcademyRoadmap();

  const copy = ROADMAP_COPY[isFr ? 'fr' : 'en'];
  const isGuest = !currentUser || currentUser.role === 'VISITOR';

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-6 py-6 sm:py-8 space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#082233] via-[#005072] to-[#006C9C] p-6 sm:p-8 text-white shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge
            variant="gold-glow"
            className="text-xs uppercase tracking-wider font-semibold"
          >
            {copy.badge}
          </Badge>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-[#FDF4D4] font-mono">
              {currentUser?.firstName || 'Learner'} ({currentUser?.role})
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {copy.heading}
          </h1>
          <p className="text-xs sm:text-sm text-slate-50 max-w-2xl">
            {copy.subtitle}
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-50">
              {copy.progressLabel(completedCount)}
            </span>
            <span className="font-mono text-[#FDF4D4] tabular-nums">
              {progressPercent}% {copy.completedSuffix}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-black/30 overflow-hidden p-0.5 border border-white/10">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[#BC9C5C] to-[#0D7A5F] transition-[width] duration-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      {isGuest && (
        <div className="rounded-2xl border border-[#006C9C]/30 bg-[#006C9C]/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#082233]">
            <BookOpen className="w-4 h-4 text-[#006C9C] shrink-0" />
            <span>{copy.guestNotice}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login">
              <Button size="sm" variant="primary" className="font-bold text-xs">
                {copy.signInBtn}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Section landmark */}
      <section className="space-y-4" aria-labelledby="academy-roadmap-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="academy-roadmap-heading"
            className="text-lg sm:text-xl font-extrabold text-[#082233]"
          >
            {copy.modulesHeading}
          </h2>
          <span className="text-xs font-medium text-[#475569]">
            {copy.unlockHint}
          </span>
        </div>

        <div className="relative space-y-6">
          <div className="absolute left-6 top-8 bottom-8 w-1 bg-[#1C7890]/30 hidden sm:block -z-0" />
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <RoadmapModuleCard
                key={lesson.id}
                lesson={lesson}
                completedCount={completedCount}
                unlockedLesson={unlockedLesson}
                isFr={isFr}
              />
            ))}
          </div>
          <CapstoneExamCard
            isFr={isFr}
            isFinalExamEligible={isFinalExamEligible}
            progress={progress}
            certificate={certificate}
            userId={currentUser?.userId}
          />
        </div>
      </section>
    </div>
  );
}
