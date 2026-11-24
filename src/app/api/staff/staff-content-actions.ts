/**
 * Module architecture and API reference for `src/app/api/staff/staff-content-actions.ts`.
 *
 * Exported symbols:
 * - `handleCreateLessonDraft` (Function): handle create lesson draft definition.
 * - `handleReviewLesson` (Function): handle review lesson definition.
 * - `handleCreatePredefinedDraft` (Function): handle create predefined draft definition.
 * - `handleReviewPredefined` (Function): handle review predefined definition.
 * - `handleUploadResource` (Function): handle upload resource definition.
 * - `handleDeleteResource` (Function): handle delete resource definition.
 * - `handleUpdateResource` (Function): handle update resource definition.
 * - `handleReassignConversation` (Function): handle reassign conversation definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/services/content-workflow-service`
 * - `@/lib/services/chat-service`
 * - `@/lib/db/types`
 * - `./staff-shared`
 *
 * @module app/api/staff/staff-content-actions
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Server-side helper module supporting the `/api/staff` API route.
 * Isolates validation, payload mapping, and domain orchestration from HTTP transport logic.
 * @module app/api/staff/staff-content-actions
 * @exports handleCreateLessonDraft, handleReviewLesson, handleCreatePredefinedDraft,
 *   handleReviewPredefined, handleUploadResource, handleDeleteResource
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { contentWorkflowService } from '@/lib/services/content-workflow-service';
import { chatService } from '@/lib/services/chat-service';
import type { UserSession } from '@/lib/db/types';
import { jsonError, requireStaffRole } from './staff-shared';

/** Creates or updates a lesson draft submitted by an Instructor or Administrator. */
export async function handleCreateLessonDraft(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['INSTRUCTOR', 'ADMINISTRATOR'],
    'Only Instructors may create educational lessons.'
  );
  if (forbidden) return forbidden;

  const res = await contentWorkflowService.createOrUpdateLessonDraft({
    instructorId: session.userId,
    id: body.id,
    lessonNumber: Number(body.lessonNumber || 8),
    titleEn: body.titleEn,
    titleFr: body.titleFr,
    contentMarkdownEn: body.contentMarkdownEn,
    contentMarkdownFr: body.contentMarkdownFr,
    pdfGuideUrl: body.pdfGuideUrl,
    audioLectureUrl: body.audioLectureUrl,
    videoLectureUrl: body.videoLectureUrl,
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  }

  db.save();
  return NextResponse.json({ ok: true, data: res.data });
}

/** Reviews and approves/rejects an educational lesson under Supervisor authority. */
export async function handleReviewLesson(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['SUPERVISOR'],
    'Only Supervisors may review and approve educational content. Platform Administrators cannot approve lessons directly.'
  );
  if (forbidden) return forbidden;

  const lesson = db.learningContents.find((l) => l.id === body.lessonId);
  if (lesson && lesson.authorId === session.userId) {
    return jsonError(
      403,
      'SELF_APPROVAL_FORBIDDEN',
      'Instructors cannot approve their own educational materials.'
    );
  }

  const res = await contentWorkflowService.reviewLessonContent({
    supervisorId: session.userId,
    lessonId: body.lessonId,
    decision: body.decision,
    notes: body.notes,
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  }

  db.save();
  return NextResponse.json({ ok: true, data: res.data });
}

/** Creates a predefined quick-reply draft submitted by dialogue staff. */
export async function handleCreatePredefinedDraft(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['DIALOGIST', 'SUPERVISOR', 'ADMINISTRATOR'],
    'Only dialogue staff may create quick reply templates.'
  );
  if (forbidden) return forbidden;

  const draft = await contentWorkflowService.createPredefinedMessageDraft({
    authorId: session.userId,
    shortcut: body.shortcut,
    category: body.category,
    bodyEn: body.bodyEn,
    bodyFr: body.bodyFr,
  });
  db.save();
  return NextResponse.json({ ok: true, data: draft });
}

/** Reviews and approves/rejects a predefined message template under Supervisor authority. */
export async function handleReviewPredefined(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['SUPERVISOR'],
    'Only Supervisors may approve quick reply templates. Platform Administrators cannot approve templates directly.'
  );
  if (forbidden) return forbidden;

  const res = await contentWorkflowService.reviewPredefinedMessage({
    supervisorId: session.userId,
    templateId: body.templateId,
    decision: body.decision,
    notes: body.notes,
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  }

  db.save();
  return NextResponse.json({ ok: true, data: res.data });
}

/** Publishes a new public Islamic library resource under Administrator authority. */
export async function handleUploadResource(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['ADMINISTRATOR'],
    'Only Administrators may upload public Islamic resources.'
  );
  if (forbidden) return forbidden;

  const res = await contentWorkflowService.uploadIslamicResource({
    adminId: session.userId,
    titleEn: body.titleEn,
    titleFr: body.titleFr,
    category: body.category,
    resourceType: body.resourceType,
    mediaUrl: body.mediaUrl,
    descriptionEn: body.descriptionEn,
    descriptionFr: body.descriptionFr,
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  }

  db.save();
  return NextResponse.json({ ok: true, data: res.data });
}

/** Deletes a public Islamic library resource under Administrator authority. */
export async function handleDeleteResource(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['ADMINISTRATOR'],
    'Only Administrators may delete public Islamic resources.'
  );
  if (forbidden) return forbidden;

  if (!body.resourceId) {
    return jsonError(400, 'MISSING_RESOURCE_ID', 'resourceId is required.');
  }

  const res = await contentWorkflowService.deletePlatformContent({
    adminId: session.userId,
    contentType: 'RESOURCE',
    contentId: body.resourceId,
  });
  if (!res.ok) {
    return jsonError(
      res.error === 'RESOURCE_NOT_FOUND' ? 404 : 400,
      res.error,
      `Failed to delete resource: ${res.error}`
    );
  }

  db.save();
  return NextResponse.json({ ok: true, message: 'Resource deleted successfully' });
}

/** Updates metadata on an existing public Islamic library resource. */
export async function handleUpdateResource(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['ADMINISTRATOR'],
    'Only Administrators may update public Islamic resources.'
  );
  if (forbidden) return forbidden;

  const {
    resourceId,
    titleEn,
    titleFr,
    category,
    resourceType,
    mediaUrl,
    descriptionEn,
    descriptionFr,
  } = body;

  if (!resourceId || !titleEn?.trim() || !mediaUrl?.trim()) {
    return jsonError(400, 'MISSING_FIELDS', 'resourceId, titleEn, and mediaUrl are required.');
  }

  const updated = db.updateIslamicResource(resourceId, {
    titleEn: titleEn.trim(),
    titleFr: titleFr !== undefined ? titleFr.trim() : undefined,
    category,
    resourceType,
    mediaUrl: mediaUrl.trim(),
    descriptionEn,
    descriptionFr,
  });
  if (!updated) {
    return jsonError(404, 'RESOURCE_NOT_FOUND', 'Resource not found');
  }

  return NextResponse.json({ ok: true, data: updated });
}

/** Reassigns an active consultation to another Dialogist or back to the shared queue. */
export async function handleReassignConversation(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['SUPERVISOR', 'ADMINISTRATOR'],
    'Only Supervisors and Administrators may reassign consultations.'
  );
  if (forbidden) return forbidden;

  const { conversationId, targetDialogistId } = body;
  if (!conversationId || !targetDialogistId) {
    return jsonError(
      400,
      'MISSING_FIELDS',
      'conversationId and targetDialogistId are required.'
    );
  }

  const res = await chatService.reassignConversation(
    session.userId,
    conversationId,
    targetDialogistId
  );
  if (!res.ok) {
    return jsonError(400, res.error.code, res.error.message);
  }

  db.save();
  return NextResponse.json({ ok: true, data: chatService.sanitizeForDialogist(res.data) });
}
