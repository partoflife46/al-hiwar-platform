/**
 * Human-in-the-loop Shahadah pronunciation audio review queue for Dialogists.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/staff/dialogist-shahadah-queue.tsx`.
 *
 * Exported symbols:
 * - `DialogistShahadahQueue` (Function): dialogist shahadah queue definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `./dialogist-copy`
 *
 * @module components/staff/dialogist-shahadah-queue
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { StaffPortalContext } from '@/hooks/use-staff-portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mic, XCircle } from 'lucide-react';
import {
  DIALOGIST_COPY,
  resolveDialogistAudioSrc,
  SUBMISSION_BADGE_VARIANT,
} from './dialogist-copy';

/** Renders pending and reviewed Shahadah audio submissions with validation controls. */
export function DialogistShahadahQueue({ ctx }: { ctx: StaffPortalContext }) {
  const { isFr, submissions, handleReviewShahadah } = ctx;
  const copy = DIALOGIST_COPY[isFr ? 'fr' : 'en'];

  return (
    <Card className="p-6 rounded-2xl border-2 border-[#BC9C5C]/40 bg-white space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#082233] flex items-center gap-2">
          <Mic className="w-5 h-5 text-[#8A672B]" />
          {`${copy.shahadahQueuePrefix} (${submissions.length})`}
        </h3>
        <Badge variant="gold" className="text-xs">
          {copy.humanVerification}
        </Badge>
      </div>

      <div className="space-y-3">
        {submissions.map((sub) => {
          const audioSrc = resolveDialogistAudioSrc(sub.audioRecordingUrl);
          return (
            <div
              key={sub.id}
              className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#082233]">
                    {copy.submissionLabel} {sub.id}
                  </span>
                  <Badge
                    variant={SUBMISSION_BADGE_VARIANT[sub.status]}
                    className="text-[11px]"
                  >
                    {copy.statusLabels[sub.status]}
                  </Badge>
                </div>
                <p className="text-xs text-[#5F7383]">
                  {copy.durationLabel}: {sub.durationSeconds}s • Format: {sub.mimeType}
                </p>
                <audio
                  key={`${sub.id}-${audioSrc}`}
                  controls
                  preload="metadata"
                  src={audioSrc}
                  className="h-9 w-64 mt-1"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleReviewShahadah(sub.id, 'REQUEST_RETAKE')}
                  className="text-xs border-[#D97706] text-[#D97706] gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {copy.retakeBtn}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleReviewShahadah(sub.id, 'VALIDATE')}
                  className="text-xs bg-[#0D7A5F] hover:bg-[#095c47] gap-1 font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {copy.validateBtn}
                </Button>
              </div>
            </div>
          );
        })}
        {submissions.length === 0 && (
          <p className="text-xs text-[#5F7383]">{copy.noSubmissions}</p>
        )}
      </div>
    </Card>
  );
}
