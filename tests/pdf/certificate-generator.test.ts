import { describe, it, expect, beforeEach } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { db } from '@/lib/db/in-memory-adapter';
import { academyService } from '@/lib/services/academy-service';
import {
  generateCertificatePdf,
  generateCertificatePdfBytes,
  generateVerificationQrSvg,
  getVerificationUrl,
  A4_LANDSCAPE_WIDTH,
  A4_LANDSCAPE_HEIGHT,
} from '@/lib/pdf/certificate-generator';

describe('Vector PDF Certificate Generator & Public Verification (Task 4.2)', () => {
  const newMuslimId = 'user-newmuslim-1';
  const adminId = 'user-admin-1';

  beforeEach(() => {
    db.reset();
  });

  it('generates valid A4 Landscape (%PDF-) byte buffer in under 200ms', async () => {
    await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_ALL_AND_GRADUATE');
    const cert = db.certificates.find((c) => c.newMuslimId === newMuslimId)!;
    expect(cert).toBeDefined();

    const start = performance.now();
    const res = await generateCertificatePdf(cert.id);
    const elapsedMs = performance.now() - start;

    expect(res.ok).toBe(true);
    expect(elapsedMs).toBeLessThan(200);

    if (res.ok) {
      const pdfBytes = res.data;
      expect(pdfBytes.byteLength).toBeGreaterThan(1500);
      const header = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
      expect(header).toBe('%PDF-');

      // Load with pdf-lib and verify page dimensions are A4 Landscape
      const loadedDoc = await PDFDocument.load(pdfBytes);
      expect(loadedDoc.getPageCount()).toBe(1);
      const page = loadedDoc.getPage(0);
      const { width, height } = page.getSize();
      expect(width).toBeCloseTo(A4_LANDSCAPE_WIDTH, 1);
      expect(height).toBeCloseTo(A4_LANDSCAPE_HEIGHT, 1);
    }
  });

  it('stamps graduate fullName, dateOfBirth, nationality, issueDate, and verificationQrHash into PDF stream', async () => {
    await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_ALL_AND_GRADUATE');
    const cert = db.certificates.find((c) => c.newMuslimId === newMuslimId)!;

    const pdfBytes = await generateCertificatePdfBytes(cert);
    const rawContent = Buffer.from(pdfBytes).toString('latin1');

    expect(rawContent).toContain("AL HIWAR DIGITAL DA'WAH & LEARNING PLATFORM");
    expect(rawContent).toContain('OFFICIAL CERTIFICATE OF ISLAMIC FUNDAMENTALS & CONVERSION');
    expect(rawContent).toContain(cert.fullName);
    expect(rawContent).toContain(cert.dateOfBirth.slice(0, 10));
    expect(rawContent).toContain(cert.nationality);
    expect(rawContent).toContain(cert.id);
    expect(rawContent).toContain(cert.verificationQrHash);
    expect(rawContent).toContain('Shahadah Validated');
  });

  it('generates SVG QR code encoding verification URL /verify/[certificateId]', async () => {
    await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_ALL_AND_GRADUATE');
    const cert = db.certificates.find((c) => c.newMuslimId === newMuslimId)!;

    const url = getVerificationUrl(cert.id);
    expect(url).toBe(`http://localhost:3000/verify/${cert.id}`);

    const svg = await generateVerificationQrSvg(cert.id);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('returns CERTIFICATE_NOT_FOUND when certificate ID does not exist', async () => {
    const res = await generateCertificatePdf('CERT-NON-EXISTENT-999');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBe('CERTIFICATE_NOT_FOUND');
    }

    const serviceRes = await academyService.generateCertificatePdf('CERT-NON-EXISTENT-999');
    expect(serviceRes.ok).toBe(false);
    if (!serviceRes.ok) {
      expect(serviceRes.error).toBe('CERTIFICATE_NOT_FOUND');
    }
  });

  it('supports public verification by both certificateId and verificationQrHash, and reflects revocation', async () => {
    await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_ALL_AND_GRADUATE');
    const cert = db.certificates.find((c) => c.newMuslimId === newMuslimId)!;

    // Verify by ID
    const byId = await academyService.verifyCertificate(cert.id);
    expect(byId.ok).toBe(true);
    if (byId.ok) {
      expect(byId.data.isRevoked).toBe(false);
      expect(byId.data.fullName).toBe('Thomas Anderson');
    }

    // Verify by QR Hash
    const byHash = await academyService.verifyCertificate(cert.verificationQrHash);
    expect(byHash.ok).toBe(true);
    if (byHash.ok) {
      expect(byHash.data.id).toBe(cert.id);
    }

    // Revoke by Administrator
    const revokeRes = await academyService.revokeCertificate(
      adminId,
      cert.id,
      'Identity verification discrepancy'
    );
    expect(revokeRes.ok).toBe(true);

    // Public verification reflects REVOKED state
    const afterRevoke = await academyService.verifyCertificate(cert.id);
    expect(afterRevoke.ok).toBe(true);
    if (afterRevoke.ok) {
      expect(afterRevoke.data.isRevoked).toBe(true);
      expect(afterRevoke.data.revocationReason).toBe('Identity verification discrepancy');
      expect(afterRevoke.data.revokedByAdminId).toBe(adminId);
    }

    // PDF of revoked certificate includes REVOKED watermark
    const revokedPdf = await academyService.generateCertificatePdf(cert.id);
    expect(revokedPdf.ok).toBe(true);
    if (revokedPdf.ok) {
      const text = Buffer.from(revokedPdf.data).toString('latin1');
      expect(text).toContain('REVOKED');
    }
  });
});
