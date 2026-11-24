/**
 * Inline forms for creating and editing platform user accounts in the Admin directory.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/staff/admin-user-forms.tsx`.
 *
 * Exported symbols:
 * - `AddUserInlineForm` (Function): add user inline form definition.
 * - `EditUserInlineForm` (Function): edit user inline form definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/lib/db/types`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `./admin-directory-copy`
 *
 * @module components/staff/admin-user-forms
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { StaffPortalContext } from '@/hooks/use-staff-portal';
import type { UserRole } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, UserPlus } from 'lucide-react';
import { ADMIN_DIR_COPY } from './admin-directory-copy';

/**
 * Constant definition for account roles.
 */
const ACCOUNT_ROLES: Exclude<UserRole, 'VISITOR'>[] = [
  'NON_MUSLIM',
  'NEW_MUSLIM',
  'DIALOGIST',
  'INSTRUCTOR',
  'SUPERVISOR',
  'ADMINISTRATOR',
];

/** Computes feedback text color class for the 8-character password hint. */
function passwordHintTone(pwd: string): string {
  const trimmed = pwd.trim().length;
  if (trimmed >= 8) return 'text-emerald-600 font-semibold';
  if (pwd.length > 0) return 'text-amber-600 font-semibold';
  return 'text-[#5F7383]';
}

/** Inline form allowing Administrators to provision a new platform user account. */
export function AddUserInlineForm({ ctx }: { ctx: StaffPortalContext }) {
  const {
    isFr,
    newFirstName,
    setNewFirstName,
    newSurname,
    setNewSurname,
    newEmail,
    setNewEmail,
    newPassword,
    setNewPassword,
    newRole,
    setNewRole,
    setIsAddingUser,
    handleCreateUser,
  } = ctx;

  const copy = ADMIN_DIR_COPY[isFr ? 'fr' : 'en'];
  const trimmedLen = newPassword.trim().length;

  return (
    <form
      onSubmit={handleCreateUser}
      className="p-4 rounded-xl border border-[#006C9C]/30 bg-[#F8FAFC] space-y-3 text-xs"
    >
      <div className="font-bold text-[#082233] flex items-center gap-1.5">
        <UserPlus className="w-4 h-4 text-[#006C9C]" />
        {copy.createHeading}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.firstNameReq}</label>
          <Input
            required
            value={newFirstName}
            onChange={(e) => setNewFirstName(e.target.value)}
            placeholder={copy.firstNamePlaceholder}
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.surnameReq}</label>
          <Input
            required
            value={newSurname}
            onChange={(e) => setNewSurname(e.target.value)}
            placeholder={copy.surnamePlaceholder}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.emailReq}</label>
          <Input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="user@alhiwar.org"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.pwdLabelReq}</label>
          <Input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
          <p className={`text-[11px] ${passwordHintTone(newPassword)}`}>
            {trimmedLen >= 8 ? copy.pwdValid : copy.pwdMin(trimmedLen)}
          </p>
        </div>
      </div>
      <div className="space-y-1">
        <label className="font-semibold text-[#082233]">{copy.accountRoleReq}</label>
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as UserRole)}
          className="w-full min-h-[44px] sm:min-h-0 rounded-xl border border-[#E2E8F0] p-2 text-base sm:text-xs bg-white text-[#082233]"
        >
          {ACCOUNT_ROLES.map((role) => (
            <option key={role} value={role}>
              {copy.roleOptions[role]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddingUser(false)}
          className="text-xs"
        >
          {copy.cancel}
        </Button>
        <Button type="submit" variant="primary" size="sm" className="text-xs font-bold">
          {copy.saveAndCreate}
        </Button>
      </div>
    </form>
  );
}

/** Inline form allowing Administrators to edit an existing user's profile, role, and status. */
export function EditUserInlineForm({ ctx }: { ctx: StaffPortalContext }) {
  const {
    isFr,
    editingUser,
    setEditingUser,
    editFirstName,
    setEditFirstName,
    editSurname,
    setEditSurname,
    editEmail,
    setEditEmail,
    editRole,
    setEditRole,
    editStatus,
    setEditStatus,
    handleSaveEditUser,
  } = ctx;

  if (!editingUser) return null;
  const copy = ADMIN_DIR_COPY[isFr ? 'fr' : 'en'];

  return (
    <form
      onSubmit={handleSaveEditUser}
      className="p-4 rounded-xl border border-[#BC9C5C]/50 bg-amber-50/40 space-y-3 text-xs"
    >
      <div className="font-bold text-[#082233] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Pencil className="w-4 h-4 text-[#8C6D32]" />
          {copy.editHeading} {editingUser.firstName} {editingUser.surname}
        </div>
        <button
          type="button"
          onClick={() => setEditingUser(null)}
          className="text-slate-400 hover:text-slate-600 font-bold"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.firstName}</label>
          <Input
            required
            value={editFirstName}
            onChange={(e) => setEditFirstName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.surname}</label>
          <Input
            required
            value={editSurname}
            onChange={(e) => setEditSurname(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.email}</label>
          <Input
            type="email"
            required
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.role}</label>
          <select
            value={editRole}
            onChange={(e) => setEditRole(e.target.value as UserRole)}
            className="w-full min-h-[44px] sm:min-h-0 rounded-xl border border-[#E2E8F0] p-2 text-base sm:text-xs bg-white text-[#082233]"
          >
            {ACCOUNT_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="font-semibold text-[#082233]">{copy.status}</label>
        <select
          value={editStatus}
          onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'SUSPENDED')}
          className="w-full min-h-[44px] sm:min-h-0 rounded-xl border border-[#E2E8F0] p-2 text-base sm:text-xs bg-white text-[#082233]"
        >
          <option value="ACTIVE">{copy.activeOpt}</option>
          <option value="SUSPENDED">{copy.suspendedOpt}</option>
        </select>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditingUser(null)}
          className="text-xs"
        >
          {copy.cancel}
        </Button>
        <Button type="submit" variant="primary" size="sm" className="text-xs font-bold">
          {copy.saveChanges}
        </Button>
      </div>
    </form>
  );
}
