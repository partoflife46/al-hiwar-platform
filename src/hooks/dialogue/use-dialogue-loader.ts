/**
 * Module architecture and API reference for `src/hooks/dialogue/use-dialogue-loader.ts`.
 *
 * Exported symbols:
 * - `UseDialogueLoaderOptions` (Interface): use dialogue loader options definition.
 * - `useDialogueDataLoader` (Function): use dialogue data loader definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/db/in-memory-adapter`
 * - `./dialogue-loaders`
 *
 * @module hooks/dialogue/use-dialogue-loader
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Role-specific session and data loading sub-hook for `useDialogueWorkspace`.
 * Handles initial load, silent 2.5s polling, and role-change event refreshes.
 */

import * as React from 'react';
import type { Conversation, PredefinedMessage, UserSession } from '@/lib/db/types';
import { db } from '@/lib/db/in-memory-adapter';
import {
  fetchCurrentSession,
  isSameSession,
  loadDialogistWorkspaceData,
  loadNewMuslimWorkspaceData,
  loadSeekerWorkspaceData,
  loadSupervisorWorkspaceData,
  mergeConversationIfUnchanged,
  selectDialogistConversation,
  type SeekerProfileSnapshot,
} from './dialogue-loaders';

/** State setters injected into `useDialogueDataLoader` from the parent workspace hook. */
export interface UseDialogueLoaderOptions {
  /** pending role ref property. */
  pendingRoleRef: React.MutableRefObject<boolean>;
  /** set current user property. */
  setCurrentUser: React.Dispatch<React.SetStateAction<UserSession | null>>;
  /** set active conversation property. */
  setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  /** set queue property. */
  setQueue: React.Dispatch<React.SetStateAction<any[]>>;
  /** set active consultations property. */
  setActiveConsultations: React.Dispatch<React.SetStateAction<any[]>>;
  /** set is triage open property. */
  setIsTriageOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** set is conversion open property. */
  setIsConversionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** set retake feedback property. */
  setRetakeFeedback: React.Dispatch<React.SetStateAction<string | null>>;
  /** set approved replies property. */
  setApprovedReplies: React.Dispatch<React.SetStateAction<PredefinedMessage[]>>;
  /** set is shahadah validated property. */
  setIsShahadahValidated: React.Dispatch<React.SetStateAction<boolean>>;
  /** set seeker profile data property. */
  setSeekerProfileData: React.Dispatch<React.SetStateAction<SeekerProfileSnapshot | null>>;
  /** set audit users property. */
  setAuditUsers: React.Dispatch<React.SetStateAction<any[]>>;
  /** set is loading property. */
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Orchestrates periodic session and role-scoped consultation snapshot loading
 * for Seekers, Dialogists, Supervisors, Administrators, and New Muslims.
 * @param options - Parent state setters and pending role transition ref.
 * @returns `loadSessionAndData` refresh callback for manual triggers.
 */
export function useDialogueDataLoader(options: UseDialogueLoaderOptions) {
  const {
    pendingRoleRef,
    setCurrentUser,
    setActiveConversation,
    setQueue,
    setActiveConsultations,
    setIsTriageOpen,
    setIsConversionOpen,
    setRetakeFeedback,
    setApprovedReplies,
    setIsShahadahValidated,
    setSeekerProfileData,
    setAuditUsers,
    setIsLoading,
  } = options;

  /** Applies loaded Non-Muslim seeker state without clobbering unchanged conversations. */
  const applySeekerData = React.useCallback(
    async (userId: string) => {
      const data = await loadSeekerWorkspaceData(userId);
      if (data.profile) setSeekerProfileData(data.profile);
      setIsShahadahValidated(data.hasValidated);
      if (data.retakeNote) setRetakeFeedback(data.retakeNote);
      setActiveConversation((prev) => mergeConversationIfUnchanged(prev, data.conversation));
      setIsTriageOpen(false);
      if (data.hasValidated) setIsConversionOpen(true);
    },
    [
      setSeekerProfileData,
      setIsShahadahValidated,
      setRetakeFeedback,
      setActiveConversation,
      setIsTriageOpen,
      setIsConversionOpen,
    ]
  );

  /** Applies Dialogist queue, active consultations, and approved quick-reply templates. */
  const applyDialogistData = React.useCallback(
    async (userId: string) => {
      const data = await loadDialogistWorkspaceData();
      if (data.approvedReplies) setApprovedReplies(data.approvedReplies);
      setQueue(data.queue);
      setActiveConsultations(data.activeConsultations);
      setActiveConversation((prev) =>
        selectDialogistConversation(prev, data.activeConsultations, data.queue, userId)
      );
      setIsTriageOpen(false);
    },
    [setApprovedReplies, setQueue, setActiveConsultations, setActiveConversation, setIsTriageOpen]
  );

  /** Applies Supervisor/Admin read-only audit snapshot across all consultations. */
  const applySupervisorData = React.useCallback(async () => {
    const data = await loadSupervisorWorkspaceData();
    if (data.auditUsers) setAuditUsers(data.auditUsers);
    setQueue(data.conversations);
    setActiveConversation((prev) => {
      const next = prev
        ? data.conversations.find((c: any) => c.id === prev.id) || prev
        : data.conversations[0] || null;
      return mergeConversationIfUnchanged(prev, next);
    });
    setIsTriageOpen(false);
  }, [setAuditUsers, setQueue, setActiveConversation, setIsTriageOpen]);

  /** Dispatches role-appropriate data loading based on the authenticated session. */
  const applyRoleData = React.useCallback(
    async (session: UserSession) => {
      if (session.role === 'NON_MUSLIM') return applySeekerData(session.userId);
      if (session.role === 'DIALOGIST') return applyDialogistData(session.userId);
      if (session.role === 'SUPERVISOR' || session.role === 'ADMINISTRATOR') {
        return applySupervisorData();
      }
      if (session.role === 'NEW_MUSLIM') {
        const history = await loadNewMuslimWorkspaceData(session.userId);
        setActiveConversation((prev) => mergeConversationIfUnchanged(prev, history));
        setIsTriageOpen(false);
        setIsConversionOpen(false);
        return;
      }
      setActiveConversation(null);
      setIsTriageOpen(false);
    },
    [
      applySeekerData,
      applyDialogistData,
      applySupervisorData,
      setActiveConversation,
      setIsTriageOpen,
      setIsConversionOpen,
    ]
  );

  /** Fetches the active user session and refreshes role-scoped dialogue state. */
  const loadSessionAndData = React.useCallback(
    async (silent = false) => {
      if (silent && pendingRoleRef.current) return;
      if (!silent) setIsLoading(true);
      try {
        const session = await fetchCurrentSession();
        if (!session) return;
        setCurrentUser((prev) => (isSameSession(prev, session) ? prev : session));
        setApprovedReplies(db.getApprovedPredefinedMessages());
        await applyRoleData(session);
      } catch (err) {
        console.error('Failed to load dialogue state:', err);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [applyRoleData, pendingRoleRef, setApprovedReplies, setCurrentUser, setIsLoading]
  );

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    loadSessionAndData();
    const timer = setInterval(() => loadSessionAndData(true), 2500);
    /** Handles handle role changed interaction. */
    const handleRoleChanged = () => loadSessionAndData();
    window.addEventListener('alhiwar:role-changed', handleRoleChanged);
    return () => {
      clearInterval(timer);
      window.removeEventListener('alhiwar:role-changed', handleRoleChanged);
    };
  }, [loadSessionAndData]);

  return { loadSessionAndData };
}
