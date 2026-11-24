/**
 * Module architecture and API reference for `src/components/profile/profile-copy.ts`.
 *
 * Exported symbols:
 * - `PROFILE_ROLE_META` (Const): profile role meta definition.
 * - `PROFILE_COPY` (Const): profile copy definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/profile/profile-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual labels and role badge metadata for the user profile management page.
 */

import type { SupportedLanguage, UserRole } from '@/lib/db/types';

/**
 * Constant definition for profile role meta.
 */
export const PROFILE_ROLE_META: Record<
  UserRole,
  { en: string; fr: string; color: string }
> = {
  VISITOR: {
    en: 'Visitor',
    fr: 'Visiteur',
    color: 'bg-slate-100 text-slate-800',
  },
  NON_MUSLIM: {
    en: 'Inquirer / Truth Seeker (Non-Muslim)',
    fr: 'Chercheur de Vérité (Non-Musulman)',
    color: 'bg-[#006C9C]/10 text-[#006C9C]',
  },
  NEW_MUSLIM: {
    en: 'New Muslim (Shahadah Validated)',
    fr: 'Nouveau Musulman (Chahada Validée)',
    color: 'bg-[#BC9C5C]/20 text-[#8C6D32]',
  },
  DIALOGIST: {
    en: 'Faculty Dialogist',
    fr: 'Spécialiste Dialogiste',
    color: 'bg-[#006C9C]/10 text-[#006C9C]',
  },
  INSTRUCTOR: {
    en: 'Curriculum Instructor',
    fr: 'Enseignant Académie',
    color: 'bg-[#0D7A5F]/15 text-[#0D7A5F]',
  },
  SUPERVISOR: {
    en: 'Sharia Supervisor',
    fr: 'Superviseur de la Chari’a',
    color: 'bg-[#BC9C5C]/20 text-[#8C6D32]',
  },
  ADMINISTRATOR: {
    en: 'Platform Administrator',
    fr: 'Administrateur de la Plateforme',
    color: 'bg-[#082233] text-white',
  },
};

/**
 * Constant definition for profile copy.
 */
export const PROFILE_COPY: Record<
  SupportedLanguage,
  {
    loading: string;
    back: string;
    heading: string;
    subtitle: string;
    shahadahBannerTitle: string;
    shahadahBannerDesc: string;
    academyActive: string;
    enterAcademyBtn: string;
    emailVerified: string;
    firstNameReq: string;
    firstNamePh: string;
    surnameReq: string;
    surnamePh: string;
    prefLangLabel: string;
    dobLabel: string;
    yearsUnit: string;
    under18Alert: string;
    nationalityLabel: string;
    genderLabel: string;
    male: string;
    female: string;
    preferNot: string;
    phoneLabel: string;
    changePwdHeading: string;
    changePwdDesc: string;
    newPwdLabel: string;
    confirmPwdLabel: string;
    saving: string;
    saveChanges: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    loading: 'Loading profile details…',
    back: 'Back',
    heading: 'Manage My Profile',
    subtitle:
      'Update your personal details, contact information, and account settings.',
    shahadahBannerTitle:
      'Your Shahadah is Validated! Complete Your Profile to Unlock the Academy.',
    shahadahBannerDesc:
      'Fill in your Nationality, select Male/Female, and enter your Phone Number below, then click "Save Changes" to enter the Al Hiwar Islamic Academy.',
    academyActive: 'Your Al Hiwar Islamic Academy enrollment is active.',
    enterAcademyBtn: 'Enter Al Hiwar Islamic Academy →',
    emailVerified: 'Email Address (Verified)',
    firstNameReq: 'First Name *',
    firstNamePh: 'First name',
    surnameReq: 'Surname *',
    surnamePh: 'Surname',
    prefLangLabel: 'Preferred Consultation & Study Language',
    dobLabel: 'Date of Birth (18+ Age Gate) *',
    yearsUnit: 'years old',
    under18Alert: 'You must be at least 18 years old to use the platform.',
    nationalityLabel: 'Nationality',
    genderLabel: 'Gender',
    male: 'Male',
    female: 'Female',
    preferNot: 'Prefer not to say',
    phoneLabel: 'Phone Number',
    changePwdHeading: 'Change Password (Optional)',
    changePwdDesc:
      'Leave blank if you do not wish to change your current password.',
    newPwdLabel: 'New Password (min 8 chars)',
    confirmPwdLabel: 'Confirm New Password',
    saving: 'Saving Changes…',
    saveChanges: 'Save Changes',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    loading: 'Chargement du profil…',
    back: 'Retour',
    heading: 'Gérer mon profil',
    subtitle:
      'Mettez à jour vos informations personnelles et préférences de compte.',
    shahadahBannerTitle:
      'Votre Chahada est validée ! Complétez votre profil pour débloquer l’Académie.',
    shahadahBannerDesc:
      'Renseignez votre nationalité, sélectionnez Homme/Femme et indiquez votre numéro de téléphone ci-dessous puis cliquez sur « Enregistrer les modifications ».',
    academyActive:
      'Votre inscription à l’Académie Islamique Al Hiwar est active.',
    enterAcademyBtn: 'Accéder à l’Académie Islamique →',
    emailVerified: 'Adresse e-mail (Vérifiée)',
    firstNameReq: 'Prénom *',
    firstNamePh: 'Prénom',
    surnameReq: 'Nom *',
    surnamePh: 'Nom',
    prefLangLabel: 'Langue préférée de consultation / cours',
    dobLabel: 'Date de naissance (18+ ans requis) *',
    yearsUnit: 'ans',
    under18Alert:
      'Vous devez avoir au moins 18 ans pour utiliser la plateforme.',
    nationalityLabel: 'Nationalité',
    genderLabel: 'Genre',
    male: 'Homme',
    female: 'Femme',
    preferNot: 'Non spécifié',
    phoneLabel: 'Téléphone',
    changePwdHeading: 'Modifier le mot de passe (Facultatif)',
    changePwdDesc:
      'Laissez vide si vous ne souhaitez pas modifier votre mot de passe actuel.',
    newPwdLabel: 'Nouveau mot de passe (8 car. min)',
    confirmPwdLabel: 'Confirmer le nouveau mot de passe',
    saving: 'Enregistrement…',
    saveChanges: 'Enregistrer les modifications',
  },
};
