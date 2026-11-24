/**
 * Module architecture and API reference for `src/app/api/shahadah/upload/route.ts`.
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
 * - `@/lib/db/types`
 *
 * @module app/api/shahadah/upload/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router API route handler for `/api/shahadah/upload`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/shahadah/upload/route
 * @exports dynamic, POST, GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { shahadahService } from '@/lib/services/shahadah-service';
import { db } from '@/lib/db/in-memory-adapter';
import { canAccessConversation, CONVERSATION_STAFF_ROLES, requireAuth } from '@/lib/security/rbac';
import type { SupportedLanguage } from '@/lib/db/types';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Handles HTTP `POST` requests for `/api/shahadah/upload`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Finding #118: Require a valid authenticated session
    const authCheck = requireAuth(request, ['NON_MUSLIM', 'NEW_MUSLIM']);
    if (!authCheck.ok) {
      return authCheck.response;
    }
    const session = authCheck.session;

    const body = await request.json().catch(() => ({}));
    const {
      seekerId,
      conversationId,
      audioRecordingUrl,
      audioData,
      audioDataUrl,
      mimeType,
      durationSeconds,
    } = body;

    // 2. Prevent Horizontal Privilege Escalation:
    // If client provides a seekerId that doesn't match session user, reject immediately
    if (seekerId && seekerId !== session.userId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'FORBIDDEN',
          message: 'You are not authorized to submit Shahadah recordings for another user',
        },
        { status: 403 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'conversationId is required' },
        { status: 400 }
      );
    }

    // 3. Verify conversation ownership
    const conversation = db.conversations.find((c) => c.id === conversationId);
    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: 'CONVERSATION_NOT_FOUND', message: 'Consultation conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.nonMuslimId !== session.userId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'FORBIDDEN',
          message: 'You do not own this consultation conversation',
        },
        { status: 403 }
      );
    }

    // SEC-09: Unbounded Audio Payload Size Protection (max 15MB base64 payload)
    const MAX_AUDIO_PAYLOAD_CHARS = 20 * 1024 * 1024; // ~15MB decoded
    const payloadStr =
      (typeof audioData === 'string' ? audioData : '') ||
      (typeof audioDataUrl === 'string' ? audioDataUrl : '');
    if (payloadStr.length > MAX_AUDIO_PAYLOAD_CHARS) {
      return NextResponse.json(
        {
          ok: false,
          error: 'PAYLOAD_TOO_LARGE',
          message: 'Audio recording payload exceeds maximum allowed size (15MB).',
        },
        { status: 413 }
      );
    }

    // 4. Derive acting user's identity strictly from verified server-side session
    const result = await shahadahService.submitShahadah({
      seekerId: session.userId,
      conversationId,
      audioRecordingUrl: audioRecordingUrl || audioDataUrl,
      audioData,
      mimeType,
      durationSeconds,
    });

    if (!result.ok) {
      let status = 400;
      if (result.error.code === 'USER_NOT_FOUND' || result.error.code === 'CONVERSATION_NOT_FOUND') {
        status = 404;
      } else if (result.error.code === 'UNAUTHORIZED' || result.error.code === 'FORBIDDEN') {
        status = 403;
      } else if (result.error.code === 'SUBMISSION_ALREADY_FINALIZED') {
        status = 409;
      }
      return NextResponse.json(
        { ok: false, error: result.error.code, message: result.error.message },
        { status }
      );
    }

    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: err?.message || 'Failed to submit Shahadah' },
      { status: 500 }
    );
  }
}

/**
 * Handles HTTP `GET` requests for `/api/shahadah/upload`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const language = (searchParams.get('language') as SupportedLanguage) || 'en';
    const conversationId = searchParams.get('conversationId');
    const seekerId = searchParams.get('seekerId');

    // Public static Shahadah pronunciation guide (never exposes user data)
    if (type === 'reference' && !conversationId && !seekerId) {
      const ref = await shahadahService.getModelReferenceAudio(language);
      return NextResponse.json({ ok: true, data: ref });
    }

    const authCheck = requireAuth(request);
    if (!authCheck.ok) {
      return authCheck.response;
    }
    const session = authCheck.session;

    if (seekerId) {
      if (seekerId !== session.userId && !CONVERSATION_STAFF_ROLES.includes(session.role)) {
        return NextResponse.json(
          { ok: false, error: 'FORBIDDEN', message: 'You are not authorized to access another user submissions' },
          { status: 403 }
        );
      }
      const matchingSubs = db.shahadahSubmissions.filter(
        (s) => s.nonMuslimId === seekerId
      );
      const submission = matchingSubs.length > 0 ? matchingSubs[matchingSubs.length - 1] : null;
      return NextResponse.json(
        { ok: true, data: submission },
        { /** Configuration group for headers. */
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    if (conversationId) {
      const conversation = db.conversations.find((c) => c.id === conversationId);
      if (!conversation) {
        return NextResponse.json(
          { ok: false, error: 'CONVERSATION_NOT_FOUND', message: 'Consultation conversation not found' },
          { status: 404 }
        );
      }
      if (!canAccessConversation(session, conversation)) {
        return NextResponse.json(
          { ok: false, error: 'FORBIDDEN', message: 'You do not have access to this conversation submission' },
          { status: 403 }
        );
      }
      const submission = await shahadahService.getSubmissionByConversation(conversationId);
      return NextResponse.json(
        { ok: true, data: submission },
        { /** Configuration group for headers. */
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    const defaultRef = await shahadahService.getModelReferenceAudio(language);
    return NextResponse.json({ ok: true, data: defaultRef });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: err?.message || 'Failed to retrieve data' },
      { status: 500 }
    );
  }
}
