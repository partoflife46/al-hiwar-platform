/**
 * Module architecture and API reference for `src/hooks/chat/chat-window-helpers.ts`.
 *
 * Exported symbols:
 * - `CHAT_WINDOW_COPY` (Const): chat window copy definition.
 * - `appendUniqueMessage` (Function): append unique message definition.
 * - `mergeIncomingMessages` (Function): merge incoming messages definition.
 * - `isValidationMessage` (Function): is validation message definition.
 * - `buildOptimisticMessage` (Function): build optimistic message definition.
 * - `syncLocalDbMessage` (Function): sync local db message definition.
 * - `fetchConversationSnapshot` (Function): fetch conversation snapshot definition.
 * - `postChatMessage` (Function): post chat message definition.
 * - `postInlineShahadahReview` (Function): post inline shahadah review definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/db/in-memory-adapter`
 *
 * @module hooks/chat/chat-window-helpers
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Helpers, bilingual copy, and API actions for the live chat window hook.
 */

import type {
  ConsultationIntent,
  Message,
  ShahadahSubmission,
} from '@/lib/db/types';
import { db } from '@/lib/db/in-memory-adapter';

/**
 * Constant definition for chat window copy.
 */
export const CHAT_WINDOW_COPY = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    inactivity:
      'All specialists are currently engaged. Your chat remains open and a specialist will join shortly.',
    validateNote: 'Mubarak! Clear and heartfelt pronunciation of the Shahadah.',
    retakeNote:
      'Please listen carefully to the authentic reference audio clip and record again.',
    intentLearn: 'I want to know more about Islam',
    intentEmbrace: 'I want to embrace Islam (Declare Shahadah)',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    inactivity:
      'Tous nos spécialistes sont actuellement en consultation. Votre salon reste ouvert et un spécialiste vous rejoindra dans les plus brefs délais.',
    validateNote: 'Mubarak ! Prononciation claire et sincère de la Chahada.',
    retakeNote:
      'Veuillez écouter attentivement l’enregistrement audio de référence et réenregistrer.',
    intentLearn: 'Je souhaite en savoir plus sur l’Islam',
    intentEmbrace: 'Je souhaite embrasser l’Islam (Déclarer la Shahadah)',
  },
} as const;

/** Appends a single message to state if its ID is not already present. */
export function appendUniqueMessage(prev: Message[], msg: Message): Message[] {
  return prev.some((m) => m.id === msg.id) ? prev : [...prev, msg];
}

/** Merges newly fetched messages into the existing list without changing reference when idle. */
export function mergeIncomingMessages(prev: Message[], incoming: Message[]): Message[] {
  const existingIds = new Set(prev.map((m) => m.id));
  const additions = incoming.filter((m) => !existingIds.has(m.id));
  return additions.length > 0 ? [...prev, ...additions] : prev;
}

/** Checks whether a message text announces official Shahadah validation. */
export function isValidationMessage(content?: string | null): boolean {
  if (!content) return false;
  return content.includes('officially validated') || content.includes('validée');
}

/** Creates an optimistic client-side message record when the API is unreachable. */
export function buildOptimisticMessage(
  conversationId: string,
  senderId: string,
  content: string
): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    conversationId,
    senderId,
    content,
    predefinedReplyId: null,
    hasVoiceNote: false,
    audioUrl: null,
    sentAt: new Date().toISOString(),
  };
}

/** Syncs a message into the in-memory client store if not already recorded. */
export function syncLocalDbMessage(msg: Message) {
  if (!db.messages.some((m) => m.id === msg.id)) {
    db.messages.push(msg);
  }
}

/** Fetches both messages and the latest Shahadah submission for a conversation. */
export async function fetchConversationSnapshot(conversationId: string): Promise<{
  messages: Message[] | null;
  submission: ShahadahSubmission | null;
}> {
  const [msgRes, shdRes] = await Promise.all([
    fetch(`/api/chat/messages?conversationId=${conversationId}`, { cache: 'no-store' }),
    fetch(`/api/shahadah/upload?conversationId=${conversationId}`, {
      cache: 'no-store',
    }).catch(() => null),
  ]);

  let submission: ShahadahSubmission | null = null;
  if (shdRes?.ok) {
    try {
      const shdJson = await shdRes.json();
      if (shdJson.ok && shdJson.data) submission = shdJson.data;
    } catch {
      // ignore malformed shahadah response
    }
  }

  let messages: Message[] | null = null;
  if (msgRes?.ok) {
    const json = await msgRes.json();
    if (json.ok && Array.isArray(json.data)) messages = json.data;
  }

  return { messages, submission };
}

/** Posts a chat message payload to `/api/chat/messages` and returns the created record. */
export async function postChatMessage(payload: {
  conversationId: string;
  senderId: string;
  content: string;
  predefinedReplyId?: string;
  messageType?: string;
  selectedIntent?: ConsultationIntent;
}): Promise<Message | null> {
  const res = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.ok && json.data ? json.data : null;
}

/** Submits an inline Dialogist Shahadah validation or retake review decision. */
export async function postInlineShahadahReview(params: {
  dialogistId: string;
  submissionId: string;
  decision: 'VALIDATE' | 'REQUEST_RETAKE';
  isFr: boolean;
}): Promise<boolean> {
  const copy = CHAT_WINDOW_COPY[params.isFr ? 'fr' : 'en'];
  const res = await fetch('/api/shahadah/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dialogistId: params.dialogistId,
      submissionId: params.submissionId,
      decision: params.decision,
      feedbackNotes:
        params.decision === 'VALIDATE' ? copy.validateNote : copy.retakeNote,
    }),
  });
  return res.ok;
}
