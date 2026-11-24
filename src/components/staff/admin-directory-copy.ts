/**
 * Module architecture and API reference for `src/components/staff/admin-directory-copy.ts`.
 *
 * Exported symbols:
 * - `filterOperationalUsers` (Function): filter operational users definition.
 * - `ADMIN_DIR_COPY` (Const): admin dir copy definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/staff/admin-directory-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual labels and operational account filter for the Admin user directory.
 */

import type { SupportedLanguage, User, UserRole } from '@/lib/db/types';

/**
 * Constant definition for demo hidden emails.
 */
const DEMO_HIDDEN_EMAILS = new Set([
  'dialogist@iu.edu.sa',
  'instructor@iu.edu.sa',
  'supervisor@iu.edu.sa',
  'newmuslim@example.com',
  'seeker@example.com',
]);

/** Filters platform user accounts down to active operational and administrator entries. */
export function filterOperationalUsers(users: User[]): User[] {
  return users.filter(
    (u) =>
      u.email === 'admin@alhiwar.org' ||
      u.email === 'graduate@example.com' ||
      !DEMO_HIDDEN_EMAILS.has(u.email)
  );
}

/**
 * Constant definition for admin dir copy.
 */
export const ADMIN_DIR_COPY: Record<
  SupportedLanguage,
  {
    certTitlePrefix: string;
    nationality: string;
    dob: string;
    revoked: string;
    valid: string;
    revoke: string;
    noCerts: string;
    usersTitle: string;
    usersSubtitle: string;
    cancel: string;
    addAccount: string;
    createHeading: string;
    firstNameReq: string;
    surnameReq: string;
    emailReq: string;
    pwdLabelReq: string;
    firstNamePlaceholder: string;
    surnamePlaceholder: string;
    pwdValid: string;
    pwdMin: (len: number) => string;
    accountRoleReq: string;
    saveAndCreate: string;
    editHeading: string;
    firstName: string;
    surname: string;
    email: string;
    role: string;
    status: string;
    activeOpt: string;
    suspendedOpt: string;
    saveChanges: string;
    suspended: string;
    verified: string;
    pendingVerification: string;
    editUserTitle: string;
    editBtn: string;
    deleteUserAria: (name: string) => string;
    deleteUserTitle: string;
    deleteBtn: string;
    roleOptions: Record<Exclude<UserRole, 'VISITOR'>, string>;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    certTitlePrefix: 'Certificate Registry & Revocation Control',
    nationality: 'Nationality',
    dob: 'DOB',
    revoked: 'REVOKED',
    valid: 'VALID',
    revoke: 'Revoke',
    noCerts:
      'No certificates issued yet. Certificates will appear here once students complete the 7-module curriculum and pass the final examination.',
    usersTitle: 'Platform User Accounts',
    usersSubtitle: 'Active operational accounts and platform administrators.',
    cancel: 'Cancel',
    addAccount: 'Add Account',
    createHeading: 'Create New Platform Account',
    firstNameReq: 'First Name *',
    surnameReq: 'Surname *',
    emailReq: 'Email Address *',
    pwdLabelReq: 'Password (min 8 chars) *',
    firstNamePlaceholder: 'e.g. Abdullah',
    surnamePlaceholder: 'e.g. Al-Mansoor',
    pwdValid: '✓ 8+ characters valid',
    pwdMin: (len) => `Minimum 8 characters (${len}/8)`,
    accountRoleReq: 'Account Role *',
    saveAndCreate: 'Save & Create',
    editHeading: 'Edit User:',
    firstName: 'First Name',
    surname: 'Surname',
    email: 'Email',
    role: 'Role',
    status: 'Status',
    activeOpt: 'ACTIVE',
    suspendedOpt: 'SUSPENDED',
    saveChanges: 'Save Changes',
    suspended: 'SUSPENDED',
    verified: 'Verified',
    pendingVerification: 'Pending Verification',
    editUserTitle: 'Edit User',
    editBtn: 'Edit',
    deleteUserAria: (name) => `Delete user ${name}`,
    deleteUserTitle: 'Delete User',
    deleteBtn: 'Delete',
    roleOptions: {
      NON_MUSLIM: 'NON_MUSLIM (Inquirer / Seeker)',
      NEW_MUSLIM: 'NEW_MUSLIM (Academy Student)',
      DIALOGIST: 'DIALOGIST (Faculty Specialist)',
      INSTRUCTOR: 'INSTRUCTOR (Curriculum Specialist)',
      SUPERVISOR: 'SUPERVISOR (Quality & Shahadah Auditor)',
      ADMINISTRATOR: 'ADMINISTRATOR (Full Platform Admin)',
    },
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    certTitlePrefix: 'Registre des Certificats & Révocation',
    nationality: 'Nationalité',
    dob: 'Date naiss.',
    revoked: 'RÉVOQUÉ',
    valid: 'VALIDE',
    revoke: 'Révoquer',
    noCerts:
      'Aucun certificat émis pour le moment. Ils apparaîtront dès qu’un étudiant réussit les 7 modules et l’examen final.',
    usersTitle: 'Comptes Utilisateurs',
    usersSubtitle:
      'Comptes opérationnels actifs et administrateurs de la plateforme.',
    cancel: 'Annuler',
    addAccount: 'Ajouter un compte',
    createHeading: 'Créer un Nouveau Compte Utilisateur',
    firstNameReq: 'Prénom *',
    surnameReq: 'Nom *',
    emailReq: 'Adresse e-mail *',
    pwdLabelReq: 'Mot de passe (8 car. min) *',
    firstNamePlaceholder: 'ex. Abdullah',
    surnamePlaceholder: 'ex. Al-Mansoor',
    pwdValid: '✓ 8+ caractères valides',
    pwdMin: (len) => `Minimum 8 caractères (${len}/8)`,
    accountRoleReq: 'Rôle du compte *',
    saveAndCreate: 'Enregistrer & Créer',
    editHeading: 'Modifier l’utilisateur :',
    firstName: 'Prénom',
    surname: 'Nom',
    email: 'E-mail',
    role: 'Rôle',
    status: 'Statut',
    activeOpt: 'ACTIF (ACTIVE)',
    suspendedOpt: 'SUSPENDU (SUSPENDED)',
    saveChanges: 'Enregistrer les modifications',
    suspended: 'SUSPENDU',
    verified: 'Vérifié',
    pendingVerification: 'En attente de vérification',
    editUserTitle: 'Modifier l’utilisateur',
    editBtn: 'Modifier',
    deleteUserAria: (name) => `Supprimer l’utilisateur ${name}`,
    deleteUserTitle: 'Supprimer l’utilisateur',
    deleteBtn: 'Supprimer',
    roleOptions: {
      NON_MUSLIM: 'NON_MUSLIM (Chercheur de vérité)',
      NEW_MUSLIM: 'NEW_MUSLIM (Étudiant Académie)',
      DIALOGIST: 'DIALOGIST (Spécialiste Chari’a)',
      INSTRUCTOR: 'INSTRUCTOR (Spécialiste Programme)',
      SUPERVISOR: 'SUPERVISOR (Superviseur Qualité & Chahada)',
      ADMINISTRATOR: 'ADMINISTRATOR (Administrateur complet)',
    },
  },
};
