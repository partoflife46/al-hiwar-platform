/**
 * Next.js App Router API route handler for `/api/auth/login`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/auth/login/route
 * @exports POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth-service';
import {
  getClientIp,
  checkRateLimit,
  isLocked,
  resetRateLimit,
  createRateLimitResponse,
} from '@/lib/security/rate-limiter';

/**
 * Constant definition for max account attempts.
 */
const MAX_ACCOUNT_ATTEMPTS = 5;
/**
 * Constant definition for account lock window ms.
 */
const ACCOUNT_LOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
/**
 * Constant definition for ip window ms.
 */
const IP_WINDOW_MS = 60 * 1000; // 1 minute
/**
 * Constant definition for ip max attempts.
 */
const IP_MAX_ATTEMPTS = process.env.NODE_ENV === 'test' ? 100 : 30;

/**
 * Handles HTTP `POST` requests for `/api/auth/login`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    // 1. IP-level rate limit guard against high-frequency bot flooding
    const ipCheck = checkRateLimit(clientIp, {
      windowMs: IP_WINDOW_MS,
      maxAttempts: IP_MAX_ATTEMPTS,
      keyPrefix: 'login:ip',
      message: 'Too many login attempts from this network. Please wait a minute before trying again.',
    });
    if (!ipCheck.success) {
      return createRateLimitResponse(ipCheck);
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Account-level lockout check (SEC-05: prevents brute-force on target account)
    const accountLock = isLocked(normalizedEmail, 'login:account');
    if (accountLock.locked) {
      const waitMinutes = Math.ceil(accountLock.retryAfterSeconds / 60);
      return NextResponse.json(
        {
          ok: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many failed login attempts. Please wait ${waitMinutes} minutes before trying again.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(accountLock.retryAfterSeconds),
          },
        }
      );
    }

    const result = await authService.login({ email: normalizedEmail, password });
    if (!result.ok) {
      // Record failed attempt against target account
      const accountLimit = checkRateLimit(normalizedEmail, {
        windowMs: ACCOUNT_LOCK_WINDOW_MS,
        maxAttempts: MAX_ACCOUNT_ATTEMPTS,
        keyPrefix: 'login:account',
      });

      if (!accountLimit.success) {
        const waitMinutes = Math.ceil(accountLimit.retryAfterSeconds / 60);
        return NextResponse.json(
          {
            ok: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: `Too many failed login attempts. Please wait ${waitMinutes} minutes before trying again.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(accountLimit.retryAfterSeconds),
            },
          }
        );
      }

      // SEC-06: Prevent account enumeration by returning unified credentials error
      const isUnverified = result.error.message?.includes('verify your email');
      const errorCode = isUnverified ? 'UNVERIFIED_EMAIL' : 'INVALID_CREDENTIALS';
      const errorMessage = isUnverified
        ? 'Please verify your email before logging in.'
        : 'Invalid email address or password. Please check your credentials and try again.';

      return NextResponse.json(
        { ok: false, error: errorCode, message: errorMessage },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful authentication
    resetRateLimit(normalizedEmail, 'login:account');
    resetRateLimit(clientIp, 'login:ip');

    // Finding #111: Do not leak raw session token into JSON response
    const { token: _token, ...safeData } = result.data;
    const response = NextResponse.json({ ok: true, data: safeData }, { status: 200 });
    response.cookies.set('alhiwar_session', result.data.token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown login error',
      },
      { status: 500 }
    );
  }
}
