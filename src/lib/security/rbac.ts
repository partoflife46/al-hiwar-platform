/**
 * Security utility module for rbac enforcement.
 * Implements cryptographic verification, access checks, and input boundary protection.
 * @module lib/security/rbac
 * @exports STAFF_ROLES, CONVERSATION_STAFF_ROLES, CLAIM_STAFF_ROLES, isStaffRole,
 *   canAccessConversation, getSessionFromRequest
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { verifySessionToken } from '@/lib/security/session-token';
import type { Conversation, UserRole, UserSession } from '@/lib/db/types';

/**
 * Constant definition for staff roles.
 */
export const STAFF_ROLES: UserRole[] = ['DIALOGIST', 'INSTRUCTOR', 'SUPERVISOR', 'ADMINISTRATOR'];
/**
 * Constant definition for conversation staff roles.
 */
export const CONVERSATION_STAFF_ROLES: UserRole[] = ['DIALOGIST', 'SUPERVISOR', 'ADMINISTRATOR'];
/**
 * Constant definition for claim staff roles.
 */
export const CLAIM_STAFF_ROLES: UserRole[] = ['DIALOGIST'];

/**
 * Executes is staff role logic.
 * @param role - Role value (`UserRole`).
 * @returns Value of type `boolean`.
 */
export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

/**
 * Executes can access conversation logic.
 * @param session - Session value (`Pick<UserSession, 'userId' | 'role'>`).
 * @param conversation - Conversation value (`Pick<Conversation, 'nonMuslimId' | 'dialog`).
 * @returns Value of type `boolean`.
 */
export function canAccessConversation(
  session: Pick<UserSession, 'userId' | 'role'>,
  conversation: Pick<Conversation, 'nonMuslimId' | 'dialogistId'> & { isAssigned?: boolean }
): boolean {
  // 1. Seeker owner
  if (conversation.nonMuslimId === session.userId) {
    return true;
  }
  // 2. Supervisors and Administrators have platform-wide oversight (FR 78)
  if (session.role === 'SUPERVISOR' || session.role === 'ADMINISTRATOR') {
    return true;
  }
  // 3. Dialogist: can only access if assigned to them or if conversation is unassigned in queue (FR 76)
  if (session.role === 'DIALOGIST') {
    return (
      conversation.dialogistId === session.userId ||
      !conversation.isAssigned ||
      conversation.dialogistId === null
    );
  }
  // 4. Other roles (INSTRUCTOR, etc.) cannot access private consultations
  return false;
}

/**
 * Executes get session from request logic.
 * @param request - Request value (`NextRequest`).
 * @returns Value of type `UserSession | null`.
 */
export function getSessionFromRequest(request: NextRequest): UserSession | null {
  let token = request.cookies.get('alhiwar_session')?.value;

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/alhiwar_session=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  const userId = verifySessionToken(token);
  if (!userId || !token) return null;

  const user = db.findUserById(userId);
  if (!user || user.status !== 'ACTIVE' || !user.emailVerified) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    surname: user.surname,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    token,
  };
}

/**
 * Executes require auth logic.
 * @param request - Request value (`NextRequest`).
 * @param allowedRoles - Allowed roles value (`UserRole[]`).
 * @returns Value of type `{ ok: true; session: UserSession } | { ok: false; `.
 */
export function requireAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
): { ok: true; session: UserSession } | { ok: false; response: NextResponse } {
  const session = getSessionFromRequest(request);

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required. Please sign in with valid credentials.',
        },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: 'FORBIDDEN',
          message: `Access denied. Role "${session.role}" is not authorized for this action.`,
          requiredRoles: allowedRoles,
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, session };
}
