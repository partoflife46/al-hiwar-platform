/**
 * Module architecture and API reference for
 *   `src/components/resources/resources-page-copy.ts`.
 *
 * Exported symbols:
 * - `RESOURCE_CATEGORIES` (Const): resource categories definition.
 * - `RESOURCE_FORMATS` (Const): resource formats definition.
 * - `localizeResourceFormat` (Function): localize resource format definition.
 * - `localizeResourceCategory` (Function): localize resource category definition.
 * - `RESOURCES_PAGE_COPY` (Const): resources page copy definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/resources/resources-page-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings, categories, and format helpers for the Islamic Resource Library page.
 */

import type {
  ResourceCategory,
  ResourceType,
  SupportedLanguage,
} from '@/lib/db/types';

/**
 * Constant definition for resource categories.
 */
export const RESOURCE_CATEGORIES: readonly {
  value: 'ALL' | ResourceCategory;
  labelEn: string;
  labelFr: string;
}[] = [
  { value: 'ALL', labelEn: 'All Categories', labelFr: 'Toutes les catégories' },
  { value: 'QURAN', labelEn: "Noble Qur'an", labelFr: 'Noble Coran' },
  {
    value: 'PROPHET',
    labelEn: 'Prophet Muhammad ﷺ',
    labelFr: 'Prophète Muhammad ﷺ',
  },
  {
    value: 'PILLARS',
    labelEn: 'Pillars of Islam & Faith',
    labelFr: 'Piliers de l’Islam et de la Foi',
  },
  {
    value: 'ETHICS',
    labelEn: 'Islamic Values & Ethics',
    labelFr: 'Valeurs et Éthique',
  },
  {
    value: 'MISCONCEPTIONS',
    labelEn: 'Common Misconceptions',
    labelFr: 'Idées Reçues Courantes',
  },
];

/**
 * Constant definition for resource formats.
 */
export const RESOURCE_FORMATS: readonly ('ALL' | ResourceType)[] = [
  'ALL',
  'TEXT',
  'PDF',
  'AUDIO',
  'VIDEO',
];

/**
 * Constant definition for fr format labels.
 */
const FR_FORMAT_LABELS: Record<'ALL' | ResourceType, string> = {
  ALL: 'TOUS',
  TEXT: 'TEXTE',
  PDF: 'PDF',
  AUDIO: 'AUDIO',
  VIDEO: 'VIDÉO',
};

/** Localizes a resource format badge string for EN/FR display. */
export function localizeResourceFormat(
  fmt: 'ALL' | ResourceType,
  isFr: boolean
): string {
  return isFr ? FR_FORMAT_LABELS[fmt] : fmt;
}

/** Localizes a resource category identifier for EN/FR display. */
export function localizeResourceCategory(
  category: ResourceCategory,
  isFr: boolean
): string {
  const entry = RESOURCE_CATEGORIES.find((c) => c.value === category);
  if (!entry) return category;
  return isFr ? entry.labelFr : entry.labelEn;
}

/**
 * Constant definition for resources page copy.
 */
export const RESOURCES_PAGE_COPY: Record<
  SupportedLanguage,
  {
    badge: string;
    heading: string;
    subtitle: string;
    searchPlaceholder: string;
    categoryLabel: string;
    formatLabel: string;
    showingCount: (shown: number, total: number) => string;
    verifiedResource: string;
    readViewPrefix: string;
    questionHeading: string;
    questionDesc: string;
    startConsultBtn: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    badge: 'Verified Islamic Library',
    heading: 'Authentic Digital Resources',
    subtitle:
      'Academic monographs, foundational texts, and multimedia recordings certified by the Islamic University of Madinah for sincere exploration of Islam.',
    searchPlaceholder: 'Search by title, keyword, or description…',
    categoryLabel: 'Category:',
    formatLabel: 'Format:',
    showingCount: (shown, total) =>
      `Showing ${shown} of ${total} verified resources`,
    verifiedResource: 'Verified Resource',
    readViewPrefix: 'Read / View',
    questionHeading: 'Have a Personal Question About Islam?',
    questionDesc:
      'Connect 1-to-1 with a qualified Sharia specialist from the Al Hiwar Digital Da’wah Platform.',
    startConsultBtn: 'Start Private Consultation',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    badge: 'Bibliothèque Islamique Vérifiée',
    heading: 'Ressources Numériques Authentiques',
    subtitle:
      'Publications académiques, textes fondamentaux et enregistrements multimédias certifiés par l’Université Islamique de Médine pour la compréhension sincère de l’Islam.',
    searchPlaceholder: 'Rechercher par titre, mot-clé ou description…',
    categoryLabel: 'Catégorie :',
    formatLabel: 'Format :',
    showingCount: (shown, total) =>
      `Affichage de ${shown} sur ${total} ressources vérifiées`,
    verifiedResource: 'Ressource Vérifiée',
    readViewPrefix: 'Lire / Consulter',
    questionHeading: 'Vous avez une question personnelle sur l’Islam ?',
    questionDesc:
      'Échangez individuellement en privé avec un spécialiste qualifié de la plateforme Al Hiwar.',
    startConsultBtn: 'Démarrer une consultation privée',
  },
};
