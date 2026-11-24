/**
 * Module architecture and API reference for `src/app/api/staff/staff-user-actions.ts`.
 *
 * Exported symbols:
 * - `handleCreateStaff` (Function): handle create staff definition.
 * - `handleRevokeCertificate` (Function): handle revoke certificate definition.
 * - `handleUpdateUser` (Function): handle update user definition.
 * - `handleDeleteUser` (Function): handle delete user definition.
 * - `handleCreateUser` (Function): handle create user definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/services/content-workflow-service`
 * - `@/lib/security/rbac`
 * - `@/lib/security/password`
 * - `@/lib/db/types`
 * - `./staff-shared`
 *
 * @module app/api/staff/staff-user-actions
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Server-side helper module supporting the `/api/staff` API route.
 * Isolates validation, payload mapping, and domain orchestration from HTTP transport logic.
 * @module app/api/staff/staff-user-actions
 * @exports handleCreateStaff, handleRevokeCertificate, handleUpdateUser, handleDeleteUser,
 *   handleCreateUser
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { contentWorkflowService } from '@/lib/services/content-workflow-service';
import { STAFF_ROLES } from '@/lib/security/rbac';
import { hashPassword } from '@/lib/security/password';
import type { User, UserSession } from '@/lib/db/types';
import {
  jsonError,
  requireStaffRole,
  sanitizeUser,
  validatePasswordInput,
} from './staff-shared';

/** Creates a verified staff account under Administrator governance. */
export async function handleCreateStaff(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['ADMINISTRATOR'],
    'Only authenticated Administrators may create staff accounts.'
  );
  if (forbidden) return forbidden;

  const { firstName, surname, email, role, password, dateOfBirth, title } = body;
  if (!firstName?.trim() || !surname?.trim() || !email?.trim() || !role || !password?.trim()) {
    return jsonError(
      400,
      'MISSING_FIELDS',
      'First name, surname, email, role, and password are required.'
    );
  }

  const pwError = validatePasswordInput(
    password.trim(),
    'Staff account password must be at least 8 characters long.'
  );
  if (pwError) return pwError;

  if (!STAFF_ROLES.includes(role)) {
    return jsonError(
      400,
      'INVALID_ROLE',
      'Role must be DIALOGIST, INSTRUCTOR, SUPERVISOR, or ADMINISTRATOR.'
    );
  }

  if (db.findUserByEmail(email.trim().toLowerCase())) {
    return jsonError(
      409,
      'EMAIL_ALREADY_EXISTS',
      `An account with email "${email}" already exists.`
    );
  }

  const res = await contentWorkflowService.createStaffAccount({
    adminId: session.userId,
    firstName,
    surname,
    email,
    role,
    dateOfBirth: dateOfBirth || '1988-01-01',
    title,
    password: password.trim(),
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  }

  db.save();
  return NextResponse.json({ ok: true, data: sanitizeUser(res.data) }, { status: 201 });
}

/** Revokes an issued graduation certificate under Administrator authority. */
export async function handleRevokeCertificate(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['ADMINISTRATOR'],
    'Only Administrators may revoke certificates.'
  );
  if (forbidden) return forbidden;

  const res = await contentWorkflowService.revokeCertificate({
    adminId: session.userId,
    certificateId: body.certificateId,
    reason: body.reason || 'Administrative revocation',
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  }

  db.save();
  return NextResponse.json({ ok: true });
}

/** Updates fields on a target platform user account under Administrator authority. */
export async function handleUpdateUser(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['ADMINISTRATOR'],
    'Only Administrators may update user accounts.'
  );
  if (forbidden) return forbidden;

  const { userId, firstName, surname, email, role, status } = body;
  const updated = db.updateUser(userId, { firstName, surname, email, role, status });
  if (!updated) {
    return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
  }

  db.save();
  return NextResponse.json({ ok: true, data: sanitizeUser(updated) });
}

/** Deletes a non-root user account under Administrator authority. */
export async function handleDeleteUser(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['ADMINISTRATOR'],
    'Only Administrators may delete user accounts.'
  );
  if (forbidden) return forbidden;

  const targetId = body.userId;
  const targetUser = db.findUserById(targetId) || db.findUserByEmail(targetId);
  if (!targetUser) {
    return jsonError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (targetUser.email === 'admin@alhiwar.org') {
    return jsonError(400, 'PROTECTED_USER', 'Root administrator account cannot be deleted.');
  }

  db.deleteUser(targetUser.id);
  db.save();
  return NextResponse.json({ ok: true, message: `Account "${targetUser.email}" deleted.` });
}

/** Creates a general or staff user account directly from the Administrator console. */
export async function handleCreateUser(
  session: UserSession,
  body: Record<string, any>
): Promise<NextResponse> {
  const forbidden = requireStaffRole(
    session,
    ['ADMINISTRATOR'],
    'Only Administrators may create user accounts.'
  );
  if (forbidden) return forbidden;

  const { firstName, surname, email, role, password } = body;
  const normalizedEmail = email.trim().toLowerCase();
  if (db.findUserByEmail(normalizedEmail)) {
    return jsonError(409, 'EMAIL_ALREADY_EXISTS', 'Account with this email already exists.');
  }

  const pwError = validatePasswordInput(
    password.trim(),
    'Password must be at least 8 characters long.'
  );
  if (pwError) return pwError;

  const hashed = await hashPassword(password.trim());
  const now = new Date().toISOString();
  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: normalizedEmail,
    passwordHash: hashed,
    firstName: firstName.trim(),
    surname: surname.trim(),
    dateOfBirth: '1995-01-01',
    role: role || 'NON_MUSLIM',
    status: 'ACTIVE',
    preferredLanguage: 'en',
    emailVerified: true,
    verificationOtp: null,
    createdAt: now,
    updatedAt: now,
  };
  db.addUser(newUser);
  db.save();
  return NextResponse.json({ ok: true, data: sanitizeUser(newUser) });
}
