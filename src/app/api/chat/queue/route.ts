/**
 * Next.js App Router API route handler for `/api/chat/queue`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/chat/queue/route
 * @exports dynamic, GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/services/chat-service';
import { db } from '@/lib/db/in-memory-adapter';
import { CONVERSATION_STAFF_ROLES, requireAuth } from '@/lib/security/rbac';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Handles HTTP `GET` requests for `/api/chat/queue`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAuth(request, CONVERSATION_STAFF_ROLES);
    if (!authCheck.ok) {
      return authCheck.response;
    }
    const session = authCheck.session;
    const queue = await chatService.getUnansweredQueue();
    const sanitizedQueue = queue.map((c) => chatService.sanitizeForDialogist(c));

    let active = db.conversations
      .filter((c) => c.status === 'ACTIVE')
      .map((c) => chatService.sanitizeForDialogist(c));
    let all = db.conversations.map((c) => chatService.sanitizeForDialogist(c));

    if (session.role === 'DIALOGIST') {
      active = active.filter((c) => c.dialogistId === session.userId);
      all = all.filter(
        (c) => c.dialogistId === session.userId || (!c.isAssigned && c.status === 'QUEUED')
      );
    }

    const approvedReplies = db.getApprovedPredefinedMessages();

    return NextResponse.json(
      {
        ok: true,
        data: sanitizedQueue,
        queue: sanitizedQueue,
        activeConversations: active,
        allConversations: all,
        approvedReplies,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve unanswered queue',
      },
      { status: 500 }
    );
  }
}
