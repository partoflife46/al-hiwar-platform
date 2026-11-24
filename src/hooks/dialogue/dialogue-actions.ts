/**
 * Module architecture and API reference for `src/hooks/dialogue/dialogue-actions.ts`.
 *
 * Exported symbols:
 * - `RecordingUploadPayload` (Interface): recording upload payload definition.
 * - `startDialogueSession` (Function): start dialogue session definition.
 * - `selectDialogueIntent` (Function): select dialogue intent definition.
 * - `claimDialogueConversation` (Function): claim dialogue conversation definition.
 * - `uploadShahadahRecording` (Function): upload shahadah recording definition.
 * - `reassignDialogueConversation` (Function): reassign dialogue conversation definition.
 * - `submitConversionProfile` (Function): submit conversion profile definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/services/chat-service`
 *
 * @module hooks/dialogue/dialogue-actions
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Mutation helpers for initiating, claiming, reassigning dialogues and submitting Shahadah artifacts.
 */

import type {
  ConsultationIntent,
  Conversation,
  Gender,
  SupportedLanguage,
  UserSession,
} from '@/lib/db/types';
import { db } from '@/lib/db/in-memory-adapter';
import { chatService } from '@/lib/services/chat-service';

/**
 * Constant definition for action copy.
 */
const ACTION_COPY = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    uploadFailed: 'Recording upload failed:',
    uploadNetErr: 'Network error uploading recording:',
    profileFailed: 'Failed to submit conversion profile.',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    uploadFailed: 'Échec de l’envoi audio :',
    uploadNetErr: 'Erreur réseau lors de l’envoi audio :',
    profileFailed: 'Échec de l’enregistrement du profil post-conversion.',
  },
} as const;

/**
 * Type contract defining recording upload payload.
 * Includes fields/members: conversationId, seekerId, audioDataUrl, mimeType,
 * durationSeconds.
 */
export interface RecordingUploadPayload {
  /** conversation id property. */
  conversationId: string;
  /** seeker id property. */
  seekerId: string;
  /** audio data url property. */
  audioDataUrl: string;
  /** mime type property. */
  mimeType: string;
  /** duration seconds property. */
  durationSeconds: number;
}

/** Sends a JSON POST request and returns status + parsed payload. */
async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { ok: res.ok, json };
}

/** Syncs newly returned messages and conversation into the client in-memory adapter. */
function syncInitiatedRecord(conv: Conversation, messages?: any[]) {
  if (Array.isArray(messages)) {
    for (const msg of messages) {
      if (!db.messages.some((m) => m.id === msg.id)) db.messages.push(msg);
    }
  }
  if (!db.conversations.some((c) => c.id === conv.id)) {
    db.conversations.push(conv);
  }
}

/** Starts a new seeker consultation with the two-choice intent prompt. */
export async function startDialogueSession(
  userId: string,
  preferredLang: SupportedLanguage
): Promise<Conversation> {
  try {
    const { ok, json } = await postJson('/api/chat/initiate', {
      nonMuslimId: userId,
      language: preferredLang,
      includeIntentPrompt: true,
    });
    if (ok && json.ok && json.data) {
      syncInitiatedRecord(json.data, json.messages);
      return json.data;
    }
  } catch (err) {
    console.error('Failed to start dialogue:', err);
  }
  return chatService.initiateConsultation(userId, 'LEARN_ABOUT_ISLAM', preferredLang, {
    includeIntentPrompt: true,
  });
}

/** Initiates a consultation using an explicit triage intent and language. */
export async function selectDialogueIntent(
  userId: string,
  intent: ConsultationIntent,
  language: SupportedLanguage
): Promise<Conversation> {
  try {
    const { ok, json } = await postJson('/api/chat/initiate', {
      nonMuslimId: userId,
      intent,
      language,
    });
    if (ok && json.ok && json.data) {
      syncInitiatedRecord(json.data);
      return json.data;
    }
  } catch (err) {
    console.error('Failed to initiate consultation:', err);
  }
  return chatService.initiateConsultation(userId, intent, language);
}

/** Claims an unanswered consultation from the specialist queue. */
export async function claimDialogueConversation(
  conversationId: string
): Promise<Conversation | null> {
  try {
    const { ok, json } = await postJson('/api/chat/claim', { conversationId });
    return ok && json.ok && json.data ? json.data : null;
  } catch (err) {
    console.error('Failed to claim conversation:', err);
    return null;
  }
}

/** Uploads a Shahadah audio recording and alerts on failure. */
export async function uploadShahadahRecording(
  payload: RecordingUploadPayload,
  isFr: boolean
): Promise<boolean> {
  const copy = ACTION_COPY[isFr ? 'fr' : 'en'];
  try {
    const { ok, json } = await postJson('/api/shahadah/upload', {
      ...payload,
      audioRecordingUrl: payload.audioDataUrl,
    });
    if (ok && json.ok) return true;
    alert(`${copy.uploadFailed} ${json.message || json.error}`);
    return false;
  } catch (err: any) {
    alert(`${copy.uploadNetErr} ${err?.message}`);
    return false;
  }
}

/** Reassigns a conversation to another Dialogist or back to the open queue. */
export async function reassignDialogueConversation(
  actorId: string,
  conversationId: string,
  newDialogistId: string
): Promise<Conversation | null> {
  try {
    const { ok, json } = await postJson('/api/staff', {
      action: 'REASSIGN_CONVERSATION',
      conversationId,
      targetDialogistId: newDialogistId,
    });
    if (ok && json.ok && json.data) return json.data;
    const fallback = await chatService.reassignConversation(
      actorId,
      conversationId,
      newDialogistId
    );
    return fallback.ok ? fallback.data : null;
  } catch (err) {
    console.error('Failed to reassign conversation:', err);
    return null;
  }
}

/** Submits mandatory post-Shahadah demographic profile fields to promote the seeker. */
export async function submitConversionProfile(
  seekerId: string,
  profileData: { nationality: string; gender: Gender; phoneNumber: string },
  isFr: boolean
): Promise<UserSession> {
  const copy = ACTION_COPY[isFr ? 'fr' : 'en'];
  const { ok, json } = await postJson('/api/shahadah/profile', {
    seekerId,
    ...profileData,
  });
  if (!ok || !json.ok) {
    throw new Error(json.message || copy.profileFailed);
  }
  return json.data;
}
