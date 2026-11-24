/**
 * Module architecture and API reference for `src/app/api/staff/route.ts`.
 *
 * Exported symbols:
 * - `dynamic` (Const): dynamic definition.
 * - `GET` (Function): get definition.
 * - `POST` (Function): post definition.
 *
 * Internal dependencies:
 * - `@/lib/security/rbac`
 * - `./staff-shared`
 * - `./staff-user-actions`
 * - `./staff-content-actions`
 *
 * @module app/api/staff/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router API route handler for `/api/staff`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/staff/route
 * @exports dynamic, GET, POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, STAFF_ROLES } from '@/lib/security/rbac';
import {
  buildAdminOrSupervisorData,
  buildDialogistData,
  buildInstructorData,
  jsonError,
  type StaffActionHandler,
} from './staff-shared';
import {
  handleCreateStaff,
  handleCreateUser,
  handleDeleteUser,
  handleRevokeCertificate,
  handleUpdateUser,
} from './staff-user-actions';
import {
  handleCreateLessonDraft,
  handleCreatePredefinedDraft,
  handleDeleteResource,
  handleReassignConversation,
  handleReviewLesson,
  handleReviewPredefined,
  handleUpdateResource,
  handleUploadResource,
} from './staff-content-actions';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Constant definition for staff action handlers.
 */
const STAFF_ACTION_HANDLERS: Record<string, StaffActionHandler> = {
  CREATE_STAFF: handleCreateStaff,
  CREATE_LESSON_DRAFT: handleCreateLessonDraft,
  REVIEW_LESSON: handleReviewLesson,
  CREATE_PREDEFINED_DRAFT: handleCreatePredefinedDraft,
  REVIEW_PREDEFINED: handleReviewPredefined,
  UPLOAD_RESOURCE: handleUploadResource,
  DELETE_RESOURCE: handleDeleteResource,
  UPDATE_RESOURCE: handleUpdateResource,
  REVOKE_CERTIFICATE: handleRevokeCertificate,
  UPDATE_USER: handleUpdateUser,
  DELETE_USER: handleDeleteUser,
  CREATE_USER: handleCreateUser,
  REASSIGN_CONVERSATION: handleReassignConversation,
};

/** Handles GET requests for role-scoped staff dashboard data. */
export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAuth(request, STAFF_ROLES);
    if (!authCheck.ok) return authCheck.response;

    const { session } = authCheck;
    let responseData: Record<string, unknown>;

    if (session.role === 'ADMINISTRATOR' || session.role === 'SUPERVISOR') {
      responseData = await buildAdminOrSupervisorData(session);
    } else if (session.role === 'DIALOGIST') {
      responseData = await buildDialogistData(session);
    } else if (session.role === 'INSTRUCTOR') {
      responseData = buildInstructorData();
    } else {
      return jsonError(403, 'FORBIDDEN', 'Unauthorized staff role');
    }

    return NextResponse.json(
      { ok: true, data: responseData },
      { /** Configuration group for headers. */
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Staff GET failed';
    return jsonError(500, 'INTERNAL_ERROR', msg);
  }
}

/** Dispatches authenticated staff management actions via action handler lookup. */
export async function POST(request: NextRequest) {
  try {
    const authCheck = requireAuth(request, STAFF_ROLES);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();
    const handler = STAFF_ACTION_HANDLERS[body?.action];
    if (!handler) {
      return jsonError(400, 'INVALID_ACTION', 'Unsupported staff action');
    }
    return await handler(authCheck.session, body);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Staff POST failed';
    return jsonError(500, 'INTERNAL_ERROR', msg);
  }
}
