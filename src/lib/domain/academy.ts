/**
 * Module architecture and API reference for `src/lib/domain/academy.ts`.
 *
 * Exported symbols:
 * - `Question` (Class): question definition.
 * - `Quiz` (Class): quiz definition.
 * - `FinalExam` (Class): final exam definition.
 * - `LearningContent` (Class): learning content definition.
 * - `LearningProgress` (Class): learning progress definition.
 * - `QuizAttempt` (Class): quiz attempt definition.
 * - `FinalAttempt` (Class): final attempt definition.
 * - `Certificate` (Class): certificate definition.
 * - `IslamicResource` (Class): islamic resource definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `./users`
 *
 * @module lib/domain/academy
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Core domain model definitions for academy entities and state transitions.
 * Aligned with the Al-Hiwar UML class diagram contracts and entity invariants.
 * @module lib/domain/academy
 * @exports Question, Quiz, FinalExam, LearningContent, LearningProgress, QuizAttempt
 */

import type {
  Certificate as CertificateRecord,
  ContentStatus,
  FinalAttempt as FinalAttemptRecord,
  FinalExam as FinalExamRecord,
  IslamicResource as IslamicResourceRecord,
  LearningContent as LearningContentRecord,
  LearningProgress as LearningProgressRecord,
  Question as QuestionRecord,
  Quiz as QuizRecord,
  QuizAttempt as QuizAttemptRecord,
  ResourceCategory,
  ResourceType,
  SupportedLanguage,
} from '@/lib/db/types';
import type {
  Administrator,
  IslamicInstructor,
  NewMuslim,
  Supervisor,
} from './users';

/**
 * Multiple-choice assessment question belonging to a Quiz or FinalExam.
 */
export class Question {
  id: string;
  quizId: string | null;
  lessonNumber?: number;
  isFinalExam: boolean;
  promptEn: string;
  promptFr: string;
  optionsJson: [string, string, string, string];
  optionsFrJson?: [string, string, string, string];
  correctOptionIndex: 0 | 1 | 2 | 3;
  explanationEn: string;
  explanationFr: string;

  constructor(record: QuestionRecord) {
    this.id = record.id;
    this.quizId = record.quizId;
    this.lessonNumber = record.lessonNumber;
    this.isFinalExam = record.isFinalExam;
    this.promptEn = record.promptEn;
    this.promptFr = record.promptFr;
    this.optionsJson = record.optionsJson;
    this.optionsFrJson = record.optionsFrJson;
    this.correctOptionIndex = record.correctOptionIndex;
    this.explanationEn = record.explanationEn;
    this.explanationFr = record.explanationFr;
  }

  /**
   * Serializes this question into a plain JSON record.
   */
  toRecord(): QuestionRecord {
    return {
      id: this.id,
      quizId: this.quizId,
      lessonNumber: this.lessonNumber,
      isFinalExam: this.isFinalExam,
      promptEn: this.promptEn,
      promptFr: this.promptFr,
      optionsJson: this.optionsJson,
      optionsFrJson: this.optionsFrJson,
      correctOptionIndex: this.correctOptionIndex,
      explanationEn: this.explanationEn,
      explanationFr: this.explanationFr,
    };
  }
}

/**
 * Lesson-level assessment quiz composed of multiple-choice questions.
 */
export class Quiz {
  id: string;
  lessonId: string;
  lessonNumber: number;
  passingPercentage: number;
  totalQuestions: number;
  isPublished: boolean;
  questions: Question[];

  constructor(record: QuizRecord, questions: Question[] = []) {
    this.id = record.id;
    this.lessonId = record.lessonId;
    this.lessonNumber = record.lessonNumber;
    this.passingPercentage = record.passingPercentage;
    this.totalQuestions = record.totalQuestions;
    this.isPublished = record.isPublished;
    this.questions = questions;
  }

  /**
   * Returns published questions to begin this lesson quiz.
   */
  startQuiz(): Question[] {
    return this.isPublished ? [...this.questions] : [];
  }

  /**
   * Evaluates submitted answers against the quiz passing threshold.
   */
  submitQuiz(answers: Record<string, number>): {
    scorePercentage: number;
    isPassed: boolean;
  } {
    const total = this.questions.length || this.totalQuestions || 1;
    let correct = 0;
    for (const q of this.questions) {
      if (answers[q.id] === q.correctOptionIndex) {
        correct += 1;
      }
    }
    const scorePercentage = Math.round((correct / total) * 100);
    return {
      scorePercentage,
      isPassed: scorePercentage >= this.passingPercentage,
    };
  }

  /**
   * Serializes this quiz into a plain JSON record.
   */
  toRecord(): QuizRecord {
    return {
      id: this.id,
      lessonId: this.lessonId,
      lessonNumber: this.lessonNumber,
      passingPercentage: this.passingPercentage,
      totalQuestions: this.totalQuestions,
      isPublished: this.isPublished,
    };
  }
}

/**
 * Comprehensive academy final examination composed of 100 questions.
 */
export class FinalExam {
  id: string;
  totalQuestions: number;
  passingPercentage: number;
  isPublished: boolean;
  questions: Question[];

  constructor(record: FinalExamRecord, questions: Question[] = []) {
    this.id = record.id;
    this.totalQuestions = record.totalQuestions;
    this.passingPercentage = record.passingPercentage;
    this.isPublished = record.isPublished;
    this.questions = questions;
  }

  /**
   * Returns published examination questions to start the final exam.
   */
  startFinalExam(): Question[] {
    return this.isPublished ? [...this.questions] : [];
  }

  /**
   * Evaluates submitted final exam answers against the 80% pass requirement.
   */
  submitFinalExam(answers: Record<string, number>): {
    scorePercentage: number;
    isPassed: boolean;
  } {
    const total = this.questions.length || this.totalQuestions || 1;
    let correct = 0;
    for (const q of this.questions) {
      if (answers[q.id] === q.correctOptionIndex) {
        correct += 1;
      }
    }
    const scorePercentage = Math.round((correct / total) * 100);
    return {
      scorePercentage,
      isPassed: scorePercentage >= this.passingPercentage,
    };
  }

  /**
   * Serializes this final exam into a plain JSON record.
   */
  toRecord(): FinalExamRecord {
    return {
      id: this.id,
      totalQuestions: this.totalQuestions,
      passingPercentage: this.passingPercentage,
      isPublished: this.isPublished,
    };
  }
}

/**
 * Structured educational lesson authored by an Instructor and approved by a Supervisor.
 */
export class LearningContent {
  id: string;
  lessonNumber: number;
  titleEn: string;
  titleFr: string;
  contentMarkdownEn: string;
  contentMarkdownFr: string;
  pdfGuideUrl?: string | null;
  audioLectureUrl?: string | null;
  videoLectureUrl?: string | null;
  status: ContentStatus;
  isApproved: boolean;
  authorId: string;
  approvedById: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  quiz?: Quiz;
  author?: IslamicInstructor;
  approvedBy?: Supervisor;

  constructor(record: LearningContentRecord, quiz?: Quiz) {
    this.id = record.id;
    this.lessonNumber = record.lessonNumber;
    this.titleEn = record.titleEn;
    this.titleFr = record.titleFr;
    this.contentMarkdownEn = record.contentMarkdownEn;
    this.contentMarkdownFr = record.contentMarkdownFr;
    this.pdfGuideUrl = record.pdfGuideUrl;
    this.audioLectureUrl = record.audioLectureUrl;
    this.videoLectureUrl = record.videoLectureUrl;
    this.status = record.status;
    this.isApproved = record.isApproved;
    this.authorId = record.authorId;
    this.approvedById = record.approvedById;
    this.reviewNotes = record.reviewNotes;
    this.createdAt = record.createdAt;
    this.quiz = quiz;
  }

  /**
   * Returns localized markdown body for this educational lesson.
   */
  displayContent(language: SupportedLanguage = 'en'): string {
    return language === 'fr' ? this.contentMarkdownFr : this.contentMarkdownEn;
  }

  /**
   * Serializes this learning content into a plain JSON record.
   */
  toRecord(): LearningContentRecord {
    return {
      id: this.id,
      lessonNumber: this.lessonNumber,
      titleEn: this.titleEn,
      titleFr: this.titleFr,
      contentMarkdownEn: this.contentMarkdownEn,
      contentMarkdownFr: this.contentMarkdownFr,
      pdfGuideUrl: this.pdfGuideUrl,
      audioLectureUrl: this.audioLectureUrl,
      videoLectureUrl: this.videoLectureUrl,
      status: this.status,
      isApproved: this.isApproved,
      authorId: this.authorId,
      approvedById: this.approvedById,
      reviewNotes: this.reviewNotes,
      createdAt: this.createdAt,
    };
  }
}

/**
 * Tracks a New Muslim learner's sequential progress across academy lessons.
 */
export class LearningProgress {
  id: string;
  newMuslimId: string;
  completedLessonsCount: number;
  unlockedLessonNumber: number;
  allQuizzesPassed: boolean;
  finalExamPassed: boolean;
  updatedAt: string;
  newMuslim?: NewMuslim;
  currentLesson?: LearningContent;

  constructor(record: LearningProgressRecord) {
    this.id = record.id;
    this.newMuslimId = record.newMuslimId;
    this.completedLessonsCount = record.completedLessonsCount;
    this.unlockedLessonNumber = record.unlockedLessonNumber;
    this.allQuizzesPassed = record.allQuizzesPassed;
    this.finalExamPassed = record.finalExamPassed;
    this.updatedAt = record.updatedAt;
  }

  /**
   * Advances unlocked lessons and updates completion status after passing a quiz.
   */
  updateProgress(completedCount: number, totalLessons: number): LearningProgress {
    this.completedLessonsCount = completedCount;
    this.unlockedLessonNumber = Math.min(totalLessons, completedCount + 1);
    this.allQuizzesPassed = totalLessons > 0 && completedCount >= totalLessons;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  /**
   * Determines whether the learner has passed all lesson quizzes for the final exam.
   */
  checkFinalExamEligibility(): boolean {
    return this.allQuizzesPassed && this.completedLessonsCount > 0;
  }

  /**
   * Serializes this progress entity into a plain JSON record.
   */
  toRecord(): LearningProgressRecord {
    return {
      id: this.id,
      newMuslimId: this.newMuslimId,
      completedLessonsCount: this.completedLessonsCount,
      unlockedLessonNumber: this.unlockedLessonNumber,
      allQuizzesPassed: this.allQuizzesPassed,
      finalExamPassed: this.finalExamPassed,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Recorded attempt by a New Muslim learner on a lesson quiz.
 */
export class QuizAttempt {
  id: string;
  quizId: string;
  newMuslimId: string;
  scorePercentage: number;
  isPassed: boolean;
  answersJson: Record<string, number>;
  attemptDate: string;
  quiz?: Quiz;
  learningProgress?: LearningProgress;

  constructor(record: QuizAttemptRecord) {
    this.id = record.id;
    this.quizId = record.quizId;
    this.newMuslimId = record.newMuslimId;
    this.scorePercentage = record.scorePercentage;
    this.isPassed = record.isPassed;
    this.answersJson = record.answersJson;
    this.attemptDate = record.attemptDate;
  }

  /**
   * Serializes this quiz attempt into a plain JSON record.
   */
  toRecord(): QuizAttemptRecord {
    return {
      id: this.id,
      quizId: this.quizId,
      newMuslimId: this.newMuslimId,
      scorePercentage: this.scorePercentage,
      isPassed: this.isPassed,
      answersJson: this.answersJson,
      attemptDate: this.attemptDate,
    };
  }
}

/**
 * Recorded attempt by a New Muslim learner on the comprehensive final exam.
 */
export class FinalAttempt {
  id: string;
  examId: string;
  newMuslimId: string;
  scorePercentage: number;
  isPassed: boolean;
  answersJson: Record<string, number>;
  attemptDate: string;
  finalExam?: FinalExam;
  learningProgress?: LearningProgress;

  constructor(record: FinalAttemptRecord) {
    this.id = record.id;
    this.examId = record.examId;
    this.newMuslimId = record.newMuslimId;
    this.scorePercentage = record.scorePercentage;
    this.isPassed = record.isPassed;
    this.answersJson = record.answersJson;
    this.attemptDate = record.attemptDate;
  }

  /**
   * Serializes this final exam attempt into a plain JSON record.
   */
  toRecord(): FinalAttemptRecord {
    return {
      id: this.id,
      examId: this.examId,
      newMuslimId: this.newMuslimId,
      scorePercentage: this.scorePercentage,
      isPassed: this.isPassed,
      answersJson: this.answersJson,
      attemptDate: this.attemptDate,
    };
  }
}

/**
 * Verifiable Islamic Academy graduation certificate issued to a New Muslim.
 */
export class Certificate {
  id: string;
  newMuslimId: string;
  finalAttemptId: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  issueDate: string;
  verificationQrHash: string;
  pdfFileUrl: string;
  isRevoked: boolean;
  revocationReason?: string | null;
  revokedByAdminId?: string | null;
  createdAt: string;
  newMuslim?: NewMuslim;

  constructor(record: CertificateRecord) {
    this.id = record.id;
    this.newMuslimId = record.newMuslimId;
    this.finalAttemptId = record.finalAttemptId;
    this.fullName = record.fullName;
    this.dateOfBirth = record.dateOfBirth;
    this.nationality = record.nationality;
    this.issueDate = record.issueDate;
    this.verificationQrHash = record.verificationQrHash;
    this.pdfFileUrl = record.pdfFileUrl;
    this.isRevoked = record.isRevoked;
    this.revocationReason = record.revocationReason;
    this.revokedByAdminId = record.revokedByAdminId;
    this.createdAt = record.createdAt;
  }

  /**
   * Finalizes issuance metadata for an eligible learner's graduation certificate.
   */
  generateCertificate(progress: LearningProgress): Certificate {
    if (progress.checkFinalExamEligibility() && progress.finalExamPassed) {
      this.issueDate = this.issueDate || new Date().toISOString();
      this.pdfFileUrl = `/api/certificates/${this.id}/download`;
      this.isRevoked = false;
    }
    return this;
  }

  /**
   * Serializes this certificate into a plain JSON record.
   */
  toRecord(): CertificateRecord {
    return {
      id: this.id,
      newMuslimId: this.newMuslimId,
      finalAttemptId: this.finalAttemptId,
      fullName: this.fullName,
      dateOfBirth: this.dateOfBirth,
      nationality: this.nationality,
      issueDate: this.issueDate,
      verificationQrHash: this.verificationQrHash,
      pdfFileUrl: this.pdfFileUrl,
      isRevoked: this.isRevoked,
      revocationReason: this.revocationReason,
      revokedByAdminId: this.revokedByAdminId,
      createdAt: this.createdAt,
    };
  }
}

/**
 * Public educational Islamic resource uploaded by a Platform Administrator.
 */
export class IslamicResource {
  id: string;
  uploadedByAdminId: string;
  titleEn: string;
  titleFr: string;
  category: ResourceCategory;
  resourceType: ResourceType;
  mediaUrl: string;
  descriptionEn: string;
  descriptionFr: string;
  isPublic: boolean;
  createdAt: string;
  uploadedBy?: Administrator;

  constructor(record: IslamicResourceRecord) {
    this.id = record.id;
    this.uploadedByAdminId = record.uploadedByAdminId;
    this.titleEn = record.titleEn;
    this.titleFr = record.titleFr;
    this.category = record.category;
    this.resourceType = record.resourceType;
    this.mediaUrl = record.mediaUrl;
    this.descriptionEn = record.descriptionEn;
    this.descriptionFr = record.descriptionFr;
    this.isPublic = record.isPublic;
    this.createdAt = record.createdAt;
  }

  /**
   * Serializes this resource into a plain JSON record.
   */
  toRecord(): IslamicResourceRecord {
    return {
      id: this.id,
      uploadedByAdminId: this.uploadedByAdminId,
      titleEn: this.titleEn,
      titleFr: this.titleFr,
      category: this.category,
      resourceType: this.resourceType,
      mediaUrl: this.mediaUrl,
      descriptionEn: this.descriptionEn,
      descriptionFr: this.descriptionFr,
      isPublic: this.isPublic,
      createdAt: this.createdAt,
    };
  }
}
