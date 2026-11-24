/**
 * Module architecture and API reference for `src/lib/db/academy-types.ts`.
 *
 * Exported symbols:
 * - `ResourceCategory` (TypeAlias): resource category definition.
 * - `ResourceType` (TypeAlias): resource type definition.
 * - `LearningContent` (TypeAlias): learning content definition.
 * - `Quiz` (TypeAlias): quiz definition.
 * - `Question` (TypeAlias): question definition.
 * - `QuizAttempt` (TypeAlias): quiz attempt definition.
 * - `FinalExam` (TypeAlias): final exam definition.
 * - `FinalAttempt` (TypeAlias): final attempt definition.
 * - `Certificate` (TypeAlias): certificate definition.
 * - `LearningProgress` (TypeAlias): learning progress definition.
 * - `IslamicResource` (TypeAlias): islamic resource definition.
 *
 * Internal dependencies:
 * - `./dialogue-types`
 *
 * @module lib/db/academy-types
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Academy curriculum, assessment, certificate, and Islamic Library data contracts.
 */

import type { ContentStatus } from './dialogue-types';

/** Public Islamic Library topical categories. */
export type ResourceCategory =
  | 'QURAN'
  | 'PROPHET'
  | 'PILLARS'
  | 'ETHICS'
  | 'MISCONCEPTIONS';

/** Media delivery formats supported by the Islamic Library. */
export type ResourceType = 'TEXT' | 'PDF' | 'AUDIO' | 'VIDEO';

/** Sequential curriculum lesson authored by Instructors and approved by Supervisors. */
export type LearningContent = {
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
};

/** Module-level 20-question quiz metadata. */
export type Quiz = {
  id: string;
  lessonId: string;
  lessonNumber: number;
  passingPercentage: number;
  totalQuestions: number;
  isPublished: boolean;
};

/** Multiple-choice assessment question for a lesson quiz or the capstone final exam. */
export type Question = {
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
};

/** Graded learner attempt on a module quiz. */
export type QuizAttempt = {
  id: string;
  quizId: string;
  newMuslimId: string;
  scorePercentage: number;
  isPassed: boolean;
  answersJson: Record<string, number>;
  attemptDate: string;
};

/** Capstone 100-question comprehensive final exam specification. */
export type FinalExam = {
  id: string;
  totalQuestions: number;
  passingPercentage: number;
  isPublished: boolean;
};

/** Graded learner attempt on the capstone final exam. */
export type FinalAttempt = {
  id: string;
  examId: string;
  newMuslimId: string;
  scorePercentage: number;
  isPassed: boolean;
  answersJson: Record<string, number>;
  attemptDate: string;
};

/** Verifiable A4 graduation & conversion credential with QR hash and revocation metadata. */
export type Certificate = {
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
};

/** Per-student sequential unlock and graduation tracking record. */
export type LearningProgress = {
  id: string;
  newMuslimId: string;
  completedLessonsCount: number;
  unlockedLessonNumber: number;
  allQuizzesPassed: boolean;
  finalExamPassed: boolean;
  updatedAt: string;
};

/** Publicly accessible Islamic Library resource catalog entry. */
export type IslamicResource = {
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
};
