/**
 * Module architecture and API reference for `src/app/api/staff/upload/upload-helpers.ts`.
 *
 * Exported symbols:
 * - `ALLOWED_UPLOAD_EXTENSIONS` (Const): allowed upload extensions definition.
 * - `DecodedUploadPayload` (Interface): decoded upload payload definition.
 * - `parseUploadRequest` (Function): parse upload request definition.
 * - `validateUploadPayload` (Function): validate upload payload definition.
 * - `saveUploadedResourceFile` (Function): save uploaded resource file definition.
 *
 * @module app/api/staff/upload/upload-helpers
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Payload decoding, file validation, and disk persistence helpers for `/api/staff/upload`.
 */

import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Constant definition for max file size.
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;
/**
 * Constant definition for base64 pattern.
 */
const BASE64_PATTERN = /^[A-Za-z0-9+/=]+$/;

/**
 * Constant definition for allowed upload extensions.
 */
export const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  '.pdf',
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
  '.aac',
  '.mp4',
  '.webm',
  '.mov',
  '.txt',
  '.md',
]);

/**
 * Type contract defining decoded upload payload.
 * Includes fields/members: fileName, fileBuffer, fileSize, mimeType.
 */
export interface DecodedUploadPayload {
  /** file name property. */
  fileName: string;
  /** file buffer property. */
  fileBuffer: Buffer;
  /** file size property. */
  fileSize: number;
  /** mime type property. */
  mimeType: string;
}

/** Decodes an inline data URL, base64 string, or plain text payload into a Buffer. */
function decodeJsonFileBuffer(rawData: unknown): Buffer {
  if (typeof rawData === 'string' && rawData.startsWith('data:')) {
    return Buffer.from(rawData.split(',')[1] || '', 'base64');
  }
  if (
    typeof rawData === 'string' &&
    BASE64_PATTERN.test(rawData) &&
    rawData.length % 4 === 0
  ) {
    return Buffer.from(rawData, 'base64');
  }
  return Buffer.from(String(rawData));
}

/** Extracts file metadata and bytes from either a JSON or multipart FormData request. */
export async function parseUploadRequest(
  request: NextRequest
): Promise<
  { ok: true; payload: DecodedUploadPayload } | { ok: false; response: NextResponse }
> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    const fileName = body.fileName || body.name || '';
    const rawData = body.fileData || body.data || '';
    if (!fileName || !rawData) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: 'MISSING_FILE', message: 'No file provided for upload.' },
          { status: 400 }
        ),
      };
    }
    const fileBuffer = decodeJsonFileBuffer(rawData);
    return {
      ok: true,
      payload: {
        fileName,
        fileBuffer,
        fileSize: fileBuffer.length,
        mimeType: body.mimeType || 'application/octet-stream',
      },
    };
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string') {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'MISSING_FILE', message: 'No file provided for upload.' },
        { status: 400 }
      ),
    };
  }
  const bytes = await file.arrayBuffer();
  return {
    ok: true,
    payload: {
      fileName: file.name,
      fileBuffer: Buffer.from(bytes),
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
    },
  };
}

/** Validates upload file size and extension against the platform allowlist. */
export function validateUploadPayload(
  payload: DecodedUploadPayload
): NextResponse | null {
  if (payload.fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds maximum allowed limit (50MB).',
      },
      { status: 413 }
    );
  }
  const ext = path.extname(payload.fileName).toLowerCase();
  if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'UNSUPPORTED_FILE_TYPE',
        message: `File extension ${ext} is not supported. Allowed extensions: ${Array.from(
          ALLOWED_UPLOAD_EXTENSIONS
        ).join(', ')}`,
      },
      { status: 400 }
    );
  }
  return null;
}

/** Writes the validated resource buffer to `public/uploads/resources` and returns its URL. */
export function saveUploadedResourceFile(payload: DecodedUploadPayload) {
  const ext = path.extname(payload.fileName).toLowerCase();
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resources');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const safeBase =
    path
      .basename(payload.fileName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 40) || 'resource';
  const finalFilename = `${Date.now()}-${safeBase}${ext}`;
  fs.writeFileSync(path.join(uploadDir, finalFilename), payload.fileBuffer);
  return {
    filename: finalFilename,
    url: `/uploads/resources/${finalFilename}`,
  };
}
