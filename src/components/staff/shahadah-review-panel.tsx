/**
 * Side-by-side Shahadah audio pronunciation review console for Dialogists and Supervisors.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/staff/shahadah-review-panel.tsx`.
 *
 * Exported symbols:
 * - `ShahadahReviewPanelProps` (Interface): shahadah review panel props definition.
 * - `ShahadahReviewPanel` (Function): shahadah review panel definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/services/shahadah-service`
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 * - `@/lib/context/language-context`
 * - `./shahadah-review-copy`
 *
 * @module components/staff/shahadah-review-panel
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { ShahadahSubmission } from '@/lib/db/types';
import type { ModelReferenceAudio } from '@/lib/services/shahadah-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/context/language-context';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck,
  RotateCcw,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import {
  resolveReviewAudioSrc,
  REVIEW_PANEL_COPY,
  REVIEW_STATUS_VARIANT,
} from './shahadah-review-copy';

/**
 * Type contract defining shahadah review panel props.
 * Includes fields/members: submission, seekerName, seekerLanguage, modelReference,
 * readOnly, onValidate.
 */
export interface ShahadahReviewPanelProps {
  /** submission property. */
  submission: ShahadahSubmission;
  /** seeker name property. */
  seekerName: string;
  /** Optional seeker language property. */
  seekerLanguage?: 'en' | 'fr';
  /** Optional model reference property. */
  modelReference?: ModelReferenceAudio | null;
  /** Optional read only property. */
  readOnly?: boolean;
  /** on validate property. */
  onValidate: (params: {
    submissionId: string;
    feedbackNotes?: string;
  }) => Promise<void>;
  /** on request retake property. */
  onRequestRetake: (params: {
    submissionId: string;
    feedbackNotes: string;
  }) => Promise<void>;
  /** Optional is processing property. */
  isProcessing?: boolean;
}

/** Displays candidate vs reference Shahadah audio players and review decision actions. */
export function ShahadahReviewPanel({
  submission,
  seekerName,
  modelReference,
  readOnly = false,
  onValidate,
  onRequestRetake,
  isProcessing = false,
}: ShahadahReviewPanelProps) {
  const { isFr } = useLanguage();
  const copy = REVIEW_PANEL_COPY[isFr ? 'fr' : 'en'];
  const locale = isFr ? 'fr-FR' : 'en-US';

  const [feedbackText, setFeedbackText] = React.useState(
    submission.feedbackNotes || ''
  );
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  const isValidated = submission.status === 'VALIDATED';
  const candidateAudioSrc = resolveReviewAudioSrc(submission.audioRecordingUrl);
  const referenceAudioSrc =
    modelReference?.audioUrl || '/audio/reference-shahadah-ar.wav';

  /**
   * Asynchronously executes handle validate logic.
   */
  const handleValidate = async () => {
    if (readOnly || isProcessing) return;
    setValidationError(null);
    await onValidate({
      submissionId: submission.id,
      feedbackNotes: feedbackText.trim() || undefined,
    });
  };

  /**
   * Asynchronously executes handle retake logic.
   */
  const handleRetake = async () => {
    if (readOnly || isProcessing) return;
    if (!feedbackText.trim()) {
      setValidationError(copy.errRetakeRequired);
      return;
    }
    setValidationError(null);
    await onRequestRetake({
      submissionId: submission.id,
      feedbackNotes: feedbackText.trim(),
    });
  };

  const submittedTime = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(submission.submittedAt));

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#082233]">{copy.heading}</h3>
            <Badge variant={REVIEW_STATUS_VARIANT[submission.status]}>
              {copy.statusLabels[submission.status]}
            </Badge>
          </div>
          <p className="text-xs text-[#5F7383]">
            {copy.candidateLabel}{' '}
            <span className="font-semibold text-[#082233]">{seekerName}</span> •{' '}
            {copy.durationLabel}: {submission.durationSeconds}s • Format:{' '}
            {submission.mimeType}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#5F7383]">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{submittedTime}</span>
        </div>
      </div>

      {readOnly && (
        <div className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600 border border-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#006C9C]" />
          <span>{copy.readOnlyBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#082233] flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[#006C9C]" />
              {copy.seekerVoiceTitle}
            </span>
            <Badge variant="secondary" className="text-[11px]">
              {copy.candidateBadge}
            </Badge>
          </div>
          <audio
            key={candidateAudioSrc}
            controls
            preload="metadata"
            src={candidateAudioSrc}
            className="w-full h-9"
          />
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#082233] flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[#BC9C5C]" />
              {copy.refTitle}
            </span>
            <Badge variant="gold" className="text-[11px]">
              {copy.refBadge}
            </Badge>
          </div>
          <audio
            key={referenceAudioSrc}
            controls
            preload="metadata"
            src={referenceAudioSrc}
            className="w-full h-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="review-feedback"
          className="block text-xs font-bold text-[#082233]"
        >
          {copy.guidanceLabel}
        </label>
        <textarea
          id="review-feedback"
          rows={3}
          value={feedbackText}
          onChange={(e) => {
            setFeedbackText(e.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={readOnly || isProcessing || isValidated}
          placeholder={copy.guidancePlaceholder}
          className={`w-full rounded-lg border bg-white text-[#082233] p-2.5 text-base sm:text-xs outline-transparent focus-visible:outline-none focus:ring-2 ${
            validationError
              ? 'border-red-500 focus:ring-red-500'
              : 'border-[#CBD5E1] focus:ring-[#006C9C]'
          } disabled:bg-slate-50 disabled:text-slate-500`}
        />
        {validationError && (
          <p
            role="alert"
            aria-live="polite"
            className="text-xs text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            {validationError}
          </p>
        )}
      </div>

      {!readOnly && (
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
          <Button
            type="button"
            variant="outline"
            onClick={handleRetake}
            disabled={isProcessing || isValidated}
            className="w-full sm:w-auto border-[#D97706] text-[#D97706] hover:bg-[#D97706]/10 gap-1.5 font-semibold text-xs"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {copy.requestRetakeBtn}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleValidate}
            disabled={isProcessing || isValidated}
            className="w-full sm:w-auto gap-1.5 font-semibold text-xs shadow-sm bg-[#0D7A5F] hover:bg-[#0A624C] text-white"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            {isValidated ? copy.validatedBtn : copy.validateBtn}
          </Button>
        </div>
      )}

      {isValidated && (
        <div className="rounded-lg bg-[#0D7A5F]/10 border border-[#0D7A5F]/30 p-3 text-xs text-[#0D7A5F] flex items-center gap-2 font-medium">
          <FileCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {copy.validatedBanner(
              new Intl.DateTimeFormat(locale).format(
                new Date(submission.validatedAt || Date.now())
              )
            )}
          </span>
        </div>
      )}
    </div>
  );
}
