/**
 * Barrel module re-exporting all Al Hiwar database entity types and store state shape.
 */

export * from './core-types';
export * from './dialogue-types';
export * from './academy-types';

import type { User } from './core-types';
import type {
  Conversation,
  Message,
  PredefinedMessage,
  ShahadahSubmission,
} from './dialogue-types';
import type {
  Certificate,
  FinalAttempt,
  FinalExam,
  IslamicResource,
  LearningContent,
  LearningProgress,
  Question,
  Quiz,
  QuizAttempt,
} from './academy-types';

/** Complete in-memory persistence snapshot managed by `InMemoryDatabaseAdapter`. */
export interface InMemoryStoreState {
  /** users property. */
  users: User[];
  /** conversations property. */
  conversations: Conversation[];
  /** messages property. */
  messages: Message[];
  /** predefined messages property. */
  predefinedMessages: PredefinedMessage[];
  /** shahadah submissions property. */
  shahadahSubmissions: ShahadahSubmission[];
  /** learning contents property. */
  learningContents: LearningContent[];
  /** quizzes property. */
  quizzes: Quiz[];
  /** questions property. */
  questions: Question[];
  /** quiz attempts property. */
  quizAttempts: QuizAttempt[];
  /** final exam property. */
  finalExam: FinalExam;
  /** final attempts property. */
  finalAttempts: FinalAttempt[];
  /** certificates property. */
  certificates: Certificate[];
  /** learning progress property. */
  learningProgress: LearningProgress[];
  /** islamic resources property. */
  islamicResources: IslamicResource[];
  /** active demo user id property. */
  activeDemoUserId: string | null;
}
