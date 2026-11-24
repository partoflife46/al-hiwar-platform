/**
 * Module architecture and API reference for `src/app/api/chat/stream/sse-dispatcher.ts`.
 *
 * Exported symbols:
 * - `SseSendFn` (TypeAlias): sse send fn definition.
 * - `getInactivityNoticeCopy` (Function): get inactivity notice copy definition.
 * - `encodeSseFrame` (Function): encode sse frame definition.
 * - `dispatchChatBusEvent` (Function): dispatch chat bus event definition.
 *
 * Internal dependencies:
 * - `@/lib/services/chat-event-bus`
 * - `@/lib/db/types`
 *
 * @module app/api/chat/stream/sse-dispatcher
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * SSE frame formatting and ChatEventBus event dispatching helpers for `/api/chat/stream`.
 */

import type { ChatEvent } from '@/lib/services/chat-event-bus';
import type { SupportedLanguage } from '@/lib/db/types';

/**
 * Type alias representing sse send fn.
 */
export type SseSendFn = (eventName: string, data: unknown, id?: string) => void;

/**
 * Constant definition for inactivity copy.
 */
const INACTIVITY_COPY: Record<SupportedLanguage, string> = {
  en: 'All specialists are currently engaged. Your chat remains open and a specialist will join shortly.',
  fr: 'Tous nos spécialistes sont actuellement en consultation. Votre salon reste ouvert et un spécialiste vous rejoindra dans les plus brefs délais.',
};

/** Returns the localized 120-second specialist wait notice message. */
export function getInactivityNoticeCopy(language: SupportedLanguage): string {
  return INACTIVITY_COPY[language] || INACTIVITY_COPY.en;
}

/** Encodes an SSE event frame as UTF-8 bytes. */
export function encodeSseFrame(
  encoder: TextEncoder,
  eventName: string,
  data: unknown,
  id?: string
): Uint8Array {
  const idPrefix = id ? `id: ${id}\n` : '';
  return encoder.encode(
    `${idPrefix}event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
  );
}

/** Emits secondary Shahadah SSE notifications when system validation messages arrive. */
function emitShahadahSignalsFromMessage(
  conversationId: string,
  content: string | undefined,
  sendEvent: SseSendFn
) {
  if (!content) return;
  if (content.includes('officially validated') || content.includes('validée')) {
    sendEvent('shahadah_validated', { conversationId, message: content });
  } else if (
    content.includes('requires a retake') ||
    content.includes('nécessite une reprise')
  ) {
    sendEvent('shahadah_retake_requested', {
      conversationId,
      feedbackNotes: content,
    });
  }
}

/** Dispatches a single ChatEventBus event onto an open SSE response stream. */
export function dispatchChatBusEvent(event: ChatEvent, sendEvent: SseSendFn) {
  switch (event.type) {
    case 'message':
      sendEvent('message', event.message, event.message.id);
      emitShahadahSignalsFromMessage(
        event.conversationId,
        event.message.content,
        sendEvent
      );
      return;
    case 'inactivity_warning':
      sendEvent('inactivity_warning', {
        conversationId: event.conversationId,
        message: event.message,
        timestamp: event.timestamp,
      });
      return;
    case 'conversation_claimed':
      sendEvent('conversation_claimed', {
        conversationId: event.conversationId,
        dialogistId: event.dialogistId,
      });
      return;
    case 'conversation_reassigned':
      sendEvent('conversation_reassigned', {
        conversationId: event.conversationId,
        targetDialogistId: event.targetDialogistId,
      });
      return;
    case 'queue_updated':
      sendEvent('queue_updated', { conversationId: event.conversationId });
      return;
    case 'shahadah_validated':
      sendEvent('shahadah_validated', {
        conversationId: event.conversationId,
        submissionId: event.submissionId,
      });
      return;
    case 'shahadah_retake_requested':
      sendEvent('shahadah_retake_requested', {
        conversationId: event.conversationId,
        feedbackNotes: event.feedbackNotes,
      });
  }
}
