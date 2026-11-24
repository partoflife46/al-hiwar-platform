/**
 * Module architecture and API reference for `src/app/api/chat/messages/route.ts`.
 *
 * Exported symbols:
 * - `dynamic` (Const): dynamic definition.
 * - `POST` (Function): post definition.
 * - `GET` (Function): get definition.
 *
 * Internal dependencies:
 * - `@/lib/services/chat-service`
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/security/rbac`
 *
 * @module app/api/chat/messages/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router API route handler for `/api/chat/messages`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/chat/messages/route
 * @exports dynamic, POST, GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/services/chat-service';
import { db } from '@/lib/db/in-memory-adapter';
import { canAccessConversation, requireAuth } from '@/lib/security/rbac';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Handles HTTP `POST` requests for `/api/chat/messages`.
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

    const body = await request.json();
    const {
      conversationId,
      senderId,
      content,
      predefinedReplyId,
      hasVoiceNote,
      audioUrl,
      messageType,
      selectedIntent,
    } = body;

    if (senderId && senderId !== session.userId) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', message: 'Cannot send messages on behalf of another user' },
        { status: 403 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'conversationId is required' },
        { status: 400 }
      );
    }

    // SEC-10: Limit maximum chat message length to prevent memory exhaustion
    const MAX_CHAT_LENGTH = 4000;
    if (content && typeof content === 'string' && content.length > MAX_CHAT_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          error: 'MESSAGE_TOO_LONG',
          message: `Chat message exceeds maximum allowed length of ${MAX_CHAT_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    // Ensure conversation exists in server DB
    let conversation = db.conversations.find((c) => c.id === conversationId);
    if (!conversation) {
      // Auto-recover transient conversation only for the authenticated Non-Muslim owner
      const seeker = db.findUserById(session.userId);
      if (seeker && seeker.role === 'NON_MUSLIM') {
        conversation = await chatService.initiateConsultation(
          seeker.id,
          'LEARN_ABOUT_ISLAM',
          seeker.preferredLanguage || 'en'
        );
        conversation.id = conversationId;
        db.conversations.push(conversation);
      }
    }

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: 'CONVERSATION_NOT_FOUND', message: 'Consultation conversation not found' },
        { status: 404 }
      );
    }

    if (!canAccessConversation(session, conversation)) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', message: 'You are not authorized to access this conversation' },
        { status: 403 }
      );
    }

    const result = await chatService.sendMessage({
      conversationId,
      senderId: session.userId,
      content: content || '',
      predefinedReplyId,
      hasVoiceNote,
      audioUrl,
      messageType,
      selectedIntent,
    });

    if (!result.ok) {
      const status =
        result.error.code === 'CONVERSATION_NOT_FOUND'
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
        message: error instanceof Error ? error.message : 'Unknown error sending message',
      },
      { status: 500 }
    );
  }
}

/**
 * Handles HTTP `GET` requests for `/api/chat/messages`.
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

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'conversationId parameter is required' },
        { status: 400 }
      );
    }

    const conversation = db.conversations.find((c) => c.id === conversationId);
    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: 'CONVERSATION_NOT_FOUND', message: 'Consultation conversation not found' },
        { status: 404 }
      );
    }

    if (!canAccessConversation(authCheck.session, conversation)) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', message: 'You are not authorized to view this conversation' },
        { status: 403 }
      );
    }

    const messages = db.messages.filter((m) => m.conversationId === conversationId);
    return NextResponse.json(
      { ok: true, data: messages },
      { /** Configuration group for headers. */
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve messages',
      },
      { status: 500 }
    );
  }
}
