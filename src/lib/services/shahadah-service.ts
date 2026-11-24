/**
 * Module architecture and API reference for `src/lib/services/shahadah-service.ts`.
 *
 * Exported symbols:
 * - `ShahadahServiceImpl` (Class): shahadah service impl definition.
 * - `shahadahService` (Const): shahadah service definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/db/types`
 * - `./chat-event-bus`
 * - `@/lib/security/session-token`
 * - `@/lib/domain`
 * - `./shahadah-audio`
 * - `./shahadah-helpers`
 *
 * @module lib/services/shahadah-service
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Shahadah audio declaration workflow service managing seeker recording uploads,
 * assigned specialist validation/retake reviews, and New Muslim role promotion.
 */

import { db as defaultDb, type InMemoryDatabaseAdapter } from '@/lib/db/in-memory-adapter';
import {
  ok,
  err,
  type Result,
  type ShahadahSubmission,
  type UserSession,
  type SupportedLanguage,
} from '@/lib/db/types';
import { chatEventBus, type ChatEventBus } from './chat-event-bus';
import { signSessionToken } from '@/lib/security/session-token';
import { Dialogist as DialogistEntity, hydrateShahadah } from '@/lib/domain';
import {
  buildModelReferenceAudio,
  buildShahadahChatText,
  inferMimeFromUrl,
  normalizeRetakeFeedback,
  persistAudioPayload,
} from './shahadah-audio';
import {
  archiveAndAdvanceAttempt,
  buildInitialSubmission,
  buildShahadahChatMessage,
  extractValidAudioPayload,
  validateConversionProfile,
  validateReviewRequest,
  type ModelReferenceAudio,
  type PostConversionProfile,
  type ReviewSubmissionInput,
  type ShahadahError,
  type ShahadahErrorCode,
  type ShahadahService,
  type SubmitShahadahInput,
} from './shahadah-helpers';

export type {
  ModelReferenceAudio,
  SubmitShahadahInput,
  ReviewSubmissionInput,
  PostConversionProfile,
  ShahadahErrorCode,
  ShahadahError,
  ShahadahService,
};

/**
 * Coordinates Shahadah voice declaration uploads, assigned specialist reviews,
 * attempt archival, and promotion of validated seekers to New Muslims.
 */
export class ShahadahServiceImpl implements ShahadahService {
  private readonly store: InMemoryDatabaseAdapter;
  private readonly events: ChatEventBus;

  /**
   * Initializes the Shahadah service with injectable persistence and event bus adapters.
   * @param store - In-memory database adapter.
   * @param events - Real-time SSE pub/sub event bus.
   */
  constructor(
    store: InMemoryDatabaseAdapter = defaultDb,
    events: ChatEventBus = chatEventBus
  ) {
    this.store = store;
    this.events = events;
  }

  /** Returns the localized reference Shahadah audio guide. */
  async getModelReferenceAudio(language: SupportedLanguage = 'en'): Promise<ModelReferenceAudio> {
    return buildModelReferenceAudio(language);
  }

  /** Validates and stores a seeker's Shahadah audio declaration and posts a chat notice. */
  async submitShahadah(
    params: SubmitShahadahInput
  ): Promise<Result<ShahadahSubmission, ShahadahError>> {
    const seekerId = params.seekerId || params.nonMuslimId;
    if (!seekerId) return err({ code: 'USER_NOT_FOUND', message: 'Seeker ID is required' });

    const seeker = this.store.findUserById(seekerId);
    if (!seeker) return err({ code: 'USER_NOT_FOUND', message: 'Seeker account not found' });

    const conv = this.store.conversations.find((c) => c.id === params.conversationId);
    if (!conv) {
      return err({ code: 'CONVERSATION_NOT_FOUND', message: 'Consultation conversation not found' });
    }
    if (conv.nonMuslimId !== seekerId) {
      return err({ code: 'UNAUTHORIZED', message: 'Seeker does not own this consultation session' });
    }

    const audioCheck = extractValidAudioPayload(params);
    if ('error' in audioCheck) return err(audioCheck.error);

    const existing = this.store.shahadahSubmissions.find(
      (s) => s.conversationId === params.conversationId
    );
    if (existing?.status === 'VALIDATED') {
      return err({
        code: 'SUBMISSION_ALREADY_FINALIZED',
        message: 'Shahadah declaration has already been validated and cannot be replaced.',
      });
    }

    const isTestEnv = process.env.NODE_ENV === 'test';
    const initialMime = params.mimeType || inferMimeFromUrl(audioCheck.rawUrl, 'audio/webm;codecs=opus');
    const persisted = persistAudioPayload(audioCheck.rawUrl, initialMime, isTestEnv);
    const duration =
      params.durationSeconds !== undefined ? Math.max(1, Math.round(params.durationSeconds)) : 15;
    const now = new Date().toISOString();

    const submission = existing
      ? archiveAndAdvanceAttempt(existing, persisted.audioUrl, persisted.mimeType, duration, now)
      : this.registerInitialSubmission({
          conversationId: conv.id,
          seekerId,
          dialogistId: conv.dialogistId,
          audioUrl: persisted.audioUrl,
          mime: persisted.mimeType,
          duration,
          now,
        });

    const content = buildShahadahChatText('SUBMITTED', conv.language);
    this.appendChatMessage(conv.id, seekerId, content, true, submission.audioRecordingUrl, now);
    conv.lastMessageAt = now;
    this.store.save();
    return ok(submission);
  }

  /** Applies an assigned specialist's validation or retake decision to a submission. */
  async reviewSubmission(
    params: ReviewSubmissionInput
  ): Promise<Result<ShahadahSubmission, ShahadahError>> {
    const reviewer = this.store.findUserById(params.dialogistId);
    const submission = this.store.shahadahSubmissions.find((s) => s.id === params.submissionId);
    const conv = submission
      ? this.store.conversations.find((c) => c.id === submission.conversationId)
      : undefined;

    const validationErr = validateReviewRequest(reviewer, submission, conv, params);
    if (validationErr) return err(validationErr);

    const lang = conv?.language || 'en';
    const now = new Date().toISOString();
    submission!.dialogistId = params.dialogistId;
    submission!.reviewerId = params.dialogistId;
    submission!.reviewedAt = now;

    if (params.decision === 'REQUEST_RETAKE') {
      const notes = normalizeRetakeFeedback(params.feedbackNotes, lang);
      const domainShahadah = hydrateShahadah(submission!);
      domainShahadah.reject(new DialogistEntity(reviewer!), notes);
      Object.assign(submission!, domainShahadah.toRecord(), { reviewedAt: now });

      const ref = await this.getModelReferenceAudio(lang);
      const text = buildShahadahChatText('RETAKE', lang, submission!.feedbackNotes);
      this.appendChatMessage(submission!.conversationId, params.dialogistId, text, false, ref.audioUrl, now);
    } else {
      const domainShahadah = hydrateShahadah(submission!);
      domainShahadah.validate(new DialogistEntity(reviewer!), params.feedbackNotes?.trim() || undefined);
      Object.assign(submission!, domainShahadah.toRecord(), {
        reviewedAt: now,
        validatedAt: now,
        feedbackNotes: params.feedbackNotes?.trim() || null,
      });

      const text = buildShahadahChatText('VALIDATED', lang);
      this.appendChatMessage(submission!.conversationId, params.dialogistId, text, false, null, now);
    }

    this.store.save();
    return ok(submission!);
  }

  /** Elevates a validated seeker to New Muslim and initializes Academy progress. */
  async completeConversionProfile(
    seekerId: string,
    profile: PostConversionProfile
  ): Promise<Result<UserSession, ShahadahError>> {
    const user = this.store.findUserById(seekerId);
    if (!user) return err({ code: 'USER_NOT_FOUND', message: 'User not found' });

    const profileErr = validateConversionProfile(profile);
    if (profileErr) return err(profileErr);

    const validatedSub = this.store.shahadahSubmissions.find(
      (s) => s.nonMuslimId === seekerId && s.status === 'VALIDATED'
    );
    if (!validatedSub && user.role !== 'NEW_MUSLIM') {
      return err({
        code: 'SHAHADAH_NOT_VALIDATED',
        message: 'Cannot complete conversion profile until Shahadah is officially validated',
      });
    }

    Object.assign(user, {
      nationality: profile.nationality.trim(),
      gender: profile.gender,
      phoneNumber: profile.phoneNumber.trim(),
      role: 'NEW_MUSLIM' as const,
      conversionDate: user.conversionDate || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.store.ensureLearningProgress(user.id);
    this.store.activeDemoUserId = user.id;
    this.store.save();

    return ok({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      surname: user.surname,
      role: 'NEW_MUSLIM',
      preferredLanguage: user.preferredLanguage,
      token: signSessionToken(user.id),
    });
  }

  /** Returns the latest Shahadah submission for a conversation, or null. */
  async getSubmissionByConversation(conversationId: string): Promise<ShahadahSubmission | null> {
    const subs = this.store.shahadahSubmissions.filter((s) => s.conversationId === conversationId);
    return subs.length > 0 ? subs[subs.length - 1] : null;
  }

  /** Returns all Shahadah submissions associated with a conversation. */
  async getSubmissionHistory(conversationId: string): Promise<ShahadahSubmission[]> {
    return this.store.shahadahSubmissions.filter((s) => s.conversationId === conversationId);
  }

  /** Looks up a Shahadah submission by unique ID. */
  async getSubmissionById(submissionId: string): Promise<ShahadahSubmission | null> {
    return this.store.shahadahSubmissions.find((s) => s.id === submissionId) || null;
  }

  /** Registers the first Shahadah attempt in the store and returns it. */
  private registerInitialSubmission(
    params: Parameters<typeof buildInitialSubmission>[0]
  ): ShahadahSubmission {
    const submission = buildInitialSubmission(params);
    this.store.shahadahSubmissions.push(submission);
    return submission;
  }

  /** Persists a Shahadah system/voice message and fans it out over the live event bus. */
  private appendChatMessage(
    conversationId: string,
    senderId: string,
    content: string,
    hasVoiceNote: boolean,
    audioUrl: string | null,
    sentAt: string
  ): void {
    const message = buildShahadahChatMessage({
      conversationId,
      senderId,
      content,
      hasVoiceNote,
      audioUrl,
      sentAt,
    });
    this.store.messages.push(message);
    this.events.publish(conversationId, { type: 'message', conversationId, message });
  }
}

/**
 * Constant definition for shahadah service.
 */
export const shahadahService = new ShahadahServiceImpl();
