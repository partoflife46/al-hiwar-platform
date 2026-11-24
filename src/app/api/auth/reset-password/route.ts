/**
 * Module architecture and API reference for `src/app/api/auth/reset-password/route.ts`.
 *
 * Exported symbols:
 * - `POST` (Function): post definition.
 *
 * Internal dependencies:
 * - `@/lib/services/auth-service`
 * - `@/lib/security/password-policy`
 *
 * @module app/api/auth/reset-password/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router API route handler for `/api/auth/reset-password`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/auth/reset-password/route
 * @exports POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth-service';
import { evaluatePassword } from '@/lib/security/password-policy';

/**
 * Handles HTTP `POST` requests for `/api/auth/reset-password`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, newPassword } = body;

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        {
          ok: false,
          error: 'MISSING_FIELDS',
          message: 'Email, reset token, and new password are required',
        },
        { status: 400 }
      );
    }

    const evaluation = evaluatePassword(newPassword);
    if (!evaluation.hasMinLength) {
      return NextResponse.json(
        {
          ok: false,
          error: 'PASSWORD_TOO_SHORT',
          message: 'Password must be at least 8 characters long',
        },
        { status: 400 }
      );
    }
    if (!evaluation.isValid) {
      return NextResponse.json(
        {
          ok: false,
          error: 'PASSWORD_TOO_WEAK',
          message: evaluation.errorMessageEn || 'Password must contain a combination of letters and numbers',
        },
        { status: 400 }
      );
    }

    const result = await authService.resetPasswordWithToken(
      email.trim().toLowerCase(),
      token.trim(),
      newPassword
    );

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error.code, message: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, message: 'Your password has been successfully updated. You may now sign in.' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown password reset error',
      },
      { status: 500 }
    );
  }
}
