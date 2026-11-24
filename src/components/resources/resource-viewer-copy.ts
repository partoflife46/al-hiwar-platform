/**
 * Module architecture and API reference for
 *   `src/components/resources/resource-viewer-copy.ts`.
 *
 * Exported symbols:
 * - `RESOURCE_VIEWER_COPY` (Const): resource viewer copy definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/resources/resource-viewer-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual reader copy for the Islamic resource viewer modal.
 */

import type { SupportedLanguage } from '@/lib/db/types';

/**
 * Constant definition for resource viewer copy.
 */
export const RESOURCE_VIEWER_COPY: Record<
  SupportedLanguage,
  {
    libraryBrand: string;
    copyLinkTitle: string;
    copied: string;
    share: string;
    printTitle: string;
    print: string;
    closeAria: string;
    verifiedCouncil: string;
    audioPlayerHeading: string;
    restartTitle: string;
    authenticRecitation: string;
    audioProdTitle: string;
    audioComingSoon: string;
    audioProdDesc: string;
    videoProdTitle: string;
    videoComingSoon: string;
    videoProdDesc: string;
    keyTakeawaysTitle: string;
    authorizedFooter: string;
    printPdfBtn: string;
    closeReaderBtn: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    libraryBrand: 'Al-Hiwar Islamic Library',
    copyLinkTitle: 'Copy link',
    copied: 'Copied!',
    share: 'Share',
    printTitle: 'Print / Save',
    print: 'Print',
    closeAria: 'Close',
    verifiedCouncil: 'Verified by Sharia Council',
    audioPlayerHeading: 'Interactive Audio Player',
    restartTitle: 'Restart',
    authenticRecitation: 'Authentic Recitation',
    audioProdTitle: 'Audio Status: Studio Recording in Production',
    audioComingSoon: 'Audio Coming Soon',
    audioProdDesc:
      'The official high-fidelity studio recitation and audio commentary is currently in production with the Faculty of Islamic Studies. The verified verse-by-verse study text, Arabic script, and authentic commentary are provided below.',
    videoProdTitle: 'Video Status: Video Production in Progress',
    videoComingSoon: 'Video Coming Soon',
    videoProdDesc:
      'The high-definition visual documentary and lecture recording is currently in production with the academic media team. The verified study syllabus, historical timeline, and reference texts are provided below.',
    keyTakeawaysTitle: 'Key Study Takeaways',
    authorizedFooter:
      'Authorized for public educational and spiritual distribution',
    printPdfBtn: 'Print / Save as PDF',
    closeReaderBtn: 'Close Reader',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    libraryBrand: 'Bibliothèque Islamique Al-Hiwar',
    copyLinkTitle: 'Copier le lien',
    copied: 'Copié !',
    share: 'Partager',
    printTitle: 'Imprimer / Sauvegarder',
    print: 'Imprimer',
    closeAria: 'Fermer',
    verifiedCouncil: 'Vérifié par le Conseil Syariah',
    audioPlayerHeading: 'Lecteur Audio Interactif',
    restartTitle: 'Recommencer',
    authenticRecitation: 'Récitation Authentique',
    audioProdTitle: 'Statut Audio : Enregistrement Studio en Cours',
    audioComingSoon: 'Bientôt Disponible',
    audioProdDesc:
      'L’enregistrement audio haute fidélité (récitation mesurée et commentaire vocal) est actuellement en cours de finalisation par la Faculté des Études Islamiques. Le texte d’étude complet, la transcription verset par verset et les explications authentiques sont disponibles ci-dessous.',
    videoProdTitle: 'Statut Vidéo : Production Vidéo en Cours',
    videoComingSoon: 'Bientôt Disponible',
    videoProdDesc:
      'La production documentaire et audiovisuelle en haute définition est actuellement en cours de réalisation par l’équipe média académique. Le programme d’étude vérifié, la chronologie historique et les textes de référence sont consultables ci-dessous.',
    keyTakeawaysTitle: 'Points Clés de l’Étude',
    authorizedFooter:
      'Publication autorisée pour la diffusion éducative et spirituelle',
    printPdfBtn: 'Imprimer / Télécharger PDF',
    closeReaderBtn: 'Fermer la lecture',
  },
};
