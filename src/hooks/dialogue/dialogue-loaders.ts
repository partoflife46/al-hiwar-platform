/**
 * Role-specific data loaders and state comparators for the live dialogue workspace.
 */

import type {
  Conversation,
  Gender,
  PredefinedMessage,
  UserSession,
} from '@/lib/db/types';
import { db } from '@/lib/db/in-memory-adapter';
import { chatService } from '@/lib/services/chat-service';

/**
 * Type contract defining seeker profile snapshot.
 * Includes fields/members: nationality, gender, phoneNumber, dateOfBirth.
 */
export interface SeekerProfileSnapshot {
  /** Optional nationality property. */
  nationality?: string | null;
  /** Optional gender property. */
  gender?: Gender | null;
  /** Optional phone number property. */
  phoneNumber?: string | null;
  /** Optional date of birth property. */
  dateOfBirth?: string;
}

/**
 * Type contract defining seeker load result.
 * Includes fields/members: conversation, profile, hasValidated, retakeNote.
 */
export interface SeekerLoadResult {
  /** conversation property. */
  conversation: Conversation | null;
  /** profile property. */
  profile: SeekerProfileSnapshot | null;
  /** has validated property. */
  hasValidated: boolean;
  /** retake note property. */
  retakeNote: string | null;
}

/**
 * Type contract defining dialogist load result.
 * Includes fields/members: queue, activeConsultations, approvedReplies.
 */
export interface DialogistLoadResult {
  queue: any[];
  activeConsultations: any[];
  approvedReplies?: PredefinedMessage[];
}

/**
 * Type contract defining supervisor load result.
 * Includes fields/members: auditUsers, conversations.
 */
export interface SupervisorLoadResult {
  auditUsers?: any[];
  conversations: any[];
}

/** Preserves reference identity when conversation metadata has not changed. */
export function mergeConversationIfUnchanged(
  prev: Conversation | null,
  next: Conversation | null
): Conversation | null {
  if (!next) return null;
  const unchanged =
    prev &&
    prev.id === next.id &&
    prev.status === next.status &&
    prev.intent === next.intent &&
    prev.isAssigned === next.isAssigned &&
    prev.dialogistId === next.dialogistId &&
    prev.inactivityNoticeSent === next.inactivityNoticeSent &&
    (prev as any).seekerFirstName === (next as any).seekerFirstName;
  return unchanged ? prev : next;
}

/** Checks whether two user sessions represent the same identity and preferences. */
export function isSameSession(prev: UserSession | null, next: UserSession): boolean {
  if (!prev) return false;
  return (
    prev.userId === next.userId &&
    prev.role === next.role &&
    prev.firstName === next.firstName &&
    prev.surname === next.surname &&
    prev.preferredLanguage === next.preferredLanguage
  );
}

/** Safely fetches JSON with no-store caching, returning null on network or parse error. */
async function fetchJsonSafe(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** Fetches the active session from `/api/auth/session`. */
export async function fetchCurrentSession(): Promise<UserSession | null> {
  const json = await fetchJsonSafe('/api/auth/session');
  return json?.data ?? null;
}

/** Loads conversation, profile, and Shahadah validation state for a Non-Muslim seeker. */
export async function loadSeekerWorkspaceData(userId: string): Promise<SeekerLoadResult> {
  const convJson = await fetchJsonSafe(`/api/chat/initiate?seekerId=${userId}`);
  const localConv = db.conversations.find(
    (c) => c.nonMuslimId === userId && (c.status === 'QUEUED' || c.status === 'ACTIVE')
  );
  const conversation: Conversation | null =
    (convJson?.ok && convJson.data) || localConv || null;

  const profJson = await fetchJsonSafe('/api/user/profile');
  const d = profJson?.ok ? profJson.data : null;
  const profile: SeekerProfileSnapshot | null = d
    ? {
        nationality: d.nationality,
        gender: d.gender,
        phoneNumber: d.phoneNumber,
        dateOfBirth: d.dateOfBirth,
      }
    : null;

  const shdJson = await fetchJsonSafe(`/api/shahadah/upload?seekerId=${userId}`);
  const status = shdJson?.ok ? shdJson.data?.status : null;
  const hasValidated = status === 'VALIDATED';
  const retakeNote =
    status === 'RETAKE_REQUESTED' ? shdJson.data.feedbackNotes || null : null;

  return { conversation, profile, hasValidated, retakeNote };
}

/** Picks the next active conversation to display for a Dialogist without losing focus. */
export function selectDialogistConversation(
  prev: Conversation | null,
  activeItems: any[],
  queueItems: any[],
  userId: string
): Conversation | null {
  const kept = prev
    ? activeItems.find((c) => c.id === prev.id) || queueItems.find((c) => c.id === prev.id)
    : null;
  const assigned = activeItems.find((c) => c.dialogistId === userId);
  const target = kept || assigned || activeItems[0] || null;
  return mergeConversationIfUnchanged(prev, target);
}

/** Loads unanswered queue and active consultations for a Dialogist. */
export async function loadDialogistWorkspaceData(): Promise<DialogistLoadResult> {
  const qJson = await fetchJsonSafe('/api/chat/queue');
  if (qJson?.ok) {
    return {
      queue: qJson.queue || qJson.data || [],
      activeConsultations: qJson.activeConversations || [],
      approvedReplies: Array.isArray(qJson.approvedReplies)
        ? qJson.approvedReplies
        : undefined,
    };
  }
  const unanswered = await chatService.getUnansweredQueue();
  return {
    queue: unanswered.map((c) => chatService.sanitizeForDialogist(c)),
    activeConsultations: [],
  };
}

/** Loads audit users and platform conversations for Supervisor/Administrator audit mode. */
export async function loadSupervisorWorkspaceData(): Promise<SupervisorLoadResult> {
  const [qJson, staffJson] = await Promise.all([
    fetchJsonSafe('/api/chat/queue'),
    fetchJsonSafe('/api/staff'),
  ]);
  const staffData = staffJson?.ok ? staffJson.data : null;
  if (staffData || qJson) {
    const staffConvs = Array.isArray(staffData?.allConversations)
      ? staffData.allConversations
      : [];
    const queueConvs = qJson?.allConversations || [];
    return {
      auditUsers: Array.isArray(staffData?.allUsers) ? staffData.allUsers : undefined,
      conversations: staffConvs.length > 0 ? staffConvs : queueConvs,
    };
  }
  return { conversations: db.conversations };
}

/** Loads archived conversation history for a New Muslim account. */
export async function loadNewMuslimWorkspaceData(userId: string): Promise<Conversation | null> {
  const json = await fetchJsonSafe(`/api/chat/initiate?seekerId=${userId}`);
  if (json?.ok && json.data) return json.data;
  return db.conversations.find((c) => c.nonMuslimId === userId) || null;
}
