/**
 * Module architecture and API reference for `src/components/auth/login-copy.ts`.
 *
 * Exported symbols:
 * - `VISITOR_LOGOUT_SESSION` (Const): visitor logout session definition.
 * - `getWorkspaceForRole` (Function): get workspace for role definition.
 * - `getPostLoginPath` (Function): get post login path definition.
 * - `LOGIN_COPY` (Const): login copy definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/auth/login-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings, workspace route helpers, and API requests for the login portal.
 */

import type { SupportedLanguage, UserRole, UserSession } from '@/lib/db/types';

/**
 * Constant definition for visitor logout session.
 */
export const VISITOR_LOGOUT_SESSION: UserSession = {
  userId: 'visitor',
  email: 'visitor@example.com',
  firstName: 'Visitor',
  surname: 'Guest',
  role: 'VISITOR',
  preferredLanguage: 'en',
  token: '',
};

/**
 * Constant definition for workspace by role.
 */
const WORKSPACE_BY_ROLE: Partial<
  Record<UserRole, { href: string; en: string; fr: string }>
> = {
  NEW_MUSLIM: {
    href: '/academy',
    en: 'Open Al Hiwar Academy',
    fr: 'Ouvrir l’Académie Islamique',
  },
  NON_MUSLIM: {
    href: '/dialogue',
    en: 'Open Private Consultation',
    fr: 'Ouvrir la Consultation Privée',
  },
};

/** Resolves the primary workspace route and button label for an authenticated role. */
export function getWorkspaceForRole(
  role: UserRole,
  isFr: boolean
): { href: string; label: string } {
  const entry = WORKSPACE_BY_ROLE[role];
  if (entry) return { href: entry.href, label: isFr ? entry.fr : entry.en };
  return {
    href: '/staff',
    label: isFr ? 'Ouvrir l’Espace Équipe' : 'Open Staff Console',
  };
}

/** Resolves the post-login destination URL for a signed-in user role. */
export function getPostLoginPath(role: UserRole): string {
  if (role === 'NEW_MUSLIM') return '/academy';
  if (role === 'NON_MUSLIM') return '/dialogue';
  return '/staff';
}

/**
 * Constant definition for login copy.
 */
export const LOGIN_COPY: Record<
  SupportedLanguage,
  {
    badge: string;
    signedInTitle: string;
    signInTitle: string;
    signedInDesc: string;
    signInDesc: string;
    currentlySignedIn: string;
    manageProfile: string;
    signOutSwitch: string;
    emailLabel: string;
    pwdLabel: string;
    forgotPwd: string;
    signingIn: string;
    signInBtn: string;
    newToPlatform: string;
    createAccount: string;
    errInvalidCreds: string;
    errLoginFailed: string;
    errEnterEmailFirst: string;
    resetSentFr: string;
    errResetFailed: string;
    errResetNetwork: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    badge: 'Al Hiwar Platform • Authentication Portal',
    signedInTitle: 'Already Signed In to Al Hiwar',
    signInTitle: 'Sign In to Al Hiwar Platform',
    signedInDesc:
      'You are already authenticated. Continue directly to your workspace or switch accounts.',
    signInDesc:
      'Access your consultation history, Al Hiwar Islamic Academy, or Staff Backoffice.',
    currentlySignedIn: 'Currently Signed In',
    manageProfile: 'Manage My Profile',
    signOutSwitch: 'Sign Out & Switch Account',
    emailLabel: 'Email Address',
    pwdLabel: 'Password',
    forgotPwd: 'Reset Password',
    signingIn: 'Signing In…',
    signInBtn: 'Sign In',
    newToPlatform: 'New to Al Hiwar Platform? ',
    createAccount: 'Create an account',
    errInvalidCreds: 'Invalid email or password',
    errLoginFailed: 'Login failed',
    errEnterEmailFirst:
      'Please enter your email address above to receive password reset instructions.',
    resetSentFr:
      'If an account matches this email address, reset instructions have been sent.',
    errResetFailed: 'Unable to process password reset request.',
    errResetNetwork: 'Network error while requesting password reset.',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    badge: 'Portail d’Authentification • Al Hiwar',
    signedInTitle: 'Session Active sur Al Hiwar',
    signInTitle: 'Connexion à la Plateforme Al Hiwar',
    signedInDesc:
      'Vous êtes déjà authentifié. Accédez directement à votre espace ou changez de compte.',
    signInDesc:
      'Accédez à votre historique de consultation, à l’Académie Islamique ou au portail des équipes.',
    currentlySignedIn: 'Connecté actuellement',
    manageProfile: 'Gérer Mon Profil',
    signOutSwitch: 'Se déconnecter et changer de compte',
    emailLabel: 'Adresse e-mail',
    pwdLabel: 'Mot de passe',
    forgotPwd: 'Mot de passe oublié ?',
    signingIn: 'Connexion…',
    signInBtn: 'Se connecter',
    newToPlatform: 'Nouveau sur Al Hiwar ? ',
    createAccount: 'Créer un compte',
    errInvalidCreds: 'Adresse e-mail ou mot de passe incorrect',
    errLoginFailed: 'Échec de connexion',
    errEnterEmailFirst:
      'Veuillez saisir votre adresse e-mail ci-dessus pour recevoir les instructions de réinitialisation.',
    resetSentFr:
      'Si un compte correspond à cette adresse e-mail, les instructions de réinitialisation ont été envoyées.',
    errResetFailed: 'Impossible de traiter la demande de réinitialisation.',
    errResetNetwork: 'Erreur réseau lors de la demande de réinitialisation.',
  },
};
