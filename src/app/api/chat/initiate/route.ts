/**
 * Module architecture and API reference for `src/app/api/chat/initiate/route.ts`.
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
 * - `@/lib/db/types`
 *
 * @module app/api/chat/initiate/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router API route handler for `/api/chat/initiate`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/chat/initiate/route
 * @exports dynamic, POST, GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/services/chat-service';
import { db } from '@/lib/db/in-memory-adapter';
import { CONVERSATION_STAFF_ROLES, requireAuth } from '@/lib/security/rbac';
import type { ConsultationIntent, SupportedLanguage } from '@/lib/db/types';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Handles HTTP `POST` requests for `/api/chat/initiate`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = requireAuth(request, ['NON_MUSLIM', 'NEW_MUSLIM']);
    if (!authCheck.ok) {
      return authCheck.response;
    }
    const session = authCheck.session;

    const body = await request.json();
    const { nonMuslimId, intent, language, includeIntentPrompt } = body;

    if (nonMuslimId && nonMuslimId !== session.userId) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', message: 'Cannot initiate consultation for another user' },
        { status: 403 }
      );
    }

    if (!intent && !includeIntentPrompt) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'intent or includeIntentPrompt is required' },
        { status: 400 }
      );
    }

    const seeker = db.findUserById(session.userId);
    if (!seeker) {
      return NextResponse.json(
        { ok: false, error: 'USER_NOT_FOUND', message: 'Authenticated user not found' },
        { status: 404 }
      );
    }

    const conversation = await chatService.initiateConsultation(
      seeker.id,
      (intent || 'LEARN_ABOUT_ISLAM') as ConsultationIntent,
      (language || seeker.preferredLanguage || 'en') as SupportedLanguage,
      { includeIntentPrompt: Boolean(includeIntentPrompt) }
    );

    const messages = db.messages.filter((m) => m.conversationId === conversation.id);

    return NextResponse.json({ ok: true, data: conversation, messages }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to initiate consultation',
      },
      { status: 500 }
    );
  }
}

/**
 * Handles HTTP `GET` requests for `/api/chat/initiate`.
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
    const seekerId = searchParams.get('seekerId');
    const dialogistId = searchParams.get('dialogistId');

    if (!seekerId && !dialogistId) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_PARAMS', message: 'seekerId or dialogistId parameter is required' },
        { status: 400 }
      );
    }

    if (dialogistId) {
      if (
        !CONVERSATION_STAFF_ROLES.includes(session.role) ||
        (dialogistId !== session.userId && session.role !== 'SUPERVISOR' && session.role !== 'ADMINISTRATOR')
      ) {
        return NextResponse.json(
          { ok: false, error: 'FORBIDDEN', message: 'Access denied for dialogist consultation lookup' },
          { status: 403 }
        );
      }

      // Find active conversation assigned to this dialogist
      const conversation = db.conversations.find(
        (c) => c.dialogistId === dialogistId && c.status === 'ACTIVE'
      );
      return NextResponse.json(
        { ok: true, data: conversation ? chatService.sanitizeForDialogist(conversation) : null },
        { status: 200, /** Configuration group for headers. */
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    if (seekerId !== session.userId && !CONVERSATION_STAFF_ROLES.includes(session.role)) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', message: 'Cannot inspect another user consultation' },
        { status: 403 }
      );
    }

    // Find active or queued conversation for this seeker
    const conversation = db.conversations.find(
      (c) => c.nonMuslimId === seekerId && (c.status === 'QUEUED' || c.status === 'ACTIVE')
    );

    const data =
      conversation && CONVERSATION_STAFF_ROLES.includes(session.role) && conversation.nonMuslimId !== session.userId
        ? chatService.sanitizeForDialogist(conversation)
        : conversation || null;

    return NextResponse.json(
      { ok: true, data },
      { status: 200, /** Configuration group for headers. */
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve consultation',
      },
      { status: 500 }
    );
  }
}
