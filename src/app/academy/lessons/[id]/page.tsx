/**
 * Academy module lesson reader page with multimedia resources and sequential access guard.
 */

'use client';

/**
 * Module architecture and API reference for `src/app/academy/lessons/[id]/page.tsx`.
 *
 * Exported symbols:
 * - `LessonReaderPage` (Function): lesson reader page definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/lib/context/language-context`
 * - `@/components/academy/markdown-lesson-body`
 * - `@/components/academy/lesson-reader-copy`
 *
 * @module app/academy/lessons/[id]/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { LearningContent } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Download,
  Lock,
  Video,
  Volume2,
} from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { MarkdownLessonBody } from '@/components/academy/markdown-lesson-body';
import {
  LESSON_READER_COPY,
  loadLessonDetailForUser,
} from '@/components/academy/lesson-reader-copy';

/** Renders locked, missing, or full interactive study view for an Academy lesson module. */
export default function LessonReaderPage() {
  const params = useParams();
  const rawId = (params?.id as string) || '1';
  const lessonNumber = parseInt(rawId.replace('lesson-', ''), 10) || 1;
  const { language, isFr } = useLanguage();
  const copy = LESSON_READER_COPY[language];

  const [audioUnavailable, setAudioUnavailable] = React.useState(false);
  const [videoUnavailable, setVideoUnavailable] = React.useState(false);
  const [lesson, setLesson] = React.useState<LearningContent | null>(null);
  const [errorStatus, setErrorStatus] = React.useState<
    'LOCKED' | 'NOT_FOUND' | null
  >(null);
  const [isLoading, setIsLoading] = React.useState(true);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    let active = true;
    /**
     * Asynchronously executes load logic.
     * @returns Promise resolving once the operation completes.
     */
    async function load() {
      setIsLoading(true);
      setErrorStatus(null);
      try {
        const result = await loadLessonDetailForUser(lessonNumber);
        if (!active) return;
        if (result.status === 'OK') setLesson(result.lesson);
        else if (result.status !== 'UNAUTHENTICATED') {
          setErrorStatus(result.status);
        }
      } catch (err) {
        console.error('Failed to load lesson detail:', err);
        if (active) setErrorStatus('NOT_FOUND');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [lessonNumber]);

  if (errorStatus === 'LOCKED') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Card className="p-8 space-y-6 rounded-3xl border border-[#D97706]/30 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D97706]/10 text-[#D97706]">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#082233]">
              {copy.lockedHeading(lessonNumber)}
            </h2>
            <p className="text-sm text-[#5F7383] max-w-md mx-auto">
              {copy.lockedBody(lessonNumber - 1)}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/academy">
              <Button variant="outline" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> {copy.returnRoadmap}
              </Button>
            </Link>
            {lessonNumber > 1 && (
              <Link href={`/academy/lessons/${lessonNumber - 1}`}>
                <Button variant="primary" className="gap-1.5">
                  {copy.goToModule(lessonNumber - 1)}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (errorStatus === 'NOT_FOUND') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Card className="p-8 space-y-6 rounded-3xl border border-red-200 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#082233]">
              {copy.notFoundHeading(lessonNumber)}
            </h2>
            <p className="text-sm text-[#5F7383]">{copy.notFoundBody}</p>
          </div>
          <Link href="/academy">
            <Button variant="primary" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> {copy.returnCurriculum}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isLoading || !lesson) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-[#5F7383]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto" />
          <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const title = isFr ? lesson.titleFr : lesson.titleEn;
  const content = isFr ? lesson.contentMarkdownFr : lesson.contentMarkdownEn;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <Link
          href="/academy"
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className: 'gap-1.5 text-xs',
          })}
        >
          <ArrowLeft className="w-4 h-4" />
          {copy.roadmapBtn}
        </Link>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-[#082233] via-[#005072] to-[#006C9C] p-6 sm:p-8 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="gold-glow"
            className="text-xs font-bold uppercase tracking-wider"
          >
            {copy.moduleOf7(lesson.lessonNumber)}
          </Badge>
          <Badge className="text-xs font-mono bg-white/15 text-white border-white/25">
            {copy.editionLabel}
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-[#D8BC7C] italic">{copy.facultySub}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lesson.audioLectureUrl && (
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#082233] flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#006C9C]" />
                {copy.audioHeading}
              </span>
              <Badge variant="secondary" className="text-[11px]">
                Audio
              </Badge>
            </div>
            {audioUnavailable ? (
              <p className="text-xs text-[#5F7383] italic py-1">
                {copy.audioUnavailable}
              </p>
            ) : (
              <audio
                controls
                src={lesson.audioLectureUrl}
                onError={() => setAudioUnavailable(true)}
                className="w-full h-9"
              />
            )}
          </div>
        )}

        {lesson.pdfGuideUrl && (
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#082233] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#BC9C5C]" />
                {copy.pdfHeading}
              </span>
              <p className="text-[11px] text-[#5F7383]">{copy.pdfSub}</p>
            </div>
            <a
              href={lesson.pdfGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#BC9C5C] text-[#8C6D32] hover:bg-[#BC9C5C]/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {copy.downloadBtn}
            </a>
          </div>
        )}
      </div>

      {lesson.videoLectureUrl && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2">
          <span className="text-xs font-bold text-[#082233] flex items-center gap-1.5">
            <Video className="w-4 h-4 text-[#D97706]" />
            {copy.videoHeading}
          </span>
          {videoUnavailable ? (
            <p className="text-xs text-[#5F7383] italic py-2">
              {copy.videoUnavailable}
            </p>
          ) : (
            <div className="aspect-video w-full rounded-xl bg-slate-900 overflow-hidden">
              <video
                controls
                preload="metadata"
                src={lesson.videoLectureUrl}
                onError={() => setVideoUnavailable(true)}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
      )}

      <Card className="p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm bg-white">
        <article className="max-w-none text-[#082233]">
          <MarkdownLessonBody content={content} />
        </article>
      </Card>

      <div className="rounded-2xl border border-[#006C9C]/30 bg-gradient-to-r from-[#006C9C]/5 via-[#BC9C5C]/5 to-transparent p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-bold text-[#082233]">
            {copy.quizCtaHeading}
          </h3>
          <p className="text-xs text-[#5F7383]">
            {copy.quizCtaBody(lesson.lessonNumber, lesson.lessonNumber + 1)}
          </p>
        </div>
        <Link
          href={`/academy/lessons/${lesson.lessonNumber}/quiz`}
          className={buttonVariants({
            variant: 'primary',
            className: 'gap-2 font-bold shadow-md px-6',
          })}
        >
          <span>{copy.quizCtaBtn(lesson.lessonNumber)}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
