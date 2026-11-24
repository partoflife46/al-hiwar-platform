/**
 * Interactive audio player, multimedia production notices, and scholarly sections for resources.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/resources/resource-media-banner.tsx`.
 *
 * Exported symbols:
 * - `ResourceMediaSection` (Function): resource media section definition.
 * - `ResourceArticleSections` (Function): resource article sections definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/badge`
 * - `./resource-viewer-copy`
 *
 * @module components/resources/resource-media-banner
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { ResourceType, SupportedLanguage } from '@/lib/db/types';
import { Badge } from '@/components/ui/badge';
import {
  Pause,
  Play,
  RotateCcw,
  Video,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { RESOURCE_VIEWER_COPY } from './resource-viewer-copy';

/**
 * Type contract defining resource media section props.
 */
interface ResourceMediaSectionProps {
  /** resource type property. */
  resourceType: ResourceType;
  /** Optional audio sample url property. */
  audioSampleUrl?: string;
  /** language property. */
  language: SupportedLanguage;
  /** is playing property. */
  isPlaying: boolean;
  /** current time property. */
  currentTime: number;
  /** duration property. */
  duration: number;
  /** is muted property. */
  isMuted: boolean;
  /** format audio time property. */
  formatAudioTime: (seconds: number) => string;
  /** on toggle play property. */
  onTogglePlay: () => void;
  /** on seek property. */
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** on restart property. */
  onRestart: () => void;
  /** on toggle mute property. */
  onToggleMute: () => void;
}

/** Renders either the interactive audio player or production notice for audio/video items. */
export function ResourceMediaSection(props: ResourceMediaSectionProps) {
  const {
    resourceType,
    audioSampleUrl,
    language,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    formatAudioTime,
    onTogglePlay,
    onSeek,
    onRestart,
    onToggleMute,
  } = props;
  const copy = RESOURCE_VIEWER_COPY[language];

  if (resourceType === 'AUDIO' && audioSampleUrl) {
    return (
      <div className="rounded-2xl border border-[#006C9C]/20 bg-gradient-to-r from-[#006C9C]/5 via-[#006C9C]/10 to-[#BC9C5C]/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#006C9C] flex items-center gap-1.5 uppercase tracking-wider">
            <Volume2 className="w-4 h-4" />
            {copy.audioPlayerHeading}
          </span>
          <span className="text-xs font-mono text-[#5F7383]">
            {formatAudioTime(currentTime)} / {formatAudioTime(duration || 180)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 180}
          value={currentTime}
          onChange={onSeek}
          className="w-full h-2 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#006C9C]"
        />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className="w-11 h-11 rounded-full bg-[#006C9C] hover:bg-[#005072] text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <button
              onClick={onRestart}
              className="p-2.5 rounded-full bg-white hover:bg-[#F1F5F9] text-[#5F7383] border border-[#CBD5E1] transition-colors"
              title={copy.restartTitle}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="p-2 text-[#5F7383] hover:text-[#082233]"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume1 className="w-4 h-4" />
              )}
            </button>
            <span className="text-xs font-semibold text-[#0D7A5F] hidden sm:inline">
              {copy.authenticRecitation}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (resourceType === 'AUDIO') {
    return (
      <div className="rounded-2xl border border-[#006C9C]/30 bg-[#F0F9FF] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#006C9C] font-bold text-xs uppercase tracking-wider">
            <Volume2 className="w-4 h-4 text-[#006C9C]" />
            <span>{copy.audioProdTitle}</span>
          </div>
          <Badge variant="gold" className="text-[11px] font-mono">
            {copy.audioComingSoon}
          </Badge>
        </div>
        <p className="text-xs text-[#5F7383] leading-relaxed">
          {copy.audioProdDesc}
        </p>
      </div>
    );
  }

  if (resourceType === 'VIDEO') {
    return (
      <div className="rounded-2xl border border-[#BC9C5C]/40 bg-[#FFFDF5] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#8A672B] font-bold text-xs uppercase tracking-wider">
            <Video className="w-4 h-4 text-[#8A672B]" />
            <span>{copy.videoProdTitle}</span>
          </div>
          <Badge variant="gold" className="text-[11px] font-mono">
            {copy.videoComingSoon}
          </Badge>
        </div>
        <p className="text-xs text-[#5F7383] leading-relaxed">
          {copy.videoProdDesc}
        </p>
      </div>
    );
  }

  return null;
}

/**
 * Type contract defining article section item.
 * Includes fields/members: titleEn, titleFr, contentEn, contentFr, arabicQuote,
 * arabicTransliteration.
 */
interface ArticleSectionItem {
  /** title en property. */
  titleEn: string;
  /** title fr property. */
  titleFr: string;
  /** content en property. */
  contentEn: string[];
  /** content fr property. */
  contentFr: string[];
  /** Optional arabic quote property. */
  arabicQuote?: string;
  /** Optional arabic transliteration property. */
  arabicTransliteration?: string;
  /** Optional arabic translation en property. */
  arabicTranslationEn?: string;
  /** Optional arabic translation fr property. */
  arabicTranslationFr?: string;
}

/** Renders structured study sections with optional Arabic quotations and transliteration. */
export function ResourceArticleSections({
  sections,
  isFr,
}: {
  sections: ArticleSectionItem[];
  isFr: boolean;
}) {
  return (
    <div className="space-y-6 pt-2">
      {sections.map((section, idx) => {
        const secTitle = isFr ? section.titleFr : section.titleEn;
        const secContent = isFr ? section.contentFr : section.contentEn;
        const arabicTrans = isFr
          ? section.arabicTranslationFr
          : section.arabicTranslationEn;

        return (
          <article key={idx} className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#082233] border-l-4 border-[#006C9C] pl-3 py-0.5">
              {secTitle}
            </h2>
            {section.arabicQuote && (
              <div className="my-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <p className="text-right font-arabic text-base sm:text-lg text-[#082233] leading-loose">
                  {section.arabicQuote}
                </p>
                {section.arabicTransliteration && (
                  <p className="text-xs font-semibold text-[#8C6D32] italic border-t border-[#E2E8F0] pt-2">
                    {section.arabicTransliteration}
                  </p>
                )}
                {arabicTrans && (
                  <p
                    className={`text-xs text-[#5F7383] italic ${
                      section.arabicTransliteration
                        ? 'pt-0.5'
                        : 'border-t border-[#E2E8F0] pt-2'
                    }`}
                  >
                    {arabicTrans}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2.5 text-xs sm:text-sm text-[#334155] leading-relaxed">
              {secContent.map((paragraph, pIdx) => (
                <p key={pIdx}>{paragraph}</p>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
