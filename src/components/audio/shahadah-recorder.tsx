/**
 * Guided Shahadah declaration audio recorder with Arabic script, retake guidance, and upload fallback.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/audio/shahadah-recorder.tsx`.
 *
 * Exported symbols:
 * - `ShahadahRecorderProps` (Interface): shahadah recorder props definition.
 * - `ShahadahRecorder` (Function): shahadah recorder definition.
 *
 * Internal dependencies:
 * - `@/lib/services/shahadah-service`
 * - `@/hooks/use-audio-recorder`
 * - `@/lib/context/language-context`
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 * - `./shahadah-recorder-copy`
 * - `./shahadah-mic-panel`
 *
 * @module components/audio/shahadah-recorder
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { ModelReferenceAudio } from '@/lib/services/shahadah-service';
import {
  convertBlobToPlayableDataUrl,
  useAudioRecorder,
} from '@/hooks/use-audio-recorder';
import { useLanguage } from '@/lib/context/language-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  Mic,
  Sparkles,
  Upload,
  Volume2,
} from 'lucide-react';
import { RECORDER_COPY } from './shahadah-recorder-copy';
import { ShahadahMicPanel, ShahadahUploadPanel } from './shahadah-mic-panel';

/**
 * Type contract defining shahadah recorder props.
 * Includes fields/members: conversationId, seekerId, language, retakeFeedback,
 * modelReference, onSubmit.
 */
export interface ShahadahRecorderProps {
  /** conversation id property. */
  conversationId: string;
  /** seeker id property. */
  seekerId: string;
  /** Optional language property. */
  language?: 'en' | 'fr';
  /** Optional retake feedback property. */
  retakeFeedback?: string | null;
  /** Optional model reference property. */
  modelReference?: ModelReferenceAudio | null;
  /** on submit property. */
  onSubmit: (payload: {
    conversationId: string;
    seekerId: string;
    audioDataUrl: string;
    mimeType: string;
    durationSeconds: number;
  }) => Promise<void>;
  /** Optional on cancel property. */
  onCancel?: () => void;
  /** Optional is submitting property. */
  isSubmitting?: boolean;
}

/** Renders the bilingual Shahadah testimony recorder with live waveform and upload tabs. */
export function ShahadahRecorder({
  conversationId,
  seekerId,
  language = 'en',
  retakeFeedback,
  modelReference,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ShahadahRecorderProps) {
  const { language: globalLang } = useLanguage();
  const isFr = globalLang === 'fr' || language === 'fr';
  const copy = RECORDER_COPY[isFr ? 'fr' : 'en'];

  const [activeTab, setActiveTab] = React.useState<'mic' | 'upload'>('mic');
  const [isPreparingAudio, setIsPreparingAudio] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const recorder = useAudioRecorder({ maxDurationSeconds: 120, fftSize: 64 });

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (recorder.fallbackActive) setActiveTab('upload');
  }, [recorder.fallbackActive]);

  /** Handles handle file change interaction. */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await recorder.handleFileUpload(file);
  };

  /**
   * Asynchronously executes handle submit logic.
   */
  const handleSubmit = async () => {
    const hasAudio = Boolean(
      recorder.audioBase64 || recorder.audioUrl || recorder.audioBlob
    );
    if (
      !hasAudio ||
      recorder.status !== 'recorded' ||
      isSubmitting ||
      isPreparingAudio
    ) {
      return;
    }

    let finalDataUrl = recorder.audioBase64 || recorder.audioUrl || '';
    let finalMime = recorder.mimeType;

    if (
      recorder.audioBlob &&
      (!recorder.audioBase64 || !recorder.audioBase64.startsWith('data:'))
    ) {
      setIsPreparingAudio(true);
      try {
        const converted = await convertBlobToPlayableDataUrl(recorder.audioBlob);
        if (converted) {
          finalDataUrl = converted.dataUrl;
          finalMime = converted.mimeType;
        }
      } finally {
        setIsPreparingAudio(false);
      }
    }

    await onSubmit({
      conversationId,
      seekerId,
      audioDataUrl: finalDataUrl,
      mimeType: finalMime,
      durationSeconds: Math.max(3, recorder.recordingTime),
    });
  };

  /**
   * Executes tab class logic.
   * @param tab - Tab value (`'mic' | 'upload'`).
   */
  const tabClass = (tab: 'mic' | 'upload') =>
    `flex-1 py-2 text-xs font-semibold rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] flex items-center justify-center gap-2 ${
      activeTab === tab
        ? 'bg-white text-[#006C9C] shadow-sm'
        : 'text-[#5F7383] hover:text-[#082233]'
    }`;

  const busy = isSubmitting || isPreparingAudio;

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-md space-y-6 max-w-2xl mx-auto">
      <div className="rounded-xl bg-gradient-to-br from-[#082233] to-[#005072] p-6 text-white shadow-inner space-y-5 text-center">
        <Badge
          variant="gold-glow"
          className="text-xs uppercase tracking-wider font-semibold"
        >
          {copy.badge}
        </Badge>
        <p
          className="text-2xl sm:text-3xl font-arabic leading-[2.1] pt-1 text-[#D8BC7C]"
          dir="rtl"
          lang="ar"
        >
          أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا
          رَسُولُ ٱللَّٰهِ
        </p>
        <p className="text-sm font-medium italic text-slate-200">
          &quot;Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan
          Rasulullah&quot;
        </p>
        <p className="text-xs text-slate-50 max-w-lg mx-auto">
          {copy.translation}
        </p>
      </div>

      {retakeFeedback && (
        <div
          role="alert"
          className="rounded-xl border border-[#D97706]/40 bg-[#D97706]/10 p-4 text-[#D97706] space-y-3"
        >
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0" />
            <span>{copy.retakeHeading}</span>
          </div>
          <p className="text-xs italic bg-white/80 p-2.5 rounded-lg border border-[#D97706]/20 text-[#082233]">
            &quot;{retakeFeedback}&quot;
          </p>
          {modelReference?.audioUrl && (
            <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <span className="font-medium text-[#082233] flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#006C9C]" />
                {copy.modelAudioPrompt}
              </span>
              <audio
                controls
                src={modelReference.audioUrl}
                className="h-8 max-w-full sm:max-w-xs"
                preload="none"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex rounded-lg bg-[#F8FAFC] p-1 border border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => setActiveTab('mic')}
          className={tabClass('mic')}
        >
          <Mic className="w-4 h-4" aria-hidden="true" />
          {copy.liveMicTab}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={tabClass('upload')}
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          {copy.uploadTab}
        </button>
      </div>

      {activeTab === 'mic' ? (
        <ShahadahMicPanel
          isFr={isFr}
          status={recorder.status}
          formattedTime={recorder.formattedTime}
          waveformBars={recorder.waveformBars}
          audioUrl={recorder.audioUrl}
          onStart={recorder.startRecording}
          onStop={recorder.stopRecording}
          onReset={recorder.resetRecording}
        />
      ) : (
        <ShahadahUploadPanel
          isFr={isFr}
          status={recorder.status}
          audioUrl={recorder.audioUrl}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          onReset={recorder.resetRecording}
        />
      )}

      {recorder.errorMessage && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{recorder.errorMessage}</span>
        </div>
      )}

      <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button
          type="button"
          variant="accent"
          size="sm"
          onClick={() =>
            recorder.setSampleAudio('/audio/sample-shahadah-jean-luc.webm', 18)
          }
          className="gap-1.5 text-xs font-medium"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {copy.demoSampleBtn}
        </Button>
        <div className="flex items-center gap-2 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={busy}
            >
              {copy.cancelBtn}
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={recorder.status !== 'recorded' || busy}
            className="gap-1.5 font-semibold shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            {busy ? copy.submittingBtn : copy.submitBtn}
          </Button>
        </div>
      </div>
    </div>
  );
}
