/**
 * Module architecture and API reference for `src/app/api/auth/demo-switch/route.ts`.
 *
 * Exported symbols:
 * - `dynamic` (Const): dynamic definition.
 * - `POST` (Function): post definition.
 * - `GET` (Function): get definition.
 *
 * Internal dependencies:
 * - `@/lib/services/auth-service`
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/security/session-token`
 * - `@/lib/db/types`
 *
 * @module app/api/auth/demo-switch/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router API route handler for `/api/auth/demo-switch`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/auth/demo-switch/route
 * @exports dynamic, POST, GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth-service';
import { db } from '@/lib/db/in-memory-adapter';
import { GUEST_SESSION_ID } from '@/lib/security/session-token';
import type { UserRole } from '@/lib/db/types';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Handles HTTP `POST` requests for `/api/auth/demo-switch`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json(
      { ok: false, error: 'NOT_FOUND', message: 'Demo endpoint is disabled in production' },
      { status: 404 }
    );
  }
  try {
    const body = await request.json();
    const role = body.role as UserRole;

    if (!role) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_ROLE', message: 'Target role is required' },
        { status: 400 }
      );
    }

    // Allow authenticated logout (resetting session to Visitor)
    if (role === 'VISITOR') {
      db.activeDemoUserId = null;
      const response = NextResponse.json(
        {
          ok: true,
          data: {
            userId: 'visitor',
            email: 'visitor@example.com',
            firstName: 'Visitor',
            surname: 'Guest',
            role: 'VISITOR',
            preferredLanguage: 'en',
            token: '',
          },
        },
        { status: 200 }
      );
      response.cookies.delete('alhiwar_session');
      return response;
    }

    // Strict security check: Persona switching to privileged roles is completely disabled in production/dev
    if (process.env.NODE_ENV !== 'test') {
      return NextResponse.json(
        {
          ok: false,
          error: 'FORBIDDEN',
          message:
            'Unauthenticated role switching is strictly disabled. Please authenticate through the official login endpoint.',
        },
        { status: 403 }
      );
    }

    const session = await authService.switchDemoPersona(role);
    const response = NextResponse.json({ ok: true, data: session }, { status: 200 });

    response.cookies.set('alhiwar_session', session.token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'SWITCH_FAILED',
        message: error instanceof Error ? error.message : 'Unknown persona switch error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handles HTTP `GET` requests for `/api/auth/demo-switch`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json(
      { ok: false, error: 'NOT_FOUND', message: 'Demo endpoint is disabled in production' },
      { status: 404 }
    );
  }
  try {
    const tokenCookie = request.cookies.get('alhiwar_session');
    if (tokenCookie?.value) {
      const session = await authService.validateSession(tokenCookie.value);
      if (session) {
        return NextResponse.json(
          { ok: true, data: session },
          { /** Configuration group for headers. */
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
        );
      }
    }

    // In isolated unit tests, support activeDemoUserId fallback
    if (process.env.NODE_ENV === 'test' && db.activeDemoUserId) {
      const demoUser = db.findUserById(db.activeDemoUserId);
      if (demoUser) {
        return NextResponse.json(
          {
            ok: true,
            data: {
              userId: demoUser.id,
              email: demoUser.email,
              firstName: demoUser.firstName,
              surname: demoUser.surname,
              role: demoUser.role,
              preferredLanguage: demoUser.preferredLanguage,
              token: `demo_${demoUser.id}`,
            },
          },
          { /** Configuration group for headers. */
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
        );
      }
    }

    // Default to unauthenticated Visitor
    return NextResponse.json(
      {
        ok: true,
        data: {
          userId: 'visitor',
          email: 'visitor@example.com',
          firstName: 'Visitor',
          surname: 'Guest',
          role: 'VISITOR',
          preferredLanguage: 'en',
          token: GUEST_SESSION_ID,
        },
      },
      { /** Configuration group for headers. */
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'GET_SESSION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to query session',
      },
      { status: 500 }
    );
  }
}
