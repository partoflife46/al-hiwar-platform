import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { db } from '@/lib/db/in-memory-adapter';
import { ok, err, type Result } from '@/lib/db/types';
import type {
  User,
  UserRole,
  UserSession,
  Conversation,
  Message,
  PredefinedMessage,
  ShahadahSubmission,
  LearningContent,
  Question,
  QuizAttempt,
  FinalAttempt,
  Certificate,
  LearningProgress,
  SupportedLanguage,
  ConsultationIntent,
  Gender,
} from '@/lib/db/types';

// ============================================================================
// 1. AuthService Contract & Implementation
// ============================================================================

export interface RegisterSeekerInput {
  firstName: string;
  surname: string;
  email: string;
  dateOfBirth: string | Date;
  password?: string;
  preferredLanguage?: SupportedLanguage;
}

export type AuthError =
  | 'AGE_GATE_REJECTED'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_OTP'
  | 'USER_NOT_FOUND'
  | 'INVALID_DOB_FORMAT';

export interface AuthServiceContract {
  calculateAge(dateOfBirth: string | Date, referenceDate?: Date): number;
  registerSeeker(
    input: RegisterSeekerInput
  ): Promise<Result<{ pendingUserId: string; email: string; demoOtpHint?: string }, AuthError>>;
  verifyEmailOtp(userId: string, otpCode: string): Promise<Result<UserSession, AuthError>>;
  login(credentials: { email: string; passwordHash: string }): Promise<Result<UserSession, AuthError>>;
  switchDemoPersona(targetRole: UserRole): Promise<UserSession>;
  validateSession(token: string): Promise<UserSession | null>;
}

export class AuthServiceSeam implements AuthServiceContract {
  calculateAge(dateOfBirth: string | Date, referenceDate: Date = new Date()): number {
    const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    if (isNaN(dob.getTime())) {
      return -1;
    }
    const ref = referenceDate;
    let age = ref.getUTCFullYear() - dob.getUTCFullYear();
    const monthDiff = ref.getUTCMonth() - dob.getUTCMonth();
    const dayDiff = ref.getUTCDate() - dob.getUTCDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }
    return age;
  }

  async registerSeeker(
    input: RegisterSeekerInput
  ): Promise<Result<{ pendingUserId: string; email: string; demoOtpHint?: string }, AuthError>> {
    const age = this.calculateAge(input.dateOfBirth);
    if (age < 0) {
      return err('INVALID_DOB_FORMAT');
    }
    if (age < 18) {
      return err('AGE_GATE_REJECTED');
    }

    const existing = db.findUserByEmail(input.email);
    if (existing) {
      return err('EMAIL_ALREADY_REGISTERED');
    }

    const dobStr =
      typeof input.dateOfBirth === 'string'
        ? input.dateOfBirth
        : input.dateOfBirth.toISOString().slice(0, 10);

    const pendingUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      email: input.email.trim().toLowerCase(),
      passwordHash: input.password || 'demo-hashed-password',
      firstName: input.firstName.trim(),
      surname: input.surname.trim(),
      dateOfBirth: dobStr,
      role: 'NON_MUSLIM',
      status: 'PENDING_VERIFICATION',
      preferredLanguage: input.preferredLanguage || 'en',
      emailVerified: false,
      verificationOtp: '1234', // Canonical demo OTP
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(pendingUser);

    return ok({
      pendingUserId: pendingUser.id,
      email: pendingUser.email,
      demoOtpHint: '1234',
    });
  }

  async verifyEmailOtp(userId: string, otpCode: string): Promise<Result<UserSession, AuthError>> {
    const user = db.findUserById(userId);
    if (!user) {
      return err('USER_NOT_FOUND');
    }

    const cleanOtp = otpCode.trim();
    if (user.verificationOtp !== cleanOtp) {
      return err('INVALID_OTP');
    }

    user.emailVerified = true;
    user.status = 'ACTIVE';
    user.verificationOtp = null;
    user.updatedAt = new Date().toISOString();

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      surname: user.surname,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      token: `session-${user.id}-${Date.now()}`,
    };

    return ok(session);
  }

  async login(credentials: { email: string; passwordHash: string }): Promise<Result<UserSession, AuthError>> {
    const user = db.findUserByEmail(credentials.email);
    if (!user || user.passwordHash !== credentials.passwordHash) {
      return err('INVALID_CREDENTIALS');
    }
    if (user.status === 'PENDING_VERIFICATION') {
      return err('INVALID_CREDENTIALS');
    }

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      surname: user.surname,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      token: `session-${user.id}-${Date.now()}`,
    };

    return ok(session);
  }

  async switchDemoPersona(targetRole: UserRole): Promise<UserSession> {
    const persona = db.findDemoUserByRole(targetRole);
    if (!persona) {
      throw new Error(`Demo persona for role ${targetRole} not found in pre-seeded fixtures`);
    }

    db.activeDemoUserId = persona.id;

    return {
      userId: persona.id,
      email: persona.email,
      firstName: persona.firstName,
      surname: persona.surname,
      role: persona.role,
      preferredLanguage: persona.preferredLanguage,
      token: `demo-session-${persona.id}`,
    };
  }

  async validateSession(token: string): Promise<UserSession | null> {
    if (!token || !token.startsWith('session-') && !token.startsWith('demo-session-')) {
      return null;
    }
    const parts = token.split('-');
    const userId = parts.slice(1, parts.length - 1).join('-') || parts[1];
    const user = db.findUserById(userId) || db.users.find((u) => token.includes(u.id));
    if (!user) {
      return null;
    }
    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      surname: user.surname,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      token,
    };
  }
}

// ============================================================================
// 2. ChatService Contract & Implementation
// ============================================================================

export type ChatError =
  | 'CONVERSATION_NOT_FOUND'
  | 'CONVERSATION_ALREADY_ASSIGNED'
  | 'UNAUTHORIZED_SENDER'
  | 'UNAUTHORIZED_SUPERVISOR'
  | 'INVALID_MESSAGE_CONTENT';

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  content: string;
  predefinedReplyId?: string | null;
  hasVoiceNote?: boolean;
  audioUrl?: string | null;
}

export interface ChatServiceContract {
  initiateConsultation(
    seekerId: string,
    intent: ConsultationIntent,
    language?: SupportedLanguage
  ): Promise<Conversation>;
  getUnansweredQueue(): Promise<Conversation[]>;
  claimConversation(dialogistId: string, conversationId: string): Promise<Result<Conversation, ChatError>>;
  sendMessage(params: SendMessageInput): Promise<Result<Message, ChatError>>;
  reassignConversation(
    supervisorId: string,
    conversationId: string,
    targetDialogistId: string
  ): Promise<Result<Conversation, ChatError>>;
  checkInactivityTimeout(
    conversationId: string,
    elapsedSeconds?: number
  ): Promise<{ notified: boolean; message?: Message }>;
  triggerInactivityChecks(): Promise<{ notifiedConversationIds: string[] }>;
}

export class ChatServiceSeam implements ChatServiceContract {
  async initiateConsultation(
    seekerId: string,
    intent: ConsultationIntent,
    language: SupportedLanguage = 'en'
  ): Promise<Conversation> {
    const conversation: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nonMuslimId: seekerId,
      dialogistId: null,
      language,
      intent,
      status: 'QUEUED',
      isAssigned: false,
      inactivityNoticeSent: false,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    db.conversations.push(conversation);
    return conversation;
  }

  async getUnansweredQueue(): Promise<Conversation[]> {
    return db.conversations.filter((c) => c.status === 'QUEUED' && !c.isAssigned);
  }

  async claimConversation(dialogistId: string, conversationId: string): Promise<Result<Conversation, ChatError>> {
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      return err('CONVERSATION_NOT_FOUND');
    }
    if (conv.isAssigned && conv.dialogistId && conv.dialogistId !== dialogistId) {
      return err('CONVERSATION_ALREADY_ASSIGNED');
    }

    conv.dialogistId = dialogistId;
    conv.isAssigned = true;
    conv.status = 'ACTIVE';
    conv.lastMessageAt = new Date().toISOString();

    return ok(conv);
  }

  async sendMessage(params: SendMessageInput): Promise<Result<Message, ChatError>> {
    const conv = db.conversations.find((c) => c.id === params.conversationId);
    if (!conv) {
      return err('CONVERSATION_NOT_FOUND');
    }
    if (!params.content && !params.predefinedReplyId && !params.audioUrl) {
      return err('INVALID_MESSAGE_CONTENT');
    }

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId: params.conversationId,
      senderId: params.senderId,
      content: params.content,
      predefinedReplyId: params.predefinedReplyId || null,
      hasVoiceNote: !!params.hasVoiceNote,
      audioUrl: params.audioUrl || null,
      sentAt: new Date().toISOString(),
    };

    db.messages.push(message);
    conv.lastMessageAt = message.sentAt;

    return ok(message);
  }

  async reassignConversation(
    supervisorId: string,
    conversationId: string,
    targetDialogistId: string
  ): Promise<Result<Conversation, ChatError>> {
    const supervisor = db.findUserById(supervisorId);
    if (!supervisor || supervisor.role !== 'SUPERVISOR') {
      return err('UNAUTHORIZED_SUPERVISOR');
    }

    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      return err('CONVERSATION_NOT_FOUND');
    }

    conv.dialogistId = targetDialogistId;
    conv.isAssigned = true;
    conv.status = 'ACTIVE';
    conv.lastMessageAt = new Date().toISOString();

    return ok(conv);
  }

  async checkInactivityTimeout(
    conversationId: string,
    elapsedSeconds: number = 120
  ): Promise<{ notified: boolean; message?: Message }> {
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv || conv.isAssigned || conv.inactivityNoticeSent) {
      return { notified: false };
    }

    if (elapsedSeconds >= 120) {
      conv.inactivityNoticeSent = true;
      const reassuranceMsg: Message = {
        id: `sys-msg-${Date.now()}`,
        conversationId: conv.id,
        senderId: 'SYSTEM_BOT',
        content:
          conv.language === 'fr'
            ? 'Tous les spécialistes sont actuellement occupés. Votre session reste ouverte et un spécialiste se joindra sous peu.'
            : 'All specialists are currently engaged. Your chat remains open and a specialist will join shortly.',
        hasVoiceNote: false,
        sentAt: new Date().toISOString(),
      };
      db.messages.push(reassuranceMsg);
      return { notified: true, message: reassuranceMsg };
    }

    return { notified: false };
  }

  async triggerInactivityChecks(): Promise<{ notifiedConversationIds: string[] }> {
    const notified: string[] = [];
    const now = Date.now();

    for (const conv of db.conversations) {
      if (!conv.isAssigned && !conv.inactivityNoticeSent) {
        const elapsed = (now - new Date(conv.createdAt).getTime()) / 1000;
        if (elapsed >= 120) {
          const res = await this.checkInactivityTimeout(conv.id, elapsed);
          if (res.notified) {
            notified.push(conv.id);
          }
        }
      }
    }
    return { notifiedConversationIds: notified };
  }
}

// ============================================================================
// 3. ShahadahService Contract & Implementation
// ============================================================================

export type ShahadahError =
  | 'SUBMISSION_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'INVALID_AUDIO'
  | 'INVALID_PROFILE_DATA'
  | 'NOT_READY_FOR_PROFILE';

export interface ModelReferenceAudio {
  language: SupportedLanguage;
  audioUrl: string;
  durationSeconds: number;
  arabicScript: string;
  phoneticGuide: string;
  englishTranslation: string;
}

export interface SubmitShahadahInput {
  conversationId: string;
  nonMuslimId: string;
  audioRecordingUrl: string;
  mimeType: string;
  durationSeconds: number;
}

export interface ReviewSubmissionInput {
  submissionId: string;
  dialogistId: string;
  decision: 'VALIDATE' | 'REQUEST_RETAKE';
  feedbackNotes?: string;
}

export interface PostConversionProfile {
  nationality: string;
  gender: Gender;
  phoneNumber: string;
}

export interface ShahadahServiceContract {
  getModelReferenceAudio(language: 'en' | 'fr'): Promise<ModelReferenceAudio>;
  submitShahadah(params: SubmitShahadahInput): Promise<Result<ShahadahSubmission, ShahadahError>>;
  reviewSubmission(params: ReviewSubmissionInput): Promise<Result<ShahadahSubmission, ShahadahError>>;
  completeConversionProfile(
    seekerId: string,
    profile: PostConversionProfile
  ): Promise<Result<UserSession, ShahadahError>>;
}

export class ShahadahServiceSeam implements ShahadahServiceContract {
  async getModelReferenceAudio(language: 'en' | 'fr'): Promise<ModelReferenceAudio> {
    return {
      language,
      audioUrl: '/brand/model-shahadah-ref.mp3',
      durationSeconds: 24,
      arabicScript: 'أشهد أن لا إله إلا الله وأشهد أن محمدا رسول الله',
      phoneticGuide:
        language === 'fr'
          ? 'Ach-hadou an la ilaha illa Allah, wa ach-hadou anna Mouhammadan rassouloullah'
          : 'Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan rasulu Allah',
      englishTranslation:
        'I bear witness that there is no god but Allah, and I bear witness that Muhammad is the Messenger of Allah.',
    };
  }

  async submitShahadah(params: SubmitShahadahInput): Promise<Result<ShahadahSubmission, ShahadahError>> {
    if (params.durationSeconds <= 0 || !params.mimeType) {
      return err('INVALID_AUDIO');
    }

    const submission: ShahadahSubmission = {
      id: `shd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId: params.conversationId,
      nonMuslimId: params.nonMuslimId,
      dialogistId: null,
      audioRecordingUrl: params.audioRecordingUrl,
      mimeType: params.mimeType,
      durationSeconds: params.durationSeconds,
      status: 'PENDING_REVIEW',
      attemptNumber: 1,
      submittedAt: new Date().toISOString(),
    };

    db.shahadahSubmissions.push(submission);
    return ok(submission);
  }

  async reviewSubmission(params: ReviewSubmissionInput): Promise<Result<ShahadahSubmission, ShahadahError>> {
    const sub = db.shahadahSubmissions.find((s) => s.id === params.submissionId);
    if (!sub) {
      return err('SUBMISSION_NOT_FOUND');
    }

    sub.dialogistId = params.dialogistId;
    if (params.decision === 'VALIDATE') {
      sub.status = 'VALIDATED';
      sub.validatedAt = new Date().toISOString();
      sub.feedbackNotes = params.feedbackNotes || 'Mabruk! Pronunciation validated.';
    } else {
      sub.status = 'RETAKE_REQUESTED';
      sub.feedbackNotes =
        params.feedbackNotes || 'Please listen to the reference audio clip and try again.';
    }

    return ok(sub);
  }

  async completeConversionProfile(
    seekerId: string,
    profile: PostConversionProfile
  ): Promise<Result<UserSession, ShahadahError>> {
    const user = db.findUserById(seekerId);
    if (!user) {
      return err('USER_NOT_FOUND');
    }

    if (!profile.nationality?.trim() || !profile.phoneNumber?.trim() || !['MALE', 'FEMALE'].includes(profile.gender)) {
      return err('INVALID_PROFILE_DATA');
    }

    // Role elevation to NEW_MUSLIM
    user.nationality = profile.nationality.trim();
    user.gender = profile.gender;
    user.phoneNumber = profile.phoneNumber.trim();
    user.conversionDate = new Date().toISOString();
    user.role = 'NEW_MUSLIM';
    user.updatedAt = new Date().toISOString();

    db.ensureLearningProgress(user.id);

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      surname: user.surname,
      role: 'NEW_MUSLIM',
      preferredLanguage: user.preferredLanguage,
      token: `newmuslim-session-${user.id}`,
    };

    return ok(session);
  }
}

// ============================================================================
// 4. AcademyService Contract & Implementation
// ============================================================================

export type AcademyError =
  | 'LESSON_NOT_FOUND'
  | 'LESSON_LOCKED'
  | 'PREREQUISITES_NOT_MET'
  | 'QUIZ_NOT_FOUND'
  | 'CERTIFICATE_NOT_FOUND'
  | 'UNAUTHORIZED_ADMIN';

export interface AcademyServiceContract {
  getProgress(newMuslimId: string): Promise<LearningProgress>;
  getLessonDetail(newMuslimId: string, lessonNumber: number): Promise<Result<LearningContent, AcademyError>>;
  getLessonQuiz(newMuslimId: string, lessonNumber: number): Promise<Result<Question[], AcademyError>>;
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
  revokeCertificate(adminId: string, certificateId: string, reason: string): Promise<Result<void, AcademyError>>;
}

export class AcademyServiceSeam implements AcademyServiceContract {
  async getProgress(newMuslimId: string): Promise<LearningProgress> {
    return db.ensureLearningProgress(newMuslimId);
  }

  async getLessonDetail(
    newMuslimId: string,
    lessonNumber: number
  ): Promise<Result<LearningContent, AcademyError>> {
    const progress = db.ensureLearningProgress(newMuslimId);
    if (lessonNumber > progress.unlockedLessonNumber) {
      return err('LESSON_LOCKED');
    }

    const lesson = db.learningContents.find(
      (l) => l.lessonNumber === lessonNumber && l.isApproved
    );
    if (!lesson) {
      return err('LESSON_NOT_FOUND');
    }

    return ok(lesson);
  }

  async getLessonQuiz(
    newMuslimId: string,
    lessonNumber: number
  ): Promise<Result<Question[], AcademyError>> {
    const progress = db.ensureLearningProgress(newMuslimId);
    if (lessonNumber > progress.unlockedLessonNumber) {
      return err('LESSON_LOCKED');
    }

    const quiz = db.getQuizByLessonNumber(lessonNumber);
    if (!quiz) {
      return err('QUIZ_NOT_FOUND');
    }

    const questions = db.getQuestionsForQuiz(quiz.id);
    return ok(questions);
  }

  async submitLessonQuiz(
    newMuslimId: string,
    lessonNumber: number,
    answers: Record<string, number>
  ): Promise<Result<QuizAttempt, AcademyError>> {
    const progress = db.ensureLearningProgress(newMuslimId);
    if (lessonNumber > progress.unlockedLessonNumber) {
      return err('LESSON_LOCKED');
    }

    const quiz = db.getQuizByLessonNumber(lessonNumber);
    if (!quiz) {
      return err('QUIZ_NOT_FOUND');
    }

    const questions = db.getQuestionsForQuiz(quiz.id);
    let correctCount = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    }

    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    const isPassed = scorePercentage >= quiz.passingPercentage; // >= 80%

    const attempt: QuizAttempt = {
      id: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      quizId: quiz.id,
      newMuslimId,
      scorePercentage,
      isPassed,
      answersJson: answers,
      attemptDate: new Date().toISOString(),
    };

    db.quizAttempts.push(attempt);

    if (isPassed) {
      progress.completedLessonsCount = Math.max(progress.completedLessonsCount, lessonNumber);
      if (lessonNumber < 7) {
        progress.unlockedLessonNumber = Math.max(progress.unlockedLessonNumber, lessonNumber + 1);
      } else {
        progress.allQuizzesPassed = true;
      }
      progress.updatedAt = new Date().toISOString();
    }

    return ok(attempt);
  }

  async getFinalExam(newMuslimId: string): Promise<Result<Question[], AcademyError>> {
    const progress = db.ensureLearningProgress(newMuslimId);
    if (!progress.allQuizzesPassed && progress.completedLessonsCount < 7) {
      return err('PREREQUISITES_NOT_MET');
    }

    const questions = db.getFinalExamQuestions();
    return ok(questions);
  }

  async submitFinalExam(
    newMuslimId: string,
    answers: Record<string, number>
  ): Promise<Result<FinalAttempt, AcademyError>> {
    const progress = db.ensureLearningProgress(newMuslimId);
    if (!progress.allQuizzesPassed && progress.completedLessonsCount < 7) {
      return err('PREREQUISITES_NOT_MET');
    }

    const questions = db.getFinalExamQuestions();
    let correctCount = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    }

    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    const isPassed = scorePercentage >= db.finalExam.passingPercentage; // >= 80%

    const attempt: FinalAttempt = {
      id: `fa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      examId: db.finalExam.id,
      newMuslimId,
      scorePercentage,
      isPassed,
      answersJson: answers,
      attemptDate: new Date().toISOString(),
    };

    db.finalAttempts.push(attempt);

    if (isPassed) {
      progress.finalExamPassed = true;
      progress.updatedAt = new Date().toISOString();

      const user = db.findUserById(newMuslimId);
      const fullName = user ? `${user.firstName} ${user.surname}` : 'New Muslim Graduate';
      const dob = user?.dateOfBirth || '2000-01-01';
      const nationality = user?.nationality || 'International';

      const certId = `CERT-IU-${Date.now().toString(36).toUpperCase()}`;
      const cert: Certificate = {
        id: certId,
        newMuslimId,
        finalAttemptId: attempt.id,
        fullName,
        dateOfBirth: dob,
        nationality,
        issueDate: new Date().toISOString(),
        verificationQrHash: `QR-${certId}`,
        pdfFileUrl: `/api/certificates/${certId}/download`,
        isRevoked: false,
        createdAt: new Date().toISOString(),
      };
      db.certificates.push(cert);
    }

    return ok(attempt);
  }

  async executeEvaluationShortcut(
    newMuslimId: string,
    mode: 'PASS_LESSON' | 'PASS_ALL_AND_GRADUATE',
    targetLessonNumber: number = 1
  ): Promise<LearningProgress> {
    const progress = db.ensureLearningProgress(newMuslimId);

    if (mode === 'PASS_LESSON') {
      progress.completedLessonsCount = Math.max(progress.completedLessonsCount, targetLessonNumber);
      if (targetLessonNumber < 7) {
        progress.unlockedLessonNumber = Math.max(progress.unlockedLessonNumber, targetLessonNumber + 1);
      } else {
        progress.allQuizzesPassed = true;
      }
      progress.updatedAt = new Date().toISOString();
      return progress;
    }

    // PASS_ALL_AND_GRADUATE shortcut
    progress.completedLessonsCount = 7;
    progress.unlockedLessonNumber = 7;
    progress.allQuizzesPassed = true;
    progress.finalExamPassed = true;
    progress.updatedAt = new Date().toISOString();

    const user = db.findUserById(newMuslimId);
    const fullName = user ? `${user.firstName} ${user.surname}` : 'Demo Graduate';
    const certId = `CERT-DEMO-${Date.now().toString(36).toUpperCase()}`;

    const existingCert = db.certificates.find((c) => c.newMuslimId === newMuslimId && !c.isRevoked);
    if (!existingCert) {
      const cert: Certificate = {
        id: certId,
        newMuslimId,
        finalAttemptId: `fa-shortcut-${Date.now()}`,
        fullName,
        dateOfBirth: user?.dateOfBirth || '1995-05-15',
        nationality: user?.nationality || 'Saudi Arabia',
        issueDate: new Date().toISOString(),
        verificationQrHash: `QR-${certId}`,
        pdfFileUrl: `/api/certificates/${certId}/download`,
        isRevoked: false,
        createdAt: new Date().toISOString(),
      };
      db.certificates.push(cert);
    }

    return progress;
  }

  async generateCertificatePdf(certificateId: string): Promise<Result<Uint8Array, AcademyError>> {
    const cert = db.certificates.find((c) => c.id === certificateId);
    if (!cert) {
      return err('CERTIFICATE_NOT_FOUND');
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 Landscape
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Madinah Blue (#006C9C -> 0, 108/255, 156/255)
    const madinahBlue = rgb(0 / 255, 108 / 255, 156 / 255);
    // Minaret Gold (#BC9C5C -> 188/255, 156/255, 92/255)
    const minaretGold = rgb(188 / 255, 156 / 255, 92 / 255);

    // Decorative Border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 802,
      height: 555,
      borderColor: minaretGold,
      borderWidth: 3,
    });

    // Institutional Header
    page.drawText('ISLAMIC UNIVERSITY OF MADINAH', {
      x: 220,
      y: 530,
      size: 22,
      font,
      color: madinahBlue,
    });
    page.drawText('Al-Jamiah Al-Islamiyyah bil-Madinah Al-Munawwarah', {
      x: 235,
      y: 495,
      size: 16,
      font,
      color: minaretGold,
    });

    page.drawText('CERTIFICATE OF ACADEMY GRADUATION', {
      x: 240,
      y: 440,
      size: 18,
      font,
      color: madinahBlue,
    });

    page.drawText('This is to certify that', {
      x: 340,
      y: 390,
      size: 13,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Graduate Name
    page.drawText(cert.fullName, {
      x: 260,
      y: 340,
      size: 26,
      font,
      color: madinahBlue,
    });

    page.drawText(`Nationality: ${cert.nationality}   |   Date of Birth: ${cert.dateOfBirth}`, {
      x: 240,
      y: 290,
      size: 12,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText("has successfully completed the 7-Module Foundational Islamic Da'wah Academy", {
      x: 160,
      y: 240,
      size: 13,
      font: regularFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText('and demonstrated mastery in the 100-Question Comprehensive Capstone Examination.', {
      x: 155,
      y: 215,
      size: 13,
      font: regularFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Verification QR Code
    const verifyUrl = `http://localhost:3000/verify/${cert.id}`;
    // @ts-expect-error qrcode/lib/server.js has no separate type declaration
    const QRCodeServer = await import('qrcode/lib/server.js');
    const qrDataUri = await (QRCodeServer.default || QRCodeServer).toDataURL(verifyUrl, {
      width: 120,
      margin: 1,
    });
    const qrImage = await pdfDoc.embedPng(qrDataUri);

    page.drawImage(qrImage, {
      x: 680,
      y: 50,
      width: 100,
      height: 100,
    });

    page.drawText(`Certificate ID: ${cert.id}`, {
      x: 50,
      y: 70,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText(`Issued: ${cert.issueDate.slice(0, 10)}  |  Scan QR code to verify authenticity`, {
      x: 50,
      y: 50,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return ok(pdfBytes);
  }

  async verifyCertificate(certificateId: string): Promise<Result<Certificate, AcademyError>> {
    const cert = db.certificates.find(
      (c) => c.id === certificateId || c.verificationQrHash === certificateId
    );
    if (!cert) {
      return err('CERTIFICATE_NOT_FOUND');
    }
    return ok(cert);
  }

  async revokeCertificate(adminId: string, certificateId: string, reason: string): Promise<Result<void, AcademyError>> {
    const admin = db.findUserById(adminId);
    if (!admin || admin.role !== 'ADMINISTRATOR') {
      return err('UNAUTHORIZED_ADMIN');
    }

    const cert = db.certificates.find((c) => c.id === certificateId);
    if (!cert) {
      return err('CERTIFICATE_NOT_FOUND');
    }

    cert.isRevoked = true;
    cert.revocationReason = reason;
    cert.revokedByAdminId = adminId;

    return ok(undefined);
  }
}

// ============================================================================
// 5. ContentWorkflowService Contract & Implementation
// ============================================================================

export type WorkflowError =
  | 'LESSON_NOT_FOUND'
  | 'MESSAGE_NOT_FOUND'
  | 'UNAUTHORIZED_INSTRUCTOR'
  | 'UNAUTHORIZED_SUPERVISOR';

export interface ContentWorkflowServiceContract {
  createLessonDraft(instructorId: string, lesson: Partial<LearningContent>): Promise<LearningContent>;
  submitLessonForApproval(instructorId: string, lessonId: string): Promise<Result<LearningContent, WorkflowError>>;
  reviewLesson(
    supervisorId: string,
    lessonId: string,
    decision: 'APPROVE' | 'REJECT',
    feedback?: string
  ): Promise<Result<LearningContent, WorkflowError>>;
  createPredefinedMessageDraft(instructorId: string, message: Partial<PredefinedMessage>): Promise<PredefinedMessage>;
  reviewPredefinedMessage(
    supervisorId: string,
    messageId: string,
    decision: 'APPROVE' | 'REJECT'
  ): Promise<Result<PredefinedMessage, WorkflowError>>;
  getConversationsAudit(supervisorId: string, filter?: { status?: string }): Promise<Conversation[]>;
}

export class ContentWorkflowServiceSeam implements ContentWorkflowServiceContract {
  async createLessonDraft(instructorId: string, lesson: Partial<LearningContent>): Promise<LearningContent> {
    const newLesson: LearningContent = {
      id: `lesson-draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      lessonNumber: lesson.lessonNumber || db.learningContents.length + 1,
      titleEn: lesson.titleEn || 'Draft Title EN',
      titleFr: lesson.titleFr || 'Titre Brouillon FR',
      contentMarkdownEn: lesson.contentMarkdownEn || '# Content EN',
      contentMarkdownFr: lesson.contentMarkdownFr || '# Contenu FR',
      pdfGuideUrl: lesson.pdfGuideUrl || null,
      audioLectureUrl: lesson.audioLectureUrl || null,
      videoLectureUrl: lesson.videoLectureUrl || null,
      status: 'DRAFT',
      isApproved: false,
      authorId: instructorId,
      approvedById: null,
      createdAt: new Date().toISOString(),
    };

    db.learningContents.push(newLesson);
    return newLesson;
  }

  async submitLessonForApproval(
    instructorId: string,
    lessonId: string
  ): Promise<Result<LearningContent, WorkflowError>> {
    const lesson = db.learningContents.find((l) => l.id === lessonId);
    if (!lesson) {
      return err('LESSON_NOT_FOUND');
    }
    lesson.status = 'PENDING_APPROVAL';
    return ok(lesson);
  }

  async reviewLesson(
    supervisorId: string,
    lessonId: string,
    decision: 'APPROVE' | 'REJECT',
    feedback?: string
  ): Promise<Result<LearningContent, WorkflowError>> {
    const supervisor = db.findUserById(supervisorId);
    if (!supervisor || supervisor.role !== 'SUPERVISOR') {
      return err('UNAUTHORIZED_SUPERVISOR');
    }

    const lesson = db.learningContents.find((l) => l.id === lessonId);
    if (!lesson) {
      return err('LESSON_NOT_FOUND');
    }

    if (decision === 'APPROVE') {
      lesson.status = 'APPROVED';
      lesson.isApproved = true;
      lesson.approvedById = supervisorId;
    } else {
      lesson.status = 'REJECTED';
      lesson.isApproved = false;
    }

    return ok(lesson);
  }

  async createPredefinedMessageDraft(
    instructorId: string,
    message: Partial<PredefinedMessage>
  ): Promise<PredefinedMessage> {
    const draft: PredefinedMessage = {
      id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      shortcut: message.shortcut || '/quick',
      category: message.category || 'THEOLOGY',
      bodyEn: message.bodyEn || 'English reply',
      bodyFr: message.bodyFr || 'Réponse en français',
      authorId: instructorId,
      approvedById: null,
      isApproved: false,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    db.predefinedMessages.push(draft);
    return draft;
  }

  async reviewPredefinedMessage(
    supervisorId: string,
    messageId: string,
    decision: 'APPROVE' | 'REJECT'
  ): Promise<Result<PredefinedMessage, WorkflowError>> {
    const supervisor = db.findUserById(supervisorId);
    if (!supervisor || supervisor.role !== 'SUPERVISOR') {
      return err('UNAUTHORIZED_SUPERVISOR');
    }

    const msg = db.predefinedMessages.find((m) => m.id === messageId);
    if (!msg) {
      return err('MESSAGE_NOT_FOUND');
    }

    if (decision === 'APPROVE') {
      msg.isApproved = true;
      msg.status = 'APPROVED';
      msg.approvedById = supervisorId;
    } else {
      msg.isApproved = false;
      msg.status = 'REJECTED';
    }

    return ok(msg);
  }

  async getConversationsAudit(
    supervisorId: string,
    filter?: { status?: string }
  ): Promise<Conversation[]> {
    return db.conversations.filter((c) => !filter?.status || c.status === filter.status);
  }
}

// Single instance export of seams
export const authService = new AuthServiceSeam();
export const chatService = new ChatServiceSeam();
export const shahadahService = new ShahadahServiceSeam();
export const academyService = new AcademyServiceSeam();
export const contentWorkflowService = new ContentWorkflowServiceSeam();
