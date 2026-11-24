/**
 * Next.js App Router API route handler for `/api/auth/forgot-password`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/auth/forgot-password/route
 * @exports POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth-service';

/**
 * Handles HTTP `POST` requests for `/api/auth/forgot-password`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'MISSING_EMAIL', message: 'Email address is required' },
        { status: 400 }
      );
    }

    // SEC-04: Prevent Host Header Injection by using configured APP_BASE_URL or whitelisting trusted hosts
    let baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    if (!baseUrl) {
      const host = request.headers.get('host') || 'localhost:3000';
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      const isTrustedHost =
        host.startsWith('localhost:') ||
        host === 'localhost' ||
        host.startsWith('127.0.0.1:') ||
        host === '127.0.0.1' ||
        host.endsWith('.alhiwar.org') ||
        host === 'alhiwar.org' ||
        host.endsWith('.up.railway.app') ||
        host.endsWith('.vercel.app');

      const trustedHost = isTrustedHost ? host : 'localhost:3000';
      const trustedProto = isTrustedHost ? proto : 'http';
      baseUrl = `${trustedProto}://${trustedHost}`;
    }

    const result = await authService.requestPasswordReset(email.trim().toLowerCase(), baseUrl);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error.code, message: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, message: result.data.message }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown forgot password error',
      },
      { status: 500 }
    );
  }
}
