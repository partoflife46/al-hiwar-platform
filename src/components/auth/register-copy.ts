/**
 * Module architecture and API reference for `src/components/auth/register-copy.ts`.
 *
 * Exported symbols:
 * - `REGISTER_COPY` (Const): register copy definition.
 * - `strengthInputClass` (Function): strength input class definition.
 * - `confirmInputClass` (Function): confirm input class definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/auth/register-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings and validation styling helpers for the seeker registration flow.
 */

import type { SupportedLanguage } from '@/lib/db/types';

/**
 * Constant definition for register copy.
 */
export const REGISTER_COPY: Record<
  SupportedLanguage,
  {
    badgeSuffix: string;
    heading: string;
    subtitle: string;
    firstNameLabel: string;
    firstNamePh: string;
    surnameLabel: string;
    surnamePh: string;
    emailLabel: string;
    pwdLabel: string;
    confirmPwdLabel: string;
    pwdMatch: string;
    pwdMismatch: string;
    dobLabel: string;
    ageCalc: (age: number) => string;
    under18Badge: string;
    eligibleBadge: string;
    under18Alert: string;
    prefLangLabel: string;
    submitting: string;
    submitBtn: string;
    alreadyReg: string;
    signInLink: string;
    otpHeading: string;
    sentTo: string;
    verifiedTitle: string;
    verifiedFallback: (email: string) => string;
    redirecting: string;
    providerNotice: string;
    codeSentTitle: string;
    codeSentPrefix: string;
    codeSentSuffix: string;
    mailNotConfiguredTitle: string;
    mailNotConfiguredBody: string;
    devPasscodeLabel: string;
    autoFill: string;
    enterOtpLabel: string;
    verifyBtn: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    badgeSuffix: 'Seeker Registration',
    heading: 'Create Your Private Consultation Account',
    subtitle:
      'Strictly for adults aged 18 years or older. Only your First Name is shared with Dialogists during live consultations.',
    firstNameLabel: 'First Name *',
    firstNamePh: 'e.g. Jean-Luc',
    surnameLabel: 'Surname (Private — For Certificate Only) *',
    surnamePh: 'e.g. Dubois',
    emailLabel: 'Email Address *',
    pwdLabel: 'Password (8+ chars, letters & numbers combination) *',
    confirmPwdLabel: 'Confirm Password *',
    pwdMatch: '✓ Passwords match',
    pwdMismatch: '✗ Do not match',
    dobLabel: 'Date of Birth (18+ Age Gate) *',
    ageCalc: (age) => `Calculated Age: ${age} yrs`,
    under18Badge: 'Under 18 Blocked',
    eligibleBadge: '18+ Eligible',
    under18Alert:
      'AGE_GATE_REJECTED: You must be at least 18 years old to register.',
    prefLangLabel: 'Preferred Consultation Language (EN / FR)',
    submitting: 'Submitting…',
    submitBtn: 'Register & Send 6-Digit Verification Code',
    alreadyReg: 'Already registered? ',
    signInLink: 'Sign in here',
    otpHeading: 'Verify 6-Digit Email OTP',
    sentTo: 'Sent to ',
    verifiedTitle: 'Email Verified Successfully!',
    verifiedFallback: (email) =>
      `Account confirmed for ${email}. Accessing your live consultation room…`,
    redirecting: 'Redirecting to consultation room…',
    providerNotice: 'Email Provider Delivery Notice',
    codeSentTitle: 'Verification Code Sent',
    codeSentPrefix:
      'We have sent a 6-digit verification code to your email address ',
    codeSentSuffix:
      ' Please check your inbox and enter the code below (expires in 5 minutes).',
    mailNotConfiguredTitle: 'Email Service Not Configured',
    mailNotConfiguredBody:
      'Transactional email provider credentials (RESEND_API_KEY / SMTP) are not configured in the server environment (.env.local). Please contact your administrator.',
    devPasscodeLabel: 'Development Passcode: ',
    autoFill: 'Auto-fill',
    enterOtpLabel: 'Enter 6-Digit Verification Code',
    verifyBtn: 'Verify OTP & Enter Consultation Room',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    badgeSuffix: 'Inscription Chercheur',
    heading: 'Créer votre compte de consultation privée',
    subtitle:
      'Strictement réservé aux adultes de 18 ans et plus. Seul votre prénom est partagé avec les spécialistes.',
    firstNameLabel: 'Prénom *',
    firstNamePh: 'ex. Jean-Luc',
    surnameLabel: 'Nom de famille (Privé — pour le certificat uniquement) *',
    surnamePh: 'ex. Dubois',
    emailLabel: 'Adresse e-mail *',
    pwdLabel: 'Mot de passe (8+ caractères, combinaison lettres & chiffres) *',
    confirmPwdLabel: 'Confirmer le mot de passe *',
    pwdMatch: '✓ Correspond',
    pwdMismatch: '✗ Ne correspond pas',
    dobLabel: 'Date de naissance (Vérification 18+) *',
    ageCalc: (age) => `Âge calculé : ${age} ans`,
    under18Badge: 'Moins de 18 ans bloqué',
    eligibleBadge: 'Éligible 18+',
    under18Alert: 'Vous devez avoir au moins 18 ans pour vous inscrire.',
    prefLangLabel: 'Langue de consultation préférée (EN / FR)',
    submitting: 'Envoi en cours…',
    submitBtn: 'S’inscrire & Envoyer le code à 6 chiffres',
    alreadyReg: 'Déjà inscrit ? ',
    signInLink: 'Se connecter ici',
    otpHeading: 'Vérifier le code OTP par e-mail',
    sentTo: 'Envoyé à ',
    verifiedTitle: 'E-mail vérifié avec succès !',
    verifiedFallback: (email) =>
      `Compte confirmé pour ${email}. Accès à votre salon de consultation…`,
    redirecting: 'Redirection vers la consultation…',
    providerNotice: 'Notification du fournisseur de messagerie',
    codeSentTitle: 'Code de vérification envoyé',
    codeSentPrefix:
      'Nous avons envoyé un code de sécurité à 6 chiffres à votre adresse e-mail ',
    codeSentSuffix:
      ' Veuillez consulter votre boîte de réception et saisir le code ci-dessous (expire dans 5 minutes).',
    mailNotConfiguredTitle: 'Service e-mail non configuré',
    mailNotConfiguredBody:
      'Les identifiants d’envoi d’e-mails (RESEND_API_KEY / SMTP) ne sont pas configurés sur le serveur. Veuillez contacter l’administrateur.',
    devPasscodeLabel: 'Code OTP de test (Dev) : ',
    autoFill: 'Remplir',
    enterOtpLabel: 'Entrez le code à 6 chiffres',
    verifyBtn: 'Vérifier & Accéder à la consultation',
  },
};

/**
 * Constant definition for strength ring class.
 */
const STRENGTH_RING_CLASS: Record<string, string> = {
  STRONG: 'border-[#0D7A5F] focus:border-[#0D7A5F] focus:ring-[#0D7A5F]/20',
  FAIR: 'border-[#D97706] focus:border-[#D97706] focus:ring-[#D97706]/20',
  WEAK: 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20',
};

/** Returns border styling for the primary password field based on strength level. */
export function strengthInputClass(hasValue: boolean, level: string): string {
  if (!hasValue) return '';
  return STRENGTH_RING_CLASS[level] || STRENGTH_RING_CLASS.WEAK;
}

/** Returns border styling for the confirmation password field. */
export function confirmInputClass(hasValue: boolean, matches: boolean): string {
  if (!hasValue) return '';
  return matches ? STRENGTH_RING_CLASS.STRONG : STRENGTH_RING_CLASS.WEAK;
}
