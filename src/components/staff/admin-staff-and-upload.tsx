/**
 * Administrator panel for provisioning staff accounts and uploading public Islamic resources.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/staff/admin-staff-and-upload.tsx`.
 *
 * Exported symbols:
 * - `AdminStaffAndUpload` (Function): admin staff and upload definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `./admin-resource-copy`
 * - `./admin-resource-media-field`
 *
 * @module components/staff/admin-staff-and-upload
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { StaffPortalContext } from '@/hooks/use-staff-portal';
import type { ResourceCategory, ResourceType, UserRole } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, UserPlus } from 'lucide-react';
import {
  ADMIN_STAFF_COPY,
  RESOURCE_CATEGORIES,
  RESOURCE_FORMATS,
} from './admin-resource-copy';
import { ResourceMediaField } from './admin-resource-media-field';

/**
 * Constant definition for staff account roles.
 */
const STAFF_ACCOUNT_ROLES = [
  'DIALOGIST',
  'INSTRUCTOR',
  'SUPERVISOR',
  'ADMINISTRATOR',
] as const;

/** Computes color tone for the minimum 8-character password hint. */
function staffPwdHintTone(pwd: string): string {
  if (pwd.trim().length >= 8) return 'text-emerald-600 font-semibold';
  if (pwd.length > 0) return 'text-amber-600 font-semibold';
  return 'text-[#5F7383]';
}

/** Renders the Admin left-column forms to create staff accounts and publish library resources. */
export function AdminStaffAndUpload({ ctx }: { ctx: StaffPortalContext }) {
  const {
    isFr,
    staffFirstName,
    setStaffFirstName,
    staffSurname,
    setStaffSurname,
    staffEmail,
    setStaffEmail,
    staffPassword,
    setStaffPassword,
    staffRole,
    setStaffRole,
    resTitleEn,
    setResTitleEn,
    resTitleFr,
    setResTitleFr,
    resCategory,
    setResCategory,
    resFormat,
    setResFormat,
    resUrl,
    setResUrl,
    resDescEn,
    setResDescEn,
    resDescFr,
    setResDescFr,
    isUploadingMedia,
    uploadingTarget,
    fileInputRef,
    getAcceptMimeType,
    handleFileUpload,
    handleCreateStaff,
    handleUploadResource,
  } = ctx;

  const copy = ADMIN_STAFF_COPY[isFr ? 'fr' : 'en'];
  const trimmedPwdLen = staffPassword.trim().length;

  return (
    <div className="lg:col-span-5 space-y-6">
      <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-4">
        <h2 className="text-base font-extrabold text-[#082233] flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#006C9C]" />
          {copy.createStaffHeading}
        </h2>
        {/* Form landmark */}
        <form onSubmit={handleCreateStaff} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              required
              value={staffFirstName}
              onChange={(e) => setStaffFirstName(e.target.value)}
              placeholder={copy.firstNamePh}
              className="text-base sm:text-xs"
            />
            <Input
              required
              value={staffSurname}
              onChange={(e) => setStaffSurname(e.target.value)}
              placeholder={copy.surnamePh}
              className="text-base sm:text-xs"
            />
          </div>
          <Input
            type="email"
            required
            value={staffEmail}
            onChange={(e) => setStaffEmail(e.target.value)}
            placeholder="staff.member@alhiwar.org"
            className="text-base sm:text-xs"
          />
          <div className="space-y-1">
            <Input
              type="password"
              required
              minLength={8}
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              placeholder={copy.staffPwdPh}
              className="text-base sm:text-xs"
            />
            <div className="text-[11px] flex items-center justify-between">
              <span className={staffPwdHintTone(staffPassword)}>
                {trimmedPwdLen >= 8 ? copy.pwdValid : copy.pwdMinReq}
              </span>
              <span className="font-mono text-[#5F7383]">{trimmedPwdLen}/8</span>
            </div>
          </div>
          <select
            aria-label={copy.staffRoleAria}
            value={staffRole}
            onChange={(e) => setStaffRole(e.target.value as UserRole)}
            className="w-full min-h-[44px] sm:min-h-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-base sm:text-xs bg-white text-[#082233] font-semibold outline-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
          >
            {STAFF_ACCOUNT_ROLES.map((role) => (
              <option key={role} value={role}>
                {copy.staffRoleLabels[role]}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary" className="w-full text-xs font-bold">
            {copy.createStaffBtn}
          </Button>
        </form>
      </Card>

      <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-4">
        <h2 className="text-base font-extrabold text-[#082233] flex items-center gap-2">
          <Upload className="w-5 h-5 text-[#8A672B]" />
          {copy.uploadResourceHeading}
        </h2>
        {/* Form landmark */}
        <form onSubmit={handleUploadResource} className="space-y-3">
          <Input
            required
            value={resTitleEn}
            onChange={(e) => setResTitleEn(e.target.value)}
            placeholder={copy.titleEnReq}
            className="text-base sm:text-xs"
          />
          <Input
            value={resTitleFr}
            onChange={(e) => setResTitleFr(e.target.value)}
            placeholder={copy.titleFrLabel}
            className="text-base sm:text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label={copy.categoryAria}
              value={resCategory}
              onChange={(e) => setResCategory(e.target.value as ResourceCategory)}
              className="min-h-[44px] sm:min-h-0 rounded-xl border border-[#E2E8F0] px-2.5 py-2 text-base sm:text-xs bg-white text-[#082233] outline-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
            >
              {RESOURCE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              aria-label={copy.formatAria}
              value={resFormat}
              onChange={(e) => setResFormat(e.target.value as ResourceType)}
              className="min-h-[44px] sm:min-h-0 rounded-xl border border-[#E2E8F0] px-2.5 py-2 text-base sm:text-xs bg-white text-[#082233] outline-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
            >
              {RESOURCE_FORMATS.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </div>
          <ResourceMediaField
            isFr={isFr}
            url={resUrl}
            onUrlChange={setResUrl}
            accept={getAcceptMimeType(resFormat)}
            isUploading={isUploadingMedia}
            isActiveUpload={isUploadingMedia && uploadingTarget === 'CREATE'}
            inputRef={fileInputRef}
            onFileSelected={(file) => handleFileUpload(file, false)}
            labelClassName="text-[11px] font-semibold text-[#082233]"
          />
          <Input
            value={resDescEn}
            onChange={(e) => setResDescEn(e.target.value)}
            placeholder="Description (EN)"
            className="text-base sm:text-xs"
          />
          <Input
            value={resDescFr}
            onChange={(e) => setResDescFr(e.target.value)}
            placeholder="Description (FR)"
            className="text-base sm:text-xs"
          />
          <Button type="submit" variant="accent" className="w-full text-xs font-bold">
            {copy.publishResourceBtn}
          </Button>
        </form>
      </Card>
    </div>
  );
}
