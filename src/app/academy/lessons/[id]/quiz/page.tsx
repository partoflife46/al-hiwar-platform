'use client';

/**
 * Module architecture and API reference for `src/app/academy/lessons/[id]/quiz/page.tsx`.
 *
 * Exported symbols:
 * - `LessonQuizPage` (Function): lesson quiz page definition.
 *
 * Internal dependencies:
 * - `@/lib/services/academy-service`
 * - `@/lib/db/types`
 * - `@/components/academy/quiz-carousel`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/lib/context/language-context`
 *
 * @module app/academy/lessons/[id]/quiz/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router view module for `/academy/lessons/[id]/quiz`.
 * Renders bilingual EN/FR interface states and connects UI interactions to platform hooks.
 * @module app/academy/lessons/[id]/quiz/page
 * @exports LessonQuizPage
 */

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { academyService } from '@/lib/services/academy-service';
import type { Question, SupportedLanguage, UserSession } from '@/lib/db/types';
import { QuizCarousel, type QuizSubmissionResult } from '@/components/academy/quiz-carousel';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';

/**
 * Renders the lesson quiz page interface component.
 * @returns Rendered JSX element tree.
 */
export default function LessonQuizPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.id as string) || '1';
  const lessonNumber = parseInt(rawId.replace('lesson-', ''), 10) || 1;
  const { language, setLanguage, isFr } = useLanguage();

  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [isLocked, setIsLocked] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    /**
     * Asynchronously executes load quiz logic.
     * @returns Promise resolving once the operation completes.
     */
    async function loadQuiz() {
      setIsLoading(true);
      setIsLocked(false);
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!res.ok) {
          setIsLoading(false);
          return;
        }
        const json = await res.json();
        const session: UserSession = json.data;
        setCurrentUser(session);

        try {
          const acRes = await fetch(
            `/api/academy?type=quiz&lessonNumber=${lessonNumber}&userId=${session.userId}`,
            { cache: 'no-store' }
          );
          const acJson = await acRes.json();
          if (acRes.ok && acJson.ok && Array.isArray(acJson.data)) {
            setQuestions(acJson.data);
            return;
          }
          if (acJson && acJson.error) {
            setIsLocked(true);
            return;
          }
        } catch {
          // fallback below
        }

        const quizRes = await academyService.getLessonQuiz(session.userId, lessonNumber);
        if (!quizRes.ok) {
          setIsLocked(true);
          return;
        }
        setQuestions(quizRes.data);
      } catch (err) {
        console.error('Failed to load lesson quiz:', err);
        setIsLocked(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadQuiz();
  }, [lessonNumber]);

  /**
   * Submits the learner's 20-question lesson quiz answers to `/api/academy`.
   * @param answers - Map of question IDs to selected option indices.
   * @returns Graded attempt summary or a fallback failed result on error.
   */
  async function handleSubmitAnswers(
    answers: Record<string, number>
  ): Promise<QuizSubmissionResult> {
    const userId = currentUser?.userId || 'user-newmuslim-1';
    try {
      const res = await fetch('/api/academy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_QUIZ',
          userId,
          lessonNumber,
          answers,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok && json.data?.attempt) {
        return {
          scorePercentage: json.data.attempt.scorePercentage,
          isPassed: json.data.attempt.isPassed,
          attemptId: json.data.attempt.id,
        };
      }
      if (json && json.error) {
        return { scorePercentage: 0, isPassed: false };
      }
    } catch {
      // fallback below
    }

    const res = await academyService.submitLessonQuiz(userId, lessonNumber, answers);
    if (!res.ok) {
      return { scorePercentage: 0, isPassed: false };
    }
    return {
      scorePercentage: res.data.scorePercentage,
      isPassed: res.data.isPassed,
      attemptId: res.data.id,
    };
  };

  if (isLocked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Card className="p-8 space-y-6 rounded-3xl border border-[#D97706]/30 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D97706]/10 text-[#D97706]">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#082233]">
              {isFr ? `Le Quiz du Module ${lessonNumber} est verrouillé` : `Module ${lessonNumber} Quiz is Locked`}
            </h2>
            <p className="text-sm text-[#5F7383] max-w-md mx-auto">
              {isFr
                ? `Vous devez réussir le quiz du module précédent avec un score d’au moins 80 % avant de passer le Module ${lessonNumber}.`
                : `You must pass the preceding module quiz with a score of ≥ 80% before attempting Module ${lessonNumber}.`}
            </p>
          </div>
          <Link href="/academy">
            <Button variant="primary" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> {isFr ? 'Retour au programme de l’Académie' : 'Return to Curriculum Roadmap'}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-[#5F7383]">
        {isFr
          ? `Chargement du Quiz de compréhension du Module ${lessonNumber}…`
          : `Loading Module ${lessonNumber} Comprehension Quiz…`}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/academy/lessons/${lessonNumber}`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="w-4 h-4" />
            {isFr ? `Retour au cours du Module ${lessonNumber}` : `Back to Module ${lessonNumber} Reading`}
          </Button>
        </Link>
        <Badge variant="gold" className="text-xs font-bold">
          {isFr
            ? `Module ${lessonNumber} • Évaluation de 20 questions`
            : `Module ${lessonNumber} • 20-Question Evaluation`}
        </Badge>
      </div>

      <QuizCarousel
        title={isFr ? `Quiz de Compréhension • Module ${lessonNumber}` : `Module ${lessonNumber} Comprehension Quiz`}
        subtitle={isFr ? '20 Questions • Score requis ≥ 80 % (16/20)' : '20 Questions • ≥ 80% Required (16/20)'}
        questions={questions}
        language={language}
        passingPercentage={80}
        onLanguageChange={setLanguage}
        onSubmitAnswers={handleSubmitAnswers}
        nextActionLabel={
          lessonNumber < 7
            ? (isFr ? `Passer au Module ${lessonNumber + 1}` : `Proceed to Module ${lessonNumber + 1}`)
            : (isFr ? 'Passer à l’Examen Final de 100 questions' : 'Proceed to 100-Question Final Exam')
        }
        onNextAction={() => {
          if (lessonNumber < 7) {
            router.push(`/academy/lessons/${lessonNumber + 1}`);
          } else {
            router.push('/academy/final-exam');
          }
        }}
      />
    </div>
  );
}
