/**
 * Administrator certificate revocation registry and user account directory view.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/staff/admin-user-directory.tsx`.
 *
 * Exported symbols:
 * - `AdminUserDirectory` (Function): admin user directory definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `./admin-directory-copy`
 * - `./admin-certificate-registry`
 * - `./admin-user-forms`
 *
 * @module components/staff/admin-user-directory
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { StaffPortalContext } from '@/hooks/use-staff-portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Pencil, PlusCircle, Trash2, XCircle } from 'lucide-react';
import { ADMIN_DIR_COPY, filterOperationalUsers } from './admin-directory-copy';
import { AdminCertificateRegistry } from './admin-certificate-registry';
import { AddUserInlineForm, EditUserInlineForm } from './admin-user-forms';

/** Renders the Administrator certificate registry and platform user account directory. */
export function AdminUserDirectory({ ctx }: { ctx: StaffPortalContext }) {
  const {
    isFr,
    users,
    isAddingUser,
    setIsAddingUser,
    editingUser,
    setEditingUser,
    userMsg,
    userErrorMsg,
    setUserErrorMsg,
    startEditUser,
    handleDeleteUser,
  } = ctx;

  const copy = ADMIN_DIR_COPY[isFr ? 'fr' : 'en'];
  const visibleUsers = filterOperationalUsers(users);

  return (
    <div className="lg:col-span-7 space-y-6">
      <AdminCertificateRegistry ctx={ctx} />

      <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#082233]">
              {copy.usersTitle} ({visibleUsers.length})
            </h2>
            <p className="text-[11px] text-[#5F7383]">{copy.usersSubtitle}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddingUser(!isAddingUser);
              setEditingUser(null);
              setUserErrorMsg(null);
            }}
            className="text-xs gap-1.5 border-[#006C9C] text-[#006C9C]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {isAddingUser ? copy.cancel : copy.addAccount}
          </Button>
        </div>

        {userMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{userMsg}</span>
          </div>
        )}

        {userErrorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{userErrorMsg}</span>
          </div>
        )}

        {isAddingUser && <AddUserInlineForm ctx={ctx} />}
        {editingUser && <EditUserInlineForm ctx={ctx} />}

        <div className="max-h-96 overflow-y-auto space-y-2">
          {visibleUsers.map((u) => {
            const fullName = `${u.firstName} ${u.surname}`;
            return (
              <div
                key={u.id}
                className="rounded-xl border border-[#E2E8F0] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-[#006C9C]/40 transition-colors"
              >
                <div>
                  <div className="font-bold text-[#082233] flex items-center gap-2">
                    <span>{fullName}</span>
                    {u.status === 'SUSPENDED' && (
                      <Badge variant="danger" className="text-[11px] py-0.5 px-2">
                        {copy.suspended}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-[#5F7383]">{u.email}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={u.emailVerified ? 'approved' : 'pending'}
                    className="text-[11px] py-0.5 px-2"
                  >
                    {u.emailVerified ? copy.verified : copy.pendingVerification}
                  </Badge>
                  <Badge variant="primary" className="text-[11px] font-mono">
                    {u.role}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEditUser(u)}
                    className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:h-8 px-3 text-xs gap-1.5 touch-manipulation text-[#006C9C] hover:bg-[#006C9C]/10"
                    title={copy.editUserTitle}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{copy.editBtn}</span>
                  </Button>
                  {u.email !== 'admin@alhiwar.org' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(u.id, fullName)}
                      className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:h-8 px-3 text-xs gap-1.5 touch-manipulation text-red-600 border-red-200 hover:bg-red-50"
                      aria-label={copy.deleteUserAria(fullName)}
                      title={copy.deleteUserTitle}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">{copy.deleteBtn}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
