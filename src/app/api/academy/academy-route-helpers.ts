/**
 * Module architecture and API reference for `src/app/api/academy/academy-route-helpers.ts`.
 *
 * Exported symbols:
 * - `NO_STORE_HEADERS` (Const): no store headers definition.
 * - `academyJson` (Function): academy json definition.
 * - `resolveAuthorizedStudentId` (Function): resolve authorized student id definition.
 * - `handleAcademyQuery` (Function): handle academy query definition.
 * - `handleAcademyMutation` (Function): handle academy mutation definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/services/academy-service`
 * - `@/lib/security/rbac`
 * - `@/lib/db/types`
 *
 * @module app/api/academy/academy-route-helpers
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Authorization guards, JSON response builders, and action handlers for `/api/academy`.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { academyService } from '@/lib/services/academy-service';
import { STAFF_ROLES } from '@/lib/security/rbac';
import type { UserSession } from '@/lib/db/types';

/**
 * Constant definition for no store headers.
 */
export const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

/** Creates a JSON response with `Cache-Control: no-store` headers. */
export function academyJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

/** Verifies whether the caller is allowed to read or mutate the requested student ID. */
export function resolveAuthorizedStudentId(
  session: UserSession,
  explicitId: string | undefined | null,
  allowStaffRead: boolean
): { ok: true; studentId: string } | { ok: false; response: NextResponse } {
  if (!explicitId || explicitId === session.userId) {
    return { ok: true, studentId: session.userId };
  }
  if (allowStaffRead && STAFF_ROLES.includes(session.role)) {
    return { ok: true, studentId: explicitId };
  }
  return {
    ok: false,
    response: academyJson(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You are not authorized to access another student record',
      },
      403
    ),
  };
}

/** Looks up the active (or fallback revoked) certificate for a learner. */
function findStudentCertificate(userId: string, includeRevoked = false) {
  const valid = db.certificates.find(
    (c) => c.newMuslimId === userId && !c.isRevoked
  );
  if (valid || !includeRevoked) return valid ?? null;
  return db.certificates.find((c) => c.newMuslimId === userId) ?? null;
}

/** Dispatches authenticated `GET /api/academy` queries by resource `type`. */
export async function handleAcademyQuery(
  type: string,
  userId: string,
  lessonNumber: number
): Promise<NextResponse> {
  if (type === 'lesson') {
    const res = await academyService.getLessonDetail(userId, lessonNumber);
    return res.ok
      ? academyJson({ ok: true, data: res.data })
      : academyJson({ ok: false, error: res.error }, 403);
  }
  if (type === 'quiz') {
    const res = await academyService.getLessonQuiz(userId, lessonNumber);
    return res.ok
      ? academyJson({ ok: true, data: res.data })
      : academyJson({ ok: false, error: res.error }, 403);
  }
  if (type === 'final-exam') {
    const res = await academyService.getFinalExam(userId);
    return res.ok
      ? academyJson({ ok: true, data: res.data })
      : academyJson({ ok: false, error: res.error }, 403);
  }

  const progress = await academyService.getProgress(userId);
  const certificate = findStudentCertificate(userId, true);
  return academyJson({
    ok: true,
    data: { progress, lessons: db.getApprovedLessons(), certificate },
  });
}

/** Handles `SUBMIT_QUIZ`, `SUBMIT_FINAL_EXAM`, and test-only `SHORTCUT` mutations. */
export async function handleAcademyMutation(
  studentId: string,
  body: Record<string, any>
): Promise<NextResponse> {
  const { action, lessonNumber, answers, mode, targetLessonNumber } = body;

  if (action === 'SUBMIT_QUIZ') {
    const res = await academyService.submitLessonQuiz(
      studentId,
      Number(lessonNumber || 1),
      answers || {}
    );
    if (!res.ok) return academyJson({ ok: false, error: res.error }, 400);
    const progress = await academyService.getProgress(studentId);
    return academyJson({ ok: true, /** Configuration group for data. */
    data: { attempt: res.data, progress } });
  }

  if (action === 'SUBMIT_FINAL_EXAM') {
    const res = await academyService.submitFinalExam(studentId, answers || {});
    if (!res.ok) return academyJson({ ok: false, error: res.error }, 400);
    const progress = await academyService.getProgress(studentId);
    const certificate = findStudentCertificate(studentId);
    return academyJson({
      ok: true,
      data: { attempt: res.data, progress, certificate },
    });
  }

  const isShortcut =
    action === 'SHORTCUT' ||
    mode === 'PASS_LESSON' ||
    mode === 'PASS_ALL_AND_GRADUATE';
  if (!isShortcut) {
    return academyJson(
      { ok: false, error: 'INVALID_ACTION', message: 'Unsupported academy action' },
      400
    );
  }
  if (process.env.NODE_ENV !== 'test') {
    return academyJson(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'Evaluation shortcuts are disabled outside test environments.',
      },
      403
    );
  }

  const progress = await academyService.executeEvaluationShortcut(
    studentId,
    mode || 'PASS_LESSON',
    targetLessonNumber ? Number(targetLessonNumber) : undefined
  );
  const certificate = findStudentCertificate(studentId);
  return academyJson({ ok: true, /** Configuration group for data. */
  data: { progress, certificate } });
}
