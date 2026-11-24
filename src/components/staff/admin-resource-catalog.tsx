/**
 * Administrator public Islamic resources catalog with inline edit and deletion controls.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/staff/admin-resource-catalog.tsx`.
 *
 * Exported symbols:
 * - `AdminResourceCatalog` (Function): admin resource catalog definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `./admin-resource-copy`
 * - `./admin-resource-media-field`
 *
 * @module components/staff/admin-resource-catalog
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { StaffPortalContext } from '@/hooks/use-staff-portal';
import type { ResourceCategory, ResourceType } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import {
  ADMIN_STAFF_COPY,
  RESOURCE_CATEGORIES,
  RESOURCE_FORMATS,
} from './admin-resource-copy';
import { ResourceMediaField } from './admin-resource-media-field';

/** Inline editor form for modifying an existing public Islamic resource record. */
function EditResourceInlineForm({ ctx }: { ctx: StaffPortalContext }) {
  const {
    isFr,
    editingResource,
    setEditingResource,
    editResTitleEn,
    setEditResTitleEn,
    editResTitleFr,
    setEditResTitleFr,
    editResCategory,
    setEditResCategory,
    editResFormat,
    setEditResFormat,
    editResUrl,
    setEditResUrl,
    editResDescEn,
    setEditResDescEn,
    editResDescFr,
    setEditResDescFr,
    isUploadingMedia,
    uploadingTarget,
    editFileInputRef,
    getAcceptMimeType,
    handleFileUpload,
    handleSaveEditResource,
  } = ctx;

  if (!editingResource) return null;
  const copy = ADMIN_STAFF_COPY[isFr ? 'fr' : 'en'];

  return (
    <form
      onSubmit={handleSaveEditResource}
      className="p-4 rounded-xl border border-[#BC9C5C]/50 bg-amber-50/40 space-y-3 text-xs"
    >
      <div className="font-bold text-[#082233] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Pencil className="w-4 h-4 text-[#8C6D32]" />
          {copy.editResourcePrefix} {editingResource.titleEn}
        </div>
        <button
          type="button"
          onClick={() => setEditingResource(null)}
          className="text-slate-400 hover:text-slate-600 font-bold"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.titleEnReq}</label>
          <Input
            required
            value={editResTitleEn}
            onChange={(e) => setEditResTitleEn(e.target.value)}
            placeholder="Resource Title (EN)"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.titleFrLabel}</label>
          <Input
            value={editResTitleFr}
            onChange={(e) => setEditResTitleFr(e.target.value)}
            placeholder="Resource Title (FR)"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.categoryReq}</label>
          <select
            aria-label={copy.categoryAria}
            value={editResCategory}
            onChange={(e) => setEditResCategory(e.target.value as ResourceCategory)}
            className="w-full min-h-[44px] sm:min-h-0 rounded-xl border border-[#E2E8F0] p-2 text-base sm:text-xs bg-white text-[#082233]"
          >
            {RESOURCE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">{copy.formatReq}</label>
          <select
            aria-label={copy.formatAria}
            value={editResFormat}
            onChange={(e) => setEditResFormat(e.target.value as ResourceType)}
            className="w-full min-h-[44px] sm:min-h-0 rounded-xl border border-[#E2E8F0] p-2 text-base sm:text-xs bg-white text-[#082233]"
          >
            {RESOURCE_FORMATS.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ResourceMediaField
        isFr={isFr}
        url={editResUrl}
        onUrlChange={setEditResUrl}
        accept={getAcceptMimeType(editResFormat)}
        isUploading={isUploadingMedia}
        isActiveUpload={isUploadingMedia && uploadingTarget === 'EDIT'}
        inputRef={editFileInputRef}
        onFileSelected={(file) => handleFileUpload(file, true)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">Description (EN)</label>
          <Input
            value={editResDescEn}
            onChange={(e) => setEditResDescEn(e.target.value)}
            placeholder="Description (EN)"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold text-[#082233]">Description (FR)</label>
          <Input
            value={editResDescFr}
            onChange={(e) => setEditResDescFr(e.target.value)}
            placeholder="Description (FR)"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditingResource(null)}
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

/** Renders the public Islamic resources catalog with inline edit and delete actions. */
export function AdminResourceCatalog({ ctx }: { ctx: StaffPortalContext }) {
  const { isFr, resources, editingResource, startEditResource, setConfirmDialog } = ctx;
  const copy = ADMIN_STAFF_COPY[isFr ? 'fr' : 'en'];

  return (
    <div className="lg:col-span-12">
      <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#082233] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#006C9C]" />
              {copy.catalogHeading(resources.length)}
            </h2>
            <p className="text-[11px] text-[#5F7383]">{copy.catalogSub}</p>
          </div>
        </div>

        {editingResource && <EditResourceInlineForm ctx={ctx} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {resources.map((res) => (
            <div
              key={res.id}
              className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 flex flex-col justify-between gap-3 hover:border-[#006C9C]/30 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="primary" className="text-[10px] font-mono py-0.5 px-2">
                      {res.resourceType}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono py-0.5 px-2">
                      {res.category}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-[#5F7383] font-mono">{res.id}</span>
                </div>
                <div className="text-xs font-bold text-[#082233] leading-snug">
                  {res.titleEn}
                </div>
                {res.titleFr && res.titleFr !== res.titleEn && (
                  <div className="text-[11px] text-[#5F7383] italic leading-tight">
                    {res.titleFr}
                  </div>
                )}
                <div className="text-[11px] text-[#006C9C] font-mono truncate max-w-full">
                  <a
                    href={res.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {res.mediaUrl}
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]/70">
                <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  ✓ {copy.verifiedResource}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEditResource(res)}
                    className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:h-8 px-3 text-xs gap-1.5 font-medium touch-manipulation text-[#006C9C] border-[#006C9C]/30 hover:bg-[#006C9C]/10"
                    aria-label={copy.editResourceAria(res.titleEn)}
                    title={copy.editResourceTitle}
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{copy.editBtn}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setConfirmDialog({
                        type: 'DELETE_RESOURCE',
                        id: res.id,
                        label: res.titleEn,
                      })
                    }
                    className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:h-8 px-3 text-xs gap-1.5 font-medium touch-manipulation text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    aria-label={copy.deleteResourceAria(res.titleEn)}
                    title={copy.deleteResourceTitle}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{copy.deleteBtn}</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {resources.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-[#5F7383]">
              {copy.emptyCatalog}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
