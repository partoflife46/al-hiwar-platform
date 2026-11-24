/**
 * Module architecture and API reference for `src/lib/db/dialogue-types.ts`.
 *
 * Exported symbols:
 * - `ConsultationIntent` (TypeAlias): consultation intent definition.
 * - `ConversationStatus` (TypeAlias): conversation status definition.
 * - `PredefinedMessageCategory` (TypeAlias): predefined message category definition.
 * - `ShahadahStatus` (TypeAlias): shahadah status definition.
 * - `ContentStatus` (TypeAlias): content status definition.
 * - `Conversation` (TypeAlias): conversation definition.
 * - `Message` (TypeAlias): message definition.
 * - `PredefinedMessage` (TypeAlias): predefined message definition.
 * - `ShahadahSubmission` (TypeAlias): shahadah submission definition.
 *
 * Internal dependencies:
 * - `./core-types`
 *
 * @module lib/db/dialogue-types
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Dialogue, quick-reply template, and Shahadah audio submission data contracts.
 */

import type { SupportedLanguage } from './core-types';

/** Seeker consultation intent selected during dialogue triage. */
export type ConsultationIntent = 'LEARN_ABOUT_ISLAM' | 'EMBRACE_ISLAM';

/** Lifecycle status of a private 1-on-1 consultation room. */
export type ConversationStatus = 'QUEUED' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';

/** Thematic grouping for approved specialist quick-reply templates. */
export type PredefinedMessageCategory =
  | 'GREETING'
  | 'THEOLOGY'
  | 'SHAHADAH'
  | 'MISCONCEPTIONS';

/** Review state of a seeker's recorded Shahadah audio submission. */
export type ShahadahStatus =
  | 'PENDING_REVIEW'
  | 'VALIDATED'
  | 'RETAKE_REQUESTED';

/** Approval workflow state for editorial lessons and quick-reply drafts. */
export type ContentStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

/** Private consultation room linking a seeker and an assigned specialist. */
export type Conversation = {
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
};

/** Single text, voice-note, or intent-triage message within a conversation. */
export type Message = {
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
};

/** Bilingual scholarly quick-reply template subject to Supervisor approval. */
export type PredefinedMessage = {
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
};

/** Recorded Shahadah declaration audio awaiting or having completed human review. */
export type ShahadahSubmission = {
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
};
