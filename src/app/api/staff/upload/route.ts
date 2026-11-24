/**
 * Module architecture and API reference for `src/app/api/staff/upload/route.ts`.
 *
 * Exported symbols:
 * - `dynamic` (Const): dynamic definition.
 * - `POST` (Function): post definition.
 *
 * Internal dependencies:
 * - `@/lib/security/rbac`
 * - `./upload-helpers`
 *
 * @module app/api/staff/upload/route
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Administrator media upload route saving Islamic Library attachments to public storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/rbac';
import {
  parseUploadRequest,
  saveUploadedResourceFile,
  validateUploadPayload,
} from './upload-helpers';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/** Authenticates an Administrator and persists an uploaded library resource file. */
export async function POST(request: NextRequest) {
  try {
    const authCheck = requireAuth(request, ['ADMINISTRATOR']);
    if (!authCheck.ok) return authCheck.response;

    const parsed = await parseUploadRequest(request);
    if (!parsed.ok) return parsed.response;

    const validationError = validateUploadPayload(parsed.payload);
    if (validationError) return validationError;

    const saved = saveUploadedResourceFile(parsed.payload);
    return NextResponse.json({
      ok: true,
      url: saved.url,
      filename: saved.filename,
      originalName: parsed.payload.fileName,
      size: parsed.payload.fileSize,
      mimeType: parsed.payload.mimeType,
    });
  } catch (error: any) {
    console.error('Resource upload failed:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error?.message || 'Failed to process resource upload.',
      },
      { status: 500 }
    );
  }
}
