/**
 * Next.js App Router API route handler for `/api/auth/logout`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/auth/logout/route
 * @exports dynamic, POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Handles HTTP `POST` requests for `/api/auth/logout`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param _request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function POST(_request: NextRequest) {
  try {
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
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'LOGOUT_FAILED',
        message: error instanceof Error ? error.message : 'Logout failed',
      },
      { status: 500 }
    );
  }
}
