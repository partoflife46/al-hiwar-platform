/**
 * Shared media URL input with local file upload and preview button for Admin resource forms.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/staff/admin-resource-media-field.tsx`.
 *
 * Exported symbols:
 * - `ResourceMediaField` (Function): resource media field definition.
 *
 * Internal dependencies:
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `./admin-resource-copy`
 *
 * @module components/staff/admin-resource-media-field
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Loader2, Upload } from 'lucide-react';
import { ADMIN_STAFF_COPY, openMediaPreview } from './admin-resource-copy';

/**
 * Type contract defining resource media field props.
 */
interface ResourceMediaFieldProps {
  /** is fr property. */
  isFr: boolean;
  /** url property. */
  url: string;
  /** on url change property. */
  onUrlChange: (val: string) => void;
  /** accept property. */
  accept: string;
  /** is uploading property. */
  isUploading: boolean;
  /** is active upload property. */
  isActiveUpload: boolean;
  /** input ref property. */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** on file selected property. */
  onFileSelected: (file: File) => void;
  /** Optional label class name property. */
  labelClassName?: string;
}

/** Renders the Media File / URL field with direct file uploader and preview link. */
export function ResourceMediaField({
  isFr,
  url,
  onUrlChange,
  accept,
  isUploading,
  isActiveUpload,
  inputRef,
  onFileSelected,
  labelClassName = 'font-semibold text-[#082233]',
}: ResourceMediaFieldProps) {
  const copy = ADMIN_STAFF_COPY[isFr ? 'fr' : 'en'];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className={labelClassName}>{copy.mediaUrlLabel}</label>
        <div>
          <input
            type="file"
            ref={inputRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileSelected(f);
              e.target.value = '';
            }}
            className="hidden"
            accept={accept}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="h-7 text-[11px] gap-1 px-2.5 text-[#006C9C] border-[#006C9C]/30 hover:bg-[#006C9C]/10"
          >
            {isActiveUpload ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{copy.uploading}</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" />
                <span>{copy.uploadLocalBtn}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          required
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder={copy.mediaUrlPh}
          className="text-base sm:text-xs flex-1"
        />
        {url && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openMediaPreview(url)}
            className="h-9 px-2.5 text-xs gap-1 text-[#082233] border-[#E2E8F0] hover:bg-slate-100 shrink-0"
            title={copy.previewTitle}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{copy.previewBtn}</span>
          </Button>
        )}
      </div>
      <p className="text-[10px] text-[#5F7383]">{copy.uploadTip}</p>
    </div>
  );
}
