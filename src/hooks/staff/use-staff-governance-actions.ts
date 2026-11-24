/**
 * Module architecture and API reference for
 *   `src/hooks/staff/use-staff-governance-actions.ts`.
 *
 * Exported symbols:
 * - `UseStaffGovernanceActionsOptions` (Interface): use staff governance actions options
 *   definition.
 * - `useStaffGovernanceActions` (Function): use staff governance actions definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `./staff-portal-api`
 * - `./staff-portal-copy`
 *
 * @module hooks/staff/use-staff-governance-actions
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Sub-hook encapsulating Instructor, Supervisor, and Administrator governance mutations:
 * lesson drafting, editorial approvals, staff provisioning, and certificate revocation.
 */

import * as React from 'react';
import type { UserRole, UserSession } from '@/lib/db/types';
import { postApiJson } from './staff-portal-api';
import { STAFF_COPY } from './staff-portal-copy';

/** Dependencies injected by `useStaffWorkflowActions` into governance handlers. */
export interface UseStaffGovernanceActionsOptions {
  /** is fr property. */
  isFr: boolean;
  /** current user property. */
  currentUser: UserSession | null;
  /** set status banner property. */
  setStatusBanner: React.Dispatch<React.SetStateAction<string | null>>;
  /** refresh data property. */
  refreshData: () => Promise<void>;
}

/**
 * Manages lesson authoring, Sharia approval reviews, staff creation, and certificate revocation.
 * @param options - Shared language, session, banner, and data refresh callbacks.
 * @returns Controlled form state and mutation callbacks for editorial and admin tabs.
 */
export function useStaffGovernanceActions({
  isFr,
  currentUser,
  setStatusBanner,
  refreshData,
}: UseStaffGovernanceActionsOptions) {
  const copy = STAFF_COPY[isFr ? 'fr' : 'en'];

  const [editingLessonId, setEditingLessonId] = React.useState<string | null>(null);
  const [lessonNumber, setLessonNumber] = React.useState(8);
  const [lessonTitleEn, setLessonTitleEn] = React.useState('');
  const [lessonTitleFr, setLessonTitleFr] = React.useState('');
  const [lessonContentEn, setLessonContentEn] = React.useState('');
  const [lessonContentFr, setLessonContentFr] = React.useState('');

  const [rejectingLessonId, setRejectingLessonId] = React.useState<string | null>(null);
  const [rejectLessonNote, setRejectLessonNote] = React.useState('');

  const [staffFirstName, setStaffFirstName] = React.useState('');
  const [staffSurname, setStaffSurname] = React.useState('');
  const [staffEmail, setStaffEmail] = React.useState('');
  const [staffPassword, setStaffPassword] = React.useState('');
  const [staffRole, setStaffRole] = React.useState<UserRole>('DIALOGIST');

  /**
   * Asynchronously executes handle create lesson draft logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleCreateLessonDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'CREATE_LESSON_DRAFT',
        id: editingLessonId || undefined,
        lessonNumber,
        titleEn: lessonTitleEn,
        titleFr: lessonTitleFr || lessonTitleEn,
        contentMarkdownEn: lessonContentEn,
        contentMarkdownFr: lessonContentFr || lessonContentEn,
      });
      if (ok) {
        setEditingLessonId(null);
        setLessonTitleEn('');
        setLessonTitleFr('');
        setLessonContentEn('');
        setLessonContentFr('');
        const title = isFr ? json.data.titleFr || json.data.titleEn : json.data.titleEn;
        setStatusBanner(copy.lessonSubmitted(json.data.lessonNumber, title));
      } else {
        setStatusBanner(`${copy.errLessonDraft}: ${json.message || json.error}`);
      }
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errNetwork}: ${err?.message}`);
    }
  };

  /**
   * Asynchronously executes handle supervisor review lesson logic.
   * @param lessonId - Lesson id value (`string`).
   * @param decision - Decision value (`'APPROVE' | 'REJECT'`).
   * @param notes - Notes value (`string`).
   */
  const handleSupervisorReviewLesson = async (
    lessonId: string,
    decision: 'APPROVE' | 'REJECT',
    notes?: string
  ) => {
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'REVIEW_LESSON',
        lessonId,
        decision,
        notes: notes?.trim() || undefined,
      });
      if (ok) {
        setRejectingLessonId(null);
        setRejectLessonNote('');
        setStatusBanner(copy.lessonMarked(json.data?.status || decision));
      } else {
        setStatusBanner(`${copy.errReview}: ${json.message || json.error}`);
      }
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errNetwork}: ${err?.message}`);
    }
  };

  /**
   * Asynchronously executes handle supervisor review template logic.
   * @param templateId - Template id value (`string`).
   * @param decision - Decision value (`'APPROVE' | 'REJECT'`).
   */
  const handleSupervisorReviewTemplate = async (
    templateId: string,
    decision: 'APPROVE' | 'REJECT'
  ) => {
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'REVIEW_PREDEFINED',
        templateId,
        decision,
      });
      setStatusBanner(
        ok
          ? copy.templateReviewed(json.data?.shortcut || templateId, decision === 'APPROVE')
          : `${copy.errReview}: ${json.message || json.error}`
      );
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errNetwork}: ${err?.message}`);
    }
  };

  /**
   * Asynchronously executes handle create staff logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffPassword || staffPassword.trim().length < 8) {
      setStatusBanner(copy.errStaffPwdLen);
      return;
    }
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'CREATE_STAFF',
        adminId: currentUser?.userId || 'user-admin-1',
        firstName: staffFirstName,
        surname: staffSurname,
        email: staffEmail,
        role: staffRole,
        password: staffPassword,
      });
      if (!ok) {
        setStatusBanner(`${copy.errCreateStaff} ${json.message || copy.errServerReject}`);
        return;
      }
      setStaffFirstName('');
      setStaffSurname('');
      setStaffEmail('');
      setStaffPassword('');
      setStatusBanner(copy.staffCreated(json.data.role, json.data.email));
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errCreateStaffNet} ${err?.message || copy.errConnFailed}`);
    }
  };

  /**
   * Asynchronously executes handle revoke certificate logic.
   * @param certId - Cert id value (`string`).
   */
  const handleRevokeCertificate = async (certId: string) => {
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'REVOKE_CERTIFICATE',
        certificateId: certId,
        reason: 'Administrative governance audit revocation',
      });
      setStatusBanner(
        ok
          ? copy.certificateRevoked(certId)
          : `${copy.errRevoke}: ${json.message || json.error}`
      );
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errNetwork}: ${err?.message}`);
    }
  };

  return {
    editingLessonId,
    setEditingLessonId,
    lessonNumber,
    setLessonNumber,
    lessonTitleEn,
    setLessonTitleEn,
    lessonTitleFr,
    setLessonTitleFr,
    lessonContentEn,
    setLessonContentEn,
    lessonContentFr,
    setLessonContentFr,
    rejectingLessonId,
    setRejectingLessonId,
    rejectLessonNote,
    setRejectLessonNote,
    staffFirstName,
    setStaffFirstName,
    staffSurname,
    setStaffSurname,
    staffEmail,
    setStaffEmail,
    staffPassword,
    setStaffPassword,
    staffRole,
    setStaffRole,
    handleCreateLessonDraft,
    handleSupervisorReviewLesson,
    handleSupervisorReviewTemplate,
    handleCreateStaff,
    handleRevokeCertificate,
  };
}
