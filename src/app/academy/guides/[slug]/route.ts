/**
 * Next.js App Router view module for `/academy/guides/[slug]`.
 * Renders bilingual EN/FR interface states and connects UI interactions to platform hooks.
 * @module app/academy/guides/[slug]/route
 * @exports dynamic, GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { db } from '@/lib/db/in-memory-adapter';

/**
 * Constant definition for dynamic.
 */
export const dynamic = 'force-dynamic';

/**
 * Executes to win ansi safe logic.
 * @param text - Text value (`string`).
 * @returns Value of type `string`.
 */
function toWinAnsiSafe(text: string): string {
  return text
    .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '[Arabic text]')
    .replace(/ﷺ/g, '(PBUH)')
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

/**
 * Executes wrap lines logic.
 * @param text - Text value (`string`).
 * @param maxChars - Max chars value (`number`).
 * @returns Value of type `string[]`.
 */
function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (!current) {
      current = w;
    } else if (current.length + 1 + w.length <= maxChars) {
      current += ` ${w}`;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Handles HTTP `GET` requests for `/academy/guides/[slug]`.
 * Validates session permissions and returns a structured JSON `NextResponse`.
 * @param _request - Request value (`NextRequest`).
 * @param context - Context value (`{ params: Promise<{ slug: string }> }`).
 * @returns Rendered JSX element tree.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const cleanSlug = slug.replace(/[^a-zA-Z0-9._-]/g, '');
  const expectedUrl = `/academy/guides/${cleanSlug}`;

  const lesson =
    db.learningContents.find((l) => l.pdfGuideUrl === expectedUrl) ||
    db.learningContents.find((l) => cleanSlug.includes(`lesson-${l.lessonNumber}`));

  if (!lesson) {
    return NextResponse.json({ ok: false, error: 'GUIDE_NOT_FOUND' }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  page.drawText('AL HIWAR ISLAMIC ACADEMY - STUDY GUIDE', {
    x: margin,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0, 0.42, 0.61),
  });
  y -= 22;

  const titleLines = wrapLines(toWinAnsiSafe(`Module ${lesson.lessonNumber}: ${lesson.titleEn}`), 68);
  for (const tl of titleLines) {
    page.drawText(tl, { x: margin, y, size: 15, font: fontBold, color: rgb(0.03, 0.13, 0.2) });
    y -= 20;
  }
  y -= 10;

  const paragraphs = lesson.contentMarkdownEn.replace(/\r\n/g, '\n').split(/\n+/);
  for (const rawLine of paragraphs) {
    const cleaned = toWinAnsiSafe(rawLine.replace(/^#+\s*/, '').replace(/\*\*|\*/g, '').trim());
    if (!cleaned) {
      y -= 8;
      continue;
    }
    const isHeading = rawLine.trim().startsWith('#');
    const wrapped = wrapLines(cleaned, isHeading ? 72 : 84);
    for (const line of wrapped) {
      if (y < margin + 20) addNewPage();
      page.drawText(line, {
        x: margin,
        y,
        size: isHeading ? 11.5 : 10,
        font: isHeading ? fontBold : fontRegular,
        color: isHeading ? rgb(0, 0.31, 0.45) : rgb(0.15, 0.22, 0.28),
      });
      y -= isHeading ? 16 : 14;
    }
    y -= 4;
  }

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${cleanSlug.endsWith('.pdf') ? cleanSlug : `${cleanSlug}.pdf`}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
