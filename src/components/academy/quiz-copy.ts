/**
 * Module architecture and API reference for `src/components/academy/quiz-copy.ts`.
 *
 * Exported symbols:
 * - `QUIZ_COPY` (Const): quiz copy definition.
 * - `localizeQuestion` (Function): localize question definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/academy/quiz-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual copy and question localization helpers for Academy quizzes and exams.
 */

import type { Question, SupportedLanguage } from '@/lib/db/types';

/**
 * Constant definition for quiz copy.
 */
export const QUIZ_COPY: Record<
  SupportedLanguage,
  {
    empty: string;
    passedBadge: string;
    failedBadge: string;
    passedTitle: string;
    failedTitle: string;
    passedDesc: string;
    failedDesc: (pct: number) => string;
    finalScore: string;
    requiredLabel: (pct: number) => string;
    retakeBtn: string;
    answerKeyTitle: (count: number) => string;
    correctPrefix: string;
    toolbarTitle: (pct: number) => string;
    questionProgress: (cur: number, total: number, ans: number) => string;
    passingScore: (pct: number) => string;
    previous: string;
    nextQuestion: string;
    submitLabel: (ans: number, total: number) => string;
    navigatorHeading: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    empty: 'No questions available for this assessment.',
    passedBadge: 'ASSESSMENT PASSED (≥ 80%)',
    failedBadge: 'BELOW PASSING THRESHOLD (< 80%)',
    passedTitle: 'Mubarak! Comprehension Verified',
    failedTitle: 'Additional Review Recommended',
    passedDesc:
      'Your score meets the Al Hiwar Islamic Academy mastery threshold.',
    failedDesc: (pct) =>
      `A minimum of ${pct}% is required. Unlimited retakes are permitted with zero cooldown.`,
    finalScore: 'Final Score',
    requiredLabel: (pct) => `Required: ≥ ${pct}%`,
    retakeBtn: 'Retake Assessment (Zero Cooldown)',
    answerKeyTitle: (n) => `Answer Key & Scholarly Explanations (${n} Highlighted)`,
    correctPrefix: 'Correct:',
    toolbarTitle: (pct) => `Comprehension Evaluation (Passing Threshold: ≥${pct}%)`,
    questionProgress: (cur, total, ans) =>
      `Question ${cur} of ${total} (${ans}/${total} Answered)`,
    passingScore: (pct) => `Passing Score: ≥ ${pct}%`,
    previous: 'Previous',
    nextQuestion: 'Next Question',
    submitLabel: (ans, total) => `Submit Assessment (${ans}/${total})`,
    navigatorHeading: 'Question Navigator',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    empty: 'Aucune question disponible pour cette évaluation.',
    passedBadge: 'ÉVALUATION RÉUSSIE (≥ 80%)',
    failedBadge: 'SEUIL DE RÉUSSITE NON ATTEINT (< 80%)',
    passedTitle: 'Mabrouk ! Compréhension validée',
    failedTitle: 'Révision supplémentaire recommandée',
    passedDesc:
      'Votre score atteint le seuil de maîtrise de l’Académie Islamique Al Hiwar.',
    failedDesc: (pct) =>
      `Un minimum de ${pct} % est requis. Vous pouvez recommencer sans limite et sans délai d’attente.`,
    finalScore: 'Score Final',
    requiredLabel: (pct) => `Requis : ≥ ${pct}%`,
    retakeBtn: 'Repasser l’évaluation (Sans délai)',
    answerKeyTitle: (n) => `Corrigé & Explications Académiques (${n} affichées)`,
    correctPrefix: 'Réponse :',
    toolbarTitle: (pct) =>
      `Évaluation de compréhension (Seuil de réussite : ≥${pct}%)`,
    questionProgress: (cur, total, ans) =>
      `Question ${cur} sur ${total} (${ans}/${total} Réponses)`,
    passingScore: (pct) => `Seuil de réussite : ≥ ${pct}%`,
    previous: 'Précédent',
    nextQuestion: 'Question suivante',
    submitLabel: (ans, total) => `Soumettre l’évaluation (${ans}/${total})`,
    navigatorHeading: 'Navigateur de questions',
  },
};

/** Returns localized prompt, options, and explanation text for a quiz question. */
export function localizeQuestion(q: Question, language: SupportedLanguage) {
  const isFr = language === 'fr';
  return {
    prompt: isFr ? q.promptFr : q.promptEn,
    explanation: isFr ? q.explanationFr : q.explanationEn,
    options: isFr && q.optionsFrJson ? q.optionsFrJson : q.optionsJson,
  };
}
