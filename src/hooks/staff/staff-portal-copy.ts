/**
 * Module architecture and API reference for `src/hooks/staff/staff-portal-copy.ts`.
 *
 * Exported symbols:
 * - `StaffTab` (TypeAlias): staff tab definition.
 * - `STAFF_ROLES` (Const): staff roles definition.
 * - `ACCEPT_MIME_BY_FORMAT` (Const): accept mime by format definition.
 * - `getAcceptMimeType` (Function): get accept mime type definition.
 * - `STAFF_COPY` (Const): staff copy definition.
 * - `buildStaffTabs` (Function): build staff tabs definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module hooks/staff/staff-portal-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual status copy, MIME type mapping, and tab definitions for the Staff Portal.
 */

import { BookOpen, MessageSquare, Settings, ShieldCheck } from 'lucide-react';
import type { ResourceType } from '@/lib/db/types';

/**
 * Type alias representing staff tab.
 */
export type StaffTab = 'DIALOGIST' | 'INSTRUCTOR' | 'SUPERVISOR' | 'ADMINISTRATOR';

/**
 * Constant definition for staff roles.
 */
export const STAFF_ROLES: readonly StaffTab[] = [
  'DIALOGIST',
  'INSTRUCTOR',
  'SUPERVISOR',
  'ADMINISTRATOR',
];

/**
 * Constant definition for accept mime by format.
 */
export const ACCEPT_MIME_BY_FORMAT: Record<ResourceType, string> = {
  PDF: '.pdf,application/pdf',
  AUDIO: '.mp3,.wav,.m4a,.ogg,.aac,audio/*',
  VIDEO: '.mp4,.webm,.mov,video/*',
  TEXT: '.txt,.md,text/plain',
};

/** Returns accepted MIME patterns for a given resource format. */
export function getAcceptMimeType(format: ResourceType): string {
  return ACCEPT_MIME_BY_FORMAT[format] ?? '*/*';
}

/**
 * Constant definition for staff copy.
 */
export const STAFF_COPY = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    tabs: {
      ADMINISTRATOR: 'Platform Administration & Users',
      SUPERVISOR: 'Shahadah & Certificate Audits',
      INSTRUCTOR: 'Curriculum & Lesson Studio',
      DIALOGIST: 'Dialogue Consultation Queue',
    },
    errGeneric: 'Error',
    errNetwork: 'Network error',
    errSend: 'Send Error',
    errDraft: 'Draft Error',
    errReview: 'Review Error',
    errLessonDraft: 'Lesson Draft Error',
    errUpload: 'Upload Error',
    errUploadFailed: 'Upload failed:',
    errUploadNet: 'Network error during upload:',
    errUnknown: 'Unknown error',
    errRevoke: 'Revoke Error',
    errDelete: 'Delete Error',
    errUpdate: 'Update Error',
    errClaimNet: 'Network error claiming conversation:',
    errCreateStaff: 'Failed to create staff account:',
    errCreateStaffNet: 'Network error creating staff account:',
    errServerReject: 'Server rejected creation',
    errConnFailed: 'Connection failed',
    errStaffPwdLen: 'Staff password must be at least 8 characters long.',
    errUserPwdLen: 'Password must be at least 8 characters long.',
    errUserUpdate: 'Failed to update user.',
    errUserDelete: 'Failed to delete user.',
    errUserCreate: 'Failed to create account.',
    errNetDot: 'Network error.',
    msgReplySent: 'Specialist message delivered to Seeker.',
    msgShahadahValidateNote:
      'Mubarak! Clear and heartfelt pronunciation of the Shahadah.',
    msgShahadahRetakeNote:
      'Please listen carefully to the authentic reference audio clip and record again.',
    msgShahadahValidated: 'Shahadah Validated! Congratulation message sent to Seeker.',
    msgShahadahRetake: 'Retake requested with model reference audio attached.',
    tplApproved: 'approved for all Dialogists',
    tplRejected: 'rejected',
    defaultResDescEn: 'Uploaded by Platform Administrator.',
    defaultResDescFr: 'Téléchargé par l’administrateur de la plateforme.',
    uploadSuccess: (name: string) => `File "${name}" uploaded successfully!`,
    claimed: (id: string) => `Claimed conversation ${id} with exclusive 1-to-1 lock.`,
    templateDraft: (shortcut: string) =>
      `Created predefined message draft "${shortcut}" (pending Supervisor approval for all Dialogists).`,
    lessonSubmitted: (num: number, title: string) =>
      `Submitted Module ${num} ("${title}") to Supervisor Approval Queue.`,
    lessonMarked: (status: string) => `Lesson marked as ${status}.`,
    templateReviewed: (label: string, approved: boolean) =>
      `Predefined message ${label} ${approved ? 'approved for all Dialogists' : 'rejected'}.`,
    staffCreated: (role: string, email: string) =>
      `Created ${role} account for ${email}. Staff can now sign in.`,
    resourceUploaded: (title: string, adminId: string) =>
      `Uploaded public IslamicResource "${title}" (uploadedByAdminId: ${adminId}).`,
    certificateRevoked: (id: string) => `Certificate ${id} revoked.`,
    userUpdated: (name: string) => `User "${name}" successfully updated.`,
    userDeleted: (name: string) => `User "${name}" has been deleted.`,
    userCreated: (name: string) => `User "${name}" successfully created.`,
    resourceDeleted: (id: string) => `Resource "${id}" deleted successfully.`,
    resourceUpdated: (title: string) => `Resource "${title}" updated successfully.`,
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    tabs: {
      ADMINISTRATOR: 'Administration & Utilisateurs',
      SUPERVISOR: 'Audits Chahada & Certificats',
      INSTRUCTOR: 'Programme & Studio Pédagogique',
      DIALOGIST: 'File des Consultations',
    },
    errGeneric: 'Erreur',
    errNetwork: 'Erreur réseau',
    errSend: 'Erreur d’envoi',
    errDraft: 'Erreur modèle',
    errReview: 'Erreur révision',
    errLessonDraft: 'Erreur brouillon',
    errUpload: 'Erreur téléversement',
    errUploadFailed: 'Échec du téléversement :',
    errUploadNet: 'Erreur réseau lors du téléversement :',
    errUnknown: 'Erreur inconnue',
    errRevoke: 'Erreur révocation',
    errDelete: 'Erreur suppression',
    errUpdate: 'Erreur modification',
    errClaimNet: 'Erreur réseau lors de la prise en charge :',
    errCreateStaff: 'Échec de la création du compte personnel :',
    errCreateStaffNet: 'Erreur réseau lors de la création du compte :',
    errServerReject: 'Rejet du serveur',
    errConnFailed: 'Échec de connexion',
    errStaffPwdLen: 'Le mot de passe du personnel doit comporter au moins 8 caractères.',
    errUserPwdLen: 'Le mot de passe doit comporter au moins 8 caractères.',
    errUserUpdate: 'Échec de mise à jour.',
    errUserDelete: 'Échec de suppression.',
    errUserCreate: 'Échec de création du compte.',
    errNetDot: 'Erreur réseau.',
    msgReplySent: 'Message du spécialiste envoyé au chercheur.',
    msgShahadahValidateNote:
      'Mubarak ! Prononciation claire et sincère de la Chahada.',
    msgShahadahRetakeNote:
      'Veuillez écouter attentivement l’enregistrement audio de référence et réenregistrer.',
    msgShahadahValidated: 'Chahada validée ! Message de félicitations envoyé au chercheur.',
    msgShahadahRetake: 'Nouvel essai demandé avec audio de référence joint.',
    tplApproved: 'approuvé pour tous les spécialistes',
    tplRejected: 'rejeté',
    defaultResDescEn: 'Uploaded by Platform Administrator.',
    defaultResDescFr: 'Téléchargé par l’administrateur de la plateforme.',
    uploadSuccess: (name: string) => `Fichier « ${name} » téléversé avec succès !`,
    claimed: (id: string) =>
      `Consultation ${id} prise en charge avec verrou exclusif 1-à-1.`,
    templateDraft: (shortcut: string) =>
      `Modèle de réponse « ${shortcut} » créé (en attente de validation du Superviseur).`,
    lessonSubmitted: (num: number, title: string) =>
      `Module ${num} (« ${title} ») soumis à l’approbation du Superviseur.`,
    lessonMarked: (status: string) => `Module marqué comme ${status}.`,
    templateReviewed: (label: string, approved: boolean) =>
      `Modèle ${label} ${approved ? 'approuvé pour tous les spécialistes' : 'rejeté'}.`,
    staffCreated: (role: string, email: string) =>
      `Compte ${role} créé pour ${email}. L’utilisateur peut maintenant se connecter.`,
    resourceUploaded: (title: string) => `Ressource publique « ${title} » publiée.`,
    certificateRevoked: (id: string) => `Certificat ${id} révoqué.`,
    userUpdated: (name: string) => `L’utilisateur « ${name} » a été mis à jour.`,
    userDeleted: (name: string) => `L’utilisateur « ${name} » a été supprimé.`,
    userCreated: (name: string) => `L’utilisateur « ${name} » a été créé avec succès.`,
    resourceDeleted: (id: string) => `Ressource « ${id} » supprimée avec succès.`,
    resourceUpdated: (title: string) => `Ressource « ${title} » mise à jour avec succès.`,
  },
} as const;

/** Builds localized tab descriptors for the Staff Portal header. */
export function buildStaffTabs(isFr: boolean) {
  const labels = STAFF_COPY[isFr ? 'fr' : 'en'].tabs;
  return [
    { id: 'ADMINISTRATOR' as const, label: labels.ADMINISTRATOR, icon: Settings },
    { id: 'SUPERVISOR' as const, label: labels.SUPERVISOR, icon: ShieldCheck },
    { id: 'INSTRUCTOR' as const, label: labels.INSTRUCTOR, icon: BookOpen },
    { id: 'DIALOGIST' as const, label: labels.DIALOGIST, icon: MessageSquare },
  ];
}
