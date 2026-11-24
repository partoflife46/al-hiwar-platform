/**
 * Domain types, validation guards, attempt archival, and record builders for `ShahadahServiceImpl`.
 */

import type {
  Result,
  ShahadahSubmission,
  UserSession,
  SupportedLanguage,
  Gender,
  Message,
  Conversation,
  User,
} from '@/lib/db/types';

/** Reference Shahadah recitation metadata in English or French. */
export interface ModelReferenceAudio {
  /** language property. */
  language: SupportedLanguage;
  /** audio url property. */
  audioUrl: string;
  /** duration seconds property. */
  durationSeconds: number;
  /** arabic script property. */
  arabicScript: string;
  /** Optional arabic text property. */
  arabicText?: string;
  /** phonetic guide property. */
  phoneticGuide: string;
  /** Optional phonetics property. */
  phonetics?: string;
  /** english translation property. */
  englishTranslation: string;
  /** Optional translation property. */
  translation?: string;
  /** Optional translation en property. */
  translationEn?: string;
  /** Optional translation fr property. */
  translationFr?: string;
}

/** Input payload for submitting a seeker's Shahadah audio declaration. */
export interface SubmitShahadahInput {
  /** conversation id property. */
  conversationId: string;
  /** Optional seeker id property. */
  seekerId?: string;
  /** Optional non muslim id property. */
  nonMuslimId?: string;
  /** Optional audio recording url property. */
  audioRecordingUrl?: string;
  /** Optional audio data property. */
  audioData?: string;
  /** Optional audio data url property. */
  audioDataUrl?: string;
  /** Optional mime type property. */
  mimeType?: string;
  /** Optional duration seconds property. */
  durationSeconds?: number;
}

/** Input payload for a specialist validating or requesting a Shahadah retake. */
export interface ReviewSubmissionInput {
  /** dialogist id property. */
  dialogistId: string;
  /** submission id property. */
  submissionId: string;
  /** decision property. */
  decision: 'VALIDATE' | 'REQUEST_RETAKE';
  /** Optional feedback notes property. */
  feedbackNotes?: string;
  /** Optional target attempt number property. */
  targetAttemptNumber?: number;
}

/** Mandatory demographic fields collected upon entering Islam. */
export interface PostConversionProfile {
  nationality: string;
  gender: Gender;
  phoneNumber: string;
}

/** Machine-readable error codes returned by `ShahadahService` operations. */
export type ShahadahErrorCode =
  | 'USER_NOT_FOUND'
  | 'CONVERSATION_NOT_FOUND'
  | 'SUBMISSION_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_AUDIO'
  | 'INVALID_DECISION'
  | 'SHAHADAH_NOT_VALIDATED'
  | 'PROFILE_INCOMPLETE'
  | 'INVALID_PROFILE_DATA'
  | 'NOT_READY_FOR_PROFILE'
  | 'SUBMISSION_ALREADY_FINALIZED'
  | 'STALE_SUBMISSION_ATTEMPT';

/** Structured domain error returned by `ShahadahService` operations. */
export interface ShahadahError {
  code: ShahadahErrorCode;
  message: string;
}

/** Contract governing Shahadah recording, specialist review, and New Muslim promotion. */
export interface ShahadahService {
  getModelReferenceAudio(language?: SupportedLanguage): Promise<ModelReferenceAudio>;
  submitShahadah(params: SubmitShahadahInput): Promise<Result<ShahadahSubmission, ShahadahError>>;
  reviewSubmission(
    params: ReviewSubmissionInput
  ): Promise<Result<ShahadahSubmission, ShahadahError>>;
  completeConversionProfile(
    seekerId: string,
    profile: PostConversionProfile
  ): Promise<Result<UserSession, ShahadahError>>;
  getSubmissionByConversation(conversationId: string): Promise<ShahadahSubmission | null>;
  getSubmissionHistory?(conversationId: string): Promise<ShahadahSubmission[]>;
  getSubmissionById(submissionId: string): Promise<ShahadahSubmission | null>;
}

/**
 * Validates audio payload presence and positive duration on a Shahadah submission request.
 * @param params - Incoming submission payload.
 * @returns Non-empty raw audio URL/data string, or a `ShahadahError`.
 */
export function extractValidAudioPayload(
  params: SubmitShahadahInput
): { rawUrl: string } | { error: ShahadahError } {
  const rawUrl = params.audioRecordingUrl || params.audioData || params.audioDataUrl;
  if (!rawUrl || rawUrl.trim().length === 0) {
    return {
      error: {
        code: 'INVALID_AUDIO',
        message: 'Audio payload (URL or Base64 data) is required',
      },
    };
  }
  if (params.durationSeconds !== undefined && params.durationSeconds <= 0) {
    return {
      error: { code: 'INVALID_AUDIO', message: 'Audio duration must be greater than zero' },
    };
  }
  return { rawUrl };
}

/**
 * Verifies reviewer authorization, submission mutability, optimistic attempt lock, and decision.
 * @param reviewer - Candidate reviewer user record.
 * @param submission - Target Shahadah submission.
 * @param conversation - Associated consultation record.
 * @param params - Review request payload.
 * @returns `ShahadahError` when review is blocked, or `null` when permitted.
 */
export function validateReviewRequest(
  reviewer: User | undefined,
  submission: ShahadahSubmission | undefined,
  conversation: Conversation | undefined,
  params: ReviewSubmissionInput
): ShahadahError | null {
  if (!reviewer || !['DIALOGIST', 'SUPERVISOR', 'ADMINISTRATOR'].includes(reviewer.role)) {
    return {
      code: 'UNAUTHORIZED',
      message: 'Only qualified dialogists or supervisors can review Shahadah submissions',
    };
  }
  if (!submission) {
    return { code: 'SUBMISSION_NOT_FOUND', message: 'Shahadah submission not found' };
  }
  if (submission.status === 'VALIDATED') {
    return {
      code: 'SUBMISSION_ALREADY_FINALIZED',
      message: 'Shahadah submission has already been validated and cannot be reviewed again.',
    };
  }
  if (
    params.targetAttemptNumber !== undefined &&
    params.targetAttemptNumber !== submission.attemptNumber
  ) {
    return {
      code: 'STALE_SUBMISSION_ATTEMPT',
      message: `Review targeted attempt #${params.targetAttemptNumber}, current is #${submission.attemptNumber}.`,
    };
  }
  if (params.decision !== 'VALIDATE' && params.decision !== 'REQUEST_RETAKE') {
    return { code: 'INVALID_DECISION', message: 'Decision must be VALIDATE or REQUEST_RETAKE' };
  }
  const assignedId = conversation?.dialogistId || submission.dialogistId;
  if (reviewer.role === 'DIALOGIST' && assignedId && assignedId !== reviewer.id) {
    return {
      code: 'UNAUTHORIZED',
      message: 'Only the assigned Dialogist can review or validate this Shahadah submission.',
    };
  }
  return null;
}

/**
 * Validates mandatory post-conversion demographic fields (`nationality`, `gender`, `phoneNumber`).
 * @param profile - Submitted profile completion payload.
 * @returns `ShahadahError` when incomplete, or `null` when valid.
 */
export function validateConversionProfile(profile: PostConversionProfile): ShahadahError | null {
  if (
    !profile.nationality?.trim() ||
    !profile.phoneNumber?.trim() ||
    !['MALE', 'FEMALE'].includes(profile.gender)
  ) {
    return {
      code: 'PROFILE_INCOMPLETE',
      message: 'Nationality, Gender (MALE or FEMALE), and Phone Number are mandatory',
    };
  }
  return null;
}

/**
 * Builds the first `ShahadahSubmission` attempt record for a consultation.
 * @param params - Submission fields and persisted audio metadata.
 * @returns Newly initialized `ShahadahSubmission` with empty `previousAttempts` audit trail.
 */
export function buildInitialSubmission(params: {
  conversationId: string;
  seekerId: string;
  dialogistId: string | null;
  audioUrl: string;
  mime: string;
  duration: number;
  now: string;
}): ShahadahSubmission {
  const subId = `shd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const submission: ShahadahSubmission = {
    id: subId,
    conversationId: params.conversationId,
    nonMuslimId: params.seekerId,
    dialogistId: params.dialogistId,
    audioRecordingUrl: params.audioUrl,
    mimeType: params.mime,
    durationSeconds: params.duration,
    status: 'PENDING_REVIEW',
    feedbackNotes: null,
    attemptNumber: 1,
    reviewerId: null,
    reviewedAt: null,
    submittedAt: params.now,
    validatedAt: null,
  };
  Object.assign(submission, { currentAttemptId: `att-${subId}-1`, previousAttempts: [] });
  return submission;
}

/**
 * Archives the current recording attempt onto `previousAttempts` before advancing attempt number.
 * @param existing - Stored submission being resubmitted after retake feedback.
 * @param audioUrl - Persisted URL of the new recording.
 * @param mime - Resolved MIME type of the new recording.
 * @param duration - Duration in whole seconds.
 * @param now - Current ISO timestamp.
 * @returns The mutated submission updated to the next `PENDING_REVIEW` attempt.
 */
export function archiveAndAdvanceAttempt(
  existing: ShahadahSubmission,
  audioUrl: string,
  mime: string,
  duration: number,
  now: string
): ShahadahSubmission {
  const prevAttempts =
    (existing as unknown as { previousAttempts?: unknown[] }).previousAttempts || [];
  const currentAttemptNum = existing.attemptNumber || 1;
  const attemptId =
    (existing as unknown as { currentAttemptId?: string }).currentAttemptId ||
    `att-${existing.id}-${currentAttemptNum}`;

  prevAttempts.push({
    attemptId,
    attemptNumber: currentAttemptNum,
    audioRecordingUrl: existing.audioRecordingUrl,
    mimeType: existing.mimeType,
    durationSeconds: existing.durationSeconds,
    submittedAt: existing.submittedAt,
    feedbackNotes: existing.feedbackNotes || null,
    reviewerId: existing.reviewerId || null,
    status: existing.status,
  });

  const nextAttemptNum = currentAttemptNum + 1;
  return Object.assign(existing, {
    audioRecordingUrl: audioUrl,
    mimeType: mime,
    durationSeconds: duration,
    status: 'PENDING_REVIEW' as const,
    feedbackNotes: null,
    attemptNumber: nextAttemptNum,
    currentAttemptId: `att-${existing.id}-${nextAttemptNum}`,
    submittedAt: now,
    validatedAt: null,
    previousAttempts: prevAttempts,
  });
}

/**
 * Builds a chat `Message` announcing a Shahadah submission, retake request, or validation.
 * @param params - Chat message attributes.
 * @returns Persisted `Message` record ready to append and stream.
 */
export function buildShahadahChatMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  hasVoiceNote: boolean;
  audioUrl: string | null;
  sentAt: string;
}): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId: params.conversationId,
    senderId: params.senderId,
    content: params.content,
    predefinedReplyId: null,
    hasVoiceNote: params.hasVoiceNote,
    audioUrl: params.audioUrl,
    sentAt: params.sentAt,
  };
}
