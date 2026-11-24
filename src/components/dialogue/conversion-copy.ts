/**
 * Module architecture and API reference for `src/components/dialogue/conversion-copy.ts`.
 *
 * Exported symbols:
 * - `CONVERSION_COPY` (Const): conversion copy definition.
 * - `validateConversionFields` (Function): validate conversion fields definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/dialogue/conversion-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings and validation helpers for the post-Shahadah conversion modal.
 */

import type { Gender, SupportedLanguage } from '@/lib/db/types';

/**
 * Constant definition for conversion copy.
 */
export const CONVERSION_COPY: Record<
  SupportedLanguage,
  {
    basmalahTrans: string;
    witnessBadge: string;
    welcomeHeading: (name: string) => string;
    welcomeBody: string;
    formHeading: string;
    formDesc: string;
    nationalityLabel: string;
    genderLabel: string;
    maleOption: string;
    femaleOption: string;
    phoneLabel: string;
    enrollingBtn: string;
    submitBtn: string;
    errNationality: string;
    errGender: string;
    errPhone: string;
    errSubmit: string;
    enrolledHeading: string;
    enrolledDesc: string;
    module1Title: string;
    module1Sub: string;
    unlockedBadge: string;
    enterAcademyBtn: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    basmalahTrans:
      '“In the Name of Allah, the Most Gracious, the Most Merciful”',
    witnessBadge: 'Official Al Hiwar Academic Witness',
    welcomeHeading: (name) => `Mabrooq! Welcome to Islam, ${name}!`,
    welcomeBody:
      'Your declaration of faith (Shahadah) has been witnessed and verified by the faculty dialogist. May Allah bless your path with peace, knowledge, and righteous deeds.',
    formHeading: 'Mandatory Post-Conversion Profile',
    formDesc:
      'Please complete the required demographic details below to officially enroll in the Al Hiwar Islamic Academy.',
    nationalityLabel: 'Nationality / Country of Residence',
    genderLabel: 'Gender',
    maleOption: 'Brother (Male)',
    femaleOption: 'Sister (Female)',
    phoneLabel: 'Phone Number (WhatsApp Contact)',
    enrollingBtn: 'Enrolling in Academy…',
    submitBtn: 'Complete Profile & Unlock Academy',
    errNationality:
      'Nationality is required for institutional certification.',
    errGender: 'Please select your gender.',
    errPhone: 'A valid phone number is required for specialist follow-up.',
    errSubmit: 'Failed to submit profile',
    enrolledHeading: 'You Are Now Officially Enrolled!',
    enrolledDesc:
      'Your student record has been initialized with the Al Hiwar Islamic Academy. Lesson 1: Pillars of Islam & Faith is unlocked and ready for you.',
    module1Title: 'Module 1: Pillars of Islam & Faith',
    module1Sub: 'Al Hiwar Islamic Academy Curriculum Roadmap',
    unlockedBadge: 'Unlocked',
    enterAcademyBtn: 'Enter Academy (Module 1)',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    basmalahTrans:
      "« Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux »",
    witnessBadge: 'Témoin Académique Officiel Al Hiwar',
    welcomeHeading: (name) =>
      `Mabrouk ! Bienvenue dans l’Islam, ${name} !`,
    welcomeBody:
      'Votre attestation de foi (Chahada) a été entendue et validée par le spécialiste. Qu’Allah bénisse votre chemin de paix, de science et de bonnes œuvres.',
    formHeading: 'Profil Obligatoire de Nouveau Musulman',
    formDesc:
      'Veuillez compléter les informations ci-dessous pour valider officiellement votre inscription à l’Académie Islamique Al Hiwar.',
    nationalityLabel: 'Nationalité / Pays de résidence',
    genderLabel: 'Genre',
    maleOption: 'Frère (Homme)',
    femaleOption: 'Sœur (Femme)',
    phoneLabel: 'Numéro de téléphone (WhatsApp / Contact)',
    enrollingBtn: 'Inscription à l’Académie…',
    submitBtn: 'Compléter le profil & Débloquer l’Académie',
    errNationality:
      'La nationalité est requise pour la certification officielle.',
    errGender: 'Veuillez sélectionner votre genre.',
    errPhone:
      'Un numéro de téléphone valide est requis pour le suivi du spécialiste.',
    errSubmit: 'Échec de l’enregistrement du profil',
    enrolledHeading: 'Vous êtes désormais officiellement inscrit(e) !',
    enrolledDesc:
      'Votre dossier d’étudiant a été créé à l’Académie Islamique Al Hiwar. Le Module 1 : Les Piliers de l’Islam et de la Foi est débloqué et prêt pour vous.',
    module1Title: 'Module 1 : Piliers de l’Islam & de la Foi',
    module1Sub: 'Programme de l’Académie Islamique Al Hiwar',
    unlockedBadge: 'Débloqué',
    enterAcademyBtn: 'Entrer à l’Académie (Module 1)',
  },
};

/** Validates mandatory post-conversion demographic fields and returns keyed errors. */
export function validateConversionFields(
  nationality: string,
  gender: Gender | null,
  phoneNumber: string,
  isFr: boolean
): Record<string, string> {
  const copy = CONVERSION_COPY[isFr ? 'fr' : 'en'];
  const errs: Record<string, string> = {};
  if (!nationality.trim()) errs.nationality = copy.errNationality;
  if (!gender) errs.gender = copy.errGender;
  if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
    errs.phoneNumber = copy.errPhone;
  }
  return errs;
}
