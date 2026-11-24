/**
 * Core domain model definitions for index entities and state transitions.
 * Aligned with the Al-Hiwar UML class diagram contracts and entity invariants.
 * @module lib/domain/index
 * @exports hydrateUser, hydrateConversation, hydrateShahadah, hydratePredefinedMessage,
 *   hydrateLearningContent, hydrateLearningProgress
 */

import type {
  Certificate as CertificateRecord,
  Conversation as ConversationRecord,
  IslamicResource as IslamicResourceRecord,
  LearningContent as LearningContentRecord,
  LearningProgress as LearningProgressRecord,
  Message as MessageRecord,
  PredefinedMessage as PredefinedMessageRecord,
  ShahadahSubmission,
  User as UserRecord,
} from '@/lib/db/types';
import {
  Administrator,
  Dialogist,
  IslamicInstructor,
  NewMuslim,
  NonMuslim,
  Supervisor,
  User,
} from './users';
import { Conversation, Message, PredefinedMessage, Shahadah } from './dialogue';
import {
  Certificate,
  FinalAttempt,
  FinalExam,
  IslamicResource,
  LearningContent,
  LearningProgress,
  Question,
  Quiz,
  QuizAttempt,
} from './academy';

export {
  User,
  Administrator,
  Supervisor,
  Dialogist,
  IslamicInstructor,
  NonMuslim,
  NewMuslim,
  Conversation,
  Message,
  PredefinedMessage,
  Shahadah,
  LearningContent,
  Quiz,
  FinalExam,
  Question,
  LearningProgress,
  QuizAttempt,
  FinalAttempt,
  Certificate,
  IslamicResource,
};

/**
 * Hydrates a persisted User JSON record into its concrete OOP User subclass.
 */
export function hydrateUser(record: UserRecord): User {
  switch (record.role) {
    case 'ADMINISTRATOR':
      return new Administrator(record);
    case 'SUPERVISOR':
      return new Supervisor(record);
    case 'DIALOGIST':
      return new Dialogist(record);
    case 'INSTRUCTOR':
      return new IslamicInstructor(record);
    case 'NEW_MUSLIM':
      return new NewMuslim(record);
    default:
      return new NonMuslim(record);
  }
}

/**
 * Hydrates a persisted Conversation record along with optional Message records.
 */
export function hydrateConversation(
  record: ConversationRecord,
  messages: MessageRecord[] = []
): Conversation {
  return new Conversation(
    record,
    messages.map((m) => new Message(m))
  );
}

/**
 * Hydrates a persisted ShahadahSubmission record into a Shahadah entity.
 */
export function hydrateShahadah(record: ShahadahSubmission): Shahadah {
  return new Shahadah(record);
}

/**
 * Hydrates a persisted PredefinedMessage record into a PredefinedMessage entity.
 */
export function hydratePredefinedMessage(
  record: PredefinedMessageRecord
): PredefinedMessage {
  return new PredefinedMessage(record);
}

/**
 * Hydrates a persisted LearningContent record into a LearningContent entity.
 */
export function hydrateLearningContent(
  record: LearningContentRecord
): LearningContent {
  return new LearningContent(record);
}

/**
 * Hydrates a persisted LearningProgress record into a LearningProgress entity.
 */
export function hydrateLearningProgress(
  record: LearningProgressRecord
): LearningProgress {
  return new LearningProgress(record);
}

/**
 * Hydrates a persisted Certificate record into a Certificate entity.
 */
export function hydrateCertificate(record: CertificateRecord): Certificate {
  return new Certificate(record);
}

/**
 * Hydrates a persisted IslamicResource record into an IslamicResource entity.
 */
export function hydrateIslamicResource(
  record: IslamicResourceRecord
): IslamicResource {
  return new IslamicResource(record);
}
