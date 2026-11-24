/**
 * Module architecture and API reference for `src/app/api/chat/claim/route.ts`.
 *
 * Exported symbols:
 * - `POST` (Function): post definition.
 *
 * Internal dependencies:
 * - `@/lib/services/chat-service`
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/security/rbac`
 *
 * @module app/api/chat/claim/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router API route handler for `/api/chat/claim`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/chat/claim/route
 * @exports POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/services/chat-service';
import { db } from '@/lib/db/in-memory-adapter';
import { CLAIM_STAFF_ROLES, requireAuth } from '@/lib/security/rbac';

/**
 * Handles HTTP `POST` requests for `/api/chat/claim`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { conversationId } = body;
    let dialogistId: string | undefined;

    const authCheck = requireAuth(request);
    if (authCheck.ok) {
      if (authCheck.session.role !== 'DIALOGIST') {
        return NextResponse.json(
          { ok: false, error: 'UNAUTHORIZED_SENDER', message: 'Only qualified dialogists can claim conversations' },
          { status: 403 }
        );
      }
      dialogistId = authCheck.session.userId;
    } else if (process.env.NODE_ENV === 'test' && body.dialogistId) {
      // Direct caller role check allowed strictly in isolated unit tests
      dialogistId = body.dialogistId;
      const caller = db.findUserById(dialogistId!);
      if (!caller || caller.role !== 'DIALOGIST') {
        return NextResponse.json(
          { ok: false, error: 'UNAUTHORIZED_SENDER', message: 'Only qualified dialogists can claim conversations' },
          { status: 403 }
        );
      }
    } else {
      return authCheck.response;
    }

    if (!dialogistId || !conversationId) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'conversationId and dialogistId are required' },
        { status: 400 }
      );
    }

    const result = await chatService.claimConversation(dialogistId, conversationId);

    if (!result.ok) {
      const status =
        result.error.code === 'CONVERSATION_ALREADY_CLAIMED'
          ? 409
          : result.error.code === 'CONVERSATION_NOT_FOUND'
          ? 404
          : result.error.code === 'UNAUTHORIZED_SENDER'
          ? 403
          : 400;

      return NextResponse.json(
        { ok: false, error: result.error.code, message: result.error.message },
        { status }
      );
    }

    return NextResponse.json({ ok: true, data: result.data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error claiming conversation',
      },
      { status: 500 }
    );
  }
}
