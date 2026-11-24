/**
 * Module architecture and API reference for `src/app/api/shahadah/review/route.ts`.
 *
 * Exported symbols:
 * - `dynamic` (Const): dynamic definition.
 * - `POST` (Function): post definition.
 * - `GET` (Function): get definition.
 *
 * Internal dependencies:
 * - `@/lib/services/shahadah-service`
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/security/rbac`
 *
 * @module app/api/shahadah/review/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router API route handler for `/api/shahadah/review`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/shahadah/review/route
 * @exports dynamic, POST, GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { shahadahService } from '@/lib/services/shahadah-service';
import { db } from '@/lib/db/in-memory-adapter';
import { canAccessConversation, CONVERSATION_STAFF_ROLES, requireAuth } from '@/lib/security/rbac';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Handles HTTP `POST` requests for `/api/shahadah/review`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { dialogistId, submissionId, decision, feedbackNotes } = body;

    // 1. Authorization Verification (Signed Session Cookie; body.dialogistId fallback test-only)
    let reviewerId: string | undefined;
    const authCheck = requireAuth(request, CONVERSATION_STAFF_ROLES);
    if (authCheck.ok) {
      reviewerId = authCheck.session.userId;
    } else if (process.env.NODE_ENV === 'test' && dialogistId) {
      reviewerId = dialogistId;
      const user = db.findUserById(dialogistId);
      if (!user || !CONVERSATION_STAFF_ROLES.includes(user.role)) {
        return NextResponse.json(
          {
            ok: false,
            error: 'UNAUTHORIZED',
            message: 'Only qualified dialogists or supervisors can review Shahadah submissions',
          },
          { status: 403 }
        );
      }
    } else {
      return authCheck.response;
    }

    // 2. Parameter Validation
    if (!reviewerId || !submissionId || !decision) {
      return NextResponse.json(
        {
          ok: false,
          error: 'MISSING_FIELDS',
          message: 'dialogistId, submissionId, and decision are required',
        },
        { status: 400 }
      );
    }

    if (decision !== 'VALIDATE' && decision !== 'REQUEST_RETAKE') {
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_DECISION',
          message: 'decision must be VALIDATE or REQUEST_RETAKE',
        },
        { status: 400 }
      );
    }

    const result = await shahadahService.reviewSubmission({
      dialogistId: reviewerId,
      submissionId,
      decision,
      feedbackNotes,
      targetAttemptNumber: body.attemptNumber || body.targetAttemptNumber,
    });

    if (!result.ok) {
      let status = 400;
      if (result.error.code === 'SUBMISSION_NOT_FOUND') {
        status = 404;
      } else if (result.error.code === 'UNAUTHORIZED') {
        status = 403;
      } else if (
        result.error.code === 'SUBMISSION_ALREADY_FINALIZED' ||
        result.error.code === 'STALE_SUBMISSION_ATTEMPT'
      ) {
        status = 409;
      }
      return NextResponse.json(
        { ok: false, error: result.error.code, message: result.error.message },
        { status }
      );
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: err?.message || 'Failed to review submission' },
      { status: 500 }
    );
  }
}

/**
 * Handles HTTP `GET` requests for `/api/shahadah/review`.
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
    const submissionId = searchParams.get('submissionId');
    const conversationId = searchParams.get('conversationId');
    const includeHistory = searchParams.get('history') === 'true';

    if (submissionId) {
      const sub = await shahadahService.getSubmissionById(submissionId);
      if (!sub) {
        return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
      }
      if (sub.nonMuslimId !== session.userId && !CONVERSATION_STAFF_ROLES.includes(session.role)) {
        return NextResponse.json(
          { ok: false, error: 'FORBIDDEN', message: 'You are not authorized to view this submission' },
          { status: 403 }
        );
      }
      return NextResponse.json({ ok: true, data: sub });
    }

    if (conversationId) {
      const conversation = db.conversations.find((c) => c.id === conversationId);
      if (conversation && !canAccessConversation(session, conversation)) {
        return NextResponse.json(
          { ok: false, error: 'FORBIDDEN', message: 'You are not authorized to view this conversation submission' },
          { status: 403 }
        );
      }
      if (!conversation && !CONVERSATION_STAFF_ROLES.includes(session.role)) {
        return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
      }
      if (includeHistory && typeof (shahadahService as any).getSubmissionHistory === 'function') {
        const history = await (shahadahService as any).getSubmissionHistory(conversationId);
        return NextResponse.json({ ok: true, data: history });
      }
      const sub = await shahadahService.getSubmissionByConversation(conversationId);
      return NextResponse.json({ ok: true, data: sub });
    }

    return NextResponse.json(
      { ok: false, error: 'MISSING_PARAMS', message: 'submissionId or conversationId required' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: err?.message || 'Failed to query submission' },
      { status: 500 }
    );
  }
}
