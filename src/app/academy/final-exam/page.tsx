/**
 * 100-question capstone comprehensive final examination page.
 */

'use client';

/**
 * Module architecture and API reference for `src/app/academy/final-exam/page.tsx`.
 *
 * Exported symbols:
 * - `FinalExamPage` (Function): final exam page definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/db/types`
 * - `@/components/academy/quiz-carousel`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/lib/context/language-context`
 * - `@/components/academy/final-exam-api`
 *
 * @module app/academy/final-exam/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db/in-memory-adapter';
import type { Question, UserSession } from '@/lib/db/types';
import {
  QuizCarousel,
  type QuizSubmissionResult,
} from '@/components/academy/quiz-carousel';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Award, Lock } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import {
  FINAL_EXAM_COPY,
  loadFinalExamState,
  submitFinalExamAnswers,
} from '@/components/academy/final-exam-api';

/** Renders the locked prerequisite view or interactive 100-question final exam carousel. */
export default function FinalExamPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const copy = FINAL_EXAM_COPY[language];

  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [isLocked, setIsLocked] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [issuedCertificateId, setIssuedCertificateId] =
    React.useState<string | null>(null);

  /**
   * Memoized handler/selector for load exam.
   */
  const loadExam = React.useCallback(async () => {
    setIsLoading(true);
    setIsLocked(false);
    try {
      const state = await loadFinalExamState();
      setCurrentUser(state.user);
      setQuestions(state.questions);
      setIssuedCertificateId(state.certificateId);
      setIsLocked(state.locked);
    } catch (err) {
      console.error('Failed to load final exam:', err);
      setIsLocked(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    loadExam();
  }, [loadExam]);

  /**
   * Submits the learner's 30-question final exam answers and records any issued certificate ID.
   * @param answers - Map of question IDs to selected choice indices.
   * @returns Quiz submission result including pass status and score percentage.
   */
  async function handleSubmitFinalExam(
    answers: Record<string, number>
  ): Promise<QuizSubmissionResult> {
    const userId = currentUser?.userId || 'user-newmuslim-1';
    const result = await submitFinalExamAnswers(userId, answers);
    if (result.certificateId) setIssuedCertificateId(result.certificateId);
    return result;
  }

  if (isLocked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Card className="p-8 space-y-6 rounded-3xl border border-[#D97706]/30 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D97706]/10 text-[#D97706]">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#082233]">
              {copy.lockedTitle}
            </h2>
            <p className="text-sm text-[#5F7383] max-w-md mx-auto">
              {copy.lockedDesc}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/academy">
              <Button variant="outline" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> {copy.returnRoadmap}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-[#5F7383]">
        {copy.loading}
      </div>
    );
  }

  /**
   * Executes handle view certificate logic.
   */
  const handleViewCertificate = () => {
    const certId =
      issuedCertificateId ||
      db.certificates.find((c) => c.newMuslimId === currentUser?.userId)?.id;
    router.push(certId ? `/academy/certificate/${certId}` : '/academy');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-[#082233] via-[#005072] to-[#006C9C] p-6 sm:p-8 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge
            variant="gold-glow"
            className="text-xs font-bold uppercase tracking-wider"
          >
            {copy.badge}
          </Badge>
          <Link href="/academy">
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-white/10 text-white border-white/20 hover:bg-white/20 gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {copy.roadmapShort}
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5">
          <Award className="w-7 h-7 text-[#BC9C5C]" />
          {copy.heading}
        </h1>
        <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">
          {copy.description}
        </p>
      </div>

      <QuizCarousel
        title={copy.quizTitle}
        subtitle={copy.quizSubtitle}
        questions={questions}
        language={language}
        passingPercentage={80}
        onLanguageChange={setLanguage}
        onSubmitAnswers={handleSubmitFinalExam}
        nextActionLabel={copy.certCta}
        onNextAction={handleViewCertificate}
      />
    </div>
  );
}
