/**
 * Application service module implementing chat event bus business rules.
 * Coordinates domain invariants, persistence updates, and structured Result responses.
 * @module lib/services/chat-event-bus
 * @exports ChatEventType, ChatMessageEvent, ChatShahadahValidatedEvent,
 *   ChatShahadahRetakeEvent, ChatInactivityWarningEvent, ChatClaimEvent
 */

import { EventEmitter } from 'events';
import type { Message } from '@/lib/db/types';

/**
 * Type alias representing chat event type.
 */
export type ChatEventType =
  | 'message'
  | 'inactivity_warning'
  | 'conversation_claimed'
  | 'conversation_reassigned'
  | 'queue_updated'
  | 'shahadah_validated'
  | 'shahadah_retake_requested';

/**
 * Type contract defining chat message event.
 * Includes fields/members: type, conversationId, message.
 */
export interface ChatMessageEvent {
  type: 'message';
  conversationId: string;
  message: Message;
}

/**
 * Type contract defining chat shahadah validated event.
 * Includes fields/members: type, conversationId, submissionId.
 */
export interface ChatShahadahValidatedEvent {
  type: 'shahadah_validated';
  conversationId: string;
  submissionId: string;
}

/**
 * Type contract defining chat shahadah retake event.
 * Includes fields/members: type, conversationId, feedbackNotes.
 */
export interface ChatShahadahRetakeEvent {
  type: 'shahadah_retake_requested';
  conversationId: string;
  feedbackNotes?: string;
}

/**
 * Type contract defining chat inactivity warning event.
 * Includes fields/members: type, conversationId, message, timestamp.
 */
export interface ChatInactivityWarningEvent {
  /** type property. */
  type: 'inactivity_warning';
  /** conversation id property. */
  conversationId: string;
  /** message property. */
  message: string;
  /** timestamp property. */
  timestamp: string;
}

/**
 * Type contract defining chat claim event.
 * Includes fields/members: type, conversationId, dialogistId.
 */
export interface ChatClaimEvent {
  type: 'conversation_claimed';
  conversationId: string;
  dialogistId: string;
}

/**
 * Type contract defining chat reassign event.
 * Includes fields/members: type, conversationId, targetDialogistId.
 */
export interface ChatReassignEvent {
  type: 'conversation_reassigned';
  conversationId: string;
  targetDialogistId: string;
}

/**
 * Type contract defining chat queue updated event.
 * Includes fields/members: type, conversationId.
 */
export interface ChatQueueUpdatedEvent {
  type: 'queue_updated';
  conversationId: string;
}

/**
 * Type alias representing chat event.
 */
export type ChatEvent =
  | ChatMessageEvent
  | ChatInactivityWarningEvent
  | ChatClaimEvent
  | ChatReassignEvent
  | ChatQueueUpdatedEvent
  | ChatShahadahValidatedEvent
  | ChatShahadahRetakeEvent;

declare global {
  // eslint-disable-next-line no-var
  var __alHiwarChatEventBus: ChatEventBus | undefined;
}

/**
 * Class defining chat event bus.
 * Includes fields/members: emitter, publish, subscribe, subscribeAll, reset.
 */
export class ChatEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  /**
   * Publishes an event to all subscribers listening to a specific conversationId.
   */
  publish(conversationId: string, event: ChatEvent): void {
    this.emitter.emit(`chat:${conversationId}`, event);
    this.emitter.emit('chat:*', event);
  }

  /**
   * Subscribes to events for a specific conversationId.
   * Returns an unsubscribe function for clean resource disposal.
   */
  subscribe(conversationId: string, listener: (event: ChatEvent) => void): () => void {
    const channel = `chat:${conversationId}`;
    this.emitter.on(channel, listener);
    return () => {
      this.emitter.off(channel, listener);
    };
  }

  /**
   * Subscribes to all chat events platform-wide (used for supervisor audit & queue watchers).
   */
  subscribeAll(listener: (event: ChatEvent) => void): () => void {
    this.emitter.on('chat:*', listener);
    return () => {
      this.emitter.off('chat:*', listener);
    };
  }

  /**
   * Resets all listeners (used in beforeEach in automated test suites).
   */
  reset(): void {
    this.emitter.removeAllListeners();
  }
}

/**
 * Executes get chat event bus logic.
 * @returns Value of type `ChatEventBus`.
 */
export function getChatEventBus(): ChatEventBus {
  if (!globalThis.__alHiwarChatEventBus) {
    globalThis.__alHiwarChatEventBus = new ChatEventBus();
  }
  return globalThis.__alHiwarChatEventBus;
}

/**
 * Constant definition for chat event bus.
 */
export const chatEventBus = getChatEventBus();
