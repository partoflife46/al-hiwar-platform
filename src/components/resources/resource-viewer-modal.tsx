/**
 * Accessible full-text and multimedia modal reader for Islamic Library resources.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/resources/resource-viewer-modal.tsx`.
 *
 * Exported symbols:
 * - `ResourceViewerModal` (Function): resource viewer modal definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/hooks/use-resource-viewer`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `./resource-viewer-copy`
 * - `./resource-media-banner`
 *
 * @module components/resources/resource-viewer-modal
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { IslamicResource, ResourceType } from '@/lib/db/types';
import { useResourceViewer } from '@/hooks/use-resource-viewer';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  Share2,
  ShieldCheck,
  Sparkles,
  Video,
  Volume2,
  X,
} from 'lucide-react';
import { RESOURCE_VIEWER_COPY } from './resource-viewer-copy';
import {
  ResourceArticleSections,
  ResourceMediaSection,
} from './resource-media-banner';

/**
 * Type contract defining resource viewer modal props.
 * Includes fields/members: resource, isOpen, onClose, language.
 */
interface ResourceViewerModalProps {
  /** resource property. */
  resource: IslamicResource | null;
  /** is open property. */
  isOpen: boolean;
  /** on close property. */
  onClose: () => void;
  /** language property. */
  language: 'en' | 'fr';
}

/**
 * Constant definition for type icons.
 */
const TYPE_ICONS: Record<ResourceType, React.ComponentType<{ className?: string }>> = {
  PDF: BookOpen,
  AUDIO: Volume2,
  VIDEO: Video,
  TEXT: FileText,
};

/** Displays a scholarly resource dialog with print/share actions, audio player, and sections. */
export function ResourceViewerModal({
  resource,
  isOpen,
  onClose,
  language,
}: ResourceViewerModalProps) {
  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    isMuted,
    setIsMuted,
    copiedLink,
    isFr,
    modalRef,
    audioRef,
    detail,
    title,
    subtitle,
    author,
    keyTakeaways,
    togglePlayAudio,
    handleTimeUpdate,
    handleSeek,
    handleRestartAudio,
    handleCopyLink,
    handlePrint,
    formatAudioTime,
  } = useResourceViewer(resource, isOpen, onClose, language);

  if (!isOpen || !resource) return null;

  const copy = RESOURCE_VIEWER_COPY[language];
  const TypeIcon = TYPE_ICONS[resource.resourceType] || FileText;

  /**
   * Executes handle toggle mute logic.
   */
  const handleToggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 !m-0 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/65 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 outline-none"
    >
      {resource.resourceType === 'AUDIO' && detail.audioSampleUrl && (
        <audio
          ref={audioRef}
          src={detail.audioSampleUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-[#CBD5E1] overflow-hidden">
        <div className="flex-none px-6 py-4 bg-gradient-to-r from-[#082233] via-[#005072] to-[#006C9C] text-white flex items-center justify-between gap-4 border-b border-[#005072]">
          <div className="flex items-center gap-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
              <span className="text-sm font-arabic tracking-wide text-[#BC9C5C]">
                بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </span>
              <span className="text-[11px] font-sans italic text-white/75">
                (Bismillāhir-Raḥmānir-Raḥīm)
              </span>
            </div>
            <span className="hidden sm:inline-block text-xs text-white/50">•</span>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/80 font-mono">
              <ShieldCheck className="w-4 h-4 text-[#BC9C5C]" />
              <span>{copy.libraryBrand}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title={copy.copyLinkTitle}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors text-xs flex items-center gap-1"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden md:inline">
                {copiedLink ? copy.copied : copy.share}
              </span>
            </button>
            <button
              onClick={handlePrint}
              title={copy.printTitle}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors text-xs flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">{copy.print}</span>
            </button>
            <button
              onClick={onClose}
              aria-label={copy.closeAria}
              className="p-2 rounded-xl bg-white/15 hover:bg-red-500/80 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 sm:py-8 space-y-6">
          <div className="space-y-3 border-b border-[#E2E8F0] pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" className="text-xs">
                {resource.category}
              </Badge>
              <Badge variant="gold" className="text-xs font-mono gap-1">
                <TypeIcon className="w-3 h-3" />
                {resource.resourceType}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-[#5F7383] font-mono">
                <Clock className="w-3.5 h-3.5" />
                {detail.readingDuration}
              </span>
              <span className="text-xs text-[#0D7A5F] font-semibold flex items-center gap-1 ml-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {copy.verifiedCouncil}
              </span>
            </div>

            <h1
              id="resource-modal-title"
              className="text-xl sm:text-2xl font-bold text-[#082233] leading-snug"
            >
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-[#5F7383] font-medium leading-relaxed">
              {subtitle}
            </p>
            <div className="text-[11px] text-[#5F7383] flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 font-mono">
              <span>{author}</span>
              <span>•</span>
              <span>{detail.publishedDate}</span>
              <span>•</span>
              <span className="text-[#006C9C]">{detail.citationSource}</span>
            </div>
          </div>

          <ResourceMediaSection
            resourceType={resource.resourceType}
            audioSampleUrl={detail.audioSampleUrl}
            language={language}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            isMuted={isMuted}
            formatAudioTime={formatAudioTime}
            onTogglePlay={togglePlayAudio}
            onSeek={handleSeek}
            onRestart={handleRestartAudio}
            onToggleMute={handleToggleMute}
          />

          {keyTakeaways && keyTakeaways.length > 0 && (
            <div className="rounded-2xl border border-[#0D7A5F]/20 bg-[#E6F4F0] p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#0D7A5F] font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>{copy.keyTakeawaysTitle}</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-[#082233]">
                {keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0D7A5F] mt-0.5 flex-none" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ResourceArticleSections sections={detail.sections} isFr={isFr} />

          <div className="pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5F7383]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0D7A5F]" />
              <span>{copy.authorizedFooter}</span>
            </div>
            <span className="font-mono text-[11px] text-[#006C9C]">
              Al-Hiwar Platform • Ver. 2025
            </span>
          </div>
        </div>

        <div className="flex-none px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className={buttonVariants({
              variant: 'outline',
              className: 'gap-1.5 text-xs font-semibold border-[#CBD5E1]',
            })}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{copy.printPdfBtn}</span>
          </button>
          <button
            onClick={onClose}
            className={buttonVariants({
              variant: 'primary',
              className: 'text-xs font-semibold px-6',
            })}
          >
            {copy.closeReaderBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
