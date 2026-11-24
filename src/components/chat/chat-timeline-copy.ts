/**
 * Module architecture and API reference for `src/components/chat/chat-timeline-copy.ts`.
 *
 * Exported symbols:
 * - `IntentOptionSpec` (Interface): intent option spec definition.
 * - `INTENT_OPTIONS` (Const): intent options definition.
 * - `TIMELINE_COPY` (Const): timeline copy definition.
 * - `SHAHADAH_BADGE_VARIANT` (Const): shahadah badge variant definition.
 * - `resolveAudioSrc` (Function): resolve audio src definition.
 * - `formatChatTime` (Function): format chat time definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/chat/chat-timeline-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings, intent options, and audio/time formatters for the chat timeline.
 */

import type { ConsultationIntent, ShahadahStatus, SupportedLanguage } from '@/lib/db/types';

/**
 * Type contract defining intent option spec.
 * Includes fields/members: id, titleEn, titleFr, arabic, transliteration, descEn.
 */
export interface IntentOptionSpec {
  /** id property. */
  id: ConsultationIntent;
  /** title en property. */
  titleEn: string;
  /** title fr property. */
  titleFr: string;
  /** arabic property. */
  arabic: string;
  /** transliteration property. */
  transliteration: string;
  /** desc en property. */
  descEn: string;
  /** desc fr property. */
  descFr: string;
  /** icon property. */
  icon: 'book' | 'heart';
}

/**
 * Constant definition for intent options.
 */
export const INTENT_OPTIONS: readonly IntentOptionSpec[] = [
  {
    id: 'LEARN_ABOUT_ISLAM',
    titleEn: 'I want to know more about Islam',
    titleFr: 'Je souhaite en savoir plus sur l’Islam',
    arabic: 'استكشاف الإسلام',
    transliteration: 'Istikshāf Al-Islām',
    descEn:
      'Private 1-on-1 dialogue with a certified Islamic scholar to ask open questions about Islamic theology, ethics, prayer, and daily practice.',
    descFr:
      'Dialogue privé individuel avec un spécialiste certifié pour poser vos questions sincères sur la théologie, la morale et la pratique.',
    icon: 'book',
  },
  {
    id: 'EMBRACE_ISLAM',
    titleEn: 'I want to embrace Islam (Declare Shahadah)',
    titleFr: 'Je souhaite embrasser l’Islam (Déclarer la Shahadah)',
    arabic: 'نطق الشهادة',
    transliteration: 'Nuṭq Ash-Shahādah',
    descEn:
      'Direct guidance from an Islamic specialist to pronounce the Shahadah (Testimony of Faith) and receive your official conversion record.',
    descFr:
      'Accompagnement bienveillant pour prononcer la Shahadah (Attestation de foi) et débuter votre parcours musulman officiel.',
    icon: 'heart',
  },
];

/**
 * Constant definition for timeline copy.
 */
export const TIMELINE_COPY: Record<
  SupportedLanguage,
  {
    sessionInit: string;
    validatedTitle: string;
    validatedSubtitle: string;
    completeProfile: string;
    emptyTitle: string;
    emptySubtitle: string;
    guideAuthor: string;
    guideBadge: string;
    guideIntro: string;
    selectedBadge: string;
    inactivityTitle: string;
    shahadahAudioTitle: string;
    requestRetake: string;
    validateShahadah: string;
    selectedIntentLabel: string;
    certifiedDialogist: string;
    dialogistBadge: string;
    modelRefAudio: string;
    statusLabels: Record<ShahadahStatus, string>;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    sessionInit: "Consultation Session Initialized • Al Hiwar Digital Da'wah Platform",
    validatedTitle:
      'Mubarak! All praise is due to Allah, your Shahadah is validated!',
    validatedSubtitle:
      'Complete your New Muslim profile to unlock official access to the Islamic Academy.',
    completeProfile: 'Complete Profile →',
    emptyTitle: 'Your Private Consultation Room is Open',
    emptySubtitle:
      'Ask your questions with sincerity and respect. A certified Islamic dialogist will respond shortly.',
    guideAuthor: 'Al Hiwar Consultation Guide',
    guideBadge: 'Consultation Options',
    guideIntro:
      'Assalamu alaykum! Welcome to your private consultation. Please choose one of the two options below so your specialist knows how best to assist you:',
    selectedBadge: 'Selected',
    inactivityTitle: 'Inactivity Notice (120s Watchdog)',
    shahadahAudioTitle: 'Shahadah Audio Declaration',
    requestRetake: 'Request Retake',
    validateShahadah: 'Validate Shahadah',
    selectedIntentLabel: 'Selected Consultation Option',
    certifiedDialogist: 'Certified Dialogist',
    dialogistBadge: 'Dialogist',
    modelRefAudio: 'Authentic Model Reference Audio',
    statusLabels: {
      VALIDATED: 'Validated',
      RETAKE_REQUESTED: 'Retake Requested',
      PENDING_REVIEW: 'Pending Review',
    },
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    sessionInit: 'Session de consultation initialisée • Plateforme Numérique Al Hiwar',
    validatedTitle: 'Mubarak ! Louange à Allah, votre Chahada a été validée !',
    validatedSubtitle:
      'Complétez votre profil de nouveau musulman pour débloquer votre accès officiel à l’Académie.',
    completeProfile: 'Compléter mon profil →',
    emptyTitle: 'Votre salon de consultation privée est ouvert',
    emptySubtitle:
      'Posez vos questions en toute sincérité. Un dialogiste certifié vous répondra sous peu.',
    guideAuthor: 'Guide de Consultation Al Hiwar',
    guideBadge: 'Options Automatiques',
    guideIntro:
      'Assalamu alaykum ! Bienvenue dans votre consultation privée. Veuillez sélectionner l’une des deux options ci-dessous afin d’informer votre spécialiste :',
    selectedBadge: 'Sélectionné',
    inactivityTitle: "Avis d'inactivité (Surveillance 120s)",
    shahadahAudioTitle: 'Déclaration Audio de la Chahada',
    requestRetake: 'Demander reprise',
    validateShahadah: 'Valider la Chahada',
    selectedIntentLabel: 'Objet sélectionné',
    certifiedDialogist: 'Spécialiste Certifié',
    dialogistBadge: 'Spécialiste',
    modelRefAudio: 'Audio de référence authentique',
    statusLabels: {
      VALIDATED: 'Validée',
      RETAKE_REQUESTED: 'Reprise demandée',
      PENDING_REVIEW: 'En attente de révision',
    },
  },
};

/**
 * Constant definition for shahadah badge variant.
 */
export const SHAHADAH_BADGE_VARIANT: Record<
  ShahadahStatus,
  'approved' | 'warning' | 'pending'
> = {
  VALIDATED: 'approved',
  RETAKE_REQUESTED: 'warning',
  PENDING_REVIEW: 'pending',
};

/** Resolves a safe playable audio URL, substituting fallback WAV for stale blob URLs. */
export function resolveAudioSrc(url?: string | null): string {
  if (!url || url.startsWith('blob:')) {
    return '/audio/sample-shahadah-jean-luc.wav';
  }
  return url;
}

/** Formats an ISO timestamp into localized HH:MM display format. */
export function formatChatTime(sentAt: string, isFr: boolean): string {
  return new Intl.DateTimeFormat(isFr ? 'fr-FR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(sentAt));
}
