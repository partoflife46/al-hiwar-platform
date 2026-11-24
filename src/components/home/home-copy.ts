/**
 * Module architecture and API reference for `src/components/home/home-copy.ts`.
 *
 * Exported symbols:
 * - `RoleActionConfig` (Interface): role action config definition.
 * - `CATEGORY_LABELS` (Const): category labels definition.
 * - `ROLE_ACTIONS` (Const): role actions definition.
 * - `HOME_COPY` (Const): home copy definition.
 * - `formatHomeResourceType` (Function): format home resource type definition.
 * - `formatHomeCategory` (Function): format home category definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/home/home-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings, role actions, and landing-page feature configurations for HomePage.
 */

import type { SupportedLanguage, UserRole } from '@/lib/db/types';

/**
 * Type contract defining role action config.
 * Includes fields/members: role, titleEn, titleFr, primaryActionLabelEn,
 * primaryActionLabelFr, primaryActionHref.
 */
export interface RoleActionConfig {
  /** role property. */
  role: UserRole;
  /** title en property. */
  titleEn: string;
  /** title fr property. */
  titleFr: string;
  /** primary action label en property. */
  primaryActionLabelEn: string;
  /** primary action label fr property. */
  primaryActionLabelFr: string;
  /** primary action href property. */
  primaryActionHref: string;
}

/**
 * Constant definition for category labels.
 */
export const CATEGORY_LABELS: Record<string, { en: string; fr: string }> = {
  QURAN: { en: "Noble Qur'an", fr: 'Noble Coran' },
  PROPHET: { en: 'Prophet Muhammad ﷺ', fr: 'Prophète Muhammad ﷺ' },
  PILLARS: { en: 'Pillars of Islam', fr: 'Piliers de l’Islam' },
  ETHICS: { en: 'Islamic Ethics', fr: 'Éthique Islamique' },
  MISCONCEPTIONS: { en: 'Misconceptions', fr: 'Idées Reçues' },
};

/**
 * Constant definition for role actions.
 */
export const ROLE_ACTIONS: Record<UserRole, RoleActionConfig> = {
  VISITOR: {
    role: 'VISITOR',
    titleEn: 'Public Explorer',
    titleFr: 'Explorateur Public',
    primaryActionLabelEn: 'Explore Islamic Library',
    primaryActionLabelFr: 'Explorer la Bibliothèque',
    primaryActionHref: '/resources',
  },
  NON_MUSLIM: {
    role: 'NON_MUSLIM',
    titleEn: 'Inquirer & Truth Seeker',
    titleFr: 'Chercheur de Vérité',
    primaryActionLabelEn: 'Open Consultation Room',
    primaryActionLabelFr: 'Ouvrir la Consultation',
    primaryActionHref: '/dialogue',
  },
  DIALOGIST: {
    role: 'DIALOGIST',
    titleEn: 'Sharia Dialogue Specialist',
    titleFr: 'Spécialiste Dialogiste',
    primaryActionLabelEn: 'Open Consultation Queue',
    primaryActionLabelFr: 'Ouvrir la File des Consultations',
    primaryActionHref: '/dialogue',
  },
  INSTRUCTOR: {
    role: 'INSTRUCTOR',
    titleEn: 'Faculty Curriculum Author',
    titleFr: 'Enseignant de l’Académie',
    primaryActionLabelEn: 'Open Curriculum Studio',
    primaryActionLabelFr: 'Ouvrir le Studio Pédagogique',
    primaryActionHref: '/staff',
  },
  SUPERVISOR: {
    role: 'SUPERVISOR',
    titleEn: 'Head of Sharia Supervision',
    titleFr: 'Superviseur de la Chari’a',
    primaryActionLabelEn: 'Open Supervision Console',
    primaryActionLabelFr: 'Ouvrir la Supervision',
    primaryActionHref: '/staff',
  },
  NEW_MUSLIM: {
    role: 'NEW_MUSLIM',
    titleEn: 'New Muslim & Academy Student',
    titleFr: 'Nouveau Musulman & Étudiant',
    primaryActionLabelEn: 'Resume Academy Study',
    primaryActionLabelFr: 'Reprendre les Cours',
    primaryActionHref: '/academy',
  },
  ADMINISTRATOR: {
    role: 'ADMINISTRATOR',
    titleEn: 'Platform Administrator',
    titleFr: 'Administrateur Plateforme',
    primaryActionLabelEn: 'Open Operations Console',
    primaryActionLabelFr: 'Ouvrir la Console Admin',
    primaryActionHref: '/staff',
  },
};

/**
 * Constant definition for home copy.
 */
export const HOME_COPY: Record<
  SupportedLanguage,
  {
    signedInAs: string;
    heroBadge: string;
    heroHeading: string;
    heroLead: string;
    heroSublead: string;
    registerCta: string;
    signInCta: string;
    browseLibraryCta: string;
    highlights: Array<{ icon: 'chat' | 'mic' | 'grad' | 'award'; title: string; desc: string }>;
    stagesHeading: string;
    stagesSubheading: string;
    stages: Array<{
      step: string;
      title: string;
      desc: string;
      ctaLabel: string;
      href: string;
      tone: 'blue' | 'gold' | 'green';
    }>;
    featuredHeading: string;
    featuredSubheading: string;
    exploreLibraryBtn: string;
    verifiedResource: string;
    readPlayLink: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    signedInAs: 'Signed in as',
    heroBadge: 'Al Hiwar Digital Da’wah & Learning Platform',
    heroHeading: 'Al Hiwar Digital Da’wah & Learning Platform',
    heroLead:
      'Explore Authentic Islamic Knowledge, Converse Privately with a Certified Specialist, and Complete the Al Hiwar Islamic Academy.',
    heroSublead:
      'Developed under verified scholarly supervision, Al Hiwar guides non-Muslim truth-seekers (18+) through private 1-to-1 consultation, Shahadah audio validation, and accredited certification.',
    registerCta: 'Register Seeker Account (18+)',
    signInCta: 'Sign In',
    browseLibraryCta: 'Browse Islamic Library',
    highlights: [
      {
        icon: 'chat',
        title: '1-to-1 Private Chat',
        desc: 'Exclusive Dialogist lock, first-name privacy, and 120s reassurance.',
      },
      {
        icon: 'mic',
        title: 'Shahadah Validation',
        desc: 'Authentic Arabic audio + specialist pronunciation verification.',
      },
      {
        icon: 'grad',
        title: 'Al Hiwar Islamic Academy',
        desc: 'Sequential lessons, 20-question quizzes (≥ 80%), and 100-question Final Exam.',
      },
      {
        icon: 'award',
        title: 'Verifiable Credential',
        desc: 'Dynamic A4 Landscape certificate stamped with QR verification hash.',
      },
    ],
    stagesHeading: 'How Al Hiwar Guides Truth Seekers',
    stagesSubheading:
      'A dignified, scholarly progression from initial inquiry to accredited Islamic certification.',
    stages: [
      {
        step: 'Step 01',
        title: 'Discover & Private Consultation',
        desc: 'Explore authenticated open-access resources, or register an adult (18+) account to start a confidential 1-to-1 dialogue with a certified Sharia specialist.',
        ctaLabel: 'Register Seeker (18+)',
        href: '/register',
        tone: 'blue',
      },
      {
        step: 'Step 02',
        title: 'Pronounce the Shahadah',
        desc: 'Listen to authentic Arabic reference recordings, record your spoken testimony of faith, and receive validation from faculty scholars with pronunciation guidance.',
        ctaLabel: 'Shahadah Validation Room',
        href: '/dialogue',
        tone: 'gold',
      },
      {
        step: 'Step 03',
        title: 'Al Hiwar Islamic Academy & Certificate',
        desc: 'Study foundational theology, prayer, and ethics. Pass sequential 20-question quizzes (≥ 80%) to unlock the 100-question Final Exam and receive your official certificate.',
        ctaLabel: 'Al Hiwar Islamic Academy',
        href: '/academy',
        tone: 'green',
      },
    ],
    featuredHeading: 'Featured Public Islamic Resource Library',
    featuredSubheading:
      'Open access in English and French across Qur’an, Prophet Muhammad ﷺ, Pillars of Islam, Ethics, and Misconceptions.',
    exploreLibraryBtn: 'Explore Full Library',
    verifiedResource: 'Verified Resource',
    readPlayLink: 'Read / Play →',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    signedInAs: 'Connecté en tant que',
    heroBadge: 'Plateforme Numérique de Da’wah & d’Enseignement Al Hiwar',
    heroHeading: 'Plateforme Al Hiwar',
    heroLead:
      'Découvrez la beauté authentique de l’Islam, dialoguez en privé avec un spécialiste certifié et rejoignez l’Al Hiwar Islamic Academy.',
    heroSublead:
      'Développé sous supervision académique et religieuse rigoureuse, Al Hiwar accompagne les chercheurs de vérité non-musulmans (18+) par une consultation privée individuelle, la validation audio de la Chahada et une certification accréditée.',
    registerCta: 'S’inscrire (18+ Ans)',
    signInCta: 'Se Connecter',
    browseLibraryCta: 'Bibliothèque Publique',
    highlights: [
      {
        icon: 'chat',
        title: 'Dialogue Privé 1-à-1',
        desc: 'Spécialiste exclusif, respect du prénom et délai rassurant de 120s.',
      },
      {
        icon: 'mic',
        title: 'Validation de la Chahada',
        desc: 'Audio arabe authentique et vérification humaine de la prononciation.',
      },
      {
        icon: 'grad',
        title: 'Académie Islamique Al Hiwar',
        desc: 'Leçons progressives, quiz de 20 questions (≥ 80 %) et examen final de 100 questions.',
      },
      {
        icon: 'award',
        title: 'Certificat Vérifiable',
        desc: 'Diplôme A4 paysage officiel avec sceau, QR code et empreinte cryptographique.',
      },
    ],
    stagesHeading: 'Comment Al Hiwar accompagne les chercheurs de vérité',
    stagesSubheading:
      'Une progression digne et académique, du premier questionnement jusqu’à la certification officielle.',
    stages: [
      {
        step: 'Étape 01',
        title: 'Découverte & Consultation Privée',
        desc: 'Explorez les ressources islamiques en accès libre, ou créez un compte adulte (18+) pour démarrer un dialogue confidentiel individuel avec un spécialiste.',
        ctaLabel: 'S’inscrire (18+ Ans)',
        href: '/register',
        tone: 'blue',
      },
      {
        step: 'Étape 02',
        title: 'Déclaration de la Chahada',
        desc: 'Écoutez les enregistrements arabes de référence, enregistrez votre profession de foi vocale et recevez la validation de nos spécialistes.',
        ctaLabel: 'Espace de Validation de la Chahada',
        href: '/dialogue',
        tone: 'gold',
      },
      {
        step: 'Étape 03',
        title: 'Académie Islamique & Certificat',
        desc: 'Étudiez la théologie fondamentale, la prière et l’éthique. Validez les quiz séquentiels (≥ 80 %) pour débloquer l’examen final et obtenir votre certificat officiel.',
        ctaLabel: 'Académie Islamique Al Hiwar',
        href: '/academy',
        tone: 'green',
      },
    ],
    featuredHeading: 'Sélection de la Bibliothèque Islamique Publique',
    featuredSubheading:
      'Accès ouvert en français et en anglais : Coran, Prophète Muhammad ﷺ, Piliers de l’Islam, Éthique et Réponses aux Idées Reçues.',
    exploreLibraryBtn: 'Explorer toute la Bibliothèque',
    verifiedResource: 'Ressource Vérifiée',
    readPlayLink: 'Lire / Consulter →',
  },
};

/**
 * Constant definition for fr type labels.
 */
const FR_TYPE_LABELS: Record<string, string> = {
  TEXT: 'TEXTE',
  VIDEO: 'VIDÉO',
};

/** Returns a localized resource format badge label. */
export function formatHomeResourceType(type: string, isFr: boolean): string {
  return isFr ? FR_TYPE_LABELS[type] || type : type;
}

/** Returns a localized resource category label. */
export function formatHomeCategory(category: string, isFr: boolean): string {
  const entry = CATEGORY_LABELS[category];
  if (!entry) return category;
  return isFr ? entry.fr : entry.en;
}
