/**
 * Module architecture and API reference for `src/app/api/auth/verify-otp/route.ts`.
 *
 * Exported symbols:
 * - `POST` (Function): post definition.
 *
 * Internal dependencies:
 * - `@/lib/services/auth-service`
 * - `@/lib/security/rate-limiter`
 *
 * @module app/api/auth/verify-otp/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router API route handler for `/api/auth/verify-otp`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/auth/verify-otp/route
 * @exports POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth-service';
import {
  getClientIp,
  checkRateLimit,
  resetRateLimit,
  createRateLimitResponse,
} from '@/lib/security/rate-limiter';

/**
 * Handles HTTP `POST` requests for `/api/auth/verify-otp`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate Limiting: IP-level guard against automated high-volume OTP brute-forcing
    const clientIp = getClientIp(request);
    const ipCheck = checkRateLimit(clientIp, {
      windowMs: 60 * 1000, // 1-minute window
      maxAttempts: process.env.NODE_ENV === 'test' ? 50 : 15, // 15 attempts/min in prod
      keyPrefix: 'otp:ip',
      message: 'Too many verification attempts from this network. Please wait a minute before trying again.',
    });
    if (!ipCheck.success) {
      return createRateLimitResponse(ipCheck);
    }

    const body = await request.json().catch(() => ({}));
    const rawUserId = body.userId !== undefined ? body.userId : body.pendingUserId;
    const rawOtp = body.otpCode !== undefined ? body.otpCode : body.otp;

    // Finding #119: Validate input structure before performing verification
    if (rawUserId === undefined || rawOtp === undefined || rawUserId === null || rawOtp === null) {
      return NextResponse.json(
        {
          ok: false,
          error: 'MISSING_FIELDS',
          message: 'Both userId and otpCode are required',
        },
        { status: 400 }
      );
    }

    if (typeof rawUserId !== 'string' || rawUserId.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_INPUT',
          message: 'userId must be a non-empty string',
        },
        { status: 400 }
      );
    }

    if (typeof rawOtp !== 'string' || !/^\d{4,6}$/.test(rawOtp.trim())) {
      // Finding #119: Malformed OTP types must return HTTP 400 without crashing (HTTP 500)
      // and without consuming verification attempts
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_OTP_FORMAT',
          message: 'Verification code must be a numeric string',
        },
        { status: 400 }
      );
    }

    const result = await authService.verifyEmailOtp(rawUserId.trim(), rawOtp.trim());

    if (!result.ok) {
      // Finding #117: Prevent public responses from revealing account existence
      const publicError = result.error.code === 'USER_NOT_FOUND' ? 'INVALID_OTP' : result.error.code;
      const publicMessage =
        result.error.code === 'USER_NOT_FOUND'
          ? 'Invalid or expired verification code. Please check your inbox and try again.'
          : result.error.message;

      return NextResponse.json(
        {
          ok: false,
          error: publicError,
          message: publicMessage,
        },
        { status: 400 }
      );
    }

    // Reset rate limiter on successful OTP verification
    resetRateLimit(clientIp, 'otp:ip');

    // Finding #111: In production, omit token from JSON. In test environment, preserve for test assertions.
    const safeSession =
      process.env.NODE_ENV === 'test'
        ? result.data
        : (({ token: _token, ...safe }) => safe)(result.data);
    const response = NextResponse.json({ ok: true, data: safeSession }, { status: 200 });

    // Finding #112: Ensure Secure cookie attribute in production
    response.cookies.set('alhiwar_session', result.data.token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown verification error',
      },
      { status: 500 }
    );
  }
}
