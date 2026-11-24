/**
 * Module architecture and API reference for `src/components/academy/lesson-reader-copy.ts`.
 *
 * Exported symbols:
 * - `LessonLoadOutcome` (TypeAlias): lesson load outcome definition.
 * - `loadLessonDetailForUser` (Function): load lesson detail for user definition.
 * - `LESSON_READER_COPY` (Const): lesson reader copy definition.
 *
 * Internal dependencies:
 * - `@/lib/services/academy-service`
 * - `@/lib/db/types`
 *
 * @module components/academy/lesson-reader-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings and lesson-loading helpers for the Academy lesson reader page.
 */

import { academyService } from '@/lib/services/academy-service';
import type { LearningContent, SupportedLanguage, UserSession } from '@/lib/db/types';

/**
 * Type alias representing lesson load outcome.
 */
export type LessonLoadOutcome =
  | { status: 'OK'; lesson: LearningContent; user: UserSession }
  | { status: 'LOCKED' }
  | { status: 'NOT_FOUND' }
  | { status: 'UNAUTHENTICATED' };

/** Loads a sequential curriculum lesson from `/api/academy` with local service fallback. */
export async function loadLessonDetailForUser(
  lessonNumber: number
): Promise<LessonLoadOutcome> {
  const res = await fetch('/api/auth/session', { cache: 'no-store' });
  if (!res.ok) return { status: 'UNAUTHENTICATED' };
  const session: UserSession = (await res.json()).data;

  try {
    const acRes = await fetch(
      `/api/academy?type=lesson&lessonNumber=${lessonNumber}&userId=${session.userId}`,
      { cache: 'no-store' }
    );
    const acJson = await acRes.json();
    if (acRes.ok && acJson.ok && acJson.data) {
      return { status: 'OK', lesson: acJson.data, user: session };
    }
    if (acJson?.error) {
      return {
        status: acJson.error === 'LESSON_LOCKED' ? 'LOCKED' : 'NOT_FOUND',
      };
    }
  } catch {
    // Fallback to local adapter below
  }

  const detail = await academyService.getLessonDetail(session.userId, lessonNumber);
  if (!detail.ok) {
    return {
      status: detail.error === 'LESSON_LOCKED' ? 'LOCKED' : 'NOT_FOUND',
    };
  }
  return { status: 'OK', lesson: detail.data, user: session };
}

/**
 * Constant definition for lesson reader copy.
 */
export const LESSON_READER_COPY: Record<
  SupportedLanguage,
  {
    lockedHeading: (n: number) => string;
    lockedBody: (prev: number) => string;
    returnRoadmap: string;
    goToModule: (prev: number) => string;
    notFoundHeading: (n: number) => string;
    notFoundBody: string;
    returnCurriculum: string;
    roadmapBtn: string;
    moduleOf7: (n: number) => string;
    editionLabel: string;
    facultySub: string;
    audioHeading: string;
    audioUnavailable: string;
    pdfHeading: string;
    pdfSub: string;
    downloadBtn: string;
    videoHeading: string;
    videoUnavailable: string;
    quizCtaHeading: string;
    quizCtaBody: (cur: number, next: number) => string;
    quizCtaBtn: (cur: number) => string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    lockedHeading: (n) => `Module ${n} is Currently Locked`,
    lockedBody: (prev) =>
      `To maintain academic and spiritual foundation, lessons must be studied in sequence. Please pass the Module ${prev} Quiz with a score of 80% or higher to unlock this module.`,
    returnRoadmap: 'Return to Roadmap',
    goToModule: (prev) => `Go to Module ${prev}`,
    notFoundHeading: (n) => `Module ${n} Not Found`,
    notFoundBody:
      'The requested curriculum module does not exist or has not been approved.',
    returnCurriculum: 'Return to Curriculum Roadmap',
    roadmapBtn: 'Curriculum Roadmap',
    moduleOf7: (n) => `Module ${n} of 7`,
    editionLabel: 'English Edition',
    facultySub: 'Faculty of Sharia & Da’wah Studies • Al Hiwar Islamic Academy',
    audioHeading: 'Audio Recitation & Commentary',
    audioUnavailable: 'Audio recitation for this module is currently being prepared.',
    pdfHeading: 'Summary PDF Study Guide',
    pdfSub: 'Printable summary notes & key terms',
    downloadBtn: 'Download',
    videoHeading: 'Faculty Video Lecture',
    videoUnavailable: 'Video lecture for this module is currently being prepared.',
    quizCtaHeading: 'Ready for Comprehension Evaluation?',
    quizCtaBody: (cur, next) =>
      `Complete the 20-question card quiz for Module ${cur}. Achieve ≥ 80% to unlock Module ${next}.`,
    quizCtaBtn: (cur) => `Proceed to Module ${cur} Quiz`,
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    lockedHeading: (n) => `Le Module ${n} est actuellement verrouillé`,
    lockedBody: (prev) =>
      `Pour préserver la progression pédagogique, les leçons doivent être étudiées dans l’ordre. Veuillez réussir le Quiz du Module ${prev} avec un score d’au moins 80 % pour débloquer ce module.`,
    returnRoadmap: 'Retour au programme',
    goToModule: (prev) => `Aller au Module ${prev}`,
    notFoundHeading: (n) => `Module ${n} introuvable`,
    notFoundBody:
      'Le module demandé n’existe pas ou n’a pas encore été validé.',
    returnCurriculum: 'Retour au programme',
    roadmapBtn: 'Programme de l’Académie',
    moduleOf7: (n) => `Module ${n} sur 7`,
    editionLabel: 'Version Française',
    facultySub:
      'Faculté de la Chari’a & Études Islamiques • Académie Islamique Al Hiwar',
    audioHeading: 'Récitation Audio & Commentaires',
    audioUnavailable:
      'La récitation audio pour ce module est en cours de préparation.',
    pdfHeading: 'Fiche de Synthèse PDF',
    pdfSub: 'Notes récapitulatives imprimables',
    downloadBtn: 'Télécharger',
    videoHeading: 'Cours Vidéo de la Faculté',
    videoUnavailable:
      'Le cours vidéo pour ce module est en cours de préparation.',
    quizCtaHeading: 'Prêt pour l’évaluation des connaissances ?',
    quizCtaBody: (cur, next) =>
      `Complétez le quiz de 20 questions du Module ${cur}. Obtenez ≥ 80 % pour débloquer le Module ${next}.`,
    quizCtaBtn: (cur) => `Passer le Quiz du Module ${cur}`,
  },
};
