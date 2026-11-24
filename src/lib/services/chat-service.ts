/**
 * Module architecture and API reference for `src/lib/services/chat-service.ts`.
 *
 * Exported symbols:
 * - `ChatService` (Interface): chat service definition.
 * - `ChatServiceImpl` (Class): chat service impl definition.
 * - `chatService` (Const): chat service definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/db/types`
 * - `./chat-event-bus`
 * - `@/lib/domain`
 * - `./chat-templates`
 * - `./chat-helpers`
 *
 * @module lib/services/chat-service
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Consultation orchestration service managing 1-to-1 private seeker dialogues,
 * exclusive Dialogist queue claiming, real-time SSE fan-out, and the 120s watchdog.
 */

import { db as defaultDb, type InMemoryDatabaseAdapter } from '@/lib/db/in-memory-adapter';
import {
  ok,
  err,
  type Result,
  type Conversation,
  type Message,
  type ConsultationIntent,
  type SupportedLanguage,
} from '@/lib/db/types';
import { chatEventBus, type ChatEventBus } from './chat-event-bus';
import { Dialogist as DialogistEntity, hydrateConversation } from '@/lib/domain';
import { buildIntentPromptMessage, buildInactivityNoticeMessage } from './chat-templates';
import {
  buildConversationRecord,
  buildMessageRecord,
  checkAutoTimerReplay,
  computeWatchdogDelayMs,
  hasSpecialistReply,
  projectConversationForDialogist,
  resolveMessageText,
  validateClaimEligibility,
  type ChatError,
  type ChatErrorCode,
  type DialogistConversationView,
  type SendMessageInput,
} from './chat-helpers';

export type { ChatErrorCode, ChatError, SendMessageInput, DialogistConversationView };

/** Contract governing private consultation lifecycle, messaging, and 120s inactivity watchdog. */
export interface ChatService {
  initiateConsultation(
    seekerId: string,
    intent: ConsultationIntent,
    language?: SupportedLanguage,
    options?: { includeIntentPrompt?: boolean }
  ): Promise<Conversation>;
  getUnansweredQueue(): Promise<Conversation[]>;
  claimConversation(
    dialogistId: string,
    conversationId: string
  ): Promise<Result<Conversation, ChatError>>;
  sendMessage(params: SendMessageInput): Promise<Result<Message, ChatError>>;
  reassignConversation(
    supervisorId: string,
    conversationId: string,
    targetDialogistId: string
  ): Promise<Result<Conversation, ChatError>>;
  checkInactivityTimeout(
    conversationId: string,
    elapsedSeconds?: number,
    options?: { checkClaimed?: boolean; autoTimer?: boolean }
  ): Promise<{ notified: boolean; message?: Message }>;
  triggerInactivityChecks(options?: {
    checkClaimed?: boolean;
  }): Promise<{ notifiedConversationIds: string[] }>;
  sanitizeForDialogist(conversation: Conversation): DialogistConversationView;
  scheduleInactivityWatchdog(conversationId: string, customDelayMs?: number): void;
  cancelInactivityWatchdog(conversationId: string): void;
  startWatchdogWorker(intervalMs?: number): void;
  stopWatchdogWorker(): void;
  clearAllWatchdogTimers(): void;
}

/**
 * Orchestrates 1-to-1 private seeker consultations, exclusive Dialogist claiming,
 * SSE real-time fan-out, and the 120-second specialist unavailability watchdog.
 */
export class ChatServiceImpl implements ChatService {
  private readonly store: InMemoryDatabaseAdapter;
  private readonly events: ChatEventBus;
  private readonly watchdogTimers: Map<string, NodeJS.Timeout> = new Map();
  private watchdogWorkerInterval: NodeJS.Timeout | null = null;

  /**
   * Initializes the consultation service with injectable persistence and event bus adapters.
   * @param store - In-memory database adapter instance.
   * @param events - Real-time SSE pub/sub event bus.
   */
  constructor(
    store: InMemoryDatabaseAdapter = defaultDb,
    events: ChatEventBus = chatEventBus
  ) {
    this.store = store;
    this.events = events;
  }

  /** Schedules a 120-second inactivity timer for an unanswered consultation. */
  scheduleInactivityWatchdog(conversationId: string, customDelayMs?: number): void {
    const conv = this.store.conversations.find((c) => c.id === conversationId);
    if (!conv || conv.inactivityNoticeSent || conv.status === 'CLOSED') return;

    this.cancelInactivityWatchdog(conversationId);
    const delayMs = computeWatchdogDelayMs(conv.createdAt, customDelayMs);
    const timer = setTimeout(async () => {
      try {
        await this.checkInactivityTimeout(conversationId, undefined, {
          checkClaimed: true,
          autoTimer: true,
        });
      } catch (e) {
        console.error(`[Watchdog] Timer failed for ${conversationId}:`, e);
      } finally {
        this.watchdogTimers.delete(conversationId);
      }
    }, delayMs);

    if (typeof timer.unref === 'function') timer.unref();
    this.watchdogTimers.set(conversationId, timer);
  }

  /** Cancels any pending inactivity timer for a conversation. */
  cancelInactivityWatchdog(conversationId: string): void {
    const timer = this.watchdogTimers.get(conversationId);
    if (timer) {
      clearTimeout(timer);
      this.watchdogTimers.delete(conversationId);
    }
  }

  /** Starts the periodic background watchdog sweep across queued conversations. */
  startWatchdogWorker(intervalMs = 5000): void {
    if (this.watchdogWorkerInterval) return;
    this.watchdogWorkerInterval = setInterval(async () => {
      try {
        await this.triggerInactivityChecks({ checkClaimed: true });
      } catch {
        // background worker continues on transient errors
      }
    }, intervalMs);
    if (typeof this.watchdogWorkerInterval.unref === 'function') {
      this.watchdogWorkerInterval.unref();
    }
  }

  /** Stops the periodic background watchdog sweep. */
  stopWatchdogWorker(): void {
    if (this.watchdogWorkerInterval) {
      clearInterval(this.watchdogWorkerInterval);
      this.watchdogWorkerInterval = null;
    }
  }

  /** Clears all per-conversation timers and halts the background worker. */
  clearAllWatchdogTimers(): void {
    for (const [, timer] of this.watchdogTimers.entries()) clearTimeout(timer);
    this.watchdogTimers.clear();
    this.stopWatchdogWorker();
  }

  /** Opens or resumes a seeker's active private consultation session. */
  async initiateConsultation(
    seekerId: string,
    intent: ConsultationIntent,
    language?: SupportedLanguage,
    options?: { includeIntentPrompt?: boolean }
  ): Promise<Conversation> {
    const seeker = this.store.findUserById(seekerId);
    const existing = this.store.conversations.find(
      (c) => c.nonMuslimId === seekerId && (c.status === 'QUEUED' || c.status === 'ACTIVE')
    );

    if (existing) {
      this.ensureIntentPromptIfNeeded(
        existing,
        existing.language || seeker?.preferredLanguage || 'en',
        Boolean(options?.includeIntentPrompt)
      );
      return existing;
    }

    const lang = language || seeker?.preferredLanguage || 'en';
    const conversation = buildConversationRecord(seekerId, intent, lang);
    this.store.conversations.push(conversation);
    this.scheduleInactivityWatchdog(conversation.id);

    if (options?.includeIntentPrompt) {
      const promptMsg = buildIntentPromptMessage(conversation.id, lang);
      this.store.messages.push(promptMsg);
      this.events.publish(conversation.id, {
        type: 'message',
        conversationId: conversation.id,
        message: promptMsg,
      });
    }

    this.events.publish(conversation.id, {
      type: 'queue_updated',
      conversationId: conversation.id,
    });
    this.store.save();
    return conversation;
  }

  /** Returns unassigned queued conversations ordered oldest-first. */
  async getUnansweredQueue(): Promise<Conversation[]> {
    return this.store.conversations
      .filter((c) => hydrateConversation(c).viewUnansweredQuestions())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /** Exclusively assigns an unanswered conversation to a qualified Dialogist. */
  async claimConversation(
    dialogistId: string,
    conversationId: string
  ): Promise<Result<Conversation, ChatError>> {
    const conv = this.store.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      return err({ code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' });
    }

    const dialogist = this.store.findUserById(dialogistId);
    const claimErr = validateClaimEligibility(conv, dialogist, dialogistId);
    if (claimErr) return err(claimErr);

    const updated = new DialogistEntity(dialogist!).acceptConversation(hydrateConversation(conv));
    Object.assign(conv, updated.toRecord());
    this.cancelInactivityWatchdog(conversationId);
    this.events.publish(conversationId, {
      type: 'conversation_claimed',
      conversationId,
      dialogistId,
    });
    this.store.save();
    return ok(conv);
  }

  /** Validates sender authorization, resolves templates, persists, and streams a chat message. */
  async sendMessage(params: SendMessageInput): Promise<Result<Message, ChatError>> {
    const conv = this.store.conversations.find((c) => c.id === params.conversationId);
    if (!conv) {
      return err({ code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' });
    }

    const sender = this.store.findUserById(params.senderId);
    const isSeeker = conv.nonMuslimId === params.senderId;
    const isAssigned = conv.dialogistId === params.senderId;

    if (!isSeeker && !isAssigned) {
      if (!conv.isAssigned && sender?.role === 'DIALOGIST') {
        Object.assign(conv, { isAssigned: true, dialogistId: sender.id, status: 'ACTIVE' });
      } else {
        return err({
          code: 'UNAUTHORIZED_SENDER',
          message: 'You are not authorized to send messages in this conversation',
        });
      }
    }

    const contentRes = resolveMessageText(params, conv, this.store.predefinedMessages);
    if (!contentRes.ok) return contentRes;

    if (
      isSeeker &&
      (params.selectedIntent === 'LEARN_ABOUT_ISLAM' ||
        params.selectedIntent === 'EMBRACE_ISLAM')
    ) {
      conv.intent = params.selectedIntent;
      this.events.publish(conv.id, { type: 'queue_updated', conversationId: conv.id });
    }

    const message = buildMessageRecord(conv.id, params, contentRes.data);
    this.store.messages.push(message);
    conv.lastMessageAt = message.sentAt;
    this.syncWatchdogAfterMessage(conv, isSeeker, isAssigned || sender?.role === 'DIALOGIST');
    this.events.publish(conv.id, { type: 'message', conversationId: conv.id, message });
    this.store.save();
    return ok(message);
  }

  /** Reassigns an active consultation to another Dialogist or back to the shared queue. */
  async reassignConversation(
    supervisorId: string,
    conversationId: string,
    targetDialogistId: string
  ): Promise<Result<Conversation, ChatError>> {
    const supervisor = this.store.findUserById(supervisorId);
    if (!supervisor || !['SUPERVISOR', 'ADMINISTRATOR'].includes(supervisor.role)) {
      return err({
        code: 'UNAUTHORIZED_SENDER',
        message: 'Only supervisors and administrators can reassign consultations',
      });
    }

    const conv = this.store.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      return err({ code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' });
    }

    if (targetDialogistId === 'QUEUE') {
      Object.assign(conv, { dialogistId: null, isAssigned: false, status: 'QUEUED' });
    } else {
      const target = this.store.findUserById(targetDialogistId);
      if (!target || target.role !== 'DIALOGIST') {
        return err({ code: 'USER_NOT_FOUND', message: 'Target dialogist account not found' });
      }
      Object.assign(conv, { dialogistId: targetDialogistId, isAssigned: true, status: 'ACTIVE' });
    }

    conv.lastMessageAt = new Date().toISOString();
    this.store.save();
    this.events.publish(conversationId, {
      type: 'conversation_reassigned',
      conversationId,
      targetDialogistId,
    });
    return ok(conv);
  }

  /** Evaluates the 120-second specialist inactivity rule and emits an automated notice if exceeded. */
  async checkInactivityTimeout(
    conversationId: string,
    elapsedSeconds?: number,
    options?: { checkClaimed?: boolean; autoTimer?: boolean }
  ): Promise<{ notified: boolean; message?: Message }> {
    const conv = this.store.conversations.find((c) => c.id === conversationId);
    if (!conv || conv.status === 'CLOSED') return { notified: false };

    if (conv.inactivityNoticeSent) {
      return checkAutoTimerReplay(conv, this.store.messages, Boolean(options?.autoTimer));
    }
    if (!options?.checkClaimed && (conv.isAssigned || conv.status !== 'QUEUED')) {
      return { notified: false };
    }
    if (options?.checkClaimed && hasSpecialistReply(conv, this.store.messages)) {
      return { notified: false };
    }

    const elapsed =
      elapsedSeconds ?? (Date.now() - new Date(conv.createdAt).getTime()) / 1000;
    if (elapsed < 120) return { notified: false };

    conv.inactivityNoticeSent = true;
    if (options?.autoTimer) {
      (conv as unknown as { _autoTimerFiredAt?: number })._autoTimerFiredAt = Date.now();
    }
    this.cancelInactivityWatchdog(conv.id);

    const sysMsg = buildInactivityNoticeMessage(conv.id, conv.language);
    this.store.messages.push(sysMsg);
    conv.lastMessageAt = sysMsg.sentAt;
    this.events.publish(conv.id, {
      type: 'inactivity_warning',
      conversationId: conv.id,
      message: sysMsg.content,
      timestamp: sysMsg.sentAt,
    });
    this.events.publish(conv.id, { type: 'message', conversationId: conv.id, message: sysMsg });
    return { notified: true, message: sysMsg };
  }

  /** Sweeps pending consultations and dispatches inactivity notices for those past 120 seconds. */
  async triggerInactivityChecks(options?: {
    checkClaimed?: boolean;
  }): Promise<{ notifiedConversationIds: string[] }> {
    const pending = this.store.conversations.filter(
      (c) =>
        !c.inactivityNoticeSent &&
        (options?.checkClaimed ? c.status !== 'CLOSED' : !c.isAssigned && c.status === 'QUEUED')
    );
    const notifiedConversationIds: string[] = [];
    for (const conv of pending) {
      const res = await this.checkInactivityTimeout(conv.id, undefined, options);
      if (res.notified) notifiedConversationIds.push(conv.id);
    }
    return { notifiedConversationIds };
  }

  /** Strips private surname/contact details when projecting a conversation to a Dialogist. */
  sanitizeForDialogist(conversation: Conversation): DialogistConversationView {
    return projectConversationForDialogist(
      conversation,
      this.store.findUserById(conversation.nonMuslimId)
    );
  }

  /** Inserts an initial intent triage prompt if the existing consultation lacks one. */
  private ensureIntentPromptIfNeeded(
    existing: Conversation,
    lang: SupportedLanguage,
    includeIntentPrompt: boolean
  ): void {
    if (!includeIntentPrompt) return;
    const hasPrompt = this.store.messages.some(
      (m) => m.conversationId === existing.id && m.messageType === 'INTENT_PROMPT'
    );
    if (!hasPrompt) {
      this.store.messages.push(buildIntentPromptMessage(existing.id, lang));
      this.store.save();
    }
  }

  /** Cancels or arms the inactivity watchdog depending on who sent the latest message. */
  private syncWatchdogAfterMessage(
    conversation: Conversation,
    isSeeker: boolean,
    isDialogistSender: boolean
  ): void {
    if (isDialogistSender) this.cancelInactivityWatchdog(conversation.id);
    else if (isSeeker && !conversation.inactivityNoticeSent) {
      this.scheduleInactivityWatchdog(conversation.id);
    }
  }
}

/**
 * Constant definition for chat service.
 */
export const chatService: ChatService = new ChatServiceImpl();

// Auto-start background watchdog worker in non-test server environments (FR 26 & NFR 18)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  chatService.startWatchdogWorker(5000);
}
