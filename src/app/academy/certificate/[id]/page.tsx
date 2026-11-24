/**
 * Official Academy graduation & conversion certificate preview and PDF download page.
 */

'use client';

/**
 * Module architecture and API reference for `src/app/academy/certificate/[id]/page.tsx`.
 *
 * Exported symbols:
 * - `CertificatePreviewPage` (Function): certificate preview page definition.
 *
 * Internal dependencies:
 * - `@/lib/pdf/certificate-generator`
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/brand-pattern`
 * - `@/lib/context/language-context`
 * - `@/components/academy/certificate-api`
 *
 * @module app/academy/certificate/[id]/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { generateVerificationQrDataUrl } from '@/lib/pdf/certificate-generator';
import type { Certificate } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrandPatternMark } from '@/components/ui/brand-pattern';
import { useLanguage } from '@/lib/context/language-context';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
} from 'lucide-react';
import {
  CERT_PREVIEW_COPY,
  formatShortIsoDate,
  lookupCertificateById,
} from '@/components/academy/certificate-api';

/** Renders the A4-styled interactive certificate preview with QR verification code. */
export default function CertificatePreviewPage() {
  const params = useParams();
  const certId = (params?.id as string) || '';
  const { language, isFr } = useLanguage();
  const copy = CERT_PREVIEW_COPY[language];

  const [certificate, setCertificate] = React.useState<Certificate | null>(null);
  const [qrDataUrl, setQrDataUrl] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (!certId) return;
    let active = true;
    /**
     * Asynchronously executes load logic.
     * @returns Promise resolving once the operation completes.
     */
    async function load() {
      setIsLoading(true);
      try {
        const { certificate: found } = await lookupCertificateById(certId);
        if (!active || !found) return;
        setCertificate(found);
        const dataUrl = await generateVerificationQrDataUrl(found.id);
        if (active) setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to load certificate preview:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [certId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-[#5F7383]">
        {copy.loading}
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Card className="p-8 space-y-4 rounded-3xl border border-red-200">
          <h2 className="text-2xl font-bold text-[#082233]">
            {copy.notFoundTitle}
          </h2>
          <p className="text-sm text-[#5F7383]">
            {copy.notFoundPrefix}
            <span className="font-mono">{certId}</span>
            {copy.notFoundSuffix}
          </p>
          <Link href="/academy">
            <Button variant="primary" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> {copy.returnRoadmap}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/academy">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="w-4 h-4" />
            {copy.returnRoadmap}
          </Button>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/verify/${certificate.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#006C9C]" />
              {copy.publicVerifyBtn}
            </Button>
          </Link>
          <a
            href={`/api/certificates/${certificate.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="accent"
              size="sm"
              className="gap-2 text-xs font-bold shadow-md"
            >
              <Download className="w-4 h-4" />
              {copy.downloadPdfBtn}
            </Button>
          </a>
        </div>
      </div>

      <div className="rounded-3xl bg-[#FCFBF7] p-4 sm:p-6 shadow-2xl border-4 border-[#006C9C]">
        <div className="rounded-2xl border-2 border-[#BC9C5C] p-6 sm:p-10 space-y-8 relative overflow-hidden">
          {certificate.isRevoked && (
            <div className="rounded-xl bg-red-50 border border-red-300 p-4 flex items-center gap-3 text-red-800">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div className="text-xs">
                <div className="font-bold uppercase">{copy.revokedTitle}</div>
                <div>
                  {copy.reasonLabel}:{' '}
                  {certificate.revocationReason || copy.defaultRevokeReason}
                </div>
              </div>
            </div>
          )}

          <div className="text-center space-y-2">
            <div className="mx-auto flex items-center justify-center p-2 rounded-2xl bg-[#F8FAFC] border border-[#BC9C5C]/30 w-24 h-24 shadow-sm">
              <BrandPatternMark className="h-20 w-20" />
            </div>
            <p className="text-xs sm:text-sm font-extrabold tracking-widest uppercase text-[#006C9C]">
              {copy.platformHeader}
            </p>
            <p className="text-xs italic text-[#8C6D32]">{copy.academySub}</p>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-[#082233] pt-2">
              {copy.certTitle}
            </h1>
            <div className="mx-auto h-0.5 w-48 bg-[#BC9C5C]" />
          </div>

          <div className="text-center space-y-4">
            <p className="text-xs sm:text-sm text-[#5F7383]">
              {copy.certifiesThat}
            </p>
            <div className="text-2xl sm:text-4xl font-extrabold text-[#006C9C] tracking-tight">
              {certificate.fullName}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#082233]">
              <span className="bg-white px-3 py-1 rounded-full border border-[#E2E8F0]">
                {copy.dobLabel} {formatShortIsoDate(certificate.dateOfBirth)}
              </span>
              <span className="bg-white px-3 py-1 rounded-full border border-[#E2E8F0]">
                {copy.nationalityLabel} {certificate.nationality}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#082233] max-w-2xl mx-auto leading-relaxed pt-2">
              {isFr ? (
                <>
                  a embrassé l’Islam (<strong>Chahada validée</strong>) devant un
                  spécialiste certifié de la plateforme Al Hiwar et a complété
                  avec succès le{' '}
                  <strong>
                    Parcours de l’Académie Islamique Al Hiwar &amp; l’Examen Final
                  </strong>{' '}
                  avec distinction académique (≥ 80 %).
                </>
              ) : (
                <>
                  has embraced Islam (<strong>Shahadah Validated</strong>) before
                  a certified specialist of the Al Hiwar Platform and has
                  successfully completed the{' '}
                  <strong>
                    Al Hiwar Islamic Academy Learning Path &amp; Final Examination
                  </strong>{' '}
                  with academic distinction (≥ 80%).
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center justify-between gap-6 pt-6 border-t border-[#BC9C5C]/40">
            <div className="space-y-1 text-xs text-[#082233]">
              <div className="font-mono font-bold">
                {copy.certIdLabel} {certificate.id}
              </div>
              <div className="font-mono text-[11px] text-[#5F7383]">
                {copy.qrHashLabel} {certificate.verificationQrHash}
              </div>
              <div>
                {copy.issueDateLabel} {formatShortIsoDate(certificate.issueDate)}
              </div>
              <div className="pt-1">
                {certificate.isRevoked ? (
                  <Badge variant="danger" className="text-[11px]">
                    {copy.revokedBadge}
                  </Badge>
                ) : (
                  <Badge variant="approved" className="text-[11px] gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {copy.validBadge}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end space-y-1">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt={copy.qrAlt}
                  className="h-24 w-24 rounded-xl border-2 border-[#BC9C5C] bg-white p-1.5 shadow-sm"
                />
              )}
              <span className="text-[11px] font-mono text-[#006C9C] font-bold">
                {copy.scanLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
