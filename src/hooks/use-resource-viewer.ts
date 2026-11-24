/**
 * Client state and side-effect hook module for use resource viewer.
 * Coordinates API requests, live state synchronization, and UI callback handlers.
 * @module hooks/use-resource-viewer
 * @exports useResourceViewer
 */

import * as React from "react";
import type { IslamicResource } from "@/lib/db/types";
import {
  DETAILED_RESOURCES,
  getResourceDetailsById,
  getResourceDetailsBySlug,
} from "@/lib/resources/resource-details";

/**
 * Manages modal focus trap, audio playback state, and resource detail lookup.
 */
export function useResourceViewer(
  resource: IslamicResource | null,
  isOpen: boolean,
  onClose: () => void,
  language: "en" | "fr"
) {
  const isFr = language === 'fr';
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Focus trap & Escape key navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;

    /**
     * Queries all currently visible, enabled focusable elements inside the open modal dialog.
     * @returns Ordered array of focusable HTML elements for keyboard focus trapping.
     */
    function getFocusableElements(): HTMLElement[] {
      if (!modalRef.current) return [];
      const focusableSelector =
        'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';
      return Array.from(modalRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => el.offsetParent !== null && !el.hasAttribute('disabled')
      );
    }

    // Initial focus on mount
    const timer = setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 50);

    /**
     * Executes handle key down logic.
     * @param e - E value (`KeyboardEvent`).
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const elements = getFocusableElements();
        if (elements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !modalRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !modalRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const detail =
    (resource &&
      (getResourceDetailsById(resource.id) ||
        getResourceDetailsBySlug(resource.mediaUrl))) ||
    DETAILED_RESOURCES['res-1'];

  const title = isFr ? detail.titleFr : detail.titleEn;
  const subtitle = isFr ? detail.subtitleFr : detail.subtitleEn;
  const author = isFr ? detail.authorFr : detail.authorEn;
  const keyTakeaways = isFr ? detail.keyTakeawaysFr : detail.keyTakeawaysEn;

  /**
   * Executes toggle play audio logic.
   */
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  /**
   * Executes handle time update logic.
   */
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  /**
   * Executes handle seek logic.
   * @param e - E value (`React.ChangeEvent<HTMLInputElement>`).
   */
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  /**
   * Executes handle restart audio logic.
   */
  const handleRestartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  /**
   * Executes handle copy link logic.
   */
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/resources?open=${resource?.id || ''}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  /**
   * Executes handle print logic.
   */
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  /**
   * Executes format audio time logic.
   * @param sec - Sec value (`number`).
   */
  const formatAudioTime = (sec: number) => {
    if (isNaN(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isMuted,
    setIsMuted,
    copiedLink,
    setCopiedLink,
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
  };
}
