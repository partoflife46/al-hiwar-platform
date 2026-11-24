'use client';

/**
 * Module architecture and API reference for `src/app/verify/[id]/error.tsx`.
 *
 * Exported symbols:
 * - `VerifyErrorBoundary` (Function): verify error boundary definition.
 *
 * Internal dependencies:
 * - `@/components/ui/card`
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 *
 * @module app/verify/[id]/error
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router view module for `/verify/[id]`.
 * Renders bilingual EN/FR interface states and connects UI interactions to platform hooks.
 * @module app/verify/[id]/error
 * @exports VerifyErrorBoundary
 */

import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

/**
 * Renders the verify error boundary interface component.
 * @param props - Destructured input containing error, reset.
 * @returns Rendered JSX element tree.
 */
export default function VerifyErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    console.error('Unhandled Verification Error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card className="p-8 rounded-3xl border border-[#E2E8F0] bg-white shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <Badge variant="warning" className="text-xs font-bold uppercase tracking-wider">
            Verification Service Notice
          </Badge>
          <h1 className="text-2xl font-extrabold text-[#082233]">
            Unable to Complete Certificate Verification
          </h1>
          <p className="text-sm text-[#5F7383] max-w-md mx-auto leading-relaxed">
            The verification service encountered an unexpected temporary error while looking up this credential.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            variant="outline"
            className="gap-2 text-xs font-bold min-h-[44px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>

          <Link href="/">
            <Button variant="primary" className="gap-2 text-xs font-bold min-h-[44px]">
              <ArrowLeft className="w-4 h-4" />
              Return to Homepage
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
