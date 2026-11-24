/**
 * Live Server-Sent Events hook for Shahadah validation and retake updates.
 */

import * as React from 'react';

/**
 * Constant definition for retake fallback.
 */
const RETAKE_FALLBACK = {
  en: 'Please practice and record again.',
  fr: 'Veuillez pratiquer et enregistrer à nouveau.',
} as const;

/**
 * Type contract defining shahadah stream options.
 * Includes fields/members: activeConvId, isFrRef, currentUserRoleRef, onValidated,
 * onRetakeFeedback.
 */
interface ShahadahStreamOptions {
  /** Optional active conv id property. */
  activeConvId?: string;
  /** is fr ref property. */
  isFrRef: React.MutableRefObject<boolean>;
  /** current user role ref property. */
  currentUserRoleRef: React.MutableRefObject<string | null>;
  /** on validated property. */
  onValidated: () => void;
  /** on retake feedback property. */
  onRetakeFeedback: (note: string) => void;
}

/** Checks whether a streamed system message announces Shahadah validation. */
function isValidationContent(content: unknown): boolean {
  if (typeof content !== 'string') return false;
  return content.includes('officially validated') || content.includes('validée');
}

/** Subscribes to `/api/chat/stream` for live Shahadah status transitions. */
export function useDialogueShahadahStream({
  activeConvId,
  isFrRef,
  currentUserRoleRef,
  onValidated,
  onRetakeFeedback,
}: ShahadahStreamOptions) {
  React.useEffect(() => {
    if (!activeConvId || typeof window === 'undefined') return;
    const EventSourceCtor = window.EventSource || (globalThis as any).EventSource;
    if (!EventSourceCtor) return;

    const es = new EventSourceCtor(`/api/chat/stream?conversationId=${activeConvId}`);

    /**
     * Executes trigger validation logic.
     */
    const triggerValidation = () => {
      onValidated();
      if (currentUserRoleRef.current === 'NON_MUSLIM') {
        // Handled by caller callback to keep state transitions unified
      }
    };

    es.addEventListener('shahadah_validated', triggerValidation);

    es.addEventListener('shahadah_retake_requested', (event: any) => {
      const fallback = RETAKE_FALLBACK[isFrRef.current ? 'fr' : 'en'];
      try {
        const data = JSON.parse(event.data);
        onRetakeFeedback(data.feedbackNotes || fallback);
      } catch {
        onRetakeFeedback(fallback);
      }
    });

    es.addEventListener('message', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (isValidationContent(data.content)) {
          onValidated();
        }
      } catch {
        // ignore malformed frames
      }
    });

    return () => es.close();
  }, [activeConvId, isFrRef, currentUserRoleRef, onValidated, onRetakeFeedback]);
}
