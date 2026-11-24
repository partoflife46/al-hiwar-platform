/**
 * Live microphone waveform panel and fallback file-upload panel for Shahadah recording.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/audio/shahadah-mic-panel.tsx`.
 *
 * Exported symbols:
 * - `ShahadahMicPanel` (Function): shahadah mic panel definition.
 * - `ShahadahUploadPanel` (Function): shahadah upload panel definition.
 *
 * Internal dependencies:
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 * - `./shahadah-recorder-copy`
 *
 * @module components/audio/shahadah-mic-panel
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, RotateCcw, Square, Upload } from 'lucide-react';
import {
  RECORDER_BADGE_VARIANT,
  RECORDER_COPY,
  type RecorderBadgeState,
} from './shahadah-recorder-copy';

/**
 * Type contract defining live mic panel props.
 * Includes fields/members: isFr, status, formattedTime, waveformBars, audioUrl, onStart.
 */
interface LiveMicPanelProps {
  /** is fr property. */
  isFr: boolean;
  /** status property. */
  status: string;
  /** formatted time property. */
  formattedTime: string;
  /** waveform bars property. */
  waveformBars: number[];
  /** audio url property. */
  audioUrl: string | null;
  /** on start property. */
  onStart: () => void;
  /** on stop property. */
  onStop: () => void;
  /** on reset property. */
  onReset: () => void;
}

/** Normalizes recorder hook status into one of the three UI badge states. */
function normalizeBadgeState(status: string): RecorderBadgeState {
  if (status === 'recording') return 'recording';
  if (status === 'recorded') return 'recorded';
  return 'idle';
}

/** Renders the live microphone amplitude visualizer, timer, and recording controls. */
export function ShahadahMicPanel({
  isFr,
  status,
  formattedTime,
  waveformBars,
  audioUrl,
  onStart,
  onStop,
  onReset,
}: LiveMicPanelProps) {
  const copy = RECORDER_COPY[isFr ? 'fr' : 'en'];
  const badgeState = normalizeBadgeState(status);

  return (
    <div className="space-y-4">
      <div
        role="img"
        aria-label="Real-time voice amplitude visualizer"
        className="flex items-end justify-center gap-1.5 h-20 bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] overflow-hidden"
      >
        {waveformBars.map((amp, idx) => {
          const heightPercent = Math.max(8, Math.min(100, Math.round(amp * 100)));
          const barTone =
            status !== 'recording'
              ? 'bg-[#006C9C]/25'
              : amp > 0.6
                ? 'bg-gradient-to-t from-[#006C9C] to-[#BC9C5C]'
                : 'bg-[#006C9C]';
          return (
            <div
              key={idx}
              style={{ height: `${heightPercent}%` }}
              className={`w-2 rounded-full transition-[height,background-color] duration-75 ease-out ${barTone}`}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-mono tabular-nums text-base font-bold text-[#082233]">
          {formattedTime}
        </span>
        <Badge variant={RECORDER_BADGE_VARIANT[badgeState]} className="gap-1.5">
          {badgeState === 'recording' && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          {copy.statusLabels[badgeState]}
        </Badge>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        {status === 'idle' && (
          <Button variant="primary" onClick={onStart} className="gap-2 px-6 shadow-sm">
            <Mic className="w-4 h-4" />
            {copy.startBtn}
          </Button>
        )}
        {status === 'recording' && (
          <Button
            variant="destructive"
            onClick={onStop}
            className="gap-2 px-6 animate-pulse"
          >
            <Square className="w-4 h-4 fill-white" />
            {copy.stopBtn}
          </Button>
        )}
        {status === 'recorded' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            {audioUrl && (
              <audio controls src={audioUrl} className="h-10 w-full rounded-lg" />
            )}
            <Button
              variant="outline"
              onClick={onReset}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              {copy.rerecordBtn}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Type contract defining upload audio panel props.
 * Includes fields/members: isFr, status, audioUrl, fileInputRef, onFileChange, onReset.
 */
interface UploadAudioPanelProps {
  /** is fr property. */
  isFr: boolean;
  /** status property. */
  status: string;
  /** audio url property. */
  audioUrl: string | null;
  /** file input ref property. */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** on file change property. */
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** on reset property. */
  onReset: () => void;
}

/** Renders the audio file upload dropzone and preview player fallback. */
export function ShahadahUploadPanel({
  isFr,
  status,
  audioUrl,
  fileInputRef,
  onFileChange,
  onReset,
}: UploadAudioPanelProps) {
  const copy = RECORDER_COPY[isFr ? 'fr' : 'en'];

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.webm,.mp4,.aac,.wav,.m4a,.ogg,.mp3"
        className="hidden"
        onChange={onFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-[#CBD5E1] hover:border-[#006C9C] bg-[#F8FAFC] rounded-xl p-6 text-center cursor-pointer transition-colors space-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
      >
        <div className="mx-auto w-10 h-10 rounded-full bg-[#006C9C]/10 text-[#006C9C] flex items-center justify-center">
          <Upload className="w-5 h-5" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold text-[#082233]">{copy.dropPrompt}</p>
        <p className="text-[11px] text-[#5F7383]">{copy.formatsHint}</p>
      </button>

      {status === 'recorded' && audioUrl && (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#F8FAFC] p-3 rounded-lg border">
          <audio controls src={audioUrl} className="h-9 w-full" />
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-1.5 shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            {copy.changeFileBtn}
          </Button>
        </div>
      )}
    </div>
  );
}
