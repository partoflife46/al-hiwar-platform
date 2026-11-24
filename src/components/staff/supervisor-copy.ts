/**
 * Module architecture and API reference for `src/components/staff/supervisor-copy.ts`.
 *
 * Exported symbols:
 * - `SUPERVISOR_COPY` (Const): supervisor copy definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module components/staff/supervisor-copy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual strings for the Sharia Supervisor approval queues and platform audit tables.
 */

import type { SupportedLanguage } from '@/lib/db/types';

/**
 * Constant definition for supervisor copy.
 */
export const SUPERVISOR_COPY: Record<
  SupportedLanguage,
  {
    lessonsQueueTitle: string;
    approveLessonBtn: string;
    rejectBtn: string;
    editorialNotesLabel: string;
    editorialNotesPh: string;
    confirmRejectBtn: string;
    cancelBtn: string;
    allLessonsReviewed: string;
    templatesQueueTitle: string;
    pendingBadge: string;
    approveAllBtn: string;
    allTemplatesReviewed: string;
    auditHeading: string;
    auditBadge: string;
    statConsultations: string;
    statLearners: string;
    statModules: string;
    statCertificates: string;
    consultationsHeading: (count: number) => string;
    unassigned: string;
    auditReassignBtn: string;
    shahadahCertHeading: (subs: number, certs: number) => string;
    lessonsUnit: string;
    quizzesUnit: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    lessonsQueueTitle: 'Educational Content Approval Queue',
    approveLessonBtn: 'Approve Lesson',
    rejectBtn: 'Reject',
    editorialNotesLabel: 'Editorial Notes for Instructor',
    editorialNotesPh: 'Specify required scholarly or editorial revisions…',
    confirmRejectBtn: 'Confirm Rejection',
    cancelBtn: 'Cancel',
    allLessonsReviewed: 'All lessons have been reviewed.',
    templatesQueueTitle: 'Predefined Quick Reply Approval Queue',
    pendingBadge: 'PENDING',
    approveAllBtn: 'Approve for All Dialogists',
    allTemplatesReviewed: 'All quick reply drafts have been reviewed.',
    auditHeading:
      'Read-Only Platform Data Audit (Conversations, Staff & Exams)',
    auditBadge: 'Read-Only Audit Mode',
    statConsultations: 'Consultations Audited',
    statLearners: 'New Muslim Learners',
    statModules: 'Curriculum Modules',
    statCertificates: 'Issued Certificates',
    consultationsHeading: (n) => `Consultations & Reassignment (${n})`,
    unassigned: 'Unassigned',
    auditReassignBtn: 'Audit / Reassign',
    shahadahCertHeading: (s, c) =>
      `Shahadah Audits (${s}) & Certificates (${c})`,
    lessonsUnit: 'Lessons',
    quizzesUnit: 'Quizzes',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    lessonsQueueTitle: 'File d’Approbation du Contenu Éducatif',
    approveLessonBtn: 'Approuver le module',
    rejectBtn: 'Rejeter',
    editorialNotesLabel: 'Notes éditoriales pour l’enseignant',
    editorialNotesPh: 'Précisez les corrections requises…',
    confirmRejectBtn: 'Confirmer le rejet',
    cancelBtn: 'Annuler',
    allLessonsReviewed: 'Tous les modules ont été révisés.',
    templatesQueueTitle: 'Approbation des Modèles de Réponses Rapides',
    pendingBadge: 'EN ATTENTE',
    approveAllBtn: 'Approuver pour tous',
    allTemplatesReviewed: 'Aucun modèle de réponse rapide en attente.',
    auditHeading:
      'Audit en Lecture Seule des Données (Consultations, Personnel & Examens)',
    auditBadge: 'Mode Audit Lecture Seule',
    statConsultations: 'Consultations auditées',
    statLearners: 'Apprenants Nouveaux Musulmans',
    statModules: 'Modules du programme',
    statCertificates: 'Certificats délivrés',
    consultationsHeading: (n) => `Consultations & Réaffectation (${n})`,
    unassigned: 'Non assignée',
    auditReassignBtn: 'Auditer / Réassigner',
    shahadahCertHeading: (s, c) =>
      `Audits Chahada (${s}) & Certificats (${c})`,
    lessonsUnit: 'Modules',
    quizzesUnit: 'Essais',
  },
};
