/**
 * Module architecture and API reference for `src/lib/services/content-workflow-service.ts`.
 *
 * Exported symbols:
 * - `ContentWorkflowServiceImpl` (Class): content workflow service impl definition.
 * - `contentWorkflowService` (Const): content workflow service definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/security/password`
 * - `./academy-service`
 * - `@/lib/domain`
 * - `@/lib/db/types`
 * - `./content-workflow-helpers`
 *
 * @module lib/services/content-workflow-service
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Editorial and administrative governance service coordinating lesson drafts,
 * predefined reply reviews, learner supervision audits, and staff/resource controls.
 */

import { db as defaultDb, type InMemoryDatabaseAdapter } from '@/lib/db/in-memory-adapter';
import { hashPassword } from '@/lib/security/password';
import { academyService as defaultAcademyService, type AcademyService } from './academy-service';
import {
  Supervisor as SupervisorEntity,
  hydrateLearningContent,
  hydratePredefinedMessage,
} from '@/lib/domain';
import {
  ok,
  err,
  type Result,
  type User,
  type UserRole,
  type PredefinedMessage,
  type LearningContent,
  type Conversation,
  type IslamicResource,
} from '@/lib/db/types';
import {
  INSTRUCTOR_ROLES,
  STAFF_ROLES,
  SUPERVISOR_ROLES,
  applyLessonDraftUpdate,
  buildDraftLessonRecord,
  buildIslamicResourceRecord,
  buildPendingLessonRecord,
  buildPredefinedDraftRecord,
  buildStaffUserRecord,
  normalizePredefinedReviewArgs,
  type CreateOrUpdateLessonDraftInput,
  type CreatePredefinedMessageInput,
  type CreateStaffAccountInput,
  type StudentSupervisionRecord,
  type SupervisorAuditOverview,
  type UploadIslamicResourceInput,
  type WorkflowError,
} from './content-workflow-helpers';

export type {
  WorkflowError,
  StudentSupervisionRecord,
  SupervisorAuditOverview,
  CreatePredefinedMessageInput,
  CreateOrUpdateLessonDraftInput,
  CreateStaffAccountInput,
  UploadIslamicResourceInput,
};

/**
 * Coordinates editorial approval workflows (lessons & predefined replies),
 * student supervision audits, and administrator staff/resource governance.
 */
export class ContentWorkflowServiceImpl {
  private readonly store: InMemoryDatabaseAdapter;
  private readonly academy: AcademyService;

  /**
   * Initializes the governance service with injectable persistence and Academy adapters.
   * @param store - In-memory database adapter.
   * @param academy - Academy service used for certificate governance delegation.
   */
  constructor(
    store: InMemoryDatabaseAdapter = defaultDb,
    academy: AcademyService = defaultAcademyService
  ) {
    this.store = store;
    this.academy = academy;
  }

  /** Creates a pending predefined quick-reply draft authored by a Dialogist. */
  async createPredefinedMessageDraft(
    authorOrInput: string | CreatePredefinedMessageInput,
    messagePartial?: Partial<PredefinedMessage>
  ): Promise<PredefinedMessage> {
    const draft = buildPredefinedDraftRecord(authorOrInput, messagePartial);
    this.store.predefinedMessages.push(draft);
    return draft;
  }

  /** Returns all approved predefined templates plus drafts authored by `dialogistId`. */
  async getAvailablePredefinedMessages(dialogistId: string): Promise<PredefinedMessage[]> {
    return this.store.predefinedMessages.filter(
      (m) => m.isApproved || m.authorId === dialogistId
    );
  }

  /** Creates an unapproved draft lesson authored by an Instructor. */
  async createLessonDraft(
    instructorId: string,
    lesson: Partial<LearningContent>
  ): Promise<LearningContent> {
    const newLesson = buildDraftLessonRecord(
      instructorId,
      lesson,
      this.store.learningContents.length + 1
    );
    this.store.learningContents.push(newLesson);
    return newLesson;
  }

  /** Submits an existing lesson draft to the Sharia Supervisor review queue. */
  async submitLessonForApproval(
    instructorId: string,
    lessonId: string
  ): Promise<Result<LearningContent, WorkflowError>> {
    if (!this.hasRole(instructorId, INSTRUCTOR_ROLES)) return err('UNAUTHORIZED_INSTRUCTOR');
    const lesson = this.store.learningContents.find((l) => l.id === lessonId);
    if (!lesson) return err('LESSON_NOT_FOUND');

    lesson.status = 'PENDING_APPROVAL';
    lesson.isApproved = false;
    return ok(lesson);
  }

  /** Creates or updates a lesson draft and places it into pending approval status. */
  async createOrUpdateLessonDraft(
    input: CreateOrUpdateLessonDraftInput
  ): Promise<Result<LearningContent, WorkflowError>> {
    if (!this.hasRole(input.instructorId, INSTRUCTOR_ROLES)) {
      return err('UNAUTHORIZED_INSTRUCTOR');
    }

    if (input.id) {
      const existing = this.store.learningContents.find((l) => l.id === input.id);
      if (!existing) return err('LESSON_NOT_FOUND');
      return ok(applyLessonDraftUpdate(existing, input));
    }

    const created = buildPendingLessonRecord(input);
    this.store.learningContents.push(created);
    return ok(created);
  }

  /** Aggregates progress, exam attempts, and certificates for all New Muslim learners. */
  async getStudentProgressSupervision(): Promise<StudentSupervisionRecord[]> {
    const newMuslims = this.store.users.filter((u) => u.role === 'NEW_MUSLIM');
    return newMuslims.map((student) => {
      const progress = this.store.ensureLearningProgress(student.id);
      const quizAttempts = this.store.quizAttempts.filter((a) => a.newMuslimId === student.id);
      const finalAttempts = this.store.finalAttempts.filter((a) => a.newMuslimId === student.id);
      const certificate =
        this.store.certificates.find((c) => c.newMuslimId === student.id && !c.isRevoked) ||
        this.store.certificates.find((c) => c.newMuslimId === student.id) ||
        null;

      return {
        user: student,
        progress,
        completedLessonsCount: progress.completedLessonsCount,
        unlockedLessonNumber: progress.unlockedLessonNumber,
        quizAttempts,
        finalAttempts,
        finalExamPassed: progress.finalExamPassed,
        certificate,
      };
    });
  }

  /** Approves or rejects a pending predefined quick-reply draft under Supervisor review. */
  async reviewPredefinedMessage(
    supervisorOrParams:
      | string
      | { supervisorId: string; templateId: string; decision: 'APPROVE' | 'REJECT'; notes?: string },
    messageIdArg?: string,
    decisionArg?: 'APPROVE' | 'REJECT'
  ): Promise<Result<PredefinedMessage, WorkflowError>> {
    const { supervisorId, templateId, decision } = normalizePredefinedReviewArgs(
      supervisorOrParams,
      messageIdArg,
      decisionArg
    );
    const supervisor = this.store.findUserById(supervisorId);
    if (!supervisor || !SUPERVISOR_ROLES.includes(supervisor.role)) {
      return err('UNAUTHORIZED_SUPERVISOR');
    }

    const msg = this.store.predefinedMessages.find((m) => m.id === templateId);
    if (!msg) return err('MESSAGE_NOT_FOUND');

    if (decision === 'APPROVE') {
      const approved = new SupervisorEntity(supervisor).approveQuickMessage(
        hydratePredefinedMessage(msg)
      );
      Object.assign(msg, approved.toRecord());
    } else {
      msg.isApproved = false;
      msg.status = 'REJECTED';
    }
    return ok(msg);
  }

  /** Alias wrapper for approving or rejecting an educational lesson draft. */
  async reviewLessonContent(params: {
    supervisorId: string;
    lessonId: string;
    decision: 'APPROVE' | 'REJECT';
    notes?: string;
  }): Promise<Result<LearningContent, WorkflowError>> {
    return this.reviewLesson(params.supervisorId, params.lessonId, params.decision, params.notes);
  }

  /** Approves or rejects a lesson draft under Sharia Supervisor oversight. */
  async reviewLesson(
    supervisorId: string,
    lessonId: string,
    decision: 'APPROVE' | 'REJECT',
    feedback?: string
  ): Promise<Result<LearningContent, WorkflowError>> {
    const supervisor = this.store.findUserById(supervisorId);
    if (!supervisor || !SUPERVISOR_ROLES.includes(supervisor.role)) {
      return err('UNAUTHORIZED_SUPERVISOR');
    }

    const lesson = this.store.learningContents.find((l) => l.id === lessonId);
    if (!lesson) return err('LESSON_NOT_FOUND');

    if (decision === 'APPROVE') {
      const approved = new SupervisorEntity(supervisor).approveEducationalContent(
        hydrateLearningContent(lesson)
      );
      Object.assign(lesson, approved.toRecord(), { reviewNotes: feedback?.trim() || null });
    } else {
      lesson.status = 'REJECTED';
      lesson.isApproved = false;
      lesson.reviewNotes = feedback?.trim() || null;
    }
    return ok(lesson);
  }

  /** Lists conversations filtered by optional status for supervisor auditing. */
  async getConversationsAudit(
    _supervisorId: string,
    filter?: { status?: string }
  ): Promise<Conversation[]> {
    return this.store.conversations.filter((c) => !filter?.status || c.status === filter.status);
  }

  /** Compiles the complete read-only supervision overview across all platform modules. */
  async getSupervisorAuditData(): Promise<SupervisorAuditOverview> {
    const studentProgress = await this.getStudentProgressSupervision();
    return {
      conversations: [...this.store.conversations],
      staff: this.store.users.filter((u) => STAFF_ROLES.includes(u.role)),
      studentProgress,
      pendingLessons: this.store.learningContents.filter(
        (l) => !l.isApproved && l.status !== 'REJECTED'
      ),
      pendingPredefinedMessages: this.store.predefinedMessages.filter(
        (m) => !m.isApproved && m.status !== 'REJECTED'
      ),
      certificates: [...this.store.certificates],
    };
  }

  /** Provisions an active, verified staff account under Administrator authority. */
  async createStaffAccount(
    input: CreateStaffAccountInput
  ): Promise<Result<User, WorkflowError>> {
    if (!this.hasRole(input.adminId, ['ADMINISTRATOR'])) return err('UNAUTHORIZED_ADMIN');
    if (!STAFF_ROLES.includes(input.role)) return err('INVALID_ROLE');
    if (this.store.findUserByEmail(input.email)) return err('EMAIL_ALREADY_EXISTS');

    const rawPw = input.password?.trim() || 'staff_hashed_credential';
    const passwordHashed = rawPw.startsWith('scrypt:') ? rawPw : await hashPassword(rawPw);
    const newStaff = buildStaffUserRecord(input, passwordHashed);
    this.store.users.push(newStaff);
    return ok(newStaff);
  }

  /** Updates a target user's role or status under Administrator authority. */
  async updateUserRole(input: {
    adminId: string;
    targetUserId: string;
    newRole?: UserRole;
    newStatus?: 'ACTIVE' | 'SUSPENDED';
  }): Promise<Result<User, WorkflowError>> {
    if (!this.hasRole(input.adminId, ['ADMINISTRATOR'])) return err('UNAUTHORIZED_ADMIN');
    const target = this.store.findUserById(input.targetUserId);
    if (!target) return err('USER_NOT_FOUND');

    if (input.newRole) target.role = input.newRole;
    if (input.newStatus) target.status = input.newStatus;
    target.updatedAt = new Date().toISOString();
    return ok(target);
  }

  /** Uploads and publishes a public Islamic library resource under Administrator authority. */
  async uploadIslamicResource(
    input: UploadIslamicResourceInput
  ): Promise<Result<IslamicResource, WorkflowError>> {
    if (!this.hasRole(input.adminId, ['ADMINISTRATOR'])) return err('UNAUTHORIZED_ADMIN');
    const resource = buildIslamicResourceRecord(input);
    this.store.islamicResources.push(resource);
    return ok(resource);
  }

  /** Deletes a resource, lesson, or predefined message under Administrator authority. */
  async deletePlatformContent(input: {
    adminId: string;
    contentType: 'RESOURCE' | 'LESSON' | 'PREDEFINED_MESSAGE';
    contentId: string;
  }): Promise<Result<void, WorkflowError>> {
    if (!this.hasRole(input.adminId, ['ADMINISTRATOR'])) return err('UNAUTHORIZED_ADMIN');
    const collections = {
      RESOURCE: { list: this.store.islamicResources, notFound: 'RESOURCE_NOT_FOUND' as const },
      LESSON: { list: this.store.learningContents, notFound: 'LESSON_NOT_FOUND' as const },
      PREDEFINED_MESSAGE: {
        list: this.store.predefinedMessages,
        notFound: 'MESSAGE_NOT_FOUND' as const,
      },
    };
    const target = collections[input.contentType];
    if (!target) return ok(undefined);

    const idx = target.list.findIndex((item) => item.id === input.contentId);
    if (idx === -1) return err(target.notFound);
    target.list.splice(idx, 1);
    return ok(undefined);
  }

  /** Delegates certificate revocation to the Academy service under Administrator governance. */
  async revokeCertificate(input: {
    adminId: string;
    certificateId: string;
    reason: string;
  }): Promise<Result<void, WorkflowError>> {
    const res = await this.academy.revokeCertificate(
      input.adminId,
      input.certificateId,
      input.reason
    );
    return res.ok ? ok(undefined) : err(res.error as WorkflowError);
  }

  /** Checks whether `userId` resolves to a persisted user holding one of `allowed` roles. */
  private hasRole(userId: string, allowed: UserRole[]): boolean {
    const user = this.store.findUserById(userId);
    return Boolean(user && allowed.includes(user.role));
  }
}

/**
 * Constant definition for content workflow service.
 */
export const contentWorkflowService = new ContentWorkflowServiceImpl();
