/**
 * Domain types, role guards, and pure record builders for `ContentWorkflowServiceImpl`.
 * Separates deterministic payload construction from stateful store mutations.
 */

import type {
  User,
  UserRole,
  PredefinedMessage,
  PredefinedMessageCategory,
  LearningContent,
  LearningProgress,
  QuizAttempt,
  FinalAttempt,
  Certificate,
  Conversation,
  IslamicResource,
  ResourceCategory,
  ResourceType,
} from '@/lib/db/types';

/** Domain error codes returned by editorial and governance workflows. */
export type WorkflowError =
  | 'LESSON_NOT_FOUND'
  | 'MESSAGE_NOT_FOUND'
  | 'RESOURCE_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_ROLE'
  | 'CERTIFICATE_NOT_FOUND'
  | 'UNAUTHORIZED_DIALOGIST'
  | 'UNAUTHORIZED_INSTRUCTOR'
  | 'UNAUTHORIZED_SUPERVISOR'
  | 'UNAUTHORIZED_ADMIN';

/** Learner supervision snapshot displayed to instructors and Sharia supervisors. */
export interface StudentSupervisionRecord {
  /** user property. */
  user: User;
  /** progress property. */
  progress: LearningProgress;
  /** completed lessons count property. */
  completedLessonsCount: number;
  /** unlocked lesson number property. */
  unlockedLessonNumber: number;
  /** quiz attempts property. */
  quizAttempts: QuizAttempt[];
  /** final attempts property. */
  finalAttempts: FinalAttempt[];
  /** final exam passed property. */
  finalExamPassed: boolean;
  /** certificate property. */
  certificate: Certificate | null;
}

/** Read-only audit bundle assembled for Sharia Supervisors and Administrators. */
export interface SupervisorAuditOverview {
  /** conversations property. */
  conversations: Conversation[];
  /** staff property. */
  staff: User[];
  /** student progress property. */
  studentProgress: StudentSupervisionRecord[];
  /** pending lessons property. */
  pendingLessons: LearningContent[];
  /** pending predefined messages property. */
  pendingPredefinedMessages: PredefinedMessage[];
  /** certificates property. */
  certificates: Certificate[];
}

/** Input for creating a Dialogist quick-reply template draft. */
export interface CreatePredefinedMessageInput {
  /** author id property. */
  authorId: string;
  /** shortcut property. */
  shortcut: string;
  /** category property. */
  category: PredefinedMessageCategory;
  /** body en property. */
  bodyEn: string;
  /** body fr property. */
  bodyFr: string;
}

/** Input for authoring or updating an educational lesson draft. */
export interface CreateOrUpdateLessonDraftInput {
  /** instructor id property. */
  instructorId: string;
  /** Optional id property. */
  id?: string;
  /** lesson number property. */
  lessonNumber: number;
  /** title en property. */
  titleEn: string;
  /** title fr property. */
  titleFr: string;
  /** content markdown en property. */
  contentMarkdownEn: string;
  /** content markdown fr property. */
  contentMarkdownFr: string;
  /** Optional pdf guide url property. */
  pdfGuideUrl?: string | null;
  /** Optional audio lecture url property. */
  audioLectureUrl?: string | null;
  /** Optional video lecture url property. */
  videoLectureUrl?: string | null;
}

/** Input for provisioning a verified staff account under admin governance. */
export interface CreateStaffAccountInput {
  /** admin id property. */
  adminId: string;
  /** first name property. */
  firstName: string;
  /** surname property. */
  surname: string;
  /** email property. */
  email: string;
  /** role property. */
  role: UserRole;
  /** date of birth property. */
  dateOfBirth: string;
  /** Optional title property. */
  title?: string;
  /** Optional password property. */
  password?: string;
}

/** Input for publishing a new public Islamic library resource. */
export interface UploadIslamicResourceInput {
  /** admin id property. */
  adminId: string;
  /** title en property. */
  titleEn: string;
  /** title fr property. */
  titleFr: string;
  /** category property. */
  category: ResourceCategory;
  /** resource type property. */
  resourceType: ResourceType;
  /** media url property. */
  mediaUrl: string;
  /** description en property. */
  descriptionEn: string;
  /** description fr property. */
  descriptionFr: string;
}

/** All internal staff roles allowed on the staff portal. */
export const STAFF_ROLES: UserRole[] = [
  'DIALOGIST',
  'INSTRUCTOR',
  'SUPERVISOR',
  'ADMINISTRATOR',
];

/** Roles authorized to draft or submit Academy curriculum lessons. */
export const INSTRUCTOR_ROLES: UserRole[] = ['INSTRUCTOR', 'SUPERVISOR', 'ADMINISTRATOR'];

/** Roles authorized to approve or reject editorial content under Sharia review. */
export const SUPERVISOR_ROLES: UserRole[] = ['SUPERVISOR', 'ADMINISTRATOR'];

/**
 * Normalizes both positional and object-based predefined message draft arguments
 * into a new pending `PredefinedMessage` record.
 * @param authorOrInput - Author user ID or structured creation payload.
 * @param messagePartial - Optional partial draft fields for positional calls.
 * @returns Newly initialized `PredefinedMessage` in `PENDING_APPROVAL` status.
 */
export function buildPredefinedDraftRecord(
  authorOrInput: string | CreatePredefinedMessageInput,
  messagePartial?: Partial<PredefinedMessage>
): PredefinedMessage {
  const input: CreatePredefinedMessageInput =
    typeof authorOrInput === 'string'
      ? {
          authorId: authorOrInput,
          shortcut: messagePartial?.shortcut || '/quick',
          category: messagePartial?.category || 'THEOLOGY',
          bodyEn: messagePartial?.bodyEn || 'English quick reply',
          bodyFr: messagePartial?.bodyFr || 'Réponse rapide en français',
        }
      : authorOrInput;

  const trimmed = input.shortcut.trim();
  return {
    id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    shortcut: trimmed.startsWith('/') ? trimmed : `/${trimmed}`,
    category: input.category || 'THEOLOGY',
    bodyEn: input.bodyEn.trim(),
    bodyFr: input.bodyFr.trim(),
    authorId: input.authorId,
    approvedById: null,
    isApproved: false,
    status: 'PENDING_APPROVAL',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates a new unapproved `LearningContent` draft with sensible defaults.
 * @param instructorId - Authoring instructor user ID.
 * @param lesson - Partial lesson metadata and markdown bodies.
 * @param nextLessonNumber - Fallback lesson sequence number.
 * @returns Newly initialized lesson record in `DRAFT` status.
 */
export function buildDraftLessonRecord(
  instructorId: string,
  lesson: Partial<LearningContent>,
  nextLessonNumber: number
): LearningContent {
  return {
    id: `lesson-draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    lessonNumber: lesson.lessonNumber || nextLessonNumber,
    titleEn: lesson.titleEn || 'Draft Lesson Title (EN)',
    titleFr: lesson.titleFr || 'Titre de la leçon (FR)',
    contentMarkdownEn: lesson.contentMarkdownEn || '# Lesson Content',
    contentMarkdownFr: lesson.contentMarkdownFr || '# Contenu de la leçon',
    pdfGuideUrl: lesson.pdfGuideUrl || null,
    audioLectureUrl: lesson.audioLectureUrl || null,
    videoLectureUrl: lesson.videoLectureUrl || null,
    status: 'DRAFT',
    isApproved: false,
    authorId: instructorId,
    approvedById: null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Builds a brand-new `LearningContent` record queued for Sharia Supervisor review.
 * @param input - Instructor submission payload.
 * @returns Newly constructed `LearningContent` in `PENDING_APPROVAL` status.
 */
export function buildPendingLessonRecord(
  input: CreateOrUpdateLessonDraftInput
): LearningContent {
  return {
    id: `lesson-draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    lessonNumber: input.lessonNumber,
    titleEn: input.titleEn.trim(),
    titleFr: input.titleFr.trim(),
    contentMarkdownEn: input.contentMarkdownEn,
    contentMarkdownFr: input.contentMarkdownFr,
    pdfGuideUrl: input.pdfGuideUrl || null,
    audioLectureUrl: input.audioLectureUrl || null,
    videoLectureUrl: input.videoLectureUrl || null,
    status: 'PENDING_APPROVAL',
    isApproved: false,
    authorId: input.instructorId,
    approvedById: null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Mutates an existing lesson record with revised instructor content and resets review status.
 * @param existing - Stored `LearningContent` record to update in place.
 * @param input - Revised lesson payload.
 * @returns The updated `LearningContent` record.
 */
export function applyLessonDraftUpdate(
  existing: LearningContent,
  input: CreateOrUpdateLessonDraftInput
): LearningContent {
  return Object.assign(existing, {
    lessonNumber: input.lessonNumber,
    titleEn: input.titleEn.trim(),
    titleFr: input.titleFr.trim(),
    contentMarkdownEn: input.contentMarkdownEn,
    contentMarkdownFr: input.contentMarkdownFr,
    pdfGuideUrl: input.pdfGuideUrl ?? existing.pdfGuideUrl ?? null,
    audioLectureUrl: input.audioLectureUrl ?? existing.audioLectureUrl ?? null,
    videoLectureUrl: input.videoLectureUrl ?? existing.videoLectureUrl ?? null,
    status: 'PENDING_APPROVAL' as const,
    isApproved: false,
    approvedById: null,
    reviewNotes: null,
  });
}

/**
 * Normalizes overloaded review arguments for predefined message approval calls.
 * @param supervisorOrParams - Supervisor ID or structured review object.
 * @param messageIdArg - Positional template ID when first argument is a string.
 * @param decisionArg - Positional review decision when first argument is a string.
 * @returns Normalized review descriptor `{ supervisorId, templateId, decision }`.
 */
export function normalizePredefinedReviewArgs(
  supervisorOrParams:
    | string
    | { supervisorId: string; templateId: string; decision: 'APPROVE' | 'REJECT'; notes?: string },
  messageIdArg?: string,
  decisionArg?: 'APPROVE' | 'REJECT'
): { supervisorId: string; templateId: string; decision: 'APPROVE' | 'REJECT' } {
  if (typeof supervisorOrParams === 'string') {
    return {
      supervisorId: supervisorOrParams,
      templateId: messageIdArg!,
      decision: decisionArg!,
    };
  }
  return {
    supervisorId: supervisorOrParams.supervisorId,
    templateId: supervisorOrParams.templateId,
    decision: supervisorOrParams.decision,
  };
}

/**
 * Builds an active, verified staff `User` record ready to append to the store.
 * @param input - Administrator provisioning payload.
 * @param passwordHash - Pre-hashed scrypt password digest.
 * @returns Initialized staff `User` record.
 */
export function buildStaffUserRecord(
  input: CreateStaffAccountInput,
  passwordHash: string
): User {
  const now = new Date().toISOString();
  return {
    id: `user-staff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    email: input.email.trim().toLowerCase(),
    passwordHash,
    firstName: input.firstName.trim(),
    surname: input.surname.trim(),
    dateOfBirth: input.dateOfBirth || '1985-01-01',
    role: input.role,
    status: 'ACTIVE',
    preferredLanguage: 'en',
    emailVerified: true,
    verificationOtp: null,
    nationality: 'Saudi Arabia',
    gender: 'MALE',
    title: input.title || `Al Hiwar Platform — ${input.role}`,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Builds a published `IslamicResource` entity from administrator upload input.
 * @param input - Validated resource upload payload.
 * @returns Initialized public `IslamicResource` record.
 */
export function buildIslamicResourceRecord(
  input: UploadIslamicResourceInput
): IslamicResource {
  return {
    id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    uploadedByAdminId: input.adminId,
    titleEn: input.titleEn.trim(),
    titleFr: input.titleFr.trim(),
    category: input.category,
    resourceType: input.resourceType,
    mediaUrl: input.mediaUrl.trim(),
    descriptionEn: input.descriptionEn.trim(),
    descriptionFr: input.descriptionFr.trim(),
    isPublic: true,
    createdAt: new Date().toISOString(),
  };
}
