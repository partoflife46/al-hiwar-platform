/**
 * Module architecture and API reference for `src/app/api/shahadah/profile/route.ts`.
 *
 * Exported symbols:
 * - `dynamic` (Const): dynamic definition.
 * - `POST` (Function): post definition.
 * - `GET` (Function): get definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/services/shahadah-service`
 * - `@/lib/security/rbac`
 *
 * @module app/api/shahadah/profile/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router API route handler for `/api/shahadah/profile`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/shahadah/profile/route
 * @exports dynamic, POST, GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { shahadahService } from '@/lib/services/shahadah-service';
import { CONVERSATION_STAFF_ROLES, requireAuth } from '@/lib/security/rbac';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Handles HTTP `POST` requests for `/api/shahadah/profile`.
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
    const { seekerId, nationality, gender, phoneNumber } = body;

    if (seekerId && seekerId !== session.userId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'FORBIDDEN',
          message: 'You are not authorized to complete another user conversion profile',
        },
        { status: 403 }
      );
    }

    if (!nationality || !gender || !phoneNumber) {
      return NextResponse.json(
        {
          ok: false,
          error: 'PROFILE_INCOMPLETE',
          message: 'nationality, gender, and phoneNumber are mandatory',
        },
        { status: 400 }
      );
    }

    const result = await shahadahService.completeConversionProfile(session.userId, {
      nationality,
      gender,
      phoneNumber,
    });

    if (!result.ok) {
      let status = 400;
      if (result.error.code === 'USER_NOT_FOUND') {
        status = 404;
      }
      return NextResponse.json(
        { ok: false, error: result.error.code, message: result.error.message },
        { status }
      );
    }

    const response = NextResponse.json({ ok: true, data: result.data });

    // Set authentication session cookie
    response.cookies.set('alhiwar_session', result.data.token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: err?.message || 'Failed to complete profile' },
      { status: 500 }
    );
  }
}

/**
 * Handles HTTP `GET` requests for `/api/shahadah/profile`.
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
    const seekerId = searchParams.get('seekerId') || session.userId;

    if (seekerId !== session.userId && !CONVERSATION_STAFF_ROLES.includes(session.role)) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', message: 'You are not authorized to view another user profile' },
        { status: 403 }
      );
    }

    const user = db.findUserById(seekerId);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const isProfileCompleted = Boolean(user.nationality && user.gender && user.phoneNumber);

    return NextResponse.json({
      ok: true,
      data: {
        seekerId: user.id,
        role: user.role,
        nationality: user.nationality,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        conversionDate: user.conversionDate,
        isProfileCompleted,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: err?.message || 'Failed to query profile' },
      { status: 500 }
    );
  }
}
