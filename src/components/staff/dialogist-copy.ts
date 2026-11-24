/**
 * Module architecture and API reference for `src/components/staff/dialogist-copy.ts`.
 *
 * Exported symbols:
 * - `DIALOGIST_COPY` (Const): dialogist copy definition.
 * - `SUBMISSION_BADGE_VARIANT` (Const): submission badge variant definition.
 * - `resolveDialogistAudioSrc` (Function): resolve dialogist audio src definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/staff/dialogist-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings and audio/status helpers for the Dialogist staff tab.
 */

import type { ShahadahStatus, SupportedLanguage } from '@/lib/db/types';

/**
 * Constant definition for dialogist copy.
 */
export const DIALOGIST_COPY: Record<
  SupportedLanguage,
  {
    queueTitle: string;
    refreshAria: string;
    refreshTitle: string;
    emptyQueueTitle: string;
    emptyQueueDesc: string;
    refreshQueueBtn: string;
    seekerLabel: string;
    firstNameOnly: string;
    claimedBadge: string;
    unansweredBadge: string;
    intentLabel: string;
    claimBtn: string;
    auditReadOnly: string;
    draftTitle: string;
    shortcutAria: string;
    shortcutPlaceholder: string;
    categoryAria: string;
    catGreeting: string;
    catTheology: string;
    catShahadah: string;
    catMisconceptions: string;
    bodyEnPlaceholder: string;
    bodyFrPlaceholder: string;
    saveDraftBtn: string;
    chatTitle: string;
    privacyGuard: string;
    autoOptionsLabel: string;
    specialistLabel: string;
    quickRepliesTitle: string;
    replyAria: string;
    replyPlaceholder: string;
    sendBtn: string;
    shahadahQueuePrefix: string;
    humanVerification: string;
    submissionLabel: string;
    durationLabel: string;
    retakeBtn: string;
    validateBtn: string;
    noSubmissions: string;
    statusLabels: Record<ShahadahStatus, string>;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    queueTitle: 'Consultation Queue',
    refreshAria: 'Refresh consultation queue',
    refreshTitle: 'Refresh',
    emptyQueueTitle: 'No active consultations in queue',
    emptyQueueDesc: 'All incoming seeker inquiries are currently addressed.',
    refreshQueueBtn: 'Refresh Queue',
    seekerLabel: 'Seeker',
    firstNameOnly: 'First Name Only',
    claimedBadge: 'CLAIMED (1-to-1 Lock)',
    unansweredBadge: 'UNANSWERED',
    intentLabel: 'Intent',
    claimBtn: 'Claim Conversation (1-to-1 Lock)',
    auditReadOnly: 'Audit Mode (Read-Only)',
    draftTitle: 'Draft Predefined Quick Reply',
    shortcutAria: 'Quick reply shortcut',
    shortcutPlaceholder: '/shortcut',
    categoryAria: 'Quick reply category',
    catGreeting: 'GREETING',
    catTheology: 'THEOLOGY',
    catShahadah: 'SHAHADAH',
    catMisconceptions: 'MISCONCEPTIONS',
    bodyEnPlaceholder: 'English quick reply text…',
    bodyFrPlaceholder: 'French quick reply text (optional)…',
    saveDraftBtn: 'Save Quick Reply Draft',
    chatTitle: 'Active Specialist Chat Room',
    privacyGuard:
      'Privacy Guard Active: Seeker Surname & Email Hidden from Dialogist View',
    autoOptionsLabel: 'Automated Consultation Options Sent to Seeker',
    specialistLabel: 'Dialogist Specialist',
    quickRepliesTitle: '1-Click Predefined Quick Replies:',
    replyAria: 'Personalized scholarly response',
    replyPlaceholder: 'Write a personalized scholarly response…',
    sendBtn: 'Send',
    shahadahQueuePrefix: 'Shahadah Audio Pronunciation Review Queue',
    humanVerification: 'Human-in-the-Loop Verification',
    submissionLabel: 'Submission',
    durationLabel: 'Duration',
    retakeBtn: 'Request Retake + Model Audio',
    validateBtn: 'Validate Shahadah & Congratulate',
    noSubmissions: 'No Shahadah audio submissions pending review.',
    statusLabels: {
      VALIDATED: 'VALIDATED',
      RETAKE_REQUESTED: 'RETAKE_REQUESTED',
      PENDING_REVIEW: 'PENDING_REVIEW',
    },
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    queueTitle: 'File de Consultation',
    refreshAria: 'Actualiser la file de consultation',
    refreshTitle: 'Actualiser',
    emptyQueueTitle: 'Aucune consultation en attente',
    emptyQueueDesc: 'Toutes les demandes de dialogue ont été traitées.',
    refreshQueueBtn: 'Actualiser la file',
    seekerLabel: 'Chercheur',
    firstNameOnly: 'Prénom seul',
    claimedBadge: 'ASSIGNÉ (Verrou 1-à-1)',
    unansweredBadge: 'EN ATTENTE',
    intentLabel: 'Objet',
    claimBtn: 'Prendre en charge (Verrou 1-à-1)',
    auditReadOnly: 'Mode Audit (Lecture Seule)',
    draftTitle: 'Rédiger un Modèle de Réponse Rapide',
    shortcutAria: 'Raccourci',
    shortcutPlaceholder: '/raccourci',
    categoryAria: 'Catégorie du modèle',
    catGreeting: 'SALUTATION',
    catTheology: 'THÉOLOGIE',
    catShahadah: 'CHAHADA',
    catMisconceptions: 'IDÉES REÇUES',
    bodyEnPlaceholder: 'Texte en anglais…',
    bodyFrPlaceholder: 'Texte en français (optionnel)…',
    saveDraftBtn: 'Enregistrer le brouillon',
    chatTitle: 'Salle de Discussion Spécialiste Active',
    privacyGuard:
      'Protection des données active : le nom et l’e-mail du chercheur sont masqués',
    autoOptionsLabel: 'Options automatiques envoyées au chercheur',
    specialistLabel: 'Spécialiste Dialogiste',
    quickRepliesTitle: 'Réponses Rapides Approuvées (1 clic) :',
    replyAria: 'Réponse académique personnalisée',
    replyPlaceholder: 'Rédiger une réponse académique personnalisée…',
    sendBtn: 'Envoyer',
    shahadahQueuePrefix: 'File de Révision Audio de la Chahada',
    humanVerification: 'Vérification Humaine',
    submissionLabel: 'Soumission',
    durationLabel: 'Durée',
    retakeBtn: 'Demander reprise + Audio modèle',
    validateBtn: 'Valider la Chahada & Féliciter',
    noSubmissions:
      'Aucun enregistrement vocal de Chahada en attente pour le moment.',
    statusLabels: {
      VALIDATED: 'VALIDÉE',
      RETAKE_REQUESTED: 'REPRISE DEMANDÉE',
      PENDING_REVIEW: 'EN ATTENTE',
    },
  },
};

/**
 * Constant definition for submission badge variant.
 */
export const SUBMISSION_BADGE_VARIANT: Record<
  ShahadahStatus,
  'approved' | 'warning' | 'primary'
> = {
  VALIDATED: 'approved',
  RETAKE_REQUESTED: 'warning',
  PENDING_REVIEW: 'primary',
};

/** Resolves a safe playable audio URL, substituting fallback WAV for ephemeral blobs. */
export function resolveDialogistAudioSrc(url?: string | null): string {
  if (!url || url.startsWith('blob:')) {
    return '/audio/sample-shahadah-jean-luc.wav';
  }
  return url;
}
