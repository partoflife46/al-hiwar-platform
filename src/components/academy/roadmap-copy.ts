/**
 * Module architecture and API reference for `src/components/academy/roadmap-copy.ts`.
 *
 * Exported symbols:
 * - `ROADMAP_COPY` (Const): roadmap copy definition.
 * - `ModuleState` (TypeAlias): module state definition.
 * - `MODULE_CARD_CLASS` (Const): module card class definition.
 * - `MODULE_NODE_CLASS` (Const): module node class definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/academy/roadmap-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings and card styling helpers for the Islamic Academy roadmap.
 */

import type { SupportedLanguage } from '@/lib/db/types';

/**
 * Constant definition for roadmap copy.
 */
export const ROADMAP_COPY: Record<
  SupportedLanguage,
  {
    badge: string;
    heading: string;
    subtitle: string;
    progressLabel: (completed: number) => string;
    completedSuffix: string;
    guestNotice: string;
    signInBtn: string;
    modulesHeading: string;
    unlockHint: string;
    passedBadge: string;
    activeBadge: string;
    lockedBadge: string;
    readingPill: string;
    audioPill: string;
    pdfPill: string;
    videoPill: string;
    reviewBtn: string;
    studyBtn: string;
    finalExamTitle: string;
    graduatedBadge: string;
    unlockedBadge: string;
    prereqBadge: string;
    finalExamDesc: string;
    passedCertified: string;
    viewCertBtn: string;
    takeFinalBtn: string;
    completeModulesBtn: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    badge: 'Al Hiwar Islamic Academy',
    heading: 'Al Hiwar Islamic Academy Curriculum Roadmap',
    subtitle:
      'A linear progression of foundational Islamic knowledge. Each module must be studied in sequence, terminating in a 20-question comprehension quiz (passing threshold ≥ 80%).',
    progressLabel: (c) => `Curriculum Progress: ${c} of 7 Modules Passed`,
    completedSuffix: 'Completed',
    guestNotice:
      'You are exploring the Academy syllabus as a Guest. Sign in to your Certified Graduate account to view full 100% curriculum completion and official certificate.',
    signInBtn: 'Sign In to Your Account',
    modulesHeading: 'Curriculum Modules (1–7)',
    unlockHint:
      'Unlock each module sequentially by passing the previous quiz (≥ 80%)',
    passedBadge: 'Passed (≥80%)',
    activeBadge: 'Active Module',
    lockedBadge: 'Locked',
    readingPill: 'Interactive Reading',
    audioPill: 'Audio Recitation',
    pdfPill: 'PDF Study Guide',
    videoPill: 'Video Lecture',
    reviewBtn: 'Review Module',
    studyBtn: 'Study Module',
    finalExamTitle: 'Capstone 100-Question Final Comprehensive Exam',
    graduatedBadge: 'Graduated',
    unlockedBadge: 'Unlocked',
    prereqBadge: 'Prerequisites Required',
    finalExamDesc:
      'Evaluates all foundational modules. Passing score of ≥ 80% awards the dynamic verifiable Al Hiwar Islamic Academy vector PDF certificate.',
    passedCertified: 'Passed & Certified',
    viewCertBtn: 'View Official Certificate',
    takeFinalBtn: 'Take Final Exam',
    completeModulesBtn: 'Complete Modules 1–7 to Unlock',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    badge: 'Académie Islamique Al Hiwar',
    heading: 'Programme d’Études de l’Académie Islamique',
    subtitle:
      'Une progression linéaire des connaissances fondamentales de l’Islam. Chaque module doit être étudié dans l’ordre et se termine par un quiz de 20 questions (seuil de réussite ≥ 80%).',
    progressLabel: (c) =>
      `Progression du cursus : ${c} sur 7 modules validés`,
    completedSuffix: 'Complété',
    guestNotice:
      'Vous explorez le programme en tant qu’invité. Connectez-vous à votre compte pour accéder à votre progression officielle et à votre certificat.',
    signInBtn: 'Se connecter',
    modulesHeading: 'Modules du cursus (1 à 7)',
    unlockHint:
      'Débloquez chaque module en validant le quiz précédent (≥ 80 %)',
    passedBadge: 'Validé (≥80%)',
    activeBadge: 'Module en cours',
    lockedBadge: 'Verrouillé',
    readingPill: 'Lecture interactive',
    audioPill: 'Récitation audio',
    pdfPill: 'Guide d’étude PDF',
    videoPill: 'Cours vidéo',
    reviewBtn: 'Réviser le module',
    studyBtn: 'Étudier le module',
    finalExamTitle: 'Examen Final Approfondi de 100 Questions',
    graduatedBadge: 'Diplômé',
    unlockedBadge: 'Débloqué',
    prereqBadge: 'Prérequis requis',
    finalExamDesc:
      'Évalue l’ensemble des modules fondamentaux. Un score ≥ 80 % délivre votre certificat officiel PDF vérifiable de l’Académie Islamique Al Hiwar.',
    passedCertified: 'Réussi & Certifié',
    viewCertBtn: 'Voir le Certificat Officiel',
    takeFinalBtn: 'Passer l’Examen Final',
    completeModulesBtn: 'Validez les Modules 1 à 7 pour débloquer',
  },
};

/**
 * Type alias representing module state.
 */
export type ModuleState = 'completed' | 'current' | 'locked';

/**
 * Constant definition for module card class.
 */
export const MODULE_CARD_CLASS: Record<ModuleState, string> = {
  current: 'border-[#006C9C] bg-white shadow-md ring-2 ring-[#006C9C]/20',
  completed: 'border-[#0D7A5F]/30 bg-[#F8FAFC]',
  locked: 'border-[#E2E8F0] bg-[#F8FAFC]',
};

/**
 * Constant definition for module node class.
 */
export const MODULE_NODE_CLASS: Record<ModuleState, string> = {
  completed: 'bg-[#0D7A5F] text-white',
  current: 'bg-[#006C9C] text-white ring-4 ring-[#1C7890]/20',
  locked: 'bg-slate-200 text-slate-700',
};
