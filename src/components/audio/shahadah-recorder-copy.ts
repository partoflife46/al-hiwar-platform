/**
 * Module architecture and API reference for
 *   `src/components/audio/shahadah-recorder-copy.ts`.
 *
 * Exported symbols:
 * - `RecorderBadgeState` (TypeAlias): recorder badge state definition.
 * - `RECORDER_BADGE_VARIANT` (Const): recorder badge variant definition.
 * - `RECORDER_COPY` (Const): recorder copy definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/audio/shahadah-recorder-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual copy and status badge mappings for the Shahadah audio recorder widget.
 */

import type { SupportedLanguage } from '@/lib/db/types';

/**
 * Type alias representing recorder badge state.
 */
export type RecorderBadgeState = 'idle' | 'recording' | 'recorded';

/**
 * Constant definition for recorder badge variant.
 */
export const RECORDER_BADGE_VARIANT: Record<
  RecorderBadgeState,
  'default' | 'destructive' | 'approved'
> = {
  idle: 'default',
  recording: 'destructive',
  recorded: 'approved',
};

/**
 * Constant definition for recorder copy.
 */
export const RECORDER_COPY: Record<
  SupportedLanguage,
  {
    badge: string;
    translation: string;
    retakeHeading: string;
    modelAudioPrompt: string;
    liveMicTab: string;
    uploadTab: string;
    statusLabels: Record<RecorderBadgeState, string>;
    startBtn: string;
    stopBtn: string;
    rerecordBtn: string;
    dropPrompt: string;
    formatsHint: string;
    changeFileBtn: string;
    demoSampleBtn: string;
    cancelBtn: string;
    submittingBtn: string;
    submitBtn: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    badge: 'Declaration of Faith • الشهادة',
    translation:
      '"I testify that there is no deity worthy of worship except Allah, and I testify that Muhammad is the Messenger of Allah."',
    retakeHeading: 'Pronunciation Guidance from Dialogist',
    modelAudioPrompt: 'Listen to authentic model pronunciation:',
    liveMicTab: 'Live Microphone',
    uploadTab: 'Upload Audio File',
    statusLabels: {
      idle: 'Awaiting Audio',
      recording: 'Recording Active',
      recorded: 'Ready for Review',
    },
    startBtn: 'Start Recording',
    stopBtn: 'Stop Recording',
    rerecordBtn: 'Re-record',
    dropPrompt: 'Click to choose an audio file or drag and drop',
    formatsHint: 'Supports: .webm, .mp4, .aac, .wav, .m4a, .mp3 (Max 25MB)',
    changeFileBtn: 'Change File',
    demoSampleBtn: 'Demo: Use Jean-Luc Sample Voice (18s)',
    cancelBtn: 'Cancel',
    submittingBtn: 'Submitting…',
    submitBtn: 'Submit Shahadah Declaration',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    badge: 'Attestation de Foi • الشهادة',
    translation:
      "« J'atteste qu'il n'y a de divinité digne d'adoration qu'Allah, et j'atteste que Muhammad est le Messager d'Allah. »",
    retakeHeading: 'Conseils de prononciation du spécialiste',
    modelAudioPrompt: 'Écouter la récitation de référence :',
    liveMicTab: 'Microphone en Direct',
    uploadTab: 'Importer un Fichier Audio',
    statusLabels: {
      idle: 'En attente d’audio',
      recording: 'Enregistrement en cours',
      recorded: 'Prêt pour examen',
    },
    startBtn: 'Démarrer l’enregistrement',
    stopBtn: 'Arrêter l’enregistrement',
    rerecordBtn: 'Réenregistrer',
    dropPrompt: 'Cliquez pour choisir un fichier audio ou glissez-le ici',
    formatsHint:
      'Formats acceptés : .webm, .mp4, .aac, .wav, .m4a, .mp3 (Max 25 Mo)',
    changeFileBtn: 'Changer de fichier',
    demoSampleBtn: 'Démo : Utiliser la voix modèle (18s)',
    cancelBtn: 'Annuler',
    submittingBtn: 'Envoi en cours…',
    submitBtn: 'Soumettre la Chahada',
  },
};
