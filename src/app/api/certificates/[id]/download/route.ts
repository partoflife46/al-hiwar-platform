/**
 * Next.js App Router API route handler for `/api/certificates/[id]/download`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/certificates/[id]/download/route
 * @exports GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { academyService } from '@/lib/services/academy-service';
import { requireAuth } from '@/lib/security/rbac';
import { db } from '@/lib/db/in-memory-adapter';

/**
 * Handles HTTP `GET` requests for `/api/certificates/[id]/download`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @param context - Context value (`{ params: Promise<{ id: string }> }`).
 * @returns Rendered JSX element tree.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.ok) {
      return authCheck.response;
    }
    const session = authCheck.session;

    const resolvedParams = await context.params;
    const certificateId = resolvedParams.id;

    // SEC-03: IDOR prevention - verify certificate exists and belongs to requesting user or supervisor/admin
    const cert = db.certificates.find((c) => c.id === certificateId);
    if (!cert) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Certificate not found' },
        { status: 404 }
      );
    }

    const isOwner = cert.newMuslimId === session.userId;
    const isAuthorizedStaff = session.role === 'SUPERVISOR' || session.role === 'ADMINISTRATOR';

    if (!isOwner && !isAuthorizedStaff) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', message: 'You are not authorized to download this certificate' },
        { status: 403 }
      );
    }

    const pdfRes = await academyService.generateCertificatePdf(certificateId);
    if (!pdfRes.ok) {
      return NextResponse.json(
        { ok: false, error: pdfRes.error, message: 'Certificate not found' },
        { status: 404 }
      );
    }

    const pdfBuffer = Buffer.from(pdfRes.data);
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${certificateId}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: err?.message || 'PDF generation failed' },
      { status: 500 }
    );
  }
}
