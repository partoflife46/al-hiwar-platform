'use client';

/**
 * Module architecture and API reference for `src/app/verify/page.tsx`.
 *
 * Exported symbols:
 * - `PublicVerifySearchPage` (Function): public verify search page definition.
 *
 * Internal dependencies:
 * - `@/components/ui/card`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `@/components/ui/badge`
 * - `@/components/ui/brand-pattern`
 * - `@/lib/context/language-context`
 *
 * @module app/verify/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router view module for `/verify`.
 * Renders bilingual EN/FR interface states and connects UI interactions to platform hooks.
 * @module app/verify/page
 * @exports PublicVerifySearchPage
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BrandPatternMark } from '@/components/ui/brand-pattern';
import { useLanguage } from '@/lib/context/language-context';
import { Search, ArrowLeft, ShieldCheck, QrCode } from 'lucide-react';

/**
 * Renders the public verify search page interface component.
 * @returns Rendered JSX element tree.
 */
export default function PublicVerifySearchPage() {
  const router = useRouter();
  const { isFr } = useLanguage();
  const [certId, setCertId] = React.useState('');

  /**
   * Executes handle submit logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) {
      router.push(`/verify/${encodeURIComponent(certId.trim())}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 space-y-6">
      <Card className="p-8 sm:p-10 rounded-3xl border-2 border-[#E2E8F0] bg-white shadow-xl space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#006C9C]/10 text-[#006C9C]">
          <ShieldCheck className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-[#006C9C]">
            {isFr ? 'Registre Public Officiel' : 'Official Public Registry'}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082233]">
            {isFr
              ? 'Vérification des Diplômes Al Hiwar'
              : 'Al Hiwar Credential Verification'}
          </h1>
          <p className="text-sm text-[#5F7383] max-w-md mx-auto leading-relaxed">
            {isFr
              ? 'Entrez l’identifiant du certificat ou l’empreinte de vérification QR pour vérifier l’authenticité d’un diplôme émis par l’Académie Al Hiwar.'
              : 'Enter a Certificate ID or QR Verification Hash to instantly verify the authenticity of an official credential issued by the Al Hiwar Academy.'}
          </p>
        </div>

        {/* Form landmark */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3 pt-2">
          <div className="flex gap-2">
            <Input
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder={isFr ? 'ex : cert-graduate-1' : 'e.g. cert-graduate-1'}
              className="h-11 text-sm font-mono"
              autoFocus
              required
            />
            <Button
              type="submit"
              variant="primary"
              className="h-11 px-5 text-xs font-bold gap-1.5 shrink-0 min-h-[44px]"
            >
              <Search className="w-4 h-4" />
              {isFr ? 'Vérifier' : 'Verify'}
            </Button>
          </div>
          <p className="text-[11px] text-[#5F7383] text-left flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-[#006C9C]" />
            {isFr
              ? 'Format pris en charge : identifiant officiel ou hachage cryptographique SHA-256.'
              : 'Supported formats: Official Certificate ID or SHA-256 verification hash.'}
          </p>
        </form>

        <div className="pt-4 border-t border-[#E2E8F0]">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-[#5F7383]">
              <ArrowLeft className="w-3.5 h-3.5" />
              {isFr ? 'Retour à l’accueil' : 'Return to Homepage'}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
