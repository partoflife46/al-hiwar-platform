/**
 * Module architecture and API reference for `src/hooks/chat/use-chat-stream.ts`.
 *
 * Exported symbols:
 * - `useChatEventStream` (Function): use chat event stream definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `./chat-window-helpers`
 *
 * @module hooks/chat/use-chat-stream
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Live Server-Sent Events subscription hook for a single chat conversation.
 */

import * as React from 'react';
import type { Conversation, Message } from '@/lib/db/types';
import {
  appendUniqueMessage,
  CHAT_WINDOW_COPY,
  isValidationMessage,
} from './chat-window-helpers';

/**
 * Type contract defining use chat event stream options.
 * Includes fields/members: conversationId, isFrRef, onShahadahValidatedRef, setMessages,
 * setCurrentConversation, setCustomInactivityNotice.
 */
interface UseChatEventStreamOptions {
  /** conversation id property. */
  conversationId: string;
  /** is fr ref property. */
  isFrRef: React.MutableRefObject<boolean>;
  /** on shahadah validated ref property. */
  onShahadahValidatedRef: React.MutableRefObject<(() => void) | undefined>;
  /** set messages property. */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  /** set current conversation property. */
  setCurrentConversation: React.Dispatch<React.SetStateAction<Conversation>>;
  /** set custom inactivity notice property. */
  setCustomInactivityNotice: React.Dispatch<React.SetStateAction<string | null>>;
}

/** Subscribes to `/api/chat/stream` for real-time messages, claims, and inactivity warnings. */
export function useChatEventStream({
  conversationId,
  isFrRef,
  onShahadahValidatedRef,
  setMessages,
  setCurrentConversation,
  setCustomInactivityNotice,
}: UseChatEventStreamOptions) {
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const EventSourceCtor = window.EventSource || (globalThis as any).EventSource;
    if (!EventSourceCtor) return;

    const eventSource = new EventSourceCtor(
      `/api/chat/stream?conversationId=${conversationId}`
    );

    eventSource.addEventListener('message', (event: any) => {
      try {
        const msg: Message = JSON.parse(event.data);
        setMessages((prev) => appendUniqueMessage(prev, msg));
        if (msg.messageType === 'INTENT_CHOICE' && msg.selectedIntent) {
          setCurrentConversation((prev) =>
            prev.intent === msg.selectedIntent
              ? prev
              : { ...prev, intent: msg.selectedIntent! }
          );
        }
        if (isValidationMessage(msg.content) && onShahadahValidatedRef.current) {
          onShahadahValidatedRef.current();
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    });

    eventSource.addEventListener('inactivity_warning', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        setCustomInactivityNotice(data.message);
      } catch {
        setCustomInactivityNotice(
          CHAT_WINDOW_COPY[isFrRef.current ? 'fr' : 'en'].inactivity
        );
      }
    });

    eventSource.addEventListener('conversation_claimed', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        setCurrentConversation((prev) => ({
          ...prev,
          isAssigned: true,
          dialogistId: data.dialogistId,
          status: 'ACTIVE',
        }));
      } catch (err) {
        console.error('Failed to parse claim event:', err);
      }
    });

    return () => eventSource.close();
  }, [
    conversationId,
    isFrRef,
    onShahadahValidatedRef,
    setMessages,
    setCurrentConversation,
    setCustomInactivityNotice,
  ]);
}
