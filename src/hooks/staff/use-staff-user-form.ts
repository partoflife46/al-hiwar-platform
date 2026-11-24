/**
 * Module architecture and API reference for `src/hooks/staff/use-staff-user-form.ts`.
 *
 * Exported symbols:
 * - `useStaffUserForm` (Function): use staff user form definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `./staff-portal-api`
 * - `./staff-portal-copy`
 *
 * @module hooks/staff/use-staff-user-form
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Sub-hook encapsulating Administrator platform user directory CRUD forms.
 */

import * as React from 'react';
import type { User, UserRole } from '@/lib/db/types';
import { postApiJson } from './staff-portal-api';
import { STAFF_COPY } from './staff-portal-copy';

/**
 * Type contract defining use staff user form options.
 * Includes fields/members: isFr, refreshData, onRequestDeleteUser.
 */
interface UseStaffUserFormOptions {
  isFr: boolean;
  refreshData: () => Promise<void>;
  onRequestDeleteUser: (userId: string, name: string) => void;
}

/** Manages state and CRUD mutations for platform user accounts in the Admin tab. */
export function useStaffUserForm({
  isFr,
  refreshData,
  onRequestDeleteUser,
}: UseStaffUserFormOptions) {
  const copy = STAFF_COPY[isFr ? 'fr' : 'en'];

  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [editFirstName, setEditFirstName] = React.useState('');
  const [editSurname, setEditSurname] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [editRole, setEditRole] = React.useState<UserRole>('NON_MUSLIM');
  const [editStatus, setEditStatus] = React.useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');

  const [isAddingUser, setIsAddingUser] = React.useState(false);
  const [newFirstName, setNewFirstName] = React.useState('');
  const [newSurname, setNewSurname] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [newRole, setNewRole] = React.useState<UserRole>('NON_MUSLIM');
  const [userMsg, setUserMsg] = React.useState<string | null>(null);
  const [userErrorMsg, setUserErrorMsg] = React.useState<string | null>(null);

  /** Handles flash user success interaction. */
  const flashUserSuccess = (msg: string) => {
    setUserMsg(msg);
    setTimeout(() => setUserMsg(null), 4000);
  };

  /**
   * Executes start edit user logic.
   * @param u - U value (`User`).
   */
  const startEditUser = (u: User) => {
    setEditingUser(u);
    setEditFirstName(u.firstName);
    setEditSurname(u.surname);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditStatus((u.status as 'ACTIVE' | 'SUSPENDED') || 'ACTIVE');
    setUserErrorMsg(null);
  };

  /**
   * Asynchronously executes handle save edit user logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserErrorMsg(null);
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'UPDATE_USER',
        userId: editingUser.id,
        firstName: editFirstName,
        surname: editSurname,
        email: editEmail,
        role: editRole,
        status: editStatus,
      });
      if (!ok) {
        setUserErrorMsg(json.message || copy.errUserUpdate);
        return;
      }
      flashUserSuccess(copy.userUpdated(`${editFirstName} ${editSurname}`));
      setEditingUser(null);
      await refreshData();
    } catch (err: any) {
      setUserErrorMsg(err?.message || copy.errNetDot);
    }
  };

  /**
   * Asynchronously executes execute delete user logic.
   * @param userId - User id value (`string`).
   * @param name - Name value (`string`).
   */
  const executeDeleteUser = async (userId: string, name: string) => {
    setUserErrorMsg(null);
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'DELETE_USER',
        userId,
      });
      if (!ok) {
        setUserErrorMsg(json.message || copy.errUserDelete);
        return;
      }
      flashUserSuccess(copy.userDeleted(name));
      await refreshData();
    } catch (err: any) {
      setUserErrorMsg(err?.message || copy.errNetDot);
    }
  };

  /** Handles handle delete user interaction. */
  const handleDeleteUser = (userId: string, name: string) => {
    onRequestDeleteUser(userId, name);
  };

  /**
   * Asynchronously executes handle create user logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserErrorMsg(null);
    if (!newFirstName || !newSurname || !newEmail) return;
    if (!newPassword || newPassword.trim().length < 8) {
      setUserErrorMsg(copy.errUserPwdLen);
      return;
    }
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'CREATE_USER',
        firstName: newFirstName,
        surname: newSurname,
        email: newEmail,
        password: newPassword.trim(),
        role: newRole,
      });
      if (!ok) {
        setUserErrorMsg(json.message || copy.errUserCreate);
        return;
      }
      flashUserSuccess(copy.userCreated(`${newFirstName} ${newSurname}`));
      setIsAddingUser(false);
      setNewFirstName('');
      setNewSurname('');
      setNewEmail('');
      setNewPassword('');
      await refreshData();
    } catch (err: any) {
      setUserErrorMsg(err?.message || copy.errNetDot);
    }
  };

  return {
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
    isAddingUser,
    setIsAddingUser,
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
    userMsg,
    setUserMsg,
    userErrorMsg,
    setUserErrorMsg,
    startEditUser,
    handleSaveEditUser,
    executeDeleteUser,
    handleDeleteUser,
    handleCreateUser,
  };
}
