/**
 * Server-side helper module supporting the `/api/staff` API route.
 * Isolates validation, payload mapping, and domain orchestration from HTTP transport logic.
 * @module app/api/staff/staff-shared
 * @exports StaffActionHandler, sanitizeUser, jsonError, requireStaffRole,
 *   validatePasswordInput, buildAdminOrSupervisorData
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { contentWorkflowService } from '@/lib/services/content-workflow-service';
import { chatService } from '@/lib/services/chat-service';
import { STAFF_ROLES } from '@/lib/security/rbac';
import { evaluatePassword } from '@/lib/security/password-policy';
import type { User, UserRole, UserSession } from '@/lib/db/types';

/**
 * Type alias representing staff action handler.
 */
export type StaffActionHandler = (
  session: UserSession,
  body: Record<string, any>
) => Promise<NextResponse>;

/** Strips sensitive authentication fields before returning user records. */
export function sanitizeUser<
  T extends Partial<Pick<User, 'passwordHash' | 'verificationOtp' | 'otpHash'>>
>(user: T) {
  const { passwordHash: _ph, verificationOtp: _vo, otpHash: _oh, ...safe } = user;
  return safe;
}

/** Builds a standardized JSON error response with status code. */
export function jsonError(status: number, error: string, message: string): NextResponse {
  return NextResponse.json({ ok: false, error, message }, { status });
}

/** Ensures the authenticated staff session matches one of `allowedRoles`. */
export function requireStaffRole(
  session: UserSession,
  allowedRoles: UserRole[],
  message: string
): NextResponse | null {
  return allowedRoles.includes(session.role)
    ? null
    : jsonError(403, 'FORBIDDEN', message);
}

/** Validates staff/user password strength against platform security policy. */
export function validatePasswordInput(
  password: string,
  shortMessage: string
): NextResponse | null {
  const evaluation = evaluatePassword(password);
  if (!evaluation.hasMinLength) {
    return jsonError(400, 'PASSWORD_TOO_SHORT', shortMessage);
  }
  if (!evaluation.isValid) {
    return jsonError(
      400,
      'PASSWORD_TOO_WEAK',
      evaluation.errorMessageEn ||
        'Password must contain a combination of letters and numbers.'
    );
  }
  return null;
}

/** Assembles full audit & operations payload for Administrators and Supervisors. */
export async function buildAdminOrSupervisorData(session: UserSession) {
  const sanitizedUsers = db.users.map(sanitizeUser);
  const enrichedConversations = db.conversations.map((c) =>
    chatService.sanitizeForDialogist(c)
  );
  const unansweredQueue = (await chatService.getUnansweredQueue()).map((c) =>
    chatService.sanitizeForDialogist(c)
  );
  const myConversations = enrichedConversations.filter(
    (c) => c.dialogistId === session.userId
  );
  const auditOverview = await contentWorkflowService.getSupervisorAuditData();
  const predefinedTemplates =
    await contentWorkflowService.getAvailablePredefinedMessages(session.userId);
  const visibleUsers =
    session.role === 'SUPERVISOR'
      ? sanitizedUsers.filter((u) => STAFF_ROLES.includes(u.role))
      : sanitizedUsers;

  return {
    ...auditOverview,
    unansweredQueue,
    myConversations,
    allConversations: enrichedConversations,
    predefinedTemplates,
    allLessons: db.learningContents,
    allPredefinedMessages: db.predefinedMessages,
    allUsers: visibleUsers,
    allResources: db.islamicResources,
    shahadahSubmissions: db.shahadahSubmissions,
  };
}

/** Assembles consultation queue and template payload scoped to a Dialogist. */
export async function buildDialogistData(session: UserSession) {
  const enrichedConversations = db.conversations.map((c) =>
    chatService.sanitizeForDialogist(c)
  );
  const unansweredQueue = (await chatService.getUnansweredQueue()).map((c) =>
    chatService.sanitizeForDialogist(c)
  );
  const myConversations = enrichedConversations.filter(
    (c) => c.dialogistId === session.userId
  );
  const predefinedTemplates =
    await contentWorkflowService.getAvailablePredefinedMessages(session.userId);
  const myTemplates = db.predefinedMessages.filter(
    (m) => m.authorId === session.userId || m.isApproved
  );
  const dialogistConversations = [...myConversations, ...unansweredQueue];

  return {
    conversations: dialogistConversations,
    allConversations: dialogistConversations,
    myConversations,
    unansweredQueue,
    predefinedTemplates,
    allPredefinedMessages: myTemplates,
    allResources: db.islamicResources,
    allLessons: [],
    allUsers: [],
    shahadahSubmissions: [],
    studentProgress: [],
    certificates: [],
    pendingLessons: [],
    pendingPredefinedMessages: [],
    staff: [],
  };
}

/** Assembles curriculum studio payload scoped to an Instructor. */
export function buildInstructorData() {
  return {
    allLessons: db.learningContents,
    allResources: db.islamicResources,
    conversations: [],
    allConversations: [],
    myConversations: [],
    unansweredQueue: [],
    allUsers: [],
    shahadahSubmissions: [],
    studentProgress: [],
    certificates: [],
    predefinedTemplates: [],
    allPredefinedMessages: [],
    pendingLessons: [],
    pendingPredefinedMessages: [],
    staff: [],
  };
}
