/**
 * Module architecture and API reference for `src/lib/domain/dialogue.ts`.
 *
 * Exported symbols:
 * - `PredefinedMessage` (Class): predefined message definition.
 * - `Message` (Class): message definition.
 * - `Conversation` (Class): conversation definition.
 * - `Shahadah` (Class): shahadah definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `./users`
 *
 * @module lib/domain/dialogue
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Core domain model definitions for dialogue entities and state transitions.
 * Aligned with the Al-Hiwar UML class diagram contracts and entity invariants.
 * @module lib/domain/dialogue
 * @exports PredefinedMessage, Message, Conversation, Shahadah
 */

import type {
  ConsultationIntent,
  ContentStatus,
  Conversation as ConversationRecord,
  ConversationStatus,
  Message as MessageRecord,
  PredefinedMessage as PredefinedMessageRecord,
  PredefinedMessageCategory,
  ShahadahStatus,
  ShahadahSubmission,
  SupportedLanguage,
} from '@/lib/db/types';
import type { Dialogist, NonMuslim, Supervisor, User } from './users';

/**
 * Reusable quick-reply message authored by a Dialogist and approved by a Supervisor.
 */
export class PredefinedMessage {
  id: string;
  shortcut: string;
  category: PredefinedMessageCategory;
  bodyEn: string;
  bodyFr: string;
  authorId: string;
  approvedById: string | null;
  isApproved: boolean;
  status?: ContentStatus;
  createdAt: string;
  author?: Dialogist;
  approvedBy?: Supervisor;

  constructor(record: PredefinedMessageRecord) {
    this.id = record.id;
    this.shortcut = record.shortcut;
    this.category = record.category;
    this.bodyEn = record.bodyEn;
    this.bodyFr = record.bodyFr;
    this.authorId = record.authorId;
    this.approvedById = record.approvedById;
    this.isApproved = record.isApproved;
    this.status = record.status;
    this.createdAt = record.createdAt;
  }

  /**
   * Serializes this predefined message into a plain JSON record.
   */
  toRecord(): PredefinedMessageRecord {
    return {
      id: this.id,
      shortcut: this.shortcut,
      category: this.category,
      bodyEn: this.bodyEn,
      bodyFr: this.bodyFr,
      authorId: this.authorId,
      approvedById: this.approvedById,
      isApproved: this.isApproved,
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}

/**
 * Text or voice message exchanged inside a private consultation conversation.
 */
export class Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  predefinedReplyId?: string | null;
  hasVoiceNote: boolean;
  audioUrl?: string | null;
  messageType?: 'TEXT' | 'INTENT_PROMPT' | 'INTENT_CHOICE';
  selectedIntent?: ConsultationIntent | null;
  sentAt: string;
  isRead: boolean;
  predefinedMessage?: PredefinedMessage;

  constructor(record: MessageRecord) {
    this.id = record.id;
    this.conversationId = record.conversationId;
    this.senderId = record.senderId;
    this.content = record.content;
    this.predefinedReplyId = record.predefinedReplyId;
    this.hasVoiceNote = record.hasVoiceNote;
    this.audioUrl = record.audioUrl;
    this.messageType = record.messageType;
    this.selectedIntent = record.selectedIntent;
    this.sentAt = record.sentAt;
    this.isRead = false;
  }

  /**
   * Stamps and prepares this message for delivery, optionally from a quick reply.
   */
  send(predefined?: PredefinedMessage, language: SupportedLanguage = 'en'): Message {
    if (predefined) {
      this.predefinedMessage = predefined;
      this.predefinedReplyId = predefined.id;
      this.content = language === 'fr' ? predefined.bodyFr : predefined.bodyEn;
    }
    this.sentAt = new Date().toISOString();
    return this;
  }

  /**
   * Marks this message as read by its recipient.
   */
  markAsRead(): Message {
    this.isRead = true;
    this.sentAt = this.sentAt || new Date().toISOString();
    return this;
  }

  /**
   * Serializes this message into a plain JSON record.
   */
  toRecord(): MessageRecord {
    return {
      id: this.id,
      conversationId: this.conversationId,
      senderId: this.senderId,
      content: this.content,
      predefinedReplyId: this.predefinedReplyId,
      hasVoiceNote: this.hasVoiceNote,
      audioUrl: this.audioUrl,
      messageType: this.messageType,
      selectedIntent: this.selectedIntent,
      sentAt: this.sentAt,
    };
  }
}

/**
 * Private 1-to-1 consultation session between a seeker and a Dialogist.
 */
export class Conversation {
  id: string;
  nonMuslimId: string;
  dialogistId: string | null;
  language: SupportedLanguage;
  intent: ConsultationIntent;
  status: ConversationStatus;
  isAssigned: boolean;
  inactivityNoticeSent?: boolean;
  lastMessageAt: string;
  createdAt: string;
  user?: User;
  dialogist?: Dialogist;
  messages: Message[];

  constructor(record: ConversationRecord, messages: Message[] = []) {
    this.id = record.id;
    this.nonMuslimId = record.nonMuslimId;
    this.dialogistId = record.dialogistId;
    this.language = record.language;
    this.intent = record.intent;
    this.status = record.status;
    this.isAssigned = record.isAssigned;
    this.inactivityNoticeSent = record.inactivityNoticeSent;
    this.lastMessageAt = record.lastMessageAt;
    this.createdAt = record.createdAt;
    this.messages = messages;
  }

  /**
   * Opens a seeker discussion with a chosen intent and starts the conversation.
   */
  startDiscussion(intent?: ConsultationIntent): Conversation {
    if (intent) {
      this.intent = intent;
    }
    return this.startConversation();
  }

  /**
   * Places this conversation into the active/queued consultation lifecycle.
   */
  startConversation(): Conversation {
    const now = new Date().toISOString();
    this.status = this.isAssigned ? 'ACTIVE' : 'QUEUED';
    this.lastMessageAt = now;
    return this;
  }

  /**
   * Sends an automated system notice when a specialist is temporarily unavailable.
   */
  sendAutoReply(content: string): Message {
    const now = new Date().toISOString();
    const reply = new Message({
      id: `msg-auto-${Date.now()}`,
      conversationId: this.id,
      senderId: 'system-watchdog',
      content,
      hasVoiceNote: false,
      audioUrl: null,
      sentAt: now,
    });
    reply.send();
    this.messages.push(reply);
    this.inactivityNoticeSent = true;
    this.lastMessageAt = now;
    return reply;
  }

  /**
   * Records the consultation intent option selected by the seeker.
   */
  selectOption(intent: ConsultationIntent): Conversation {
    this.intent = intent;
    this.lastMessageAt = new Date().toISOString();
    return this;
  }

  /**
   * Checks whether this conversation belongs to the unassigned specialist queue.
   */
  viewUnansweredQuestions(): boolean {
    return !this.isAssigned && this.status === 'QUEUED' && this.lastMessageAt.length > 0;
  }

  /**
   * Assigns this conversation exclusively to a qualified Dialogist.
   */
  acceptConversation(dialogist: Dialogist): Conversation {
    this.dialogist = dialogist;
    this.dialogistId = dialogist.id;
    this.isAssigned = true;
    this.status = 'ACTIVE';
    this.lastMessageAt = new Date().toISOString();
    return this;
  }

  /**
   * Serializes this conversation into a plain JSON record.
   */
  toRecord(): ConversationRecord {
    return {
      id: this.id,
      nonMuslimId: this.nonMuslimId,
      dialogistId: this.dialogistId,
      language: this.language,
      intent: this.intent,
      status: this.status,
      isAssigned: this.isAssigned,
      inactivityNoticeSent: this.inactivityNoticeSent,
      lastMessageAt: this.lastMessageAt,
      createdAt: this.createdAt,
    };
  }
}

/**
 * Voice-recorded Shahadah declaration submitted for specialist validation.
 */
export class Shahadah {
  id: string;
  conversationId: string;
  nonMuslimId: string;
  dialogistId: string | null;
  audioRecordingUrl: string;
  mimeType: string;
  durationSeconds: number;
  status: ShahadahStatus;
  feedbackNotes?: string | null;
  attemptNumber: number;
  reviewerId?: string | null;
  reviewedAt?: string | null;
  submittedAt: string;
  validatedAt?: string | null;
  nonMuslim?: NonMuslim;
  dialogist?: Dialogist;
  message?: Message;

  constructor(record: ShahadahSubmission) {
    this.id = record.id;
    this.conversationId = record.conversationId;
    this.nonMuslimId = record.nonMuslimId;
    this.dialogistId = record.dialogistId;
    this.audioRecordingUrl = record.audioRecordingUrl;
    this.mimeType = record.mimeType;
    this.durationSeconds = record.durationSeconds;
    this.status = record.status;
    this.feedbackNotes = record.feedbackNotes;
    this.attemptNumber = record.attemptNumber;
    this.reviewerId = record.reviewerId;
    this.reviewedAt = record.reviewedAt;
    this.submittedAt = record.submittedAt;
    this.validatedAt = record.validatedAt;
  }

  /**
   * Marks this Shahadah submission as validated by an authorized Dialogist.
   */
  validate(reviewer: Dialogist, notes?: string): Shahadah {
    const now = new Date().toISOString();
    this.status = 'VALIDATED';
    this.dialogist = reviewer;
    this.dialogistId = reviewer.id;
    this.reviewerId = reviewer.id;
    this.feedbackNotes = notes ?? null;
    this.reviewedAt = now;
    this.validatedAt = now;
    return this;
  }

  /**
   * Rejects this Shahadah submission and requests a clearer pronunciation retake.
   */
  reject(reviewer: Dialogist, feedback: string): Shahadah {
    const now = new Date().toISOString();
    this.status = 'RETAKE_REQUESTED';
    this.dialogist = reviewer;
    this.dialogistId = reviewer.id;
    this.reviewerId = reviewer.id;
    this.feedbackNotes = feedback.trim();
    this.reviewedAt = now;
    this.validatedAt = null;
    return this;
  }

  /**
   * Serializes this Shahadah submission into a plain JSON record.
   */
  toRecord(): ShahadahSubmission {
    return {
      id: this.id,
      conversationId: this.conversationId,
      nonMuslimId: this.nonMuslimId,
      dialogistId: this.dialogistId,
      audioRecordingUrl: this.audioRecordingUrl,
      mimeType: this.mimeType,
      durationSeconds: this.durationSeconds,
      status: this.status,
      feedbackNotes: this.feedbackNotes,
      attemptNumber: this.attemptNumber,
      reviewerId: this.reviewerId,
      reviewedAt: this.reviewedAt,
      submittedAt: this.submittedAt,
      validatedAt: this.validatedAt,
    };
  }
}
