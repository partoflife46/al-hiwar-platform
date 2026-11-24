/**
 * Individual module row card and capstone final exam card for the Academy roadmap.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/academy/roadmap-module-card.tsx`.
 *
 * Exported symbols:
 * - `RoadmapModuleCard` (Function): roadmap module card definition.
 * - `CapstoneExamCard` (Function): capstone exam card definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/db/types`
 * - `@/lib/services/academy-service`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `./roadmap-copy`
 *
 * @module components/academy/roadmap-module-card
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db/in-memory-adapter';
import type { Certificate, LearningContent } from '@/lib/db/types';
import type { AcademyProgress } from '@/lib/services/academy-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  Lock,
  Video,
  Volume2,
} from 'lucide-react';
import {
  MODULE_CARD_CLASS,
  MODULE_NODE_CLASS,
  ROADMAP_COPY,
  type ModuleState,
} from './roadmap-copy';

/**
 * Type contract defining roadmap module card props.
 * Includes fields/members: lesson, completedCount, unlockedLesson, isFr.
 */
interface RoadmapModuleCardProps {
  /** lesson property. */
  lesson: LearningContent;
  /** completed count property. */
  completedCount: number;
  /** unlocked lesson property. */
  unlockedLesson: number;
  /** is fr property. */
  isFr: boolean;
}

/** Renders a single sequential Academy curriculum module node on the roadmap. */
export function RoadmapModuleCard({
  lesson,
  completedCount,
  unlockedLesson,
  isFr,
}: RoadmapModuleCardProps) {
  const copy = ROADMAP_COPY[isFr ? 'fr' : 'en'];
  const isCompleted = lesson.lessonNumber <= completedCount;
  const isCurrent = lesson.lessonNumber === unlockedLesson;
  const isLocked = lesson.lessonNumber > unlockedLesson;
  const state: ModuleState = isCompleted
    ? 'completed'
    : isCurrent
      ? 'current'
      : 'locked';

  return (
    <div
      className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border p-5 transition-[border-color,box-shadow] ${MODULE_CARD_CLASS[state]}`}
    >
      <div className="flex items-center gap-3 sm:w-16 shrink-0 z-10">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-sm shadow-sm transition-colors ${MODULE_NODE_CLASS[state]}`}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          ) : isLocked ? (
            <Lock className="h-5 w-5" aria-hidden="true" />
          ) : (
            lesson.lessonNumber
          )}
        </div>
      </div>

      <div className="flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-bold ${
              isLocked ? 'text-[#005072]' : 'text-[#006C9C]'
            }`}
          >
            Module {lesson.lessonNumber}
          </span>
          {isCompleted && (
            <Badge variant="approved" className="text-[11px] gap-1">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> {copy.passedBadge}
            </Badge>
          )}
          {isCurrent && (
            <Badge variant="primary" className="text-[11px]">
              {copy.activeBadge}
            </Badge>
          )}
          {isLocked && (
            <Badge variant="locked" className="text-[11px] gap-1">
              <Lock className="w-3 h-3" aria-hidden="true" /> {copy.lockedBadge}
            </Badge>
          )}
        </div>

        <h3
          className={`text-base sm:text-lg font-bold ${
            isLocked ? 'text-slate-700' : 'text-[#082233]'
          }`}
        >
          {isFr ? lesson.titleFr : lesson.titleEn}
        </h3>
        {!isFr && lesson.titleFr && (
          <p className="text-xs text-[#475569] italic">{lesson.titleFr}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-700">
          <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
            <FileText className="w-3 h-3 text-[#005072]" aria-hidden="true" />{' '}
            {copy.readingPill}
          </span>
          {lesson.audioLectureUrl && (
            <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
              <Volume2 className="w-3 h-3 text-[#145B6E]" aria-hidden="true" />{' '}
              {copy.audioPill}
            </span>
          )}
          {lesson.pdfGuideUrl && (
            <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
              <BookOpen className="w-3 h-3 text-[#735724]" aria-hidden="true" />{' '}
              {copy.pdfPill}
            </span>
          )}
          {lesson.videoLectureUrl && (
            <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
              <Video className="w-3 h-3 text-[#B45309]" aria-hidden="true" />{' '}
              {copy.videoPill}
            </span>
          )}
        </div>
      </div>

      <div className="sm:self-center shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
        {isLocked ? (
          <Button
            variant="outline"
            disabled
            size="sm"
            className="w-full sm:w-auto gap-1 text-slate-700 border-slate-300 bg-white"
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            {copy.lockedBadge}
          </Button>
        ) : (
          <Link href={`/academy/lessons/${lesson.lessonNumber}`}>
            <Button
              variant={isCurrent ? 'primary' : 'outline'}
              size="sm"
              className="w-full sm:w-auto gap-1.5 font-semibold"
            >
              {isCompleted ? copy.reviewBtn : copy.studyBtn}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Type contract defining capstone exam card props.
 * Includes fields/members: isFr, isFinalExamEligible, progress, certificate, userId.
 */
interface CapstoneExamCardProps {
  /** is fr property. */
  isFr: boolean;
  /** is final exam eligible property. */
  isFinalExamEligible: boolean;
  /** progress property. */
  progress: AcademyProgress | null;
  /** certificate property. */
  certificate: Certificate | null;
  /** Optional user id property. */
  userId?: string;
}

/** Renders the 100-question final comprehensive exam and certificate status card. */
export function CapstoneExamCard({
  isFr,
  isFinalExamEligible,
  progress,
  certificate,
  userId,
}: CapstoneExamCardProps) {
  const copy = ROADMAP_COPY[isFr ? 'fr' : 'en'];
  const activeCert =
    certificate ||
    db.certificates.find((c) => c.newMuslimId === userId && !c.isRevoked);
  const badgeText = progress?.finalExamPassed
    ? copy.graduatedBadge
    : isFinalExamEligible
      ? copy.unlockedBadge
      : copy.prereqBadge;

  return (
    <div
      className={`rounded-2xl border-2 p-6 transition-[border-color,box-shadow] ${
        isFinalExamEligible
          ? 'border-[#BC9C5C] bg-gradient-to-r from-white to-[#BC9C5C]/10 shadow-lg'
          : 'border-[#E2E8F0] bg-[#F8FAFC]'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              isFinalExamEligible
                ? 'bg-[#BC9C5C] text-white shadow-md'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            <Award className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`text-lg font-bold ${
                  isFinalExamEligible ? 'text-[#082233]' : 'text-slate-700'
                }`}
              >
                {copy.finalExamTitle}
              </h3>
              <Badge variant={isFinalExamEligible ? 'gold' : 'locked'}>
                {badgeText}
              </Badge>
            </div>
            <p className="text-xs text-[#475569] max-w-xl">{copy.finalExamDesc}</p>
          </div>
        </div>

        <div className="shrink-0 w-full sm:w-auto flex flex-wrap items-center gap-2">
          {progress?.finalExamPassed ? (
            <>
              <Badge variant="approved" className="text-xs py-2 px-3 gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {copy.passedCertified}
              </Badge>
              {activeCert && (
                <Link
                  href={`/academy/certificate/${activeCert.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#006C9C] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#005072]"
                >
                  <Award className="w-4 h-4" /> {copy.viewCertBtn}
                </Link>
              )}
            </>
          ) : isFinalExamEligible ? (
            <Link href="/academy/final-exam">
              <Button
                variant="accent"
                className="w-full sm:w-auto gap-2 font-bold shadow-md"
              >
                {copy.takeFinalBtn}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              disabled
              className="w-full sm:w-auto text-xs gap-1.5 text-slate-700 border-slate-300 bg-white"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              {copy.completeModulesBtn}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
