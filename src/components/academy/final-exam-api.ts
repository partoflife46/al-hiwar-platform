/**
 * Module architecture and API reference for `src/components/academy/final-exam-api.ts`.
 *
 * Exported symbols:
 * - `FINAL_EXAM_COPY` (Const): final exam copy definition.
 * - `FinalExamLoadResult` (Interface): final exam load result definition.
 * - `loadFinalExamState` (Function): load final exam state definition.
 * - `submitFinalExamAnswers` (Function): submit final exam answers definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/services/academy-service`
 * - `@/lib/db/types`
 * - `@/components/academy/quiz-carousel`
 *
 * @module components/academy/final-exam-api
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * API helpers and bilingual strings for the 100-question capstone final examination.
 */

import { db } from '@/lib/db/in-memory-adapter';
import { academyService } from '@/lib/services/academy-service';
import type { Question, SupportedLanguage, UserSession } from '@/lib/db/types';
import type { QuizSubmissionResult } from '@/components/academy/quiz-carousel';

/**
 * Constant definition for final exam copy.
 */
export const FINAL_EXAM_COPY: Record<
  SupportedLanguage,
  {
    lockedTitle: string;
    lockedDesc: string;
    returnRoadmap: string;
    loading: string;
    badge: string;
    roadmapShort: string;
    heading: string;
    description: string;
    quizTitle: string;
    quizSubtitle: string;
    certCta: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    lockedTitle: '100-Question Capstone Final Exam is Locked',
    lockedDesc:
      'All 7 foundational module quizzes must be passed with ≥ 80% before taking the comprehensive Final Examination.',
    returnRoadmap: 'Return to Academy Roadmap',
    loading: 'Loading 100-Question Capstone Final Examination…',
    badge: 'Al Hiwar Islamic Academy • Capstone Examination',
    roadmapShort: 'Roadmap',
    heading: '100-Question Comprehensive Final Examination',
    description:
      'Achieve a passing score of ≥ 80% (at least 80 of 100 correct) to automatically generate your official Al Hiwar Islamic Academy Graduation & Conversion Certificate with QR verification.',
    quizTitle: 'Comprehensive Final Examination',
    quizSubtitle: '100 Questions • ≥ 80% Required (80/100)',
    certCta: 'View & Download Official PDF Certificate',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    lockedTitle: 'L’Examen Final de 100 questions est verrouillé',
    lockedDesc:
      'Les 7 quiz des modules fondamentaux doivent être validés avec ≥ 80 % avant de pouvoir passer l’Examen Final officiel.',
    returnRoadmap: 'Retour au programme de l’Académie',
    loading: 'Chargement de l’Examen Final de 100 questions…',
    badge: 'Académie Islamique Al Hiwar • Examen de Fin d’Études',
    roadmapShort: 'Programme',
    heading: 'Examen Final Approfondi de 100 Questions',
    description:
      'Obtenez un score d’au moins 80 % (au moins 80 bonnes réponses sur 100) pour générer automatiquement votre Certificat officiel d’Islam et de Diplômé de l’Académie Al Hiwar avec vérification par QR code.',
    quizTitle: 'Examen Final de l’Académie',
    quizSubtitle: '100 Questions • Score requis ≥ 80 % (80/100)',
    certCta: 'Voir & Télécharger le Certificat Officiel (PDF)',
  },
};

/**
 * Type contract defining final exam load result.
 * Includes fields/members: user, questions, certificateId, locked.
 */
export interface FinalExamLoadResult {
  /** user property. */
  user: UserSession | null;
  /** questions property. */
  questions: Question[];
  /** certificate id property. */
  certificateId: string | null;
  /** locked property. */
  locked: boolean;
}

/** Fetches the existing non-revoked certificate ID for a learner if already issued. */
async function fetchExistingCertId(userId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/academy?type=progress&userId=${userId}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.data?.certificate?.id) return json.data.certificate.id;
    }
  } catch {
    // ignore optional certificate lookup error
  }
  return null;
}

/** Loads the 100-question final exam for the signed-in learner with local fallback. */
export async function loadFinalExamState(): Promise<FinalExamLoadResult> {
  const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
  if (!sessionRes.ok) {
    return { user: null, /** Configuration group for questions. */
    questions: [], certificateId: null, locked: false };
  }
  const session: UserSession = (await sessionRes.json()).data;

  try {
    const acRes = await fetch(
      `/api/academy?type=final-exam&userId=${session.userId}`,
      { cache: 'no-store' }
    );
    const acJson = await acRes.json();
    if (acRes.ok && acJson.ok && Array.isArray(acJson.data)) {
      const certificateId = await fetchExistingCertId(session.userId);
      return {
        user: session,
        questions: acJson.data,
        certificateId,
        locked: false,
      };
    }
    if (acJson?.error) {
      return { user: session, /** Configuration group for questions. */
      questions: [], certificateId: null, locked: true };
    }
  } catch {
    // Fallback to local adapter below
  }

  const examRes = await academyService.getFinalExam(session.userId);
  if (!examRes.ok) {
    return { user: session, /** Configuration group for questions. */
    questions: [], certificateId: null, locked: true };
  }
  const cert = db.certificates.find(
    (c) => c.newMuslimId === session.userId && !c.isRevoked
  );
  return {
    user: session,
    questions: examRes.data,
    certificateId: cert?.id ?? null,
    locked: false,
  };
}

/** Submits final exam answers via `/api/academy` with local `academyService` fallback. */
export async function submitFinalExamAnswers(
  userId: string,
  answers: Record<string, number>
): Promise<QuizSubmissionResult> {
  try {
    const res = await fetch('/api/academy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SUBMIT_FINAL_EXAM', userId, answers }),
    });
    const json = await res.json();
    if (res.ok && json.ok && json.data?.attempt) {
      return {
        scorePercentage: json.data.attempt.scorePercentage,
        isPassed: json.data.attempt.isPassed,
        attemptId: json.data.attempt.id,
        certificateId: json.data.certificate?.id || null,
      };
    }
    if (json?.error) return { scorePercentage: 0, isPassed: false };
  } catch {
    // Fallback below
  }

  const fallback = await academyService.submitFinalExam(userId, answers);
  if (!fallback.ok) return { scorePercentage: 0, isPassed: false };
  const cert = db.certificates.find((c) => c.newMuslimId === userId && !c.isRevoked);
  return {
    scorePercentage: fallback.data.scorePercentage,
    isPassed: fallback.data.isPassed,
    attemptId: fallback.data.id,
    certificateId: cert?.id || null,
  };
}
