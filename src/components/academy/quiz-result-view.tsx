/**
 * Assessment result banner and scholarly answer key review panel.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/academy/quiz-result-view.tsx`.
 *
 * Exported symbols:
 * - `QuizResultView` (Function): quiz result view definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `./quiz-carousel`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `./quiz-copy`
 *
 * @module components/academy/quiz-result-view
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { Question, SupportedLanguage } from '@/lib/db/types';
import type { QuizSubmissionResult } from './quiz-carousel';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Award, RotateCcw, XCircle } from 'lucide-react';
import { localizeQuestion, QUIZ_COPY } from './quiz-copy';

/**
 * Type contract defining quiz result view props.
 * Includes fields/members: result, questions, answers, language, passingPercentage,
 * nextActionLabel.
 */
interface QuizResultViewProps {
  /** result property. */
  result: QuizSubmissionResult;
  /** questions property. */
  questions: Question[];
  /** answers property. */
  answers: Record<string, number>;
  /** language property. */
  language: SupportedLanguage;
  /** passing percentage property. */
  passingPercentage: number;
  /** next action label property. */
  nextActionLabel: string;
  /** on retake property. */
  onRetake: () => void;
  /** Optional on next action property. */
  onNextAction?: () => void;
}

/** Displays final assessment score, pass/fail status, and scholarly answer explanations. */
export function QuizResultView({
  result,
  questions,
  answers,
  language,
  passingPercentage,
  nextActionLabel,
  onRetake,
  onNextAction,
}: QuizResultViewProps) {
  const copy = QUIZ_COPY[language];
  const passed = result.isPassed;
  const highlighted = questions.slice(0, 10);

  return (
    <div className="space-y-6">
      <Card
        className={`p-8 rounded-3xl border-2 shadow-lg space-y-6 ${
          passed
            ? 'border-[#0D7A5F] bg-gradient-to-br from-white to-[#0D7A5F]/5'
            : 'border-[#D97706] bg-gradient-to-br from-white to-[#D97706]/5'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md ${
                passed ? 'bg-[#0D7A5F]' : 'bg-[#D97706]'
              }`}
            >
              {passed ? <Award className="h-9 w-9" /> : <XCircle className="h-9 w-9" />}
            </div>
            <div className="space-y-1">
              <Badge
                variant={passed ? 'approved' : 'warning'}
                className="text-xs font-bold"
              >
                {passed ? copy.passedBadge : copy.failedBadge}
              </Badge>
              <h2 className="text-2xl font-extrabold text-[#082233]">
                {passed ? copy.passedTitle : copy.failedTitle}
              </h2>
              <p className="text-xs text-[#5F7383]">
                {passed ? copy.passedDesc : copy.failedDesc(passingPercentage)}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right bg-white px-6 py-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#5F7383]">
              {copy.finalScore}
            </div>
            <div
              className={`text-4xl font-extrabold tabular-nums tracking-tight ${
                passed ? 'text-[#0D7A5F]' : 'text-[#D97706]'
              }`}
            >
              {result.scorePercentage}%
            </div>
            <div className="text-[11px] text-[#5F7383]">
              {copy.requiredLabel(passingPercentage)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
          <Button
            type="button"
            variant="outline"
            onClick={onRetake}
            className="gap-2 font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            {copy.retakeBtn}
          </Button>
          {passed && onNextAction && (
            <Button
              type="button"
              variant="primary"
              onClick={onNextAction}
              className="gap-2 font-bold shadow-md px-6"
            >
              {nextActionLabel}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6 rounded-3xl border border-[#E2E8F0] space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#006C9C]">
          {copy.answerKeyTitle(highlighted.length)}
        </h3>
        <div className="space-y-3">
          {highlighted.map((q, idx) => {
            const isCorrect = answers[q.id] === q.correctOptionIndex;
            const { prompt, explanation, options } = localizeQuestion(q, language);
            return (
              <div
                key={q.id}
                className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-[#082233]">
                    Q{idx + 1}. {prompt}
                  </span>
                  <Badge
                    variant={isCorrect ? 'approved' : 'warning'}
                    className="text-[11px] shrink-0"
                  >
                    {isCorrect
                      ? 'Correct'
                      : `${copy.correctPrefix} ${options[q.correctOptionIndex]}`}
                  </Badge>
                </div>
                <p className="text-xs text-[#5F7383]">{explanation}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
