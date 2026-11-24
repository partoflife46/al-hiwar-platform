/**
 * Next.js App Router view module for `/audio/[slug]`.
 * Renders bilingual EN/FR interface states and connects UI interactions to platform hooks.
 * @module app/audio/[slug]/route
 * @exports dynamic, GET
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '@/lib/db/in-memory-adapter';
import { canAccessConversation, CONVERSATION_STAFF_ROLES, requireAuth } from '@/lib/security/rbac';
import type { ShahadahSubmission, UserSession } from '@/lib/db/types';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Executes get mime type logic.
 * @param filename - Filename value (`string`).
 * @returns Value of type `string`.
 */
function getMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.aac')) return 'audio/aac';
  return 'application/octet-stream';
}

/**
 * Executes can access private audio logic.
 * @param session - Session value (`UserSession`).
 * @param cleanSlug - Clean slug value (`string`).
 * @returns Value of type `boolean`.
 */
function canAccessPrivateAudio(session: UserSession, cleanSlug: string): boolean {
  if (CONVERSATION_STAFF_ROLES.includes(session.role)) {
    return true;
  }

  const audioUrl = `/audio/${cleanSlug}`;
  const ownsSubmission = db.shahadahSubmissions.some((s) => {
    if (s.nonMuslimId !== session.userId) return false;
    if (s.audioRecordingUrl === audioUrl) return true;
    const prev = (s as ShahadahSubmission & { previousAttempts?: Array<{ audioRecordingUrl?: string }> })
      .previousAttempts;
    return Array.isArray(prev) && prev.some((a) => a.audioRecordingUrl === audioUrl);
  });
  if (ownsSubmission) {
    return true;
  }

  const matchingConvIds = db.messages
    .filter((m) => m.audioUrl === audioUrl)
    .map((m) => m.conversationId);
  if (matchingConvIds.length > 0) {
    return db.conversations.some(
      (c) => matchingConvIds.includes(c.id) && canAccessConversation(session, c)
    );
  }

  return false;
}

/**
 * Executes serve audio buffer logic.
 * @param request - Request value (`NextRequest`).
 * @param fileBuffer - File buffer value (`Buffer`).
 * @param filename - Filename value (`string`).
 * @param isPrivate - Is private value (`boolean`).
 */
function serveAudioBuffer(
  request: NextRequest,
  fileBuffer: Buffer,
  filename: string,
  isPrivate: boolean
) {
  const total = fileBuffer.length;
  const contentType = getMimeType(filename);
  const cacheControl = isPrivate ? 'private, no-store' : 'public, max-age=86400';
  const rangeHeader = request.headers.get('range');

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? Math.min(parseInt(match[2], 10), total - 1) : total - 1;

      if (start >= total || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${total}`,
          },
        });
      }

      const chunk = fileBuffer.subarray(start, end + 1);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Length': chunk.length.toString(),
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': cacheControl,
        },
      });
    }
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': total.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': cacheControl,
    },
  });
}

/**
 * Handles HTTP `GET` requests for `/audio/[slug]`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @param props - Destructured input containing params.
 * @returns Rendered JSX element tree.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = path.basename(slug);
    const runtimeAudioPath = path.join(process.cwd(), '.data', 'audio', cleanSlug);
    const publicAudioPath = path.join(process.cwd(), 'public', 'audio', cleanSlug);

    // SEC-11: Public educational resources in public/audio/ must be accessible without auth
    if (fs.existsSync(publicAudioPath)) {
      const fileBuffer = fs.readFileSync(publicAudioPath);
      return serveAudioBuffer(request, fileBuffer, cleanSlug, false);
    }

    // Private recordings in .data/audio/ require strict authentication
    const authCheck = requireAuth(request);
    if (!authCheck.ok) {
      return authCheck.response;
    }

    if (fs.existsSync(runtimeAudioPath)) {
      if (!canAccessPrivateAudio(authCheck.session, cleanSlug)) {
        return NextResponse.json(
          { ok: false, error: 'FORBIDDEN', message: 'You are not authorized to access this recording' },
          { status: 403 }
        );
      }
      const fileBuffer = fs.readFileSync(runtimeAudioPath);
      return serveAudioBuffer(request, fileBuffer, cleanSlug, true);
    }

    if (fs.existsSync(publicAudioPath)) {
      const fileBuffer = fs.readFileSync(publicAudioPath);
      return serveAudioBuffer(request, fileBuffer, cleanSlug, false);
    }

    // Fallback: serve authentic WAV sample for reference playback if requested slug isn't a private file
    const wavFallback = path.join(process.cwd(), 'public', 'audio', 'sample-shahadah-jean-luc.wav');
    if (fs.existsSync(wavFallback)) {
      const fileBuffer = fs.readFileSync(wavFallback);
      return serveAudioBuffer(request, fileBuffer, 'sample-shahadah-jean-luc.wav', false);
    }

    return NextResponse.json({ error: 'Audio file not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to serve audio file' },
      { status: 500 }
    );
  }
}
