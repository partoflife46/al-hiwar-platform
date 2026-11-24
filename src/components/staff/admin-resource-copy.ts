/**
 * Module architecture and API reference for `src/components/staff/admin-resource-copy.ts`.
 *
 * Exported symbols:
 * - `RESOURCE_CATEGORIES` (Const): resource categories definition.
 * - `RESOURCE_FORMATS` (Const): resource formats definition.
 * - `ADMIN_STAFF_COPY` (Const): admin staff copy definition.
 * - `openMediaPreview` (Function): open media preview definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/staff/admin-resource-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings and select option constants for Admin resource and staff panels.
 */

import type {
  ResourceCategory,
  ResourceType,
  SupportedLanguage,
  UserRole,
} from '@/lib/db/types';

/**
 * Constant definition for resource categories.
 */
export const RESOURCE_CATEGORIES: readonly ResourceCategory[] = [
  'QURAN',
  'PROPHET',
  'PILLARS',
  'ETHICS',
  'MISCONCEPTIONS',
];

/**
 * Constant definition for resource formats.
 */
export const RESOURCE_FORMATS: readonly ResourceType[] = [
  'PDF',
  'AUDIO',
  'VIDEO',
  'TEXT',
];

/**
 * Constant definition for admin staff copy.
 */
export const ADMIN_STAFF_COPY: Record<
  SupportedLanguage,
  {
    catalogHeading: (count: number) => string;
    catalogSub: string;
    editResourcePrefix: string;
    titleEnReq: string;
    titleFrLabel: string;
    categoryReq: string;
    categoryAria: string;
    formatReq: string;
    formatAria: string;
    mediaUrlLabel: string;
    uploading: string;
    uploadLocalBtn: string;
    mediaUrlPh: string;
    previewTitle: string;
    previewBtn: string;
    uploadTip: string;
    cancel: string;
    saveChanges: string;
    verifiedResource: string;
    editResourceAria: (t: string) => string;
    editResourceTitle: string;
    editBtn: string;
    deleteResourceAria: (t: string) => string;
    deleteResourceTitle: string;
    deleteBtn: string;
    emptyCatalog: string;
    createStaffHeading: string;
    firstNamePh: string;
    surnamePh: string;
    staffPwdPh: string;
    pwdValid: string;
    pwdMinReq: string;
    staffRoleAria: string;
    createStaffBtn: string;
    uploadResourceHeading: string;
    publishResourceBtn: string;
    staffRoleLabels: Record<
      Extract<UserRole, 'DIALOGIST' | 'INSTRUCTOR' | 'SUPERVISOR' | 'ADMINISTRATOR'>,
      string
    >;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    catalogHeading: (n) => `Public Islamic Resources Catalog (${n})`,
    catalogSub:
      'Manage and delete verified public monographs, audios, videos, and texts (FR 68).',
    editResourcePrefix: 'Edit Resource:',
    titleEnReq: 'Resource Title (EN) *',
    titleFrLabel: 'Resource Title (FR)',
    categoryReq: 'Category *',
    categoryAria: 'Resource category',
    formatReq: 'Format *',
    formatAria: 'Resource format',
    mediaUrlLabel: 'Media File / URL *',
    uploading: 'Uploading…',
    uploadLocalBtn: 'Upload Local File',
    mediaUrlPh: '/resources/guide.pdf or https://…',
    previewTitle: 'Preview media in new tab',
    previewBtn: 'Preview',
    uploadTip:
      '💡 You can upload a direct file (PDF, Audio, Video) from your computer or paste an external URL.',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    verifiedResource: 'Verified Resource',
    editResourceAria: (t) => `Edit resource ${t}`,
    editResourceTitle: 'Edit Resource',
    editBtn: 'Edit',
    deleteResourceAria: (t) => `Delete resource ${t}`,
    deleteResourceTitle: 'Delete Resource',
    deleteBtn: 'Delete',
    emptyCatalog: 'No public Islamic resources available in the library.',
    createStaffHeading: 'Create Staff / Administrator Account',
    firstNamePh: 'First Name',
    surnamePh: 'Surname',
    staffPwdPh: 'Staff Account Password (min 8 chars) *',
    pwdValid: '✓ Valid length (8+ chars)',
    pwdMinReq: 'Minimum 8 characters required',
    staffRoleAria: 'Staff account role',
    createStaffBtn: 'Create Verified Staff Account',
    uploadResourceHeading: 'Upload Public Islamic Resource',
    publishResourceBtn: 'Publish to Islamic Resource Library',
    staffRoleLabels: {
      DIALOGIST: 'DIALOGIST (Sharia Specialist)',
      INSTRUCTOR: 'INSTRUCTOR (Islamic Instructor)',
      SUPERVISOR: 'SUPERVISOR (Sharia Oversight)',
      ADMINISTRATOR: 'ADMINISTRATOR (Platform Admin)',
    },
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    catalogHeading: (n) =>
      `Bibliothèque des Ressources Islamiques Publiques (${n})`,
    catalogSub:
      'Gestion et suppression des monographies, audios, vidéos et textes publics vérifiés (FR 68).',
    editResourcePrefix: 'Modifier la ressource :',
    titleEnReq: 'Titre de la ressource (EN) *',
    titleFrLabel: 'Titre de la ressource (FR)',
    categoryReq: 'Catégorie *',
    categoryAria: 'Catégorie de la ressource',
    formatReq: 'Format *',
    formatAria: 'Format de la ressource',
    mediaUrlLabel: 'Fichier / URL du Média *',
    uploading: 'Téléversement…',
    uploadLocalBtn: 'Choisir un fichier',
    mediaUrlPh: '/resources/guide.pdf ou https://…',
    previewTitle: 'Prévisualiser le média',
    previewBtn: 'Aperçu',
    uploadTip:
      '💡 Vous pouvez téléverser un fichier direct (PDF, Audio, Vidéo) depuis votre ordinateur ou coller une URL externe.',
    cancel: 'Annuler',
    saveChanges: 'Enregistrer les modifications',
    verifiedResource: 'Vérifié',
    editResourceAria: (t) => `Modifier la ressource ${t}`,
    editResourceTitle: 'Modifier la ressource',
    editBtn: 'Modifier',
    deleteResourceAria: (t) => `Supprimer la ressource ${t}`,
    deleteResourceTitle: 'Supprimer la ressource',
    deleteBtn: 'Supprimer',
    emptyCatalog: 'Aucune ressource publique disponible dans la bibliothèque.',
    createStaffHeading: 'Créer un Compte Personnel / Administrateur',
    firstNamePh: 'Prénom',
    surnamePh: 'Nom',
    staffPwdPh: 'Mot de passe (8 car. min) *',
    pwdValid: '✓ Longueur valide (8+ caractères)',
    pwdMinReq: 'Minimum 8 caractères requis',
    staffRoleAria: 'Rôle du compte staff',
    createStaffBtn: 'Créer le compte personnel vérifié',
    uploadResourceHeading: 'Publier une Ressource Islamique Publique',
    publishResourceBtn: 'Publier dans la Bibliothèque Publique',
    staffRoleLabels: {
      DIALOGIST: 'DIALOGIST (Spécialiste Chari’a)',
      INSTRUCTOR: 'INSTRUCTOR (Enseignant Islamique)',
      SUPERVISOR: 'SUPERVISOR (Superviseur Chari’a)',
      ADMINISTRATOR: 'ADMINISTRATOR (Administrateur Plateforme)',
    },
  },
};

/** Opens a local or external resource media URL safely in a new browser tab. */
export function openMediaPreview(url: string) {
  const target =
    url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')
      ? url
      : `/${url}`;
  window.open(target, '_blank', 'noopener,noreferrer');
}
