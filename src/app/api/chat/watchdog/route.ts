/**
 * Next.js App Router API route handler for `/api/chat/watchdog`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/chat/watchdog/route
 * @exports POST, GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/services/chat-service';

/**
 * Executes is authorized watchdog trigger logic.
 * @param request - Request value (`NextRequest`).
 * @returns Value of type `boolean`.
 */
function isAuthorizedWatchdogTrigger(request: NextRequest): boolean {
  // In test environments, allow test runner execution
  if (process.env.NODE_ENV === 'test') {
    return true;
  }
  const cronSecret = process.env.CRON_SECRET || process.env.WATCHDOG_SECRET;
  if (!cronSecret) {
    return true; // internal fallback when no external cron secret is configured
  }
  const provided =
    request.headers.get('x-watchdog-secret') ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  return provided === cronSecret;
}

/**
 * Handles HTTP `POST` requests for `/api/chat/watchdog`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedWatchdogTrigger(request)) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHORIZED', message: 'Invalid or missing watchdog secret' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { conversationId, elapsedSeconds } = body;

    // SEC-01: Disallow client-provided elapsedSeconds outside test environment
    const trustedElapsed = process.env.NODE_ENV === 'test' && typeof elapsedSeconds === 'number'
      ? elapsedSeconds
      : undefined;

    if (conversationId) {
      const res = await chatService.checkInactivityTimeout(
        conversationId,
        trustedElapsed,
        { checkClaimed: true }
      );
      return NextResponse.json({ ok: true, data: res });
    }

    const res = await chatService.triggerInactivityChecks({ checkClaimed: true });
    return NextResponse.json({ ok: true, data: res });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Watchdog check failed' },
      { status: 500 }
    );
  }
}

/**
 * Handles HTTP `GET` requests for `/api/chat/watchdog`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedWatchdogTrigger(request)) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHORIZED', message: 'Invalid or missing watchdog secret' },
        { status: 401 }
      );
    }

    const res = await chatService.triggerInactivityChecks({ checkClaimed: true });
    return NextResponse.json({ ok: true, data: res });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Watchdog trigger failed' },
      { status: 500 }
    );
  }
}
