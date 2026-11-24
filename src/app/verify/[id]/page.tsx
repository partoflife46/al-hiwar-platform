/**
 * Public QR credential verification registry page for Al Hiwar Academy certificates.
 */

'use client';

/**
 * Module architecture and API reference for `src/app/verify/[id]/page.tsx`.
 *
 * Exported symbols:
 * - `PublicVerifyCertificatePage` (Function): public verify certificate page definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `@/components/ui/brand-pattern`
 * - `@/lib/context/language-context`
 * - `@/components/academy/certificate-api`
 *
 * @module app/verify/[id]/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Certificate, SupportedLanguage } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandPatternMark } from '@/components/ui/brand-pattern';
import { useLanguage } from '@/lib/context/language-context';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  Globe,
  Hash,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';
import {
  formatShortIsoDate,
  lookupCertificateById,
  VERIFY_CERT_COPY,
} from '@/components/academy/certificate-api';

/** Renders the unverified/not-found certificate screen with an inline lookup form. */
function CertificateNotFoundView({
  id,
  language,
}: {
  id: string;
  language: SupportedLanguage;
}) {
  const router = useRouter();
  const copy = VERIFY_CERT_COPY[language];
  const [searchId, setSearchId] = React.useState('');

  /**
   * Executes handle search logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      router.push(`/verify/${encodeURIComponent(searchId.trim())}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card className="p-8 rounded-3xl border-2 border-red-300 bg-white shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700">
          <XCircle className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <Badge
            variant="danger"
            className="text-xs font-bold uppercase tracking-wider"
          >
            {copy.unverifiedBadge}
          </Badge>
          <h1 className="text-2xl font-extrabold text-[#082233]">
            {copy.notFoundTitle}
          </h1>
          <p className="text-sm text-[#5F7383] max-w-md mx-auto leading-relaxed">
            {copy.notFoundPrefix}
            <span className="font-mono font-bold text-[#082233]">
              {id || '—'}
            </span>
            {copy.notFoundSuffix}
          </p>
        </div>

        {/* Form landmark */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto pt-2 flex gap-2">
          <Input
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder={copy.searchPlaceholder}
            className="text-xs h-10"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="h-10 px-4 text-xs font-bold gap-1 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            {copy.verifyBtn}
          </Button>
        </form>

        <div className="pt-2 border-t border-[#E2E8F0]">
          <Link href="/">
            <Button
              variant="primary"
              className="gap-1.5 text-xs font-bold min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" /> {copy.returnHomeBtn}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

/** Renders the verified or revoked credential details card for public verification. */
function PublicCertificateVerificationView({
  certificate,
  language,
}: {
  certificate: Certificate;
  language: SupportedLanguage;
}) {
  const copy = VERIFY_CERT_COPY[language];
  const isRevoked = Boolean(certificate.isRevoked);

  const details = [
    {
      icon: User,
      iconTone: 'text-[#006C9C]',
      label: copy.fullNameLabel,
      value: certificate.fullName || '—',
      valCls: 'text-base font-extrabold text-[#082233]',
    },
    {
      icon: Globe,
      iconTone: 'text-[#006C9C]',
      label: copy.nationalityLabel,
      value: certificate.nationality || '—',
      valCls: 'text-base font-bold text-[#082233]',
    },
    {
      icon: Calendar,
      iconTone: 'text-[#8A672B]',
      label: copy.dobLabel,
      value: formatShortIsoDate(certificate.dateOfBirth),
      valCls: 'text-sm font-mono font-bold text-[#082233]',
    },
    {
      icon: Calendar,
      iconTone: 'text-[#0D7A5F]',
      label: copy.issueDateLabel,
      value: formatShortIsoDate(certificate.issueDate),
      valCls: 'text-sm font-mono font-bold text-[#082233]',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Card
        className={`p-8 rounded-3xl border-2 shadow-xl space-y-6 bg-white ${
          isRevoked ? 'border-red-500' : 'border-[#0D7A5F]'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm">
              <BrandPatternMark className="h-14 w-14" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#006C9C]">
                {copy.registryTag}
              </div>
              <h1 className="text-xl font-extrabold text-[#082233]">
                {copy.registryHeading}
              </h1>
              <p className="text-xs text-[#5F7383]">{copy.registrySub}</p>
            </div>
          </div>

          <Badge
            variant={isRevoked ? 'danger' : 'approved'}
            className="text-xs px-3 py-1.5 gap-1.5 font-bold"
          >
            {isRevoked ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {isRevoked ? copy.statusRevoked : copy.statusValid}
          </Badge>
        </div>

        {isRevoked && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 space-y-1">
            <div className="font-bold uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> {copy.revocationHeading}
            </div>
            <p>
              {copy.revocationPrefix}
              <strong>
                {certificate.revocationReason || copy.defaultRevokeReason}
              </strong>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {details.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl bg-[#F8FAFC] p-4 border border-[#E2E8F0] space-y-1"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5F7383] flex items-center gap-1">
                  <Icon className={`w-3.5 h-3.5 ${item.iconTone}`} /> {item.label}
                </span>
                <div className={item.valCls}>{item.value}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-[#006C9C]/5 border border-[#006C9C]/20 p-4 space-y-2 text-xs text-[#082233]">
          <div className="font-bold flex items-center gap-1.5 text-[#006C9C]">
            <CheckCircle2 className="w-4 h-4" /> {copy.attestationTitle}
          </div>
          <p className="leading-relaxed text-[#5F7383]">
            {copy.attestationBody}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 font-mono text-[11px] text-[#082233]">
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3 text-[#8A672B]" /> ID : {certificate.id}
            </span>
            <span>
              {copy.qrHashLabel} {certificate.verificationQrHash || '—'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link href={`/academy/certificate/${certificate.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs min-h-[44px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {copy.viewFullBtn}
            </Button>
          </Link>
          <a
            href={`/api/certificates/${certificate.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5 text-xs font-bold min-h-[44px]"
            >
              <Download className="w-3.5 h-3.5" /> {copy.downloadPdfBtn}
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}

/** Verifies a certificate identifier or QR hash against the Al Hiwar public registry. */
export default function PublicVerifyCertificatePage() {
  const params = useParams();
  const verifyId = typeof params?.id === 'string' ? params.id : '';
  const { language } = useLanguage();
  const copy = VERIFY_CERT_COPY[language];

  const [certificate, setCertificate] = React.useState<Certificate | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    let isCancelled = false;
    /**
     * Asynchronously executes check authenticity logic.
     * @returns Promise resolving once the operation completes.
     */
    async function checkAuthenticity() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const outcome = await lookupCertificateById(verifyId);
        if (isCancelled) return;
        setCertificate(outcome.certificate);
        setNotFound(outcome.notFound);
      } catch {
        if (!isCancelled) setNotFound(true);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }
    checkAuthenticity();
    return () => {
      isCancelled = true;
    };
  }, [verifyId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#006C9C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-[#5F7383]">{copy.verifying}</p>
      </div>
    );
  }

  if (notFound || !certificate) {
    return <CertificateNotFoundView id={verifyId} language={language} />;
  }

  return (
    <PublicCertificateVerificationView
      certificate={certificate}
      language={language}
    />
  );
}
