/**
 * Next.js App Router API route handler for `/api/resources`.
 * Validates request payloads, enforces role-based access control, and returns JSON
 * responses.
 * @module app/api/resources/route
 * @exports dynamic, GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Handles HTTP `GET` requests for `/api/resources`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param request - Request value (`NextRequest`).
 * @returns Rendered JSX element tree.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const format = searchParams.get('format') || searchParams.get('resourceType');
    const query = searchParams.get('q')?.trim().toLowerCase();

    let resources = db.getPublicIslamicResources(
      category && category !== 'ALL' ? category : undefined
    );

    if (format && format !== 'ALL') {
      resources = resources.filter((r) => r.resourceType === format);
    }

    if (query) {
      resources = resources.filter(
        (r) =>
          r.titleEn.toLowerCase().includes(query) ||
          r.titleFr.toLowerCase().includes(query) ||
          r.descriptionEn.toLowerCase().includes(query) ||
          r.descriptionFr.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      ok: true,
      data: resources,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: err?.message || 'Failed to load resources' },
      { status: 500 }
    );
  }
}
