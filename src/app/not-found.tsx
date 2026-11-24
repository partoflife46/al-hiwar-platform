/**
 * Next.js App Router view module for `/`.
 * Renders bilingual EN/FR interface states and connects UI interactions to platform hooks.
 * @module app/not-found
 * @exports NotFound
 */

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Renders the not found interface component.
 * @returns Rendered JSX element tree.
 */
export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full p-8 text-center space-y-4 rounded-3xl border border-[#CBD5E1] bg-white shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#006C9C]/10 text-[#006C9C] flex items-center justify-center text-2xl font-bold font-mono">
          404
        </div>
        <h1 className="text-xl font-bold text-[#082233]">
          Page Not Found / Page Introuvable
        </h1>
        <p className="text-xs text-[#5F7383] leading-relaxed">
          The requested page does not exist or has been moved. / La page demandée n&apos;existe pas ou a été déplacée.
        </p>
        <Link href="/">
          <Button variant="primary" className="w-full text-xs font-bold">
            Return to Homepage / Retour à l&apos;accueil
          </Button>
        </Link>
      </Card>
    </div>
  );
}
