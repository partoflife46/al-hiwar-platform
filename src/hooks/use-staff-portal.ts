/**
 * Module architecture and API reference for `src/hooks/use-staff-portal.ts`.
 *
 * Exported symbols:
 * - `useStaffPortal` (Function): use staff portal definition.
 * - `StaffPortalContext` (TypeAlias): staff portal context definition.
 *
 * Internal dependencies:
 * - `@/lib/services/content-workflow-service`
 * - `@/lib/context/language-context`
 * - `@/lib/db/types`
 * - `./staff/staff-portal-copy`
 * - `./staff/staff-portal-api`
 * - `./staff/use-staff-dialogue-stream`
 * - `./staff/use-staff-user-form`
 * - `./staff/use-staff-resource-form`
 * - `./staff/use-staff-workflow-forms`
 *
 * @module hooks/use-staff-portal
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Main React hook orchestrating state, live sync, and role-isolated actions for the Staff Portal.
 */

import * as React from 'react';
import { type StudentSupervisionRecord } from '@/lib/services/content-workflow-service';
import { useLanguage } from '@/lib/context/language-context';
import type {
  Certificate,
  Conversation,
  IslamicResource,
  LearningContent,
  PredefinedMessage,
  ShahadahSubmission,
  User,
  UserSession,
} from '@/lib/db/types';
import {
  buildStaffTabs,
  STAFF_ROLES,
  type StaffTab,
} from './staff/staff-portal-copy';
import {
  fetchStaffSession,
  fetchStaffSnapshot,
  resolveSelectedConvId,
} from './staff/staff-portal-api';
import { useStaffDialogueStream } from './staff/use-staff-dialogue-stream';
import { useStaffUserForm } from './staff/use-staff-user-form';
import { useStaffResourceForm } from './staff/use-staff-resource-form';
import { useStaffWorkflowActions } from './staff/use-staff-workflow-forms';

export type { StaffTab };

/**
 * Type alias representing confirm dialog state.
 */
type ConfirmDialogState =
  | { type: 'REVOKE_CERTIFICATE'; id: string; label: string }
  | { type: 'DELETE_USER'; id: string; label: string }
  | { type: 'DELETE_RESOURCE'; id: string; label: string }
  | null;

/**
 * Constant definition for external roles.
 */
const EXTERNAL_ROLES = new Set(['VISITOR', 'NON_MUSLIM', 'NEW_MUSLIM']);

/** Checks whether a user role corresponds to one of the four staff workspaces. */
function isStaffTabRole(role?: string | null): role is StaffTab {
  return Boolean(role && STAFF_ROLES.includes(role as StaffTab));
}

/** Syncs the URL query parameters with the active staff tab and selected conversation. */
function useSyncStaffQuery(activeTab: StaffTab, selectedConvId: string | null) {
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    if (selectedConvId) params.set('conv', selectedConvId);
    else params.delete('conv');
    const nextSearch = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`
    );
  }, [activeTab, selectedConvId]);
}

/** Manages state, live polling, SSE stream, and CRUD actions for the Staff Portal. */
export function useStaffPortal() {
  const { isFr } = useLanguage();
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const isAuditOnly =
    currentUser?.role === 'ADMINISTRATOR' || currentUser?.role === 'SUPERVISOR';
  const [activeTab, setActiveTab] = React.useState<StaffTab>('DIALOGIST');
  const [statusBanner, setStatusBanner] = React.useState<string | null>(null);

  const allTabs = React.useMemo(() => buildStaffTabs(isFr), [isFr]);
  const availableTabs = allTabs.filter((t) => t.id === currentUser?.role);
  const effectiveTab: StaffTab =
    availableTabs.some((t) => t.id === activeTab)
      ? activeTab
      : availableTabs[0]?.id || (currentUser?.role as StaffTab) || 'DIALOGIST';

  const [conversations, setConversations] = React.useState<
    (Conversation & { seekerFirstName?: string })[]
  >([]);
  const [selectedConvId, setSelectedConvId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [templates, setTemplates] = React.useState<PredefinedMessage[]>([]);
  const [allTemplates, setAllTemplates] = React.useState<PredefinedMessage[]>([]);
  const [submissions, setSubmissions] = React.useState<ShahadahSubmission[]>([]);
  const [lessons, setLessons] = React.useState<LearningContent[]>([]);
  const [studentRecords, setStudentRecords] = React.useState<
    StudentSupervisionRecord[]
  >([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [certificates, setCertificates] = React.useState<Certificate[]>([]);
  const [resources, setResources] = React.useState<IslamicResource[]>([]);
  const [confirmDialog, setConfirmDialog] =
    React.useState<ConfirmDialogState>(null);
  const [isConfirmingAction, setIsConfirmingAction] = React.useState(false);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (!confirmDialog) return;
    /** Handles on key down interaction. */
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isConfirmingAction) setConfirmDialog(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmDialog, isConfirmingAction]);

  useSyncStaffQuery(activeTab, selectedConvId);

  /**
   * Memoized handler/selector for refresh data.
   */
  const refreshData = React.useCallback(async () => {
    const snap = await fetchStaffSnapshot(currentUser?.userId || 'user-dialogist-1');
    if (snap.users) setUsers(snap.users);
    setConversations(snap.conversations);
    setSelectedConvId((prev) => resolveSelectedConvId(prev, snap.conversations));
    if (snap.templates) setTemplates(snap.templates);
    if (snap.allTemplates) setAllTemplates(snap.allTemplates);
    if (snap.submissions) setSubmissions(snap.submissions);
    if (snap.lessons) setLessons(snap.lessons);
    if (snap.studentRecords) setStudentRecords(snap.studentRecords);
    if (snap.certificates) setCertificates(snap.certificates);
    if (snap.resources) setResources(snap.resources);
  }, [currentUser?.userId]);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    /**
     * Asynchronously executes init session logic.
     * @returns Promise resolving once the operation completes.
     */
    async function initSession() {
      const session = await fetchStaffSession();
      if (session) {
        setCurrentUser(session);
        const urlConv =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('conv')
            : null;
        if (urlConv) setSelectedConvId(urlConv);
        if (isStaffTabRole(session.role)) setActiveTab(session.role);
      }
      await refreshData();
    }
    initSession();

    const pollTimer = setInterval(refreshData, 2500);
    /**
     * Executes handle role changed logic.
     * @param e - E value (`Event`).
     */
    const handleRoleChanged = (e: Event) => {
      const detail = (e as CustomEvent<UserSession>).detail;
      if (detail) {
        setCurrentUser(detail);
        if (isStaffTabRole(detail.role)) setActiveTab(detail.role);
      }
      refreshData();
    };
    window.addEventListener('alhiwar:role-changed', handleRoleChanged);
    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('alhiwar:role-changed', handleRoleChanged);
    };
  }, [refreshData]);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (isStaffTabRole(currentUser?.role) && activeTab !== currentUser.role) {
      setActiveTab(currentUser.role);
    }
  }, [currentUser?.role, activeTab]);

  const canAccessDialogueStream =
    Boolean(currentUser) &&
    ((currentUser?.role === 'DIALOGIST' && effectiveTab === 'DIALOGIST') ||
      (currentUser?.role === 'SUPERVISOR' && effectiveTab === 'SUPERVISOR'));

  const { activeMessages, setActiveMessages } = useStaffDialogueStream(
    selectedConvId,
    canAccessDialogueStream
  );

  const workflow = useStaffWorkflowActions({
    isFr,
    currentUser,
    selectedConvId,
    setSelectedConvId,
    replyText,
    setReplyText,
    setActiveMessages,
    setStatusBanner,
    refreshData,
  });

  const resourceForm = useStaffResourceForm({
    isFr,
    refreshData,
    setStatusBanner,
    setResources,
  });

  const userForm = useStaffUserForm({
    isFr,
    refreshData,
    onRequestDeleteUser: (id, label) =>
      setConfirmDialog({ type: 'DELETE_USER', id, label }),
  });

  /**
   * Asynchronously executes handle confirm destructive action logic.
   */
  const handleConfirmDestructiveAction = async () => {
    if (!confirmDialog) return;
    setIsConfirmingAction(true);
    try {
      const handlers: Record<NonNullable<ConfirmDialogState>['type'], () => Promise<void>> = {
        DELETE_USER: () => userForm.executeDeleteUser(confirmDialog.id, confirmDialog.label),
        REVOKE_CERTIFICATE: () => workflow.handleRevokeCertificate(confirmDialog.id),
        DELETE_RESOURCE: () => resourceForm.handleDeleteResource(confirmDialog.id),
      };
      await handlers[confirmDialog.type]();
      setConfirmDialog(null);
    } finally {
      setIsConfirmingAction(false);
    }
  };

  const selectedConversation =
    conversations.find((c) => c.id === selectedConvId) || null;
  const isExternalRole = Boolean(
    currentUser?.role && EXTERNAL_ROLES.has(currentUser.role)
  );

  return {
    isFr,
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab,
    statusBanner,
    setStatusBanner,
    conversations,
    setConversations,
    selectedConvId,
    setSelectedConvId,
    replyText,
    setReplyText,
    templates,
    setTemplates,
    allTemplates,
    setAllTemplates,
    submissions,
    setSubmissions,
    lessons,
    setLessons,
    studentRecords,
    setStudentRecords,
    users,
    setUsers,
    certificates,
    setCertificates,
    resources,
    setResources,
    confirmDialog,
    setConfirmDialog,
    isConfirmingAction,
    setIsConfirmingAction,
    activeMessages,
    setActiveMessages,
    isAuditOnly,
    allTabs,
    availableTabs,
    effectiveTab,
    refreshData,
    handleConfirmDestructiveAction,
    selectedConversation,
    canAccessDialogueStream,
    isExternalRole,
    ...workflow,
    ...resourceForm,
    ...userForm,
  };
}

/**
 * Type alias representing staff portal context.
 */
export type StaffPortalContext = ReturnType<typeof useStaffPortal>;
