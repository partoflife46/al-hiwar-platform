/**
 * Module architecture and API reference for `src/app/api/academy/route.ts`.
 *
 * Exported symbols:
 * - `dynamic` (Const): dynamic definition.
 * - `GET` (Function): get definition.
 * - `POST` (Function): post definition.
 *
 * Internal dependencies:
 * - `@/lib/services/academy-service`
 * - `@/lib/security/rbac`
 * - `./academy-route-helpers`
 *
 * @module app/api/academy/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * REST route handlers for Al Hiwar Islamic Academy progress, lessons, quizzes, and verification.
 */

import { NextRequest } from 'next/server';
import { academyService } from '@/lib/services/academy-service';
import { requireAuth } from '@/lib/security/rbac';
import {
  academyJson,
  handleAcademyMutation,
  handleAcademyQuery,
  resolveAuthorizedStudentId,
} from './academy-route-helpers';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/** Serves public QR verification or authenticated Academy lessons, quizzes, and progress. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'progress';

    if (type === 'certificate') {
      const certId = searchParams.get('certificateId') || '';
      const res = await academyService.verifyCertificate(certId);
      return res.ok
        ? academyJson({ ok: true, data: res.data })
        : academyJson({ ok: false, error: res.error }, 404);
    }

    const authCheck = requireAuth(request);
    if (!authCheck.ok) return authCheck.response;

    const target = resolveAuthorizedStudentId(
      authCheck.session,
      searchParams.get('userId'),
      true
    );
    if (!target.ok) return target.response;

    const lessonNumber = Number(searchParams.get('lessonNumber') || 1);
    return handleAcademyQuery(type, target.studentId, lessonNumber);
  } catch (err: any) {
    return academyJson(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: err?.message || 'Academy GET failed',
      },
      500
    );
  }
}

/** Submits lesson quiz answers, final exam answers, or test-only progression shortcuts. */
export async function POST(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();
    const target = resolveAuthorizedStudentId(
      authCheck.session,
      body.userId,
      false
    );
    if (!target.ok) return target.response;

    return handleAcademyMutation(target.studentId, body);
  } catch (err: any) {
    return academyJson(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: err?.message || 'Academy POST failed',
      },
      500
    );
  }
}
