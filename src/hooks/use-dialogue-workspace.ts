/**
 * Module architecture and API reference for `src/hooks/use-dialogue-workspace.ts`.
 *
 * Exported symbols:
 * - `useDialogueWorkspace` (Function): use dialogue workspace definition.
 * - `DialogueWorkspaceContext` (TypeAlias): dialogue workspace context definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/context/language-context`
 * - `./dialogue/dialogue-loaders`
 * - `./dialogue/dialogue-actions`
 * - `./dialogue/use-dialogue-loader`
 * - `./dialogue/use-dialogue-stream`
 *
 * @module hooks/use-dialogue-workspace
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Main React hook orchestrating the live dialogue workspace across all platform roles.
 * Composes session/polling loaders, SSE Shahadah stream listeners, and user action handlers.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type {
  ConsultationIntent,
  Conversation,
  Gender,
  PredefinedMessage,
  SupportedLanguage,
  UserSession,
} from '@/lib/db/types';
import { db } from '@/lib/db/in-memory-adapter';
import { useLanguage } from '@/lib/context/language-context';
import type { SeekerProfileSnapshot } from './dialogue/dialogue-loaders';
import {
  claimDialogueConversation,
  reassignDialogueConversation,
  selectDialogueIntent,
  startDialogueSession,
  submitConversionProfile,
  uploadShahadahRecording,
  type RecordingUploadPayload,
} from './dialogue/dialogue-actions';
import { useDialogueDataLoader } from './dialogue/use-dialogue-loader';
import { useDialogueShahadahStream } from './dialogue/use-dialogue-stream';

/**
 * Synchronizes the `?conv=` query string with the currently selected conversation ID.
 * @param conversationId - Active consultation ID, if selected.
 */
function useSyncConversationQuery(conversationId?: string) {
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (typeof window === 'undefined' || !conversationId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('conv') !== conversationId) {
      params.set('conv', conversationId);
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?${params.toString()}`
      );
    }
  }, [conversationId]);
}

/**
 * Registers an Escape-key listener that closes the active modal or drawer when open.
 * @param isOpen - Whether the dismissible surface is currently mounted.
 * @param onClose - Callback invoked upon pressing Escape.
 */
function useEscapeToClose(isOpen: boolean, onClose: () => void) {
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (!isOpen) return;
    /** Handles handle key down interaction. */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
}

/**
 * Manages live dialogue session state, polling, queue claiming, Shahadah uploads,
 * supervisor reassignment, and post-conversion profile promotion.
 * @returns Full workspace state bag and action handlers consumed by `/dialogue`.
 */
export function useDialogueWorkspace() {
  const router = useRouter();
  const { language, setLanguage, isFr } = useLanguage();
  const isFrRef = React.useRef(isFr);
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    isFrRef.current = isFr;
  }, [isFr]);

  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const currentUserRoleRef = React.useRef<string | null>(null);
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    currentUserRoleRef.current = currentUser?.role ?? null;
  }, [currentUser?.role]);

  const [activeConversation, setActiveConversation] =
    React.useState<Conversation | null>(null);
  const [queue, setQueue] = React.useState<any[]>([]);
  const [activeConsultations, setActiveConsultations] = React.useState<any[]>([]);
  const [isTriageOpen, setIsTriageOpen] = React.useState(false);
  const [isStartingDialogue, setIsStartingDialogue] = React.useState(false);
  const [isConversionOpen, setIsConversionOpen] = React.useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = React.useState(false);
  const [isSubmittingRecording, setIsSubmittingRecording] = React.useState(false);
  const [retakeFeedback, setRetakeFeedback] = React.useState<string | null>(null);
  const [approvedReplies, setApprovedReplies] = React.useState<PredefinedMessage[]>([]);
  const [isShahadahValidated, setIsShahadahValidated] = React.useState(false);
  const [seekerProfileData, setSeekerProfileData] =
    React.useState<SeekerProfileSnapshot | null>(null);
  const [auditUsers, setAuditUsers] = React.useState<any[]>([]);
  const [pendingRoleSession, setPendingRoleSession] =
    React.useState<UserSession | null>(null);
  const pendingRoleRef = React.useRef(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const closeRecorder = React.useCallback(() => setIsRecorderOpen(false), []);
  useEscapeToClose(isRecorderOpen, closeRecorder);
  useSyncConversationQuery(activeConversation?.id);

  const { loadSessionAndData } = useDialogueDataLoader({
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
  });

  const activeConvId = activeConversation?.id;

  /**
   * Memoized handler/selector for handle stream validated.
   */
  const handleStreamValidated = React.useCallback(() => {
    setIsShahadahValidated(true);
    setIsRecorderOpen(false);
    if (currentUserRoleRef.current === 'NON_MUSLIM') {
      setIsConversionOpen(true);
    }
  }, []);

  useDialogueShahadahStream({
    activeConvId,
    isFrRef,
    currentUserRoleRef,
    onValidated: handleStreamValidated,
    onRetakeFeedback: setRetakeFeedback,
  });

  /**
   * Asynchronously executes handle start dialogue logic.
   */
  const handleStartDialogue = async () => {
    if (!currentUser || isStartingDialogue) return;
    setIsStartingDialogue(true);
    try {
      const preferredLang = language || currentUser.preferredLanguage || 'en';
      const conv = await startDialogueSession(currentUser.userId, preferredLang);
      setActiveConversation(conv);
    } finally {
      setIsStartingDialogue(false);
    }
  };

  /**
   * Asynchronously executes handle select intent logic.
   * @param intent - Intent value (`ConsultationIntent`).
   * @param lang - Lang value (`SupportedLanguage`).
   */
  const handleSelectIntent = async (
    intent: ConsultationIntent,
    lang: SupportedLanguage
  ) => {
    if (!currentUser) return;
    const conv = await selectDialogueIntent(currentUser.userId, intent, lang);
    setActiveConversation(conv);
    setIsTriageOpen(false);
  };

  /**
   * Asynchronously executes handle claim logic.
   * @param conversationId - Conversation id value (`string`).
   */
  const handleClaim = async (conversationId: string) => {
    if (!currentUser) return;
    const claimed = await claimDialogueConversation(conversationId);
    if (claimed) {
      setActiveConversation(claimed);
      await loadSessionAndData(true);
    }
  };

  /**
   * Asynchronously executes handle upload recording logic.
   * @param payload - Payload value (`RecordingUploadPayload`).
   */
  const handleUploadRecording = async (payload: RecordingUploadPayload) => {
    setIsSubmittingRecording(true);
    try {
      const uploaded = await uploadShahadahRecording(payload, isFr);
      if (uploaded) setIsRecorderOpen(false);
    } finally {
      setIsSubmittingRecording(false);
    }
  };

  const handleShahadahValidated = React.useCallback(() => {
    setIsShahadahValidated(true);
    setIsConversionOpen(true);
  }, []);

  /**
   * Asynchronously executes handle reassign logic.
   * @param conversationId - Conversation id value (`string`).
   * @param newDialogistId - New dialogist id value (`string`).
   */
  const handleReassign = async (conversationId: string, newDialogistId: string) => {
    if (!currentUser) return;
    const updated = await reassignDialogueConversation(
      currentUser.userId,
      conversationId,
      newDialogistId
    );
    if (updated) {
      setActiveConversation(updated);
      setQueue((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, ...updated } : c))
      );
    }
  };

  /**
   * Asynchronously executes handle submit profile logic.
   * @param profileData - Profile data value (`{ nationality: string; gender: Gender; pho`).
   */
  const handleSubmitProfile = async (profileData: {
    nationality: string;
    gender: Gender;
    phoneNumber: string;
  }) => {
    if (!currentUser) return;
    const updatedSession = await submitConversionProfile(
      currentUser.userId,
      profileData,
      isFr
    );
    pendingRoleRef.current = true;
    setPendingRoleSession(updatedSession);
  };

  const seeker = currentUser ? db.findUserById(currentUser.userId) : undefined;
  const auditConversations =
    activeConsultations.length > 0 ? activeConsultations : db.conversations;

  return {
    seeker,
    auditConversations,
    handleSubmitProfile,
    language,
    setLanguage,
    isFr,
    currentUser,
    setCurrentUser,
    activeConversation,
    setActiveConversation,
    queue,
    setQueue,
    activeConsultations,
    setActiveConsultations,
    isTriageOpen,
    setIsTriageOpen,
    isStartingDialogue,
    setIsStartingDialogue,
    isConversionOpen,
    setIsConversionOpen,
    isRecorderOpen,
    setIsRecorderOpen,
    isSubmittingRecording,
    setIsSubmittingRecording,
    retakeFeedback,
    setRetakeFeedback,
    approvedReplies,
    setApprovedReplies,
    isShahadahValidated,
    setIsShahadahValidated,
    seekerProfileData,
    setSeekerProfileData,
    auditUsers,
    setAuditUsers,
    pendingRoleSession,
    setPendingRoleSession,
    isLoading,
    setIsLoading,
    router,
    isFrRef,
    currentUserRoleRef,
    pendingRoleRef,
    loadSessionAndData,
    handleStartDialogue,
    handleSelectIntent,
    handleClaim,
    handleUploadRecording,
    activeConvId,
    handleShahadahValidated,
    handleReassign,
  };
}

/** Return shape exported by `useDialogueWorkspace` for dialogue views. */
export type DialogueWorkspaceContext = ReturnType<typeof useDialogueWorkspace>;
