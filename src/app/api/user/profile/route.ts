/**
 * Module architecture and API reference for `src/app/api/user/profile/route.ts`.
 *
 * Exported symbols:
 * - `dynamic` (Const): dynamic definition.
 * - `GET` (Function): get definition.
 * - `PUT` (Function): put definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/security/rbac`
 * - `@/lib/security/session-token`
 * - `./profile-helpers`
 *
 * @module app/api/user/profile/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router API route handler for `/api/user/profile`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/user/profile/route
 * @exports dynamic, GET, PUT
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { getSessionFromRequest } from '@/lib/security/rbac';
import { signSessionToken } from '@/lib/security/session-token';
import {
  applyBasicProfileUpdates,
  applyPasswordChange,
  hasValidatedShahadahFor,
  maybePromoteToNewMuslim,
  profileError,
  serializeSafeProfile,
} from './profile-helpers';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/** Returns the authenticated user's sanitized profile and Shahadah validation status. */
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role === 'VISITOR') {
      return profileError(401, 'UNAUTHORIZED', 'You must be signed in to view your profile');
    }

    const user = db.findUserById(session.userId);
    if (!user) {
      return profileError(404, 'USER_NOT_FOUND', 'User profile not found');
    }

    const safeUser = serializeSafeProfile(user, hasValidatedShahadahFor(user.id));
    return NextResponse.json(
      { ok: true, data: safeUser },
      { /** Configuration group for headers. */
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return profileError(500, 'INTERNAL_ERROR', msg);
  }
}

/** Updates authenticated user profile fields, password, and optional New Muslim promotion. */
export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role === 'VISITOR') {
      return profileError(401, 'UNAUTHORIZED', 'You must be signed in to update your profile');
    }

    const user = db.findUserById(session.userId);
    if (!user) {
      return profileError(404, 'USER_NOT_FOUND', 'User account not found');
    }

    const body = await request.json();
    const basicErr = applyBasicProfileUpdates(user, body);
    if (basicErr) return basicErr;

    if (body.password) {
      const pwErr = await applyPasswordChange(user, body.password, body.currentPassword);
      if (pwErr) return pwErr;
    }

    const hasValidatedShahadah = hasValidatedShahadahFor(user.id);
    const rolePromoted = maybePromoteToNewMuslim(user, hasValidatedShahadah);
    user.updatedAt = new Date().toISOString();
    db.save();

    const updatedUser = serializeSafeProfile(user, hasValidatedShahadah, {
      rolePromoted,
      updatedAt: user.updatedAt,
    });
    const response = NextResponse.json({ ok: true, data: updatedUser });
    if (rolePromoted) {
      response.cookies.set('alhiwar_session', signSessionToken(user.id), {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown profile error';
    return profileError(500, 'INTERNAL_ERROR', msg);
  }
}
