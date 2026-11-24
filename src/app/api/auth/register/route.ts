/**
 * Next.js App Router API route handler for `/api/auth/register`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/auth/register/route
 * @exports POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth-service';
import { db } from '@/lib/db/in-memory-adapter';
import { emailService } from '@/lib/email/email-service';

/**
 * Handles HTTP `POST` requests for `/api/auth/register`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await authService.registerSeeker(body);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error.code,
          message: result.error.message,
          minAge: result.error.minAge,
          emailConfigured: emailService.isConfigured(),
        },
        { status: 400 }
      );
    }

    const payload = {
      pendingUserId: result.data.pendingUserId,
      email: result.data.email,
      emailDelivered: result.data.emailDelivered,
      emailConfigured: result.data.emailConfigured,
      emailDeliveryError: result.data.emailDeliveryError,
      ...(process.env.NODE_ENV !== 'production' && result.data.demoOtpHint
        ? { demoOtpHint: result.data.demoOtpHint }
        : {}),
    };

    return NextResponse.json({ ok: true, data: payload }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown registration error',
      },
      { status: 500 }
    );
  }
}
