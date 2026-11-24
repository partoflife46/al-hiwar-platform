/**
 * HTTP helpers and state snapshot loaders for the Staff Portal hook.
 */

import { db } from '@/lib/db/in-memory-adapter';
import {
  contentWorkflowService,
  type StudentSupervisionRecord,
} from '@/lib/services/content-workflow-service';
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

/**
 * Type contract defining staff portal snapshot.
 */
export interface StaffPortalSnapshot {
  /** Optional users property. */
  users?: User[];
  /** conversations property. */
  conversations: (Conversation & { seekerFirstName?: string })[];
  /** Optional templates property. */
  templates?: PredefinedMessage[];
  /** Optional all templates property. */
  allTemplates?: PredefinedMessage[];
  /** Optional submissions property. */
  submissions?: ShahadahSubmission[];
  /** Optional lessons property. */
  lessons?: LearningContent[];
  /** Optional student records property. */
  studentRecords?: StudentSupervisionRecord[];
  /** Optional certificates property. */
  certificates?: Certificate[];
  /** Optional resources property. */
  resources?: IslamicResource[];
}

/**
 * Type contract defining api json outcome.
 * Includes fields/members: ok, json.
 */
export interface ApiJsonOutcome {
  ok: boolean;
  json: any;
}

/** Sends a JSON POST request to an internal API route. */
export async function postApiJson(url: string, body: unknown): Promise<ApiJsonOutcome> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { ok: res.ok && Boolean(json.ok), json };
}

/** Fetches the current authenticated session, returning null on failure. */
export async function fetchStaffSession(): Promise<UserSession | null> {
  try {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch (err) {
    console.error('Failed to load staff session:', err);
    return null;
  }
}

/** Selects the best active conversation ID from the latest conversation list. */
export function resolveSelectedConvId(
  prev: string | null,
  convList: Conversation[]
): string | null {
  if (convList.length === 0) return prev;
  if (prev && convList.some((c) => c.id === prev)) return prev;
  const preferred =
    convList.find((c) => c.status === 'ACTIVE' || c.status === 'QUEUED') || convList[0];
  return preferred.id;
}

/** Fetches all staff portal collections from `/api/staff` with local adapter fallback. */
export async function fetchStaffSnapshot(
  dialogistId: string
): Promise<StaffPortalSnapshot> {
  try {
    const res = await fetch('/api/staff', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.data) {
        const d = json.data;
        const conversations = Array.isArray(d.allConversations)
          ? d.allConversations
          : Array.isArray(d.unansweredQueue)
            ? d.unansweredQueue
            : [];
        return {
          users: Array.isArray(d.allUsers) ? d.allUsers : undefined,
          conversations,
          templates: Array.isArray(d.predefinedTemplates)
            ? d.predefinedTemplates
            : undefined,
          allTemplates: Array.isArray(d.allPredefinedMessages)
            ? d.allPredefinedMessages
            : undefined,
          submissions: Array.isArray(d.shahadahSubmissions)
            ? d.shahadahSubmissions
            : undefined,
          lessons: Array.isArray(d.allLessons) ? d.allLessons : undefined,
          studentRecords: Array.isArray(d.studentProgress)
            ? d.studentProgress
            : undefined,
          certificates: Array.isArray(d.certificates) ? d.certificates : undefined,
          resources: Array.isArray(d.allResources) ? d.allResources : undefined,
        };
      }
    }
  } catch {
    // Fallback to in-memory adapter below
  }

  const availTemplates =
    await contentWorkflowService.getAvailablePredefinedMessages(dialogistId);
  const supervision = await contentWorkflowService.getStudentProgressSupervision();
  return {
    conversations: [...db.conversations],
    templates: [...availTemplates],
    allTemplates: [...db.predefinedMessages],
    submissions: [...db.shahadahSubmissions],
    lessons: [...db.learningContents],
    studentRecords: supervision,
    users: [...db.users],
    certificates: [...db.certificates],
    resources: [...db.islamicResources],
  };
}
