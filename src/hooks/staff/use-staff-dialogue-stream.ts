/**
 * Module architecture and API reference for `src/hooks/staff/use-staff-dialogue-stream.ts`.
 *
 * Exported symbols:
 * - `useStaffDialogueStream` (Function): use staff dialogue stream definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/db/types`
 *
 * @module hooks/staff/use-staff-dialogue-stream
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Live polling and SSE stream hook for the selected Staff Portal conversation.
 */

import * as React from 'react';
import { db } from '@/lib/db/in-memory-adapter';
import type { Message } from '@/lib/db/types';

/** Appends a message to state only if its ID is not already present. */
function appendUniqueMessage(prev: Message[], msg: Message): Message[] {
  return prev.some((m) => m.id === msg.id) ? prev : [...prev, msg];
}

/** Subscribes to live messages for the selected conversation when permitted. */
export function useStaffDialogueStream(
  selectedConvId: string | null,
  canAccessDialogueStream: boolean
) {
  const [activeMessages, setActiveMessages] = React.useState<Message[]>([]);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (!selectedConvId || !canAccessDialogueStream) {
      setActiveMessages([]);
      return;
    }

    let isSubscribed = true;

    /**
     * Asynchronously executes load conv messages logic.
     * @returns Promise resolving once the operation completes.
     */
    async function loadConvMessages() {
      try {
        const res = await fetch(
          `/api/chat/messages?conversationId=${selectedConvId}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.ok && Array.isArray(json.data) && isSubscribed) {
            setActiveMessages(json.data);
          }
        }
      } catch {
        const fallback = db.messages.filter(
          (m) => m.conversationId === selectedConvId
        );
        if (isSubscribed) setActiveMessages(fallback);
      }
    }

    loadConvMessages();
    const pollMsgTimer = setInterval(loadConvMessages, 2000);

    const EventSourceCtor =
      typeof window !== 'undefined'
        ? window.EventSource || (globalThis as any).EventSource
        : null;
    const es = EventSourceCtor
      ? new EventSourceCtor(`/api/chat/stream?conversationId=${selectedConvId}`)
      : null;

    if (es) {
      es.addEventListener('message', (event: any) => {
        try {
          const msg: Message = JSON.parse(event.data);
          setActiveMessages((prev) => appendUniqueMessage(prev, msg));
        } catch {
          // ignore malformed event payload
        }
      });
    }

    return () => {
      isSubscribed = false;
      clearInterval(pollMsgTimer);
      if (es) es.close();
    };
  }, [selectedConvId, canAccessDialogueStream]);

  return { activeMessages, setActiveMessages };
}
