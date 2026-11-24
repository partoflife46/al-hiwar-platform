/**
 * Role metadata, route permissions, and localized labels for the primary platform navbar.
 */

import type { SupportedLanguage, UserRole } from '@/lib/db/types';

/**
 * Type contract defining role nav meta.
 * Includes fields/members: labelEn, labelFr, workspaceHref, workspaceLabelEn,
 * workspaceLabelFr, badgeVariant.
 */
export interface RoleNavMeta {
  /** label en property. */
  labelEn: string;
  /** label fr property. */
  labelFr: string;
  /** workspace href property. */
  workspaceHref: string;
  /** workspace label en property. */
  workspaceLabelEn: string;
  /** workspace label fr property. */
  workspaceLabelFr: string;
  /** badge variant property. */
  badgeVariant: 'primary' | 'secondary' | 'gold' | 'default';
}

/**
 * Constant definition for dialogue nav roles.
 */
export const DIALOGUE_NAV_ROLES = new Set<UserRole>([
  'NON_MUSLIM',
  'DIALOGIST',
  'SUPERVISOR',
]);

/**
 * Constant definition for staff nav roles.
 */
export const STAFF_NAV_ROLES = new Set<UserRole>([
  'DIALOGIST',
  'INSTRUCTOR',
  'SUPERVISOR',
  'ADMINISTRATOR',
]);

/**
 * Constant definition for role metadata.
 */
export const ROLE_METADATA: Record<UserRole, RoleNavMeta> = {
  VISITOR: {
    labelEn: 'Visitor',
    labelFr: 'Visiteur',
    workspaceHref: '/resources',
    workspaceLabelEn: 'Islamic Library',
    workspaceLabelFr: 'Bibliothèque Islamique',
    badgeVariant: 'secondary',
  },
  NON_MUSLIM: {
    labelEn: 'Seeker',
    labelFr: 'Chercheur',
    workspaceHref: '/dialogue',
    workspaceLabelEn: 'Live Dialogue',
    workspaceLabelFr: 'Dialogue en Direct',
    badgeVariant: 'primary',
  },
  DIALOGIST: {
    labelEn: 'Dialogist',
    labelFr: 'Spécialiste',
    workspaceHref: '/dialogue',
    workspaceLabelEn: 'Consultation Room',
    workspaceLabelFr: 'Salle de Consultation',
    badgeVariant: 'primary',
  },
  INSTRUCTOR: {
    labelEn: 'Instructor',
    labelFr: 'Enseignant',
    workspaceHref: '/staff',
    workspaceLabelEn: 'Curriculum Studio',
    workspaceLabelFr: 'Studio Pédagogique',
    badgeVariant: 'secondary',
  },
  SUPERVISOR: {
    labelEn: 'Supervisor',
    labelFr: 'Superviseur',
    workspaceHref: '/staff',
    workspaceLabelEn: 'Sharia Oversight',
    workspaceLabelFr: 'Supervision Chari’a',
    badgeVariant: 'gold',
  },
  NEW_MUSLIM: {
    labelEn: 'New Muslim',
    labelFr: 'Nouveau Musulman',
    workspaceHref: '/academy',
    workspaceLabelEn: 'Foundational Academy',
    workspaceLabelFr: 'Académie Islamique',
    badgeVariant: 'gold',
  },
  ADMINISTRATOR: {
    labelEn: 'Administrator',
    labelFr: 'Administrateur',
    workspaceHref: '/staff',
    workspaceLabelEn: 'Platform Operations',
    workspaceLabelFr: 'Administration',
    badgeVariant: 'primary',
  },
};

/**
 * Constant definition for nav copy.
 */
export const NAV_COPY: Record<
  SupportedLanguage,
  {
    tagline: string;
    toggleMenu: string;
    home: string;
    library: string;
    dialogue: string;
    academy: string;
    staff: string;
    manageProfileTitle: string;
    manageProfile: string;
    profileShort: string;
    logout: string;
    logoutShort: string;
    login: string;
    register: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    tagline: 'Authentic Islamic Dialogue & Learning',
    toggleMenu: 'Toggle navigation menu',
    home: 'Home',
    library: 'Islamic Library',
    dialogue: 'Live Dialogue',
    academy: 'Al Hiwar Islamic Academy',
    staff: 'Staff Portal',
    manageProfileTitle: 'Manage My Profile',
    manageProfile: 'Manage My Profile',
    profileShort: 'Profile',
    logout: 'Log Out',
    logoutShort: 'Log Out',
    login: 'Login',
    register: 'Register (18+)',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    tagline: 'Dialogue & Enseignement Islamique Authentique',
    toggleMenu: 'Ouvrir le menu de navigation',
    home: 'Accueil',
    library: 'Bibliothèque',
    dialogue: 'Dialogue Privé',
    academy: 'Académie Islamique',
    staff: 'Portail Staff',
    manageProfileTitle: 'Gérer mon profil',
    manageProfile: 'Mon Profil',
    profileShort: 'Mon Profil',
    logout: 'Se déconnecter',
    logoutShort: 'Déconnexion',
    login: 'Connexion',
    register: 'S’inscrire (18+)',
  },
};

/** Resolves the localized role label and workspace CTA text for a role. */
export function getLocalizedRoleMeta(role: UserRole, isFr: boolean) {
  const meta = ROLE_METADATA[role] || ROLE_METADATA.VISITOR;
  return {
    workspaceHref: meta.workspaceHref,
    roleLabel: isFr ? meta.labelFr : meta.labelEn,
    workspaceLabel: isFr ? meta.workspaceLabelFr : meta.workspaceLabelEn,
  };
}
