/**
 * Module architecture and API reference for `src/lib/services/academy-service.ts`.
 *
 * Exported symbols:
 * - `AcademyErrorCode` (TypeAlias): academy error code definition.
 * - `AcademyError` (TypeAlias): academy error definition.
 * - `AcademyProgress` (Interface): academy progress definition.
 * - `AcademyService` (Interface): academy service definition.
 * - `AcademyServiceImpl` (Class): academy service impl definition.
 * - `academyService` (Const): academy service definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/pdf/certificate-generator`
 * - `@/lib/domain`
 * - `@/lib/db/types`
 * - `./academy-helpers`
 *
 * @module lib/services/academy-service
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Application service module implementing academy service business rules.
 * Coordinates domain invariants, persistence updates, and structured Result responses.
 * @module lib/services/academy-service
 * @exports AcademyErrorCode, AcademyError, AcademyProgress, AcademyService,
 *   AcademyServiceImpl, academyService
 */

import { db as defaultDb, type InMemoryDatabaseAdapter } from '@/lib/db/in-memory-adapter';
import { generateCertificatePdfBytes } from '@/lib/pdf/certificate-generator';
import {
  Question as QuestionEntity,
  Quiz as QuizEntity,
  hydrateLearningProgress,
} from '@/lib/domain';
import {
  ok,
  err,
  type Result,
  type LearningContent,
  type LearningProgress,
  type Question,
  type QuizAttempt,
  type FinalAttempt,
  type Certificate,
} from '@/lib/db/types';
import { ensureGraduationCertificate, scoreQuestions } from './academy-helpers';

/**
 * Type alias representing academy error code.
 */
export type AcademyErrorCode =
  | 'LESSON_NOT_FOUND'
  | 'LESSON_LOCKED'
  | 'PREREQUISITES_NOT_MET'
  | 'QUIZ_NOT_FOUND'
  | 'CERTIFICATE_NOT_FOUND'
  | 'UNAUTHORIZED_ADMIN';

/**
 * Type alias representing academy error.
 */
export type AcademyError = AcademyErrorCode;

/** Learner roadmap progress enriched with active lesson and quiz history. */
export interface AcademyProgress extends LearningProgress {
  activeLessonNumber: number;
  overallProgressPercentage: number;
  quizAttempts: QuizAttempt[];
}

/** Contract for New Muslim Academy lessons, quizzes, exams, and certification. */
export interface AcademyService {
  getProgress(newMuslimId: string): Promise<AcademyProgress>;
  getLessonDetail(
    newMuslimId: string,
    lessonNumber: number
  ): Promise<Result<LearningContent, AcademyError>>;
  getLessonQuiz(
    newMuslimId: string,
    lessonNumber: number
  ): Promise<Result<Question[], AcademyError>>;
  submitLessonQuiz(
    newMuslimId: string,
    lessonNumber: number,
    answers: Record<string, number>
  ): Promise<Result<QuizAttempt, AcademyError>>;
  getFinalExam(newMuslimId: string): Promise<Result<Question[], AcademyError>>;
  submitFinalExam(
    newMuslimId: string,
    answers: Record<string, number>
  ): Promise<Result<FinalAttempt, AcademyError>>;
  executeEvaluationShortcut(
    newMuslimId: string,
    mode: 'PASS_LESSON' | 'PASS_ALL_AND_GRADUATE',
    targetLessonNumber?: number
  ): Promise<LearningProgress>;
  generateCertificatePdf(certificateId: string): Promise<Result<Uint8Array, AcademyError>>;
  verifyCertificate(certificateId: string): Promise<Result<Certificate, AcademyError>>;
  revokeCertificate(
    adminId: string,
    certificateId: string,
    reason: string
  ): Promise<Result<void, AcademyError>>;
}

/**
 * Manages sequential lesson gating, 80% pass evaluations, final exams,
 * and verifiable graduation certificates for New Muslim learners.
 */
export class AcademyServiceImpl implements AcademyService {
  private readonly store: InMemoryDatabaseAdapter;

  constructor(store: InMemoryDatabaseAdapter = defaultDb) {
    this.store = store;
  }

  /** Returns the learner's roadmap state, completion ratio, and quiz attempt log. */
  async getProgress(newMuslimId: string): Promise<AcademyProgress> {
    const progress = this.store.ensureLearningProgress(newMuslimId);
    const attempts = this.store.quizAttempts.filter((a) => a.newMuslimId === newMuslimId);
    const activeLessonNumber = progress.allQuizzesPassed
      ? 7
      : Math.min(7, Math.max(1, progress.unlockedLessonNumber));
    const overallProgressPercentage = progress.finalExamPassed
      ? 100
      : Math.round((progress.completedLessonsCount / 7) * 100);

    return { ...progress, activeLessonNumber, overallProgressPercentage, quizAttempts: attempts };
  }

  /** Fetches an approved lesson when unlocked for the learner. */
  async getLessonDetail(
    newMuslimId: string,
    lessonNumber: number
  ): Promise<Result<LearningContent, AcademyError>> {
    if (lessonNumber < 1) return err('LESSON_NOT_FOUND');

    const progress = this.store.ensureLearningProgress(newMuslimId);
    if (lessonNumber > progress.unlockedLessonNumber) return err('LESSON_LOCKED');

    const lesson = this.store.learningContents.find(
      (l) => l.lessonNumber === lessonNumber && l.isApproved
    );
    return lesson ? ok(lesson) : err('LESSON_NOT_FOUND');
  }

  /** Returns quiz questions for an unlocked academy lesson. */
  async getLessonQuiz(
    newMuslimId: string,
    lessonNumber: number
  ): Promise<Result<Question[], AcademyError>> {
    const progress = this.store.ensureLearningProgress(newMuslimId);
    if (lessonNumber > progress.unlockedLessonNumber) return err('LESSON_LOCKED');

    const quiz = this.store.getQuizByLessonNumber(lessonNumber);
    if (!quiz) return err('QUIZ_NOT_FOUND');

    return ok(this.store.getQuestionsForQuiz(quiz.id));
  }

  /** Grades a lesson quiz submission and unlocks the next lesson on >= 80% score. */
  async submitLessonQuiz(
    newMuslimId: string,
    lessonNumber: number,
    answers: Record<string, number>
  ): Promise<Result<QuizAttempt, AcademyError>> {
    const progress = this.store.ensureLearningProgress(newMuslimId);
    if (lessonNumber > progress.unlockedLessonNumber) return err('LESSON_LOCKED');

    const quiz = this.store.getQuizByLessonNumber(lessonNumber);
    if (!quiz) return err('QUIZ_NOT_FOUND');

    const questions = this.store.getQuestionsForQuiz(quiz.id);
    const quizEntity = new QuizEntity(
      quiz,
      questions.map((q) => new QuestionEntity(q))
    );
    const { scorePercentage, isPassed } =
      questions.length > 0
        ? quizEntity.submitQuiz(answers)
        : { scorePercentage: 0, isPassed: false };

    const attempt: QuizAttempt = {
      id: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      quizId: quiz.id,
      newMuslimId,
      scorePercentage,
      isPassed,
      answersJson: answers,
      attemptDate: new Date().toISOString(),
    };
    this.store.quizAttempts.push(attempt);

    if (isPassed) {
      const updated = hydrateLearningProgress(progress).updateProgress(
        Math.max(progress.completedLessonsCount, lessonNumber),
        7
      );
      Object.assign(progress, updated.toRecord());
    }

    this.store.save();
    return ok(attempt);
  }

  /** Returns the 100-question final exam once all 7 lesson quizzes are passed. */
  async getFinalExam(newMuslimId: string): Promise<Result<Question[], AcademyError>> {
    const progress = this.store.ensureLearningProgress(newMuslimId);
    if (!progress.allQuizzesPassed && progress.completedLessonsCount < 7) {
      return err('PREREQUISITES_NOT_MET');
    }
    return ok(this.store.getFinalExamQuestions());
  }

  /** Evaluates the final exam and issues a verifiable graduation certificate on pass. */
  async submitFinalExam(
    newMuslimId: string,
    answers: Record<string, number>
  ): Promise<Result<FinalAttempt, AcademyError>> {
    const progress = this.store.ensureLearningProgress(newMuslimId);
    if (!progress.allQuizzesPassed && progress.completedLessonsCount < 7) {
      return err('PREREQUISITES_NOT_MET');
    }

    const questions = this.store.getFinalExamQuestions();
    const scorePercentage = scoreQuestions(questions, answers);
    const isPassed = scorePercentage >= this.store.finalExam.passingPercentage;

    const attempt: FinalAttempt = {
      id: `fa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      examId: this.store.finalExam.id,
      newMuslimId,
      scorePercentage,
      isPassed,
      answersJson: answers,
      attemptDate: new Date().toISOString(),
    };
    this.store.finalAttempts.push(attempt);

    if (isPassed) {
      progress.finalExamPassed = true;
      progress.updatedAt = new Date().toISOString();
      ensureGraduationCertificate(this.store, newMuslimId, attempt.id);
    }

    this.store.save();
    return ok(attempt);
  }

  /** Advances learner progress directly for evaluation and demo workflows. */
  async executeEvaluationShortcut(
    newMuslimId: string,
    mode: 'PASS_LESSON' | 'PASS_ALL_AND_GRADUATE',
    targetLessonNumber?: number
  ): Promise<LearningProgress> {
    const progress = this.store.ensureLearningProgress(newMuslimId);

    if (mode === 'PASS_LESSON') {
      const target = targetLessonNumber || progress.unlockedLessonNumber || 1;
      progress.completedLessonsCount = Math.max(progress.completedLessonsCount, target);
      if (target < 7) {
        progress.unlockedLessonNumber = Math.max(progress.unlockedLessonNumber, target + 1);
      } else {
        progress.allQuizzesPassed = true;
      }
      progress.updatedAt = new Date().toISOString();
      this.store.save();
      return progress;
    }

    if (mode === 'PASS_ALL_AND_GRADUATE') {
      progress.completedLessonsCount = 7;
      progress.unlockedLessonNumber = 7;
      progress.allQuizzesPassed = true;
      progress.finalExamPassed = true;
      progress.updatedAt = new Date().toISOString();
      ensureGraduationCertificate(this.store, newMuslimId, `fa-shortcut-${Date.now()}`);
      this.store.save();
    }

    return progress;
  }

  /** Renders official vector PDF bytes for a certificate ID or QR hash. */
  async generateCertificatePdf(
    certificateId: string
  ): Promise<Result<Uint8Array, AcademyError>> {
    const cert = this.findCertificateByIdOrHash(certificateId);
    if (!cert) return err('CERTIFICATE_NOT_FOUND');
    return ok(await generateCertificatePdfBytes(cert));
  }

  /** Verifies authenticity of a certificate by ID or QR hash. */
  async verifyCertificate(certificateId: string): Promise<Result<Certificate, AcademyError>> {
    const cert = this.findCertificateByIdOrHash(certificateId);
    return cert ? ok(cert) : err('CERTIFICATE_NOT_FOUND');
  }

  /** Revokes an issued certificate under Administrator authority. */
  async revokeCertificate(
    adminId: string,
    certificateId: string,
    reason: string
  ): Promise<Result<void, AcademyError>> {
    const admin = this.store.findUserById(adminId);
    if (!admin || admin.role !== 'ADMINISTRATOR') return err('UNAUTHORIZED_ADMIN');

    const cert = this.store.certificates.find((c) => c.id === certificateId);
    if (!cert) return err('CERTIFICATE_NOT_FOUND');

    cert.isRevoked = true;
    cert.revocationReason = reason;
    cert.revokedByAdminId = adminId;
    this.store.save();
    return ok(undefined);
  }

  /**
   * Executes find certificate by id or hash logic.
   * @param certificateId - Certificate id value (`string`).
   * @returns Result of type `Certificate | undefined`.
   */
  private findCertificateByIdOrHash(certificateId: string): Certificate | undefined {
    return this.store.certificates.find(
      (c) => c.id === certificateId || c.verificationQrHash === certificateId
    );
  }
}

/**
 * Constant definition for academy service.
 */
export const academyService = new AcademyServiceImpl();
