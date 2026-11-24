/**
 * Module architecture and API reference for `src/components/staff/shahadah-review-copy.ts`.
 *
 * Exported symbols:
 * - `REVIEW_STATUS_VARIANT` (Const): review status variant definition.
 * - `REVIEW_PANEL_COPY` (Const): review panel copy definition.
 * - `resolveReviewAudioSrc` (Function): resolve review audio src definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/staff/shahadah-review-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings and badge styling maps for the Shahadah review console panel.
 */

import type { ShahadahStatus, SupportedLanguage } from '@/lib/db/types';

/**
 * Constant definition for review status variant.
 */
export const REVIEW_STATUS_VARIANT: Record<
  ShahadahStatus,
  'approved' | 'pending' | 'gold'
> = {
  VALIDATED: 'approved',
  RETAKE_REQUESTED: 'pending',
  PENDING_REVIEW: 'gold',
};

/**
 * Constant definition for review panel copy.
 */
export const REVIEW_PANEL_COPY: Record<
  SupportedLanguage,
  {
    heading: string;
    candidateLabel: string;
    durationLabel: string;
    readOnlyBanner: string;
    seekerVoiceTitle: string;
    candidateBadge: string;
    refTitle: string;
    refBadge: string;
    guidanceLabel: string;
    guidancePlaceholder: string;
    errRetakeRequired: string;
    requestRetakeBtn: string;
    validatedBtn: string;
    validateBtn: string;
    validatedBanner: (dateStr: string) => string;
    statusLabels: Record<ShahadahStatus, string>;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    heading: 'Shahadah Pronunciation Review Console',
    candidateLabel: 'Candidate:',
    durationLabel: 'Duration',
    readOnlyBanner:
      'Supervisor Read-Only Inspection Mode: Specialist actions are locked.',
    seekerVoiceTitle: 'Seeker’s Voice Declaration',
    candidateBadge: 'Candidate',
    refTitle: 'Authentic Model Reference',
    refBadge: 'Faculty of Sharia Benchmark',
    guidanceLabel: 'Pronunciation Guidance & Corrective Notes',
    guidancePlaceholder:
      'Enter pronunciation guidance or congratulations… (Mandatory for retake requests)',
    errRetakeRequired:
      'Please provide pronunciation guidance notes for the seeker before requesting a retake.',
    requestRetakeBtn: 'Request Retake',
    validatedBtn: 'Validated',
    validateBtn: 'Validate Shahadah',
    validatedBanner: (d) => `Shahadah declaration officially validated on ${d}.`,
    statusLabels: {
      VALIDATED: 'VALIDATED',
      RETAKE_REQUESTED: 'RETAKE_REQUESTED',
      PENDING_REVIEW: 'PENDING_REVIEW',
    },
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    heading: 'Console de Révision de Prononciation de la Chahada',
    candidateLabel: 'Candidat :',
    durationLabel: 'Durée',
    readOnlyBanner:
      'Mode inspection Superviseur (lecture seule) : Les actions du spécialiste sont verrouillées.',
    seekerVoiceTitle: 'Déclaration Vocale du Chercheur',
    candidateBadge: 'Candidat',
    refTitle: 'Référence Modèle Authentique',
    refBadge: 'Modèle Faculté de la Chari’a',
    guidanceLabel: 'Conseils de prononciation & Remarques',
    guidancePlaceholder:
      'Saisissez vos conseils de prononciation ou vos félicitations… (Obligatoire pour une demande de reprise)',
    errRetakeRequired:
      'Veuillez fournir des conseils de prononciation au chercheur avant de demander une reprise.',
    requestRetakeBtn: 'Demander une reprise',
    validatedBtn: 'Validée',
    validateBtn: 'Valider la Chahada',
    validatedBanner: (d) =>
      `Déclaration de Chahada officiellement validée le ${d}.`,
    statusLabels: {
      VALIDATED: 'VALIDÉE',
      RETAKE_REQUESTED: 'REPRISE DEMANDÉE',
      PENDING_REVIEW: 'EN ATTENTE',
    },
  },
};

/** Resolves a safe playable audio URL, substituting fallback WAV for ephemeral blobs. */
export function resolveReviewAudioSrc(url?: string | null): string {
  if (!url || url.startsWith('blob:')) {
    return '/audio/sample-shahadah-jean-luc.wav';
  }
  return url;
}
