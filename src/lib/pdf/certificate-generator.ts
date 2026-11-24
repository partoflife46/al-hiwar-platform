/**
 * Module architecture and API reference for `src/lib/pdf/certificate-generator.ts`.
 *
 * Exported symbols:
 * - `CertificateGeneratorError` (TypeAlias): certificate generator error definition.
 * - `MADINAH_BLUE_RGB` (Const): madinah blue rgb definition.
 * - `MINARET_GOLD_RGB` (Const): minaret gold rgb definition.
 * - `DEEP_NAVY_RGB` (Const): deep navy rgb definition.
 * - `MUTED_SLATE_RGB` (Const): muted slate rgb definition.
 * - `A4_LANDSCAPE_WIDTH` (Const): a4 landscape width definition.
 * - `A4_LANDSCAPE_HEIGHT` (Const): a4 landscape height definition.
 * - `getVerificationUrl` (Function): get verification url definition.
 * - `generateVerificationQrSvg` (Function): generate verification qr svg definition.
 * - `generateVerificationQrDataUrl` (Function): generate verification qr data url
 *   definition.
 * - `generateCertificatePdfBytes` (Function): generate certificate pdf bytes definition.
 * - `generateCertificatePdf` (Function): generate certificate pdf definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/db/types`
 *
 * @module lib/pdf/certificate-generator
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Shared platform module for certificate generator utilities and configuration.
 * Exports typed helpers consumed across the Al-Hiwar web application.
 * @module lib/pdf/certificate-generator
 * @exports CertificateGeneratorError, MADINAH_BLUE_RGB, MINARET_GOLD_RGB, DEEP_NAVY_RGB,
 *   MUTED_SLATE_RGB, A4_LANDSCAPE_WIDTH
 */

import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import { db } from '@/lib/db/in-memory-adapter';
import { ok, err, type Result, type Certificate } from '@/lib/db/types';

/**
 * Type alias representing certificate generator error.
 */
export type CertificateGeneratorError = 'CERTIFICATE_NOT_FOUND' | 'PDF_GENERATION_FAILED';

// Institutional Brand Colors — Islamic University of Madinah
// Madinah Blue: #006C9C -> rgb(0, 108/255, 156/255)
export const MADINAH_BLUE_RGB = rgb(0 / 255, 108 / 255, 156 / 255);
// Minaret Gold: #BC9C5C -> rgb(188/255, 156/255, 92/255)
export const MINARET_GOLD_RGB = rgb(188 / 255, 156 / 255, 92 / 255);
// Deep Navy Ink: #082233 -> rgb(8/255, 34/255, 51/255)
export const DEEP_NAVY_RGB = rgb(8 / 255, 34 / 255, 51 / 255);
// Muted Slate: #5F7383 -> rgb(95/255, 115/255, 131/255)
export const MUTED_SLATE_RGB = rgb(95 / 255, 115 / 255, 131 / 255);

/**
 * Constant definition for a4 landscape width.
 */
export const A4_LANDSCAPE_WIDTH = 841.89;
/**
 * Constant definition for a4 landscape height.
 */
export const A4_LANDSCAPE_HEIGHT = 595.28;

/**
 * Executes get verification url logic.
 * @param certificateId - Certificate id value (`string`).
 * @returns Value of type `string`.
 */
export function getVerificationUrl(certificateId: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/verify/${certificateId}`;
}

/**
 * Generates an inline SVG string for a verification QR code.
 * Safe in both server and client environments.
 */
export async function generateVerificationQrSvg(certificateId: string): Promise<string> {
  const url = getVerificationUrl(certificateId);
  return QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    color: {
      dark: '#082233',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generates a PNG data URL for a verification QR code so React can render
 * it safely inside an `<img>` element without `dangerouslySetInnerHTML`.
 */
export async function generateVerificationQrDataUrl(certificateId: string): Promise<string> {
  const url = getVerificationUrl(certificateId);
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 192,
    color: {
      dark: '#082233',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generates an official A4 Landscape (841.89 x 595.28 pt) vector PDF Certificate
 * for a graduated New Muslim using pdf-lib and qrcode.
 */
export async function generateCertificatePdfBytes(cert: Certificate): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  pdfDoc.setTitle(`Official Certificate of Islamic Fundamentals - ${cert.fullName}`);
  pdfDoc.setAuthor("Al Hiwar Digital Da'wah & Learning Platform");
  pdfDoc.setSubject(
    `Graduation Certificate ${cert.id} for ${cert.fullName} (${cert.nationality}, DOB: ${cert.dateOfBirth})`
  );
  pdfDoc.setKeywords([
    'Al Hiwar',
    'Al Hiwar Islamic Academy',
    cert.id,
    cert.verificationQrHash,
    cert.fullName,
    cert.nationality,
  ]);

  const page = pdfDoc.addPage([A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT]);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const obliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // 1. Soft Ivory/Parchment Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: A4_LANDSCAPE_WIDTH,
    height: A4_LANDSCAPE_HEIGHT,
    color: rgb(252 / 255, 251 / 255, 247 / 255),
  });

  // 2. Dual-Concentric Geometric Borders (#006C9C Outer & #BC9C5C Inner)
  // Outer Madinah Blue Border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: A4_LANDSCAPE_WIDTH - 40,
    height: A4_LANDSCAPE_HEIGHT - 40,
    borderColor: MADINAH_BLUE_RGB,
    borderWidth: 4,
  });

  // Inner Minaret Gold Concentric Border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: A4_LANDSCAPE_WIDTH - 60,
    height: A4_LANDSCAPE_HEIGHT - 60,
    borderColor: MINARET_GOLD_RGB,
    borderWidth: 2,
  });

  // Corner Geometric Ornaments (Concentric Squares in Gold & Blue)
  const corners = [
    { x: 26, y: 26 },
    { x: A4_LANDSCAPE_WIDTH - 42, y: 26 },
    { x: 26, y: A4_LANDSCAPE_HEIGHT - 42 },
    { x: A4_LANDSCAPE_WIDTH - 42, y: A4_LANDSCAPE_HEIGHT - 42 },
  ];
  for (const corner of corners) {
    page.drawRectangle({
      x: corner.x,
      y: corner.y,
      width: 16,
      height: 16,
      borderColor: MINARET_GOLD_RGB,
      borderWidth: 1.5,
      color: MADINAH_BLUE_RGB,
    });
  }

  // 3. Vector Institutional Emblem Seal at Top Center
  const centerX = A4_LANDSCAPE_WIDTH / 2;
  page.drawCircle({
    x: centerX,
    y: 530,
    size: 24,
    borderColor: MINARET_GOLD_RGB,
    borderWidth: 2,
    color: MADINAH_BLUE_RGB,
  });
  page.drawText('IU', {
    x: centerX - 9,
    y: 524,
    size: 16,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // 4. Institutional Header & Title
  const headerText = "AL HIWAR DIGITAL DA'WAH & LEARNING PLATFORM";
  const headerWidth = boldFont.widthOfTextAtSize(headerText, 13);
  page.drawText(headerText, {
    x: (A4_LANDSCAPE_WIDTH - headerWidth) / 2,
    y: 482,
    size: 13,
    font: boldFont,
    color: MADINAH_BLUE_RGB,
  });

  const subHeaderText = 'Al Hiwar Islamic Academy | Global Outreach & Learning';
  const subHeaderWidth = obliqueFont.widthOfTextAtSize(subHeaderText, 10);
  page.drawText(subHeaderText, {
    x: (A4_LANDSCAPE_WIDTH - subHeaderWidth) / 2,
    y: 465,
    size: 10,
    font: obliqueFont,
    color: MINARET_GOLD_RGB,
  });

  const titleText = 'OFFICIAL CERTIFICATE OF ISLAMIC FUNDAMENTALS & CONVERSION';
  const titleWidth = boldFont.widthOfTextAtSize(titleText, 18);
  page.drawText(titleText, {
    x: (A4_LANDSCAPE_WIDTH - titleWidth) / 2,
    y: 425,
    size: 18,
    font: boldFont,
    color: DEEP_NAVY_RGB,
  });

  // Decorative Gold Divider Line
  page.drawLine({
    start: { x: 180, y: 412 },
    end: { x: A4_LANDSCAPE_WIDTH - 180, y: 412 },
    thickness: 1.5,
    color: MINARET_GOLD_RGB,
  });

  // 5. Proclamation & Graduate Full Name
  const introText = 'This official academic and spiritual credential certifies that';
  const introWidth = regularFont.widthOfTextAtSize(introText, 12);
  page.drawText(introText, {
    x: (A4_LANDSCAPE_WIDTH - introWidth) / 2,
    y: 382,
    size: 12,
    font: regularFont,
    color: MUTED_SLATE_RGB,
  });

  const safeFullName = cert.fullName || 'New Muslim Graduate';
  const nameFontSize = safeFullName.length > 32 ? 22 : 28;
  const nameWidth = boldFont.widthOfTextAtSize(safeFullName, nameFontSize);
  page.drawText(safeFullName, {
    x: (A4_LANDSCAPE_WIDTH - nameWidth) / 2,
    y: 340,
    size: nameFontSize,
    font: boldFont,
    color: MADINAH_BLUE_RGB,
  });

  // Graduate Personal Metadata Bar (DOB & Nationality)
  const formattedDob = cert.dateOfBirth ? cert.dateOfBirth.slice(0, 10) : 'N/A';
  const personalMeta = `Date of Birth: ${formattedDob}     |     Nationality: ${cert.nationality || 'International'}`;
  const personalMetaWidth = boldFont.widthOfTextAtSize(personalMeta, 11);
  page.drawText(personalMeta, {
    x: (A4_LANDSCAPE_WIDTH - personalMetaWidth) / 2,
    y: 308,
    size: 11,
    font: boldFont,
    color: DEEP_NAVY_RGB,
  });

  // 6. Shahadah Validation & 7-Module Academy Completion Statement (Requirement FR 61)
  const line1 =
    'has embraced Islam (Shahadah Validated) before a certified specialist of the Al Hiwar Platform';
  const line1Width = regularFont.widthOfTextAtSize(line1, 12);
  page.drawText(line1, {
    x: (A4_LANDSCAPE_WIDTH - line1Width) / 2,
    y: 268,
    size: 12,
    font: regularFont,
    color: DEEP_NAVY_RGB,
  });

  const line2 =
    'and has successfully completed the Al Hiwar Islamic Academy Learning Path & Final Examination';
  const line2Width = regularFont.widthOfTextAtSize(line2, 12);
  page.drawText(line2, {
    x: (A4_LANDSCAPE_WIDTH - line2Width) / 2,
    y: 248,
    size: 12,
    font: regularFont,
    color: DEEP_NAVY_RGB,
  });

  const line3 =
    'with academic distinction (>= 80%), demonstrating foundational mastery of Islamic belief, worship, and ethics.';
  const line3Width = obliqueFont.widthOfTextAtSize(line3, 11);
  page.drawText(line3, {
    x: (A4_LANDSCAPE_WIDTH - line3Width) / 2,
    y: 228,
    size: 11,
    font: obliqueFont,
    color: MUTED_SLATE_RGB,
  });

  // 7. Issue Date, Certificate ID, Signatures & High-Density Vector QR Code
  const issueDateFormatted = cert.issueDate ? cert.issueDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const verifyUrl = getVerificationUrl(cert.id);

  // Left Metadata Column
  page.drawText(`Certificate ID: ${cert.id}`, {
    x: 60,
    y: 125,
    size: 10,
    font: boldFont,
    color: DEEP_NAVY_RGB,
  });
  page.drawText(`Verification Hash: ${cert.verificationQrHash}`, {
    x: 60,
    y: 108,
    size: 9,
    font: regularFont,
    color: MUTED_SLATE_RGB,
  });
  page.drawText(`Issue Date: ${issueDateFormatted}`, {
    x: 60,
    y: 91,
    size: 10,
    font: boldFont,
    color: DEEP_NAVY_RGB,
  });
  page.drawText(`Verify Online: ${verifyUrl}`, {
    x: 60,
    y: 74,
    size: 8.5,
    font: regularFont,
    color: MADINAH_BLUE_RGB,
  });

  // Right Vector QR Code Matrix (High-Density, Zero-Raster Overhead)
  const qrData = QRCode.create(verifyUrl, { errorCorrectionLevel: 'M' });
  const moduleCount = qrData.modules.size;
  const qrBoxSize = 96;
  const qrStartX = A4_LANDSCAPE_WIDTH - 60 - qrBoxSize;
  const qrStartY = 66;
  const cellSize = qrBoxSize / moduleCount;

  // QR Frame
  page.drawRectangle({
    x: qrStartX - 6,
    y: qrStartY - 6,
    width: qrBoxSize + 12,
    height: qrBoxSize + 12,
    color: rgb(1, 1, 1),
    borderColor: MINARET_GOLD_RGB,
    borderWidth: 1.5,
  });

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qrData.modules.get(row, col)) {
        page.drawRectangle({
          x: qrStartX + col * cellSize,
          y: qrStartY + (moduleCount - 1 - row) * cellSize,
          width: cellSize + 0.15,
          height: cellSize + 0.15,
          color: DEEP_NAVY_RGB,
        });
      }
    }
  }

  page.drawText('SCAN TO VERIFY', {
    x: qrStartX + 12,
    y: qrStartY - 18,
    size: 8,
    font: boldFont,
    color: MADINAH_BLUE_RGB,
  });

  // Revocation Watermark if certificate is revoked
  if (cert.isRevoked) {
    page.drawText('REVOKED', {
      x: 280,
      y: 280,
      size: 60,
      font: boldFont,
      color: rgb(190 / 255, 18 / 255, 60 / 255),
    });
  }

  // Embed uncompressed ASCII verification dictionary in PDF Catalog for instant auditability
  pdfDoc.catalog.set(
    PDFName.of('AlHiwarCredential'),
    pdfDoc.context.obj({
      Institution: PDFString.of(
        "AL HIWAR DIGITAL DA'WAH & LEARNING PLATFORM"
      ),
      DocumentTitle: PDFString.of(
        'OFFICIAL CERTIFICATE OF ISLAMIC FUNDAMENTALS & CONVERSION'
      ),
      Declaration: PDFString.of(
        'has embraced Islam (Shahadah Validated) and successfully completed the Al Hiwar Islamic Academy Learning Path & Final Examination'
      ),
      GraduateFullName: PDFString.of(safeFullName),
      DateOfBirth: PDFString.of(formattedDob),
      Nationality: PDFString.of(cert.nationality || 'International'),
      IssueDate: PDFString.of(issueDateFormatted),
      CertificateId: PDFString.of(cert.id),
      VerificationQrHash: PDFString.of(cert.verificationQrHash),
      VerificationUrl: PDFString.of(verifyUrl),
      Status: PDFString.of(cert.isRevoked ? `REVOKED: ${cert.revocationReason || ''}` : 'VALID'),
    })
  );

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  return pdfBytes;
}

/**
 * Generates a PDF certificate from either a Certificate object or a certificateId in db.
 */
export async function generateCertificatePdf(
  certOrId: Certificate | string
): Promise<Result<Uint8Array, CertificateGeneratorError>> {
  const cert =
    typeof certOrId === 'string'
      ? db.certificates.find((c) => c.id === certOrId || c.verificationQrHash === certOrId)
      : certOrId;

  if (!cert) {
    return err('CERTIFICATE_NOT_FOUND');
  }

  try {
    const bytes = await generateCertificatePdfBytes(cert);
    return ok(bytes);
  } catch {
    return err('PDF_GENERATION_FAILED');
  }
}
