/**
 * Next.js App Router API route handler for `/api/academy/progress`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/academy/progress/route
 * @exports dynamic, GET, POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { academyService } from '@/lib/services/academy-service';
import { requireAuth, STAFF_ROLES } from '@/lib/security/rbac';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Handles HTTP `GET` requests for `/api/academy/progress`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.ok) {
      return authCheck.response;
    }
    const session = authCheck.session;

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    if (requestedUserId && requestedUserId !== session.userId && !STAFF_ROLES.includes(session.role)) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', message: 'You are not authorized to view another user progress' },
        { status: 403 }
      );
    }

    const userId = requestedUserId || session.userId;
    const progress = await academyService.getProgress(userId);
    return NextResponse.json({ ok: true, data: progress });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: err?.message || 'Failed to get progress' },
      { status: 500 }
    );
  }
}

/**
 * Handles HTTP `POST` requests for `/api/academy/progress`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.ok) {
      return authCheck.response;
    }
    const session = authCheck.session;

    if (process.env.NODE_ENV !== 'test') {
      return NextResponse.json(
        {
          ok: false,
          error: 'FORBIDDEN',
          message: 'Evaluation shortcut endpoint is strictly restricted to test environments.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, mode, targetLessonNumber } = body;

    if (userId && userId !== session.userId && !STAFF_ROLES.includes(session.role)) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', message: 'Cannot modify progress for another user' },
        { status: 403 }
      );
    }

    const studentId = userId || session.userId;

    if (mode === 'PASS_LESSON' || mode === 'PASS_ALL_AND_GRADUATE') {
      const progress = await academyService.executeEvaluationShortcut(
        studentId,
        mode,
        targetLessonNumber
      );
      return NextResponse.json({ ok: true, data: progress });
    }

    return NextResponse.json(
      { ok: false, error: 'INVALID_MODE', message: 'Supported modes: PASS_LESSON, PASS_ALL_AND_GRADUATE' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: err?.message || 'Failed to update progress' },
      { status: 500 }
    );
  }
}
