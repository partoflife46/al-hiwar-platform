/**
 * Module architecture and API reference for `src/hooks/staff/use-staff-resource-form.ts`.
 *
 * Exported symbols:
 * - `useStaffResourceForm` (Function): use staff resource form definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `./staff-portal-api`
 * - `./staff-portal-copy`
 *
 * @module hooks/staff/use-staff-resource-form
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Sub-hook encapsulating Administrator Islamic Resource upload, edit, and delete forms.
 */

import * as React from 'react';
import type {
  IslamicResource,
  ResourceCategory,
  ResourceType,
} from '@/lib/db/types';
import { postApiJson } from './staff-portal-api';
import { getAcceptMimeType, STAFF_COPY } from './staff-portal-copy';

/**
 * Type contract defining use staff resource form options.
 * Includes fields/members: isFr, refreshData, setStatusBanner, setResources.
 */
interface UseStaffResourceFormOptions {
  /** is fr property. */
  isFr: boolean;
  /** refresh data property. */
  refreshData: () => Promise<void>;
  /** set status banner property. */
  setStatusBanner: React.Dispatch<React.SetStateAction<string | null>>;
  /** set resources property. */
  setResources: React.Dispatch<React.SetStateAction<IslamicResource[]>>;
}

/** Manages creation, editing, deletion, and media upload state for Islamic resources. */
export function useStaffResourceForm({
  isFr,
  refreshData,
  setStatusBanner,
  setResources,
}: UseStaffResourceFormOptions) {
  const copy = STAFF_COPY[isFr ? 'fr' : 'en'];

  const [resTitleEn, setResTitleEn] = React.useState('');
  const [resTitleFr, setResTitleFr] = React.useState('');
  const [resCategory, setResCategory] = React.useState<ResourceCategory>('QURAN');
  const [resFormat, setResFormat] = React.useState<ResourceType>('PDF');
  const [resUrl, setResUrl] = React.useState('/resources/new-faculty-guide.pdf');
  const [resDescEn, setResDescEn] = React.useState('');
  const [resDescFr, setResDescFr] = React.useState('');

  const [editingResource, setEditingResource] = React.useState<IslamicResource | null>(
    null
  );
  const [editResTitleEn, setEditResTitleEn] = React.useState('');
  const [editResTitleFr, setEditResTitleFr] = React.useState('');
  const [editResCategory, setEditResCategory] =
    React.useState<ResourceCategory>('QURAN');
  const [editResFormat, setEditResFormat] = React.useState<ResourceType>('PDF');
  const [editResUrl, setEditResUrl] = React.useState('');
  const [editResDescEn, setEditResDescEn] = React.useState('');
  const [editResDescFr, setEditResDescFr] = React.useState('');

  const [isUploadingMedia, setIsUploadingMedia] = React.useState(false);
  const [uploadingTarget, setUploadingTarget] = React.useState<'CREATE' | 'EDIT' | null>(
    null
  );
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const editFileInputRef = React.useRef<HTMLInputElement | null>(null);

  /**
   * Asynchronously executes handle file upload logic.
   * @param file - File value (`File`).
   * @param isEdit - Input is edit argument.
   */
  const handleFileUpload = async (file: File, isEdit = false) => {
    if (!file) return;
    setIsUploadingMedia(true);
    setUploadingTarget(isEdit ? 'EDIT' : 'CREATE');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/staff/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (res.ok && json.ok && json.url) {
        if (isEdit) setEditResUrl(json.url);
        else setResUrl(json.url);
        setStatusBanner(copy.uploadSuccess(file.name));
      } else {
        setStatusBanner(
          `${copy.errUploadFailed} ${json.message || json.error || copy.errUnknown}`
        );
      }
    } catch (err: any) {
      setStatusBanner(`${copy.errUploadNet} ${err.message}`);
    } finally {
      setIsUploadingMedia(false);
      setUploadingTarget(null);
    }
  };

  /**
   * Asynchronously executes handle upload resource logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'UPLOAD_RESOURCE',
        titleEn: resTitleEn,
        titleFr: resTitleFr || resTitleEn,
        category: resCategory,
        resourceType: resFormat,
        mediaUrl: resUrl,
        descriptionEn: resDescEn || copy.defaultResDescEn,
        descriptionFr: resDescFr || copy.defaultResDescFr,
      });
      if (ok) {
        setResTitleEn('');
        setResTitleFr('');
        setResDescEn('');
        setResDescFr('');
        const title = isFr ? json.data?.titleFr || json.data?.titleEn : json.data?.titleEn;
        setStatusBanner(copy.resourceUploaded(title, json.data?.uploadedByAdminId));
      } else {
        setStatusBanner(`${copy.errUpload}: ${json.message || json.error}`);
      }
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errNetwork}: ${err?.message}`);
    }
  };

  /**
   * Asynchronously executes handle delete resource logic.
   * @param resourceId - Resource id value (`string`).
   */
  const handleDeleteResource = async (resourceId: string) => {
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'DELETE_RESOURCE',
        resourceId,
      });
      setStatusBanner(
        ok
          ? copy.resourceDeleted(resourceId)
          : `${copy.errDelete}: ${json.message || json.error}`
      );
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errNetwork}: ${err?.message}`);
    }
  };

  /**
   * Executes start edit resource logic.
   * @param res - Res value (`IslamicResource`).
   */
  const startEditResource = (res: IslamicResource) => {
    setEditingResource(res);
    setEditResTitleEn(res.titleEn);
    setEditResTitleFr(res.titleFr || '');
    setEditResCategory(res.category);
    setEditResFormat(res.resourceType);
    setEditResUrl(res.mediaUrl);
    setEditResDescEn(res.descriptionEn || '');
    setEditResDescFr(res.descriptionFr || '');
  };

  /**
   * Asynchronously executes handle save edit resource logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleSaveEditResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    try {
      const { ok, json } = await postApiJson('/api/staff', {
        action: 'UPDATE_RESOURCE',
        resourceId: editingResource.id,
        titleEn: editResTitleEn,
        titleFr: editResTitleFr || editResTitleEn,
        category: editResCategory,
        resourceType: editResFormat,
        mediaUrl: editResUrl,
        descriptionEn: editResDescEn,
        descriptionFr: editResDescFr || editResDescEn,
      });
      if (ok) {
        setResources((prev) =>
          prev.map((r) => (r.id === editingResource.id ? { ...r, ...json.data } : r))
        );
        const title = isFr ? json.data?.titleFr || json.data?.titleEn : json.data?.titleEn;
        setStatusBanner(copy.resourceUpdated(title));
        setEditingResource(null);
      } else {
        setStatusBanner(`${copy.errUpdate}: ${json.message || json.error}`);
      }
      await refreshData();
    } catch (err: any) {
      setStatusBanner(`${copy.errNetwork}: ${err?.message}`);
    }
  };

  return {
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
    setIsUploadingMedia,
    uploadingTarget,
    setUploadingTarget,
    fileInputRef,
    editFileInputRef,
    getAcceptMimeType,
    handleFileUpload,
    handleUploadResource,
    handleDeleteResource,
    startEditResource,
    handleSaveEditResource,
  };
}
