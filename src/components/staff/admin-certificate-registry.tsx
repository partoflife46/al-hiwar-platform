/**
 * Certificate issuance ledger and revocation control card for Administrators.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/staff/admin-certificate-registry.tsx`.
 *
 * Exported symbols:
 * - `AdminCertificateRegistry` (Function): admin certificate registry definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `./admin-directory-copy`
 *
 * @module components/staff/admin-certificate-registry
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { StaffPortalContext } from '@/hooks/use-staff-portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Trash2 } from 'lucide-react';
import { ADMIN_DIR_COPY } from './admin-directory-copy';

/** Displays issued Academy certificates with governance revocation controls. */
export function AdminCertificateRegistry({ ctx }: { ctx: StaffPortalContext }) {
  const { isFr, certificates, setConfirmDialog } = ctx;
  const copy = ADMIN_DIR_COPY[isFr ? 'fr' : 'en'];

  return (
    <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-4">
      <h2 className="text-base font-extrabold text-[#082233] flex items-center gap-2">
        <Award className="w-5 h-5 text-[#8A672B]" />
        {`${copy.certTitlePrefix} (${certificates.length})`}
      </h2>
      <div className="space-y-2.5">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <div className="text-xs font-bold text-[#082233]">
                {cert.fullName} ({cert.id})
              </div>
              <div className="text-[11px] text-[#5F7383]">
                {copy.nationality}: {cert.nationality} • {copy.dob}:{' '}
                {cert.dateOfBirth.slice(0, 10)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={cert.isRevoked ? 'danger' : 'approved'}>
                {cert.isRevoked ? copy.revoked : copy.valid}
              </Badge>
              {!cert.isRevoked && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setConfirmDialog({
                      type: 'REVOKE_CERTIFICATE',
                      id: cert.id,
                      label: `${cert.fullName} (${cert.id})`,
                    })
                  }
                  className="text-xs text-red-600 border-red-200 gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {copy.revoke}
                </Button>
              )}
            </div>
          </div>
        ))}
        {certificates.length === 0 && (
          <p className="text-xs text-[#5F7383]">{copy.noCerts}</p>
        )}
      </div>
    </Card>
  );
}
