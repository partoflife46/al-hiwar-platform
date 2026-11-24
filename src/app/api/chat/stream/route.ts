/**
 * Module architecture and API reference for `src/app/api/chat/stream/route.ts`.
 *
 * Exported symbols:
 * - `dynamic` (Const): dynamic definition.
 * - `GET` (Function): get definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/services/chat-event-bus`
 * - `@/lib/services/chat-service`
 * - `@/lib/security/rbac`
 * - `./sse-dispatcher`
 *
 * @module app/api/chat/stream/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Server-Sent Events endpoint streaming live consultation messages and Shahadah updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { chatEventBus, type ChatEvent } from '@/lib/services/chat-event-bus';
import { chatService } from '@/lib/services/chat-service';
import { canAccessConversation, requireAuth } from '@/lib/security/rbac';
import {
  dispatchChatBusEvent,
  encodeSseFrame,
  getInactivityNoticeCopy,
} from './sse-dispatcher';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Constant definition for sse headers.
 */
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

/** Opens an authenticated SSE stream for a single consultation room. */
export async function GET(request: NextRequest) {
  const authCheck = requireAuth(request);
  if (!authCheck.ok) return authCheck.response;

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');
  const lastEventId =
    searchParams.get('lastEventId') || request.headers.get('last-event-id');

  if (!conversationId) {
    return NextResponse.json(
      { ok: false, error: 'Missing conversationId parameter' },
      { status: 400 }
    );
  }

  const conversation = db.conversations.find((c) => c.id === conversationId);
  if (!conversation) {
    return NextResponse.json(
      { ok: false, error: 'Conversation not found' },
      { status: 404 }
    );
  }

  if (!canAccessConversation(authCheck.session, conversation)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You are not authorized to stream this conversation',
      },
      { status: 403 }
    );
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let pingInterval: NodeJS.Timeout | null = null;

  /** Handles cleanup interaction. */
  const cleanup = () => {
    if (pingInterval) clearInterval(pingInterval);
    if (unsubscribe) unsubscribe();
  };

  const stream = new ReadableStream({
    /**
     * Executes start logic.
     * @param controller - Input controller argument.
     */
    start(controller) {
      /** Handles send event interaction. */
      const sendEvent = (eventName: string, data: unknown, id?: string) => {
        controller.enqueue(encodeSseFrame(encoder, eventName, data, id));
      };

      sendEvent('connected', {
        conversationId: conversation.id,
        status: conversation.status,
        isAssigned: conversation.isAssigned,
        dialogistId: conversation.dialogistId,
      });

      const history = db.messages.filter(
        (m) => m.conversationId === conversationId
      );
      for (const msg of history) {
        if (!lastEventId || msg.id > lastEventId) {
          sendEvent('message', msg, msg.id);
        }
      }

      if (conversation.inactivityNoticeSent) {
        sendEvent('inactivity_warning', {
          conversationId: conversation.id,
          message: getInactivityNoticeCopy(conversation.language),
          timestamp: conversation.lastMessageAt,
        });
      }

      unsubscribe = chatEventBus.subscribe(
        conversationId,
        (event: ChatEvent) => {
          try {
            dispatchChatBusEvent(event, sendEvent);
          } catch {
            // Stream already closed by client
          }
        }
      );

      chatService.checkInactivityTimeout(conversationId).catch(() => {});

      pingInterval = setInterval(async () => {
        try {
          await chatService.checkInactivityTimeout(conversationId);
          sendEvent('ping', { timestamp: new Date().toISOString() });
        } catch {
          if (pingInterval) clearInterval(pingInterval);
        }
      }, 15000);

      request.signal.addEventListener('abort', () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
    cancel: cleanup,
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
