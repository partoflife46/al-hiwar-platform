/**
 * Pure domain types, validation rules, and record builders for `ChatServiceImpl`.
 * Keeps consultation state mutations in `chat-service.ts` concise and easy to audit.
 */

import {
  ok,
  err,
  type Result,
  type Conversation,
  type Message,
  type PredefinedMessage,
  type User,
  type ConsultationIntent,
  type SupportedLanguage,
} from '@/lib/db/types';

/** Machine-readable error codes returned by consultation and messaging operations. */
export type ChatErrorCode =
  | 'CONVERSATION_ALREADY_CLAIMED'
  | 'CONVERSATION_NOT_FOUND'
  | 'UNAUTHORIZED_SENDER'
  | 'INVALID_MESSAGE'
  | 'USER_NOT_FOUND';

/** Structured domain error returned by `ChatService` operations. */
export interface ChatError {
  code: ChatErrorCode;
  message: string;
}

/** Input payload for posting a text, voice, or predefined-template chat message. */
export interface SendMessageInput {
  /** conversation id property. */
  conversationId: string;
  /** sender id property. */
  senderId: string;
  /** content property. */
  content: string;
  /** Optional predefined reply id property. */
  predefinedReplyId?: string | null;
  /** Optional has voice note property. */
  hasVoiceNote?: boolean;
  /** Optional audio url property. */
  audioUrl?: string | null;
  /** Optional message type property. */
  messageType?: 'TEXT' | 'INTENT_PROMPT' | 'INTENT_CHOICE';
  /** Optional selected intent property. */
  selectedIntent?: ConsultationIntent | null;
}

/** Privacy-filtered conversation projection visible to Dialogists (first name only). */
export interface DialogistConversationView extends Conversation {
  seekerFirstName: string;
  seekerPreferredLanguage: SupportedLanguage;
}

/**
 * Builds a fresh queued consultation record for a seeker.
 * @param seekerId - Authenticated seeker user identifier.
 * @param intent - Initial consultation intent (`LEARN_ABOUT_ISLAM` or `EMBRACE_ISLAM`).
 * @param language - Preferred dialogue language (`en` or `fr`).
 * @returns Newly initialized `Conversation` entity record.
 */
export function buildConversationRecord(
  seekerId: string,
  intent: ConsultationIntent,
  language: SupportedLanguage
): Conversation {
  const now = new Date().toISOString();
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    nonMuslimId: seekerId,
    dialogistId: null,
    language,
    intent,
    status: 'QUEUED',
    isAssigned: false,
    inactivityNoticeSent: false,
    lastMessageAt: now,
    createdAt: now,
  };
}

/**
 * Computes remaining milliseconds before the 120-second specialist inactivity notice fires.
 * @param createdAt - ISO timestamp when the consultation was opened.
 * @param customDelayMs - Optional explicit delay override used by tests.
 * @returns Non-negative timeout duration in milliseconds.
 */
export function computeWatchdogDelayMs(createdAt: string, customDelayMs?: number): number {
  if (customDelayMs !== undefined) return customDelayMs;
  const elapsedMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
  return Math.max(0, 120_000 - elapsedMs);
}

/**
 * Verifies that a user is a qualified Dialogist and the consultation is claimable.
 * @param conversation - Target consultation record.
 * @param dialogist - Candidate specialist user record, if found.
 * @param dialogistId - Identifier of the claiming specialist.
 * @returns `ChatError` when claiming is disallowed, or `null` when permitted.
 */
export function validateClaimEligibility(
  conversation: Conversation,
  dialogist: User | undefined,
  dialogistId: string
): ChatError | null {
  if (!dialogist || dialogist.role !== 'DIALOGIST') {
    return {
      code: 'UNAUTHORIZED_SENDER',
      message: 'Only qualified dialogists can claim conversations',
    };
  }
  const claimedByOther =
    conversation.isAssigned &&
    conversation.dialogistId !== null &&
    conversation.dialogistId !== dialogistId;

  if (claimedByOther) {
    return {
      code: 'CONVERSATION_ALREADY_CLAIMED',
      message: 'This conversation has already been claimed by another dialogist.',
    };
  }
  return null;
}

/**
 * Resolves and validates final message text, expanding approved predefined templates when used.
 * @param params - Outgoing message payload.
 * @param conversation - Active consultation providing the target language.
 * @param templates - Store collection of predefined reply templates.
 * @returns Trimmed text content wrapped in `Result`, or an `INVALID_MESSAGE` error.
 */
export function resolveMessageText(
  params: SendMessageInput,
  conversation: Conversation,
  templates: PredefinedMessage[]
): Result<string, ChatError> {
  let finalContent = params.content || '';
  if (params.predefinedReplyId) {
    const tpl = templates.find((p) => p.id === params.predefinedReplyId);
    if (!tpl || !tpl.isApproved) {
      return err({
        code: 'INVALID_MESSAGE',
        message: 'Predefined message template not found or not approved',
      });
    }
    if (!finalContent.trim()) {
      finalContent = conversation.language === 'fr' ? tpl.bodyFr : tpl.bodyEn;
    }
  }
  if (!finalContent.trim() && !params.hasVoiceNote && !params.predefinedReplyId) {
    return err({ code: 'INVALID_MESSAGE', message: 'Message content cannot be empty' });
  }
  return ok(finalContent.trim());
}

/**
 * Constructs a persisted `Message` record from validated send parameters.
 * @param conversationId - Identifier of the target consultation.
 * @param params - Original send payload carrying optional media and intent metadata.
 * @param content - Validated and trimmed message text.
 * @returns Newly constructed `Message` record with current ISO timestamp.
 */
export function buildMessageRecord(
  conversationId: string,
  params: SendMessageInput,
  content: string
): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversationId,
    senderId: params.senderId,
    content,
    predefinedReplyId: params.predefinedReplyId || null,
    hasVoiceNote: Boolean(params.hasVoiceNote),
    audioUrl: params.audioUrl || null,
    ...(params.messageType ? { messageType: params.messageType } : {}),
    ...(params.selectedIntent ? { selectedIntent: params.selectedIntent } : {}),
    sentAt: new Date().toISOString(),
  };
}

/**
 * Checks whether a manual inactivity check immediately followed an auto-timer firing (<= 50 ms)
 * so callers receive the freshly emitted system notice without duplicating it.
 * @param conversation - Conversation carrying optional internal `_autoTimerFiredAt` marker.
 * @param messages - All stored messages to locate the emitted system notice.
 * @param isAutoTimer - True when invoked directly by the background timer callback.
 * @returns Replay result with the previously emitted system notice when within the window.
 */
export function checkAutoTimerReplay(
  conversation: Conversation,
  messages: Message[],
  isAutoTimer: boolean
): { notified: boolean; message?: Message } {
  const tracked = conversation as unknown as { _autoTimerFiredAt?: number };
  if (!isAutoTimer && tracked._autoTimerFiredAt && Date.now() - tracked._autoTimerFiredAt <= 50) {
    delete tracked._autoTimerFiredAt;
    const lastMsg = messages
      .slice()
      .reverse()
      .find((m) => m.conversationId === conversation.id && m.senderId === 'system');
    return { notified: true, message: lastMsg };
  }
  return { notified: false };
}

/**
 * Determines whether any human specialist (non-seeker, non-system) has replied in a consultation.
 * @param conversation - Consultation being evaluated.
 * @param messages - Store message array.
 * @returns True when at least one specialist reply exists.
 */
export function hasSpecialistReply(conversation: Conversation, messages: Message[]): boolean {
  return messages.some(
    (m) =>
      m.conversationId === conversation.id &&
      m.senderId !== conversation.nonMuslimId &&
      m.senderId !== 'system'
  );
}

/**
 * Projects a consultation for Dialogist views by exposing only the seeker's first name.
 * @param conversation - Raw consultation record.
 * @param seeker - Seeker user record if resolved from the store.
 * @returns Sanitized `DialogistConversationView` excluding surname, email, and phone.
 */
export function projectConversationForDialogist(
  conversation: Conversation,
  seeker: User | undefined
): DialogistConversationView {
  return {
    ...conversation,
    seekerFirstName: seeker ? seeker.firstName : 'Seeker',
    seekerPreferredLanguage: conversation.language,
  };
}
