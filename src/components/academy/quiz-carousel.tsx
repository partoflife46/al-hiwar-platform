/**
 * Interactive 1-question-at-a-time assessment carousel for module quizzes and final exams.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/academy/quiz-carousel.tsx`.
 *
 * Exported symbols:
 * - `QuizSubmissionResult` (Interface): quiz submission result definition.
 * - `QuizCarouselProps` (Interface): quiz carousel props definition.
 * - `QuizCarousel` (Function): quiz carousel definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `./quiz-copy`
 * - `./quiz-result-view`
 *
 * @module components/academy/quiz-carousel
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { Question, SupportedLanguage } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { localizeQuestion, QUIZ_COPY } from './quiz-copy';
import { QuizResultView } from './quiz-result-view';

/**
 * Type contract defining quiz submission result.
 * Includes fields/members: scorePercentage, isPassed, attemptId, certificateId.
 */
export interface QuizSubmissionResult {
  /** score percentage property. */
  scorePercentage: number;
  /** is passed property. */
  isPassed: boolean;
  /** Optional attempt id property. */
  attemptId?: string;
  /** Optional certificate id property. */
  certificateId?: string | null;
}

/**
 * Type contract defining quiz carousel props.
 */
export interface QuizCarouselProps {
  /** title property. */
  title: string;
  /** Optional subtitle property. */
  subtitle?: string;
  /** questions property. */
  questions: Question[];
  /** Optional language property. */
  language?: SupportedLanguage;
  /** Optional passing percentage property. */
  passingPercentage?: number;
  /** Optional on language change property. */
  onLanguageChange?: (lang: SupportedLanguage) => void;
  /** on submit answers property. */
  onSubmitAnswers: (answers: Record<string, number>) => Promise<QuizSubmissionResult>;
  /** Optional on simulate pass property. */
  onSimulatePass?: () => Promise<QuizSubmissionResult>;
  /** Optional simulate button label property. */
  simulateButtonLabel?: string;
  /** Optional next action label property. */
  nextActionLabel?: string;
  /** Optional on next action property. */
  onNextAction?: () => void;
}

/**
 * Constant definition for option letters.
 */
const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

/** Computes pill styling for each question index button in the compact navigator. */
function navPillTone(isActive: boolean, isAnswered: boolean): string {
  if (isActive) return 'bg-[#006C9C] text-white ring-2 ring-[#006C9C]/30';
  if (isAnswered) return 'bg-[#0D7A5F]/15 text-[#0D7A5F] border border-[#0D7A5F]/30';
  return 'bg-white text-[#5F7383] border border-[#E2E8F0]';
}

/** Renders an interactive assessment carousel with progress bar, navigator, and results. */
export function QuizCarousel({
  title,
  subtitle,
  questions,
  language = 'en',
  passingPercentage = 80,
  onLanguageChange,
  onSubmitAnswers,
  nextActionLabel = 'Continue to Next Module',
  onNextAction,
}: QuizCarouselProps) {
  const copy = QUIZ_COPY[language];
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<QuizSubmissionResult | null>(null);

  const totalQuestions = questions.length;
  if (totalQuestions === 0) {
    return <Card className="p-8 text-center text-[#5F7383]">{copy.empty}</Card>;
  }

  /**
   * Executes handle retake logic.
   */
  const handleRetake = () => {
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
  };

  if (result) {
    return (
      <QuizResultView
        result={result}
        questions={questions}
        answers={answers}
        language={language}
        passingPercentage={passingPercentage}
        nextActionLabel={nextActionLabel}
        onRetake={handleRetake}
        onNextAction={onNextAction}
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);
  const { prompt: promptText, options: optionsList } = localizeQuestion(
    currentQuestion,
    language
  );
  const selectedOption = answers[currentQuestion.id];

  /** Handles handle select option interaction. */
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  /**
   * Asynchronously executes handle submit logic.
   */
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      setResult(await onSubmitAnswers(answers));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#082233]">
          <BookOpen className="w-4 h-4 text-[#006C9C]" />
          <span>{copy.toolbarTitle(passingPercentage)}</span>
        </div>
        {onLanguageChange && (
          <div className="flex items-center gap-1 rounded-lg bg-white p-1 border border-[#E2E8F0]">
            {(['en', 'fr'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange(lang)}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  language === lang ? 'bg-[#006C9C] text-white' : 'text-[#5F7383]'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[#5F7383]">
          <span>
            {title} {subtitle ? `• ${subtitle}` : ''}
          </span>
          <span className="font-mono text-[#006C9C]">
            {copy.questionProgress(currentIndex + 1, totalQuestions, answeredCount)}
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            style={{
              transform: `scaleX(${progressPercent / 100})`,
              transformOrigin: 'left',
            }}
            className="h-full w-full bg-gradient-to-r from-[#006C9C] to-[#0D7A5F] transition-transform duration-300 ease-out will-change-transform"
          />
        </div>
      </div>

      <Card className="p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-md bg-white space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="primary" className="text-xs font-mono">
            Question {currentIndex + 1} / {totalQuestions}
          </Badge>
          <span className="text-xs text-[#5F7383] flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-[#BC9C5C]" />
            {copy.passingScore(passingPercentage)}
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-[#082233] leading-snug">
          {promptText}
        </h2>

        <div className="space-y-3">
          {optionsList.map((optionText, idx) => {
            const isSelected = selectedOption === idx;
            return (
              <button
                key={idx}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSelectOption(currentQuestion.id, idx)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] flex items-center gap-3.5 ${
                  isSelected
                    ? 'border-[#006C9C] bg-[#006C9C]/5 text-[#082233] font-semibold shadow-sm'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#1C7890]/50 text-[#082233]'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                    isSelected
                      ? 'bg-[#006C9C] text-white'
                      : 'bg-white border border-[#E2E8F0] text-[#5F7383]'
                  }`}
                >
                  {OPTION_LETTERS[idx]}
                </span>
                <span className="text-sm sm:text-base">{optionText}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            {copy.previous}
          </Button>
          <div className="flex items-center gap-2">
            {currentIndex < totalQuestions - 1 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))
                }
                className="gap-1.5"
              >
                {copy.nextQuestion}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="accent"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="gap-1.5 font-bold shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {copy.submitLabel(answeredCount, totalQuestions)}
            </Button>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5F7383]">
          {copy.navigatorHeading}
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Question ${idx + 1}`}
              aria-current={idx === currentIndex ? 'step' : undefined}
              className={`relative before:absolute before:-inset-1 before:content-[''] h-7 min-w-[1.75rem] px-1.5 rounded-lg text-[11px] font-mono tabular-nums font-bold transition-all active:scale-[0.95] duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${navPillTone(
                idx === currentIndex,
                answers[q.id] !== undefined
              )}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
