/**
 * Module architecture and API reference for `src/lib/db/seed-data.ts`.
 *
 * Exported symbols:
 * - `createInitialSeedState` (Function): create initial seed state definition.
 *
 * Internal dependencies:
 * - `./types`
 * - `./seeds/constants`
 * - `./seeds/users`
 * - `./seeds/resources-and-messages`
 * - `./seeds/curriculum`
 * - `./seeds/questions`
 *
 * @module lib/db/seed-data
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Persistence layer module defining seed data contracts and storage behavior.
 * Maintains consistent in-memory and JSON-backed platform state across requests.
 * @module lib/db/seed-data
 * @exports createInitialSeedState
 */

import type {
  InMemoryStoreState,
  Conversation,
  Message,
  ShahadahSubmission,
  LearningProgress,
  FinalExam,
  Certificate,
} from "./types";
import { NOW_ISO } from "./seeds/constants";
import { createInitialUsers } from "./seeds/users";
import {
  createInitialIslamicResources,
  createInitialPredefinedMessages,
} from "./seeds/resources-and-messages";
import {
  createInitialLearningContents,
  createInitialQuizzes,
} from "./seeds/curriculum";
import { createInitialQuestions } from "./seeds/questions";

export {
  createInitialUsers,
  createInitialIslamicResources,
  createInitialPredefinedMessages,
  createInitialLearningContents,
  createInitialQuizzes,
  createInitialQuestions,
};

/**
 * Builds the initial in-memory store state for test or clean dev/prod runtime.
 */
export function createInitialSeedState(): InMemoryStoreState {
  const isTest = process.env.NODE_ENV === 'test';
  const users = createInitialUsers();
  const islamicResources = createInitialIslamicResources();
  const predefinedMessages = createInitialPredefinedMessages();
  const learningContents = createInitialLearningContents();
  const quizzes = createInitialQuizzes();
  const questions = createInitialQuestions();

  const finalExam: FinalExam = {
    id: 'final-exam-main',
    totalQuestions: 100,
    passingPercentage: 80.0,
    isPublished: true,
  };

  const sampleConversation: Conversation = {
    id: 'conv-demo-1',
    nonMuslimId: 'user-seeker-1',
    dialogistId: 'user-dialogist-1',
    language: 'en',
    intent: 'EMBRACE_ISLAM',
    status: 'ACTIVE',
    isAssigned: true,
    inactivityNoticeSent: false,
    lastMessageAt: NOW_ISO,
    createdAt: '2026-11-08T17:40:00.000Z',
  };

  const sampleMessages: Message[] = [
    {
      id: 'msg-demo-1',
      conversationId: 'conv-demo-1',
      senderId: 'user-seeker-1',
      content:
        'Hello Sheikh Ahmad, I have been reading the Noble Qur’an and studying the life of Prophet Muhammad ﷺ for several months. My heart is at peace with Tawhid and I would like to declare my Shahadah today.',
      predefinedReplyId: null,
      hasVoiceNote: false,
      audioUrl: null,
      sentAt: '2026-11-08T17:42:00.000Z',
    },
    {
      id: 'msg-demo-2',
      conversationId: 'conv-demo-1',
      senderId: 'user-dialogist-1',
      content:
        'Alhamdulillah, welcome brother Jean-Luc! Embracing Islam begins with sincere conviction in the heart and pronouncing the Shahadah: "Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan Rasulu Allah". Whenever you are ready, record your voice note below and I will listen and validate your pronunciation.',
      predefinedReplyId: 'pm-6',
      hasVoiceNote: false,
      audioUrl: null,
      sentAt: '2026-11-08T17:45:00.000Z',
    },
    {
      id: 'msg-demo-3',
      conversationId: 'conv-demo-1',
      senderId: 'user-seeker-1',
      content:
        'I have just recorded my Shahadah audio declaration in Arabic and English for your review.',
      predefinedReplyId: null,
      hasVoiceNote: true,
      audioUrl: '/audio/sample-shahadah-jean-luc.webm',
      sentAt: '2026-11-08T17:50:00.000Z',
    },
  ];

  const sampleShahadah: ShahadahSubmission = {
    id: 'shahadah-demo-1',
    conversationId: 'conv-demo-1',
    nonMuslimId: 'user-seeker-1',
    dialogistId: 'user-dialogist-1',
    audioRecordingUrl: '/audio/sample-shahadah-jean-luc.webm',
    mimeType: 'audio/webm;codecs=opus',
    durationSeconds: 18,
    status: 'PENDING_REVIEW',
    feedbackNotes: null,
    attemptNumber: 1,
    reviewerId: null,
    reviewedAt: null,
    submittedAt: '2026-11-08T17:50:00.000Z',
    validatedAt: null,
  };

  const initialProgress: LearningProgress[] = [
    ...(isTest
      ? [
          {
            id: 'prog-newmuslim-1',
            newMuslimId: 'user-newmuslim-1',
            completedLessonsCount: 0,
            unlockedLessonNumber: 1,
            allQuizzesPassed: false,
            finalExamPassed: false,
            updatedAt: NOW_ISO,
          },
        ]
      : []),
    {
      id: 'prog-graduate-1',
      newMuslimId: 'user-graduate-1',
      completedLessonsCount: 7,
      unlockedLessonNumber: 7,
      allQuizzesPassed: true,
      finalExamPassed: true,
      updatedAt: NOW_ISO,
    },
  ];

  const initialCertificates: Certificate[] = [
    {
      id: 'cert-graduate-1',
      newMuslimId: 'user-graduate-1',
      finalAttemptId: 'attempt-final-exam-graduate-1',
      fullName: 'Zayd Ibrahim',
      dateOfBirth: '1995-04-12',
      nationality: 'United Kingdom',
      issueDate: NOW_ISO,
      verificationQrHash: 'alhiwar-verify-user-graduate-1-hash',
      pdfFileUrl: '/api/certificates/cert-graduate-1/download',
      isRevoked: false,
      revocationReason: null,
      revokedByAdminId: null,
      createdAt: NOW_ISO,
    },
  ];

  return {
    users,
    conversations: isTest ? [sampleConversation] : [],
    messages: isTest ? sampleMessages : [],
    predefinedMessages,
    shahadahSubmissions: isTest ? [sampleShahadah] : [],
    learningContents,
    quizzes,
    questions,
    quizAttempts: [],
    finalExam,
    finalAttempts: [],
    certificates: isTest ? initialCertificates : [],
    learningProgress: isTest ? initialProgress : [],
    islamicResources,
    activeDemoUserId: null,
  };
}

