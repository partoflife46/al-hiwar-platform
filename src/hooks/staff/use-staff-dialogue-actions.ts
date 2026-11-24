/**
 * Sub-hook encapsulating Dialogist consultation actions: claiming queued seekers,
 * sending replies, drafting predefined templates, and reviewing Shahadah submissions.
 */

import * as React from 'react';
import type { Message, PredefinedMessageCategory, UserSession } from '@/lib/db/types';
import { postApiJson } from './staff-portal-api';
import { STAFF_COPY } from './staff-portal-copy';

/** Dependencies injected by `useStaffWorkflowActions` into Dialogist action handlers. */
export interface UseStaffDialogueActionsOptions {
  /** is fr property. */
  isFr: boolean;
  /** current user property. */
  currentUser: UserSession | null;
  /** selected conv id property. */
  selectedConvId: string | null;
  /** set selected conv id property. */
  setSelectedConvId: React.Dispatch<React.SetStateAction<string | null>>;
  /** reply text property. */
  replyText: string;
  /** set reply text property. */
  setReplyText: React.Dispatch<React.SetStateAction<string>>;
  /** set active messages property. */
  setActiveMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  /** set status banner property. */
  setStatusBanner: React.Dispatch<React.SetStateAction<string | null>>;
  /** refresh data property. */
  refreshData: () => Promise<void>;
}

/**
 * Manages Dialogist-facing consultation actions and predefined reply draft form state.
 * @param options - Shared portal state setters and snapshot refresh callback.
 * @returns Draft form fields plus claim, reply, template draft, and Shahadah review handlers.
 */
export function useStaffDialogueActions({
  isFr,
  currentUser,
  selectedConvId,
  setSelectedConvId,
  replyText,
  setReplyText,
  setActiveMessages,
  setStatusBanner,
  refreshData,
}: UseStaffDialogueActionsOptions) {
  const copy = STAFF_COPY[isFr ? 'fr' : 'en'];

  const [draftShortcut, setDraftShortcut] = React.useState('/mercy');
  const [draftCategory, setDraftCategory] =
    React.useState<PredefinedMessageCategory>('THEOLOGY');
  const [draftBodyEn, setDraftBodyEn] = React.useState('');
  const [draftBodyFr, setDraftBodyFr] = React.useState('');

  /**
   * Asynchronously executes handle claim conversation logic.
   * @param convId - Conv id value (`string`).
   */
  const handleClaimConversation = async (convId: string) => {
    try {
      const { ok, json } = await postApiJson('/api/chat/claim', { conversationId: convId });
      if (!ok) {
        setStatusBanner(`${copy.errGeneric}: ${json.message || json.error}`);
      } else {
        setSelectedConvId(convId);
        setStatusBanner(copy.claimed(convId));
      }
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errClaimNet} ${err?.message}`);
    }
  };

  /**
   * Asynchronously executes handle send reply logic.
   * @param predefinedReplyId - Predefined reply id value (`string`).
   */
  const handleSendReply = async (predefinedReplyId?: string) => {
    if (!selectedConvId) return;
    if (!predefinedReplyId && !replyText.trim()) return;
    try {
      const { ok, json } = await postApiJson('/api/chat/messages', {
        conversationId: selectedConvId,
        senderId: currentUser?.userId,
        content: replyText,
        predefinedReplyId: predefinedReplyId || null,
      });
      if (ok) {
        if (!predefinedReplyId) setReplyText('');
        if (json.data) {
          setActiveMessages((prev) =>
            prev.some((m) => m.id === json.data.id) ? prev : [...prev, json.data]
          );
        }
        setStatusBanner(copy.msgReplySent);
      } else {
        setStatusBanner(`${copy.errSend}: ${json.message || json.error}`);
      }
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errNetwork}: ${err?.message}`);
    }
  };

  /**
   * Asynchronously executes handle create template draft logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleCreateTemplateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'CREATE_PREDEFINED_DRAFT',
        shortcut: draftShortcut,
        category: draftCategory,
        bodyEn: draftBodyEn,
        bodyFr: draftBodyFr || draftBodyEn,
      });
      if (ok) {
        setDraftBodyEn('');
        setDraftBodyFr('');
        setStatusBanner(copy.templateDraft(json.data?.shortcut || draftShortcut));
      } else {
        setStatusBanner(`${copy.errDraft}: ${json.message || json.error}`);
      }
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errNetwork}: ${err?.message}`);
    }
  };

  /**
   * Asynchronously executes handle review shahadah logic.
   * @param submissionId - Submission id value (`string`).
   * @param decision - Decision value (`'VALIDATE' | 'REQUEST_RETAKE'`).
   * @param targetAttemptNumber - Target attempt number value (`number`).
   */
  const handleReviewShahadah = async (
    submissionId: string,
    decision: 'VALIDATE' | 'REQUEST_RETAKE',
    targetAttemptNumber?: number
  ) => {
    try {
      const isValidate = decision === 'VALIDATE';
      const { ok, json } = await postApiJson('/api/shahadah/review', {
        dialogistId: currentUser?.userId,
        submissionId,
        decision,
        targetAttemptNumber,
        feedbackNotes: isValidate
          ? copy.msgShahadahValidateNote
          : copy.msgShahadahRetakeNote,
      });
      setStatusBanner(
        ok
          ? isValidate
            ? copy.msgShahadahValidated
            : copy.msgShahadahRetake
          : `${copy.errReview}: ${json.message || json.error}`
      );
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errNetwork}: ${err?.message}`);
    }
  };

  return {
    draftShortcut,
    setDraftShortcut,
    draftCategory,
    setDraftCategory,
    draftBodyEn,
    setDraftBodyEn,
    draftBodyFr,
    setDraftBodyFr,
    handleClaimConversation,
    handleSendReply,
    handleCreateTemplateDraft,
    handleReviewShahadah,
  };
}
