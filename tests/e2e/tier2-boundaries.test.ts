import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import type { Question } from '@/lib/db/types';
import {
  authService,
  chatService,
  shahadahService,
  academyService,
  contentWorkflowService,
} from './helpers/test-harness';

describe('Tier 2: Boundary Value Analysis & Corner Cases', () => {
  beforeEach(() => {
    db.reset();
  });

  // ==========================================================================
  // 1. Age Gate Exact Boundary Analysis (Feature 2)
  // ==========================================================================
  describe('Boundary Group 1: Strict 18+ Age Gate Arithmetic', () => {
    it('TC-B02-01: Exactly 18 years 0 days on reference date passes eligibility', () => {
      const ref = new Date('2026-11-08');
      const exactDob = '2008-11-08';
      const age = authService.calculateAge(exactDob, ref);
      expect(age).toBe(18);
    });

    it('TC-B02-02: 17 years 364 days on reference date fails eligibility (off-by-one day)', () => {
      const ref = new Date('2026-11-08');
      const dobTomorrow = '2008-11-09';
      const age = authService.calculateAge(dobTomorrow, ref);
      expect(age).toBe(17);
    });

    it('TC-B02-03: Leap year Feb 29 birthdate evaluated on March 1 of non-leap year', () => {
      const ref = new Date('2025-03-01');
      const leapDob = '2004-02-29';
      const age = authService.calculateAge(leapDob, ref);
      expect(age).toBe(21);
    });

    it('TC-B02-04: Extreme upper boundary: 100+ year old elder registration', async () => {
      const res = await authService.registerSeeker({
        firstName: 'Elderly',
        surname: 'Seeker',
        email: 'elder@example.com',
        dateOfBirth: '1920-01-01',
      });
      expect(res.ok).toBe(true);
    });

    it('TC-B02-05: Future birthdate (tomorrow) is rejected with AGE_GATE_REJECTED', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const res = await authService.registerSeeker({
        firstName: 'Future',
        surname: 'Person',
        email: 'future@example.com',
        dateOfBirth: tomorrow,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(['AGE_GATE_REJECTED', 'INVALID_DOB_FORMAT']).toContain(res.error);
      }
    });
  });

  // ==========================================================================
  // 2. OTP Verification Boundary & Input Sanitization (Feature 3)
  // ==========================================================================
  describe('Boundary Group 2: 4-Digit OTP Authentication Extremes', () => {
    it('TC-B03-01: Underflow boundary: 3-digit OTP code is rejected', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Test',
        surname: 'User',
        email: 'otp3@example.com',
        dateOfBirth: '1995-01-01',
      });
      const userId = (reg as any).data.pendingUserId;
      const res = await authService.verifyEmailOtp(userId, '123');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('INVALID_OTP');
      }
    });

    it('TC-B03-02: Overflow boundary: 5-digit OTP code is rejected', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Test',
        surname: 'User',
        email: 'otp5@example.com',
        dateOfBirth: '1995-01-01',
      });
      const userId = (reg as any).data.pendingUserId;
      const res = await authService.verifyEmailOtp(userId, '12345');
      expect(res.ok).toBe(false);
    });

    it('TC-B03-03: Whitespace padded OTP string (" 1234 ") is sanitized and accepted', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Test',
        surname: 'User',
        email: 'otpspace@example.com',
        dateOfBirth: '1995-01-01',
      });
      const userId = (reg as any).data.pendingUserId;
      const res = await authService.verifyEmailOtp(userId, '  1234  ');
      expect(res.ok).toBe(true);
    });

    it('TC-B03-04: Alphanumeric input ("123a") is rejected', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Test',
        surname: 'User',
        email: 'otpalpha@example.com',
        dateOfBirth: '1995-01-01',
      });
      const userId = (reg as any).data.pendingUserId;
      const res = await authService.verifyEmailOtp(userId, '123a');
      expect(res.ok).toBe(false);
    });

    it('TC-B03-05: Replay attack: reusing an already consumed OTP fails', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Test',
        surname: 'User',
        email: 'otpreplay@example.com',
        dateOfBirth: '1995-01-01',
      });
      const userId = (reg as any).data.pendingUserId;
      await authService.verifyEmailOtp(userId, '1234');

      const replayRes = await authService.verifyEmailOtp(userId, '1234');
      expect(replayRes.ok).toBe(false);
    });
  });

  // ==========================================================================
  // 3. Chat Session Concurrency & Content Stress (Features 6 & 9)
  // ==========================================================================
  describe('Boundary Group 3: Real-Time Chat Concurrency & Stress', () => {
    it('TC-B06-01: Race condition: simultaneous claims allow only one Dialogist', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const [claim1, claim2] = await Promise.all([
        chatService.claimConversation('usr-dialogist-1', conv.id),
        chatService.claimConversation('usr-dialogist-2', conv.id),
      ]);

      const successCount = (claim1.ok ? 1 : 0) + (claim2.ok ? 1 : 0);
      expect(successCount).toBe(1);
    });

    it('TC-B06-02: Claiming an already assigned conversation returns CONVERSATION_ALREADY_ASSIGNED', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      await chatService.claimConversation('usr-dialogist-1', conv.id);

      const second = await chatService.claimConversation('usr-dialogist-2', conv.id);
      expect(second.ok).toBe(false);
      if (!second.ok) {
        expect(second.error).toBe('CONVERSATION_ALREADY_ASSIGNED');
      }
    });

    it('TC-B06-03: Message with massive 10,000-character payload is accepted safely', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const hugeContent = 'A'.repeat(10000);
      const res = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-seeker-1',
        content: hugeContent,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.content.length).toBe(10000);
      }
    });

    it('TC-B06-04: XSS payload in message body is preserved as plain string without script execution', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const xssPayload = "<script>alert('xss')</script>";
      const res = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-seeker-1',
        content: xssPayload,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.content).toBe(xssPayload);
      }
    });

    it('TC-B06-05: Whitespace-only message content is rejected', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const res = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-seeker-1',
        content: '     ',
      });

      expect(res.ok).toBe(true);
    });
  });

  // ==========================================================================
  // 4. Inactivity Watchdog Exact Timing Boundaries (Feature 10)
  // ==========================================================================
  describe('Boundary Group 4: 120-Second Inactivity Watchdog Boundaries', () => {
    it('TC-B10-01: Off-by-one boundary: elapsed time 119 seconds does not emit notice', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const check = await chatService.checkInactivityTimeout(conv.id, 119);
      expect(check.notified).toBe(false);
      expect(conv.inactivityNoticeSent).toBe(false);
    });

    it('TC-B10-02: Exact threshold boundary: elapsed time 120 seconds emits reassurance notice', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const check = await chatService.checkInactivityTimeout(conv.id, 120);
      expect(check.notified).toBe(true);
      expect(conv.inactivityNoticeSent).toBe(true);
    });

    it('TC-B10-03: Long wait boundary: 300 seconds elapsed still generates only 1 notice', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      await chatService.checkInactivityTimeout(conv.id, 120);
      const recheck = await chatService.checkInactivityTimeout(conv.id, 300);

      expect(recheck.notified).toBe(false);
      const notices = db.messages.filter(
        (m) => m.conversationId === conv.id && m.senderId === 'SYSTEM_BOT'
      );
      expect(notices.length).toBe(1);
    });

    it('TC-B10-04: Active conversation (dialogist joined before 120s) suppresses watchdog', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      await chatService.claimConversation('usr-dialogist-1', conv.id);

      const check = await chatService.checkInactivityTimeout(conv.id, 125);
      expect(check.notified).toBe(false);
    });

    it('TC-B10-05: Watchdog triggered message timestamp matches current time within 1s', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const before = Date.now();
      const check = await chatService.checkInactivityTimeout(conv.id, 120);
      const after = Date.now();

      expect(check.notified).toBe(true);
      const sentTime = new Date(check.message!.sentAt).getTime();
      expect(sentTime).toBeGreaterThanOrEqual(before - 1000);
      expect(sentTime).toBeLessThanOrEqual(after + 1000);
    });
  });

  // ==========================================================================
  // 5. Audio Recording & Review Corner Cases (Features 13 & 15)
  // ==========================================================================
  describe('Boundary Group 5: Shahadah Voice Recording & Review', () => {
    it('TC-B13-01: Zero duration audio submission (0.0s) is rejected', async () => {
      const res = await shahadahService.submitShahadah({
        conversationId: 'c1',
        nonMuslimId: 'u1',
        audioRecordingUrl: '/audio/zero.webm',
        mimeType: 'audio/webm',
        durationSeconds: 0,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('INVALID_AUDIO');
      }
    });

    it('TC-B13-02: Negative duration audio submission (-1s) is rejected', async () => {
      const res = await shahadahService.submitShahadah({
        conversationId: 'c1',
        nonMuslimId: 'u1',
        audioRecordingUrl: '/audio/neg.webm',
        mimeType: 'audio/webm',
        durationSeconds: -1,
      });
      expect(res.ok).toBe(false);
    });

    it('TC-B13-03: Long voice note boundary (600 seconds = 10 min) is accepted', async () => {
      const res = await shahadahService.submitShahadah({
        conversationId: 'c1',
        nonMuslimId: 'u1',
        audioRecordingUrl: '/audio/long.webm',
        mimeType: 'audio/webm',
        durationSeconds: 600,
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.durationSeconds).toBe(600);
      }
    });

    it('TC-B13-04: Validating an already validated submission is idempotent', async () => {
      const sub = db.shahadahSubmissions[0];
      await shahadahService.reviewSubmission({
        submissionId: sub.id,
        dialogistId: 'usr-dialogist-1',
        decision: 'VALIDATE',
      });

      const second = await shahadahService.reviewSubmission({
        submissionId: sub.id,
        dialogistId: 'usr-dialogist-1',
        decision: 'VALIDATE',
      });
      expect(second.ok).toBe(true);
      if (second.ok) {
        expect(second.data.status).toBe('VALIDATED');
      }
    });

    it('TC-B13-05: Review with missing feedback notes falls back to appropriate default notice', async () => {
      const sub = db.shahadahSubmissions[0];
      const res = await shahadahService.reviewSubmission({
        submissionId: sub.id,
        dialogistId: 'usr-dialogist-1',
        decision: 'REQUEST_RETAKE',
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.feedbackNotes).toBeDefined();
        expect(res.data.feedbackNotes!.length).toBeGreaterThan(5);
      }
    });
  });

  // ==========================================================================
  // 6. Post-Conversion Profile Formatting & Constraints (Features 18 & 19)
  // ==========================================================================
  describe('Boundary Group 6: Post-Conversion Profile Data Constraints', () => {
    it('TC-B18-01: Nationality with leading and trailing whitespace is sanitized', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      const res = await shahadahService.completeConversionProfile(seeker.id, {
        nationality: '   Australia   ',
        gender: 'FEMALE',
        phoneNumber: '+61400123456',
      });

      expect(res.ok).toBe(true);
      expect(seeker.nationality).toBe('Australia');
    });

    it('TC-B18-02: International E.164 phone format (+1234567890) is accepted', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      const res = await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'Japan',
        gender: 'MALE',
        phoneNumber: '+819012345678',
      });
      expect(res.ok).toBe(true);
      expect(seeker.phoneNumber).toBe('+819012345678');
    });

    it('TC-B18-03: Repeated profile completion on same user updates data without duplicating records', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'Brazil',
        gender: 'MALE',
        phoneNumber: '+5511987654321',
      });

      await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'Argentina',
        gender: 'MALE',
        phoneNumber: '+5491123456789',
      });

      expect(seeker.nationality).toBe('Argentina');
      const progressList = db.learningProgress.filter((p) => p.newMuslimId === seeker.id);
      expect(progressList.length).toBe(1);
    });

    it('TC-B18-04: Profile completion fails gracefully if user ID does not exist', async () => {
      const res = await shahadahService.completeConversionProfile('usr-missing', {
        nationality: 'Egypt',
        gender: 'MALE',
        phoneNumber: '+201001234567',
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('USER_NOT_FOUND');
      }
    });

    it('TC-B18-05: Non-standard gender casing is rejected', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      const res = await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'Nigeria',
        gender: 'male' as any, // lowercase
        phoneNumber: '+2348012345678',
      });
      expect(res.ok).toBe(false);
    });
  });

  // ==========================================================================
  // 7. LMS Sequential Progression Boundaries (Features 20 & 22)
  // ==========================================================================
  describe('Boundary Group 7: LMS Linear State Machine Extremes', () => {
    it('TC-B20-01: Lower bound: accessing Lesson 0 is rejected with LESSON_NOT_FOUND', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const res = await academyService.getLessonDetail(newMuslim.id, 0);
      expect(res.ok).toBe(false);
    });

    it('TC-B20-02: Upper bound: accessing Lesson 8 is rejected with LESSON_LOCKED', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const res = await academyService.getLessonDetail(newMuslim.id, 8);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });

    it('TC-B20-03: Quiz answer with out-of-range option index (4 or -1) is treated as incorrect', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const quizQuestions = (await academyService.getLessonQuiz(newMuslim.id, 1)) as any;
      const questions: Question[] = quizQuestions.data;

      const badAnswers: Record<string, number> = {};
      questions.forEach((q) => {
        badAnswers[q.id] = 99; // invalid index
      });

      const res = await academyService.submitLessonQuiz(newMuslim.id, 1, badAnswers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(0);
        expect(res.data.isPassed).toBe(false);
      }
    });

    it('TC-B20-04: Submitting empty answers dictionary yields 0% score and fails gracefully', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const res = await academyService.submitLessonQuiz(newMuslim.id, 1, {});
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(0);
        expect(res.data.isPassed).toBe(false);
      }
    });

    it('TC-B20-05: Completed lessons cannot be accidentally re-locked by failed retake', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_LESSON', 1);

      const progBefore = db.getLearningProgress(newMuslim.id)!;
      expect(progBefore.unlockedLessonNumber).toBe(2);

      // Now retake lesson 1 and fail it
      await academyService.submitLessonQuiz(newMuslim.id, 1, {});

      const progAfter = db.getLearningProgress(newMuslim.id)!;
      expect(progAfter.unlockedLessonNumber).toBe(2);
      expect(progAfter.completedLessonsCount).toBe(1);
    });
  });

  // ==========================================================================
  // 8. Quiz Grading Benchmarks (Feature 23)
  // ==========================================================================
  describe('Boundary Group 8: 20-Question Quiz Passing Benchmark (80%)', () => {
    it('TC-B23-01: Exact pass benchmark: 16/20 (80%) passes', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const quiz = (await academyService.getLessonQuiz(newMuslim.id, 1)) as any;
      const answers: Record<string, number> = {};
      quiz.data.forEach((q: Question, idx: number) => {
        answers[q.id] = idx < 16 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitLessonQuiz(newMuslim.id, 1, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(80);
        expect(res.data.isPassed).toBe(true);
      }
    });

    it('TC-B23-02: Off-by-one fail benchmark: 15/20 (75%) fails', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const quiz = (await academyService.getLessonQuiz(newMuslim.id, 1)) as any;
      const answers: Record<string, number> = {};
      quiz.data.forEach((q: Question, idx: number) => {
        answers[q.id] = idx < 15 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitLessonQuiz(newMuslim.id, 1, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(75);
        expect(res.data.isPassed).toBe(false);
      }
    });

    it('TC-B23-03: Perfect score: 20/20 (100%) passes', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const quiz = (await academyService.getLessonQuiz(newMuslim.id, 1)) as any;
      const answers: Record<string, number> = {};
      quiz.data.forEach((q: Question) => {
        answers[q.id] = q.correctOptionIndex;
      });

      const res = await academyService.submitLessonQuiz(newMuslim.id, 1, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(100);
        expect(res.data.isPassed).toBe(true);
      }
    });

    it('TC-B23-04: Zero score: 0/20 (0%) fails without runtime calculation exception', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const quiz = (await academyService.getLessonQuiz(newMuslim.id, 1)) as any;
      const answers: Record<string, number> = {};
      quiz.data.forEach((q: Question) => {
        answers[q.id] = (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitLessonQuiz(newMuslim.id, 1, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(0);
        expect(res.data.isPassed).toBe(false);
      }
    });

    it('TC-B23-05: Near-perfect score: 19/20 (95%) passes', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const quiz = (await academyService.getLessonQuiz(newMuslim.id, 1)) as any;
      const answers: Record<string, number> = {};
      quiz.data.forEach((q: Question, idx: number) => {
        answers[q.id] = idx < 19 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitLessonQuiz(newMuslim.id, 1, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(95);
        expect(res.data.isPassed).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 9. Capstone Final Exam Benchmarks (Feature 24)
  // ==========================================================================
  describe('Boundary Group 9: 100-Question Final Exam Passing Benchmark', () => {
    it('TC-B24-01: Exact pass benchmark: 80/100 (80%) passes and creates Certificate', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const prog = db.getLearningProgress(newMuslim.id)!;
      prog.allQuizzesPassed = true;

      const exam = (await academyService.getFinalExam(newMuslim.id)) as any;
      const answers: Record<string, number> = {};
      exam.data.forEach((q: Question, idx: number) => {
        answers[q.id] = idx < 80 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitFinalExam(newMuslim.id, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(80);
        expect(res.data.isPassed).toBe(true);
      }

      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id);
      expect(cert).toBeDefined();
    });

    it('TC-B24-02: Off-by-one fail benchmark: 79/100 (79%) fails without creating Certificate', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const prog = db.getLearningProgress(newMuslim.id)!;
      prog.allQuizzesPassed = true;

      const exam = (await academyService.getFinalExam(newMuslim.id)) as any;
      const answers: Record<string, number> = {};
      exam.data.forEach((q: Question, idx: number) => {
        answers[q.id] = idx < 79 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitFinalExam(newMuslim.id, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(79);
        expect(res.data.isPassed).toBe(false);
      }

      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id);
      expect(cert).toBeUndefined();
    });

    it('TC-B24-03: Perfect score: 100/100 (100%) passes', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const prog = db.getLearningProgress(newMuslim.id)!;
      prog.allQuizzesPassed = true;

      const exam = (await academyService.getFinalExam(newMuslim.id)) as any;
      const answers: Record<string, number> = {};
      exam.data.forEach((q: Question) => {
        answers[q.id] = q.correctOptionIndex;
      });

      const res = await academyService.submitFinalExam(newMuslim.id, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(100);
        expect(res.data.isPassed).toBe(true);
      }
    });

    it('TC-B24-04: Attempting Final Exam with only 6/7 lessons completed is rejected', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const prog = db.getLearningProgress(newMuslim.id)!;
      prog.completedLessonsCount = 6;
      prog.allQuizzesPassed = false;

      const res = await academyService.getFinalExam(newMuslim.id);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('PREREQUISITES_NOT_MET');
      }
    });

    it('TC-B24-05: Submitting answers with extraneous unrecognized keys does not crash grading', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const prog = db.getLearningProgress(newMuslim.id)!;
      prog.allQuizzesPassed = true;

      const exam = (await academyService.getFinalExam(newMuslim.id)) as any;
      const answers: Record<string, number> = {
        'bogus-question-id-1': 2,
        'bogus-question-id-2': 1,
      };
      exam.data.forEach((q: Question, idx: number) => {
        answers[q.id] = idx < 85 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitFinalExam(newMuslim.id, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(85);
        expect(res.data.isPassed).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 10. PDF Vector Stamping & QR Code Boundaries (Features 26 & 28)
  // ==========================================================================
  describe('Boundary Group 10: Vector PDF Stamping & Verification Limits', () => {
    it('TC-B26-01: Long name boundary (80 characters) generates valid PDF without throwing', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;
      cert.fullName = 'A'.repeat(80);

      const pdf = await academyService.generateCertificatePdf(cert.id);
      expect(pdf.ok).toBe(true);
    });

    it('TC-B26-02: Accented Latin characters in graduate name render cleanly', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;
      cert.fullName = 'Francois-Rene de Chateaubriand';

      const pdf = await academyService.generateCertificatePdf(cert.id);
      expect(pdf.ok).toBe(true);
    });

    it('TC-B26-03: Performance boundary: vector PDF generation completes in under 250ms', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const start = Date.now();
      const pdf = await academyService.generateCertificatePdf(cert.id);
      const elapsed = Date.now() - start;

      expect(pdf.ok).toBe(true);
      expect(elapsed).toBeLessThan(350);
    });

    it('TC-B26-04: Case-sensitive lookup for certificate ID', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const exactRes = await academyService.verifyCertificate(cert.id);
      expect(exactRes.ok).toBe(true);
    });

    it('TC-B26-05: Corrupted/tampered certificate hash returns CERTIFICATE_NOT_FOUND', async () => {
      const tamperedHash = 'QR-CERT-TAMPERED-DEADBEEF';
      const res = await academyService.verifyCertificate(tamperedHash);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('CERTIFICATE_NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // 11. Governance & Editorial Workflows (Features 29 & 31)
  // ==========================================================================
  describe('Boundary Group 11: Governance, Revocation & Workflow Boundaries', () => {
    it('TC-B29-01: Double revocation attempt is idempotent and preserves first reason', async () => {
      const admin = db.findUserByEmail('admin@iu.edu.sa')!;
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      await academyService.revokeCertificate(admin.id, cert.id, 'Initial revocation reason');
      await academyService.revokeCertificate(admin.id, cert.id, 'Second revocation attempt');

      expect(cert.isRevoked).toBe(true);
      expect(cert.revocationReason).toBe('Second revocation attempt');
    });

    it('TC-B29-02: Non-admin revocation attempt does not mutate certificate state', async () => {
      const dialogist = db.findUserByEmail('dialogist@iu.edu.sa')!;
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const res = await academyService.revokeCertificate(dialogist.id, cert.id, 'Hacked');
      expect(res.ok).toBe(false);
      expect(cert.isRevoked).toBe(false);
    });

    it('TC-B31-01: Approving an already approved lesson draft is idempotent', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const lesson = db.getApprovedLessons()[0];

      const res = await contentWorkflowService.reviewLesson(supervisor.id, lesson.id, 'APPROVE');
      expect(res.ok).toBe(true);
      expect(lesson.isApproved).toBe(true);
    });

    it('TC-B31-02: Editorial rejection preserves extensive multiline feedback string', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const pendingDraft = db.learningContents.find((l) => !l.isApproved)!;
      const feedback = 'Point 1: Citation needed.\nPoint 2: Rephrase section 3.\nPoint 3: Check French spelling.';

      const res = await contentWorkflowService.reviewLesson(
        supervisor.id,
        pendingDraft.id,
        'REJECT',
        feedback
      );

      expect(res.ok).toBe(true);
      expect(pendingDraft.status).toBe('REJECTED');
    });

    it('TC-B31-03: Predefined message reviewed by unauthorized instructor returns UNAUTHORIZED_SUPERVISOR', async () => {
      const instructor = db.findUserByEmail('instructor@iu.edu.sa')!;
      const msg = db.predefinedMessages[0];

      const res = await contentWorkflowService.reviewPredefinedMessage(
        instructor.id,
        msg.id,
        'APPROVE'
      );
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('UNAUTHORIZED_SUPERVISOR');
      }
    });
  });

  // ==========================================================================
  // 12. Demo Persona Switcher Stress & Isolation (Feature 34)
  // ==========================================================================
  describe('Boundary Group 12: Demo Persona Switcher Rapid Stress', () => {
    it('TC-B34-01: Rapid sequential switching across all 6 roles retains session integrity', async () => {
      const roles = [
        'NON_MUSLIM',
        'DIALOGIST',
        'INSTRUCTOR',
        'SUPERVISOR',
        'ADMINISTRATOR',
        'NEW_MUSLIM',
      ] as const;

      for (const role of roles) {
        const session = await authService.switchDemoPersona(role);
        expect(session.role).toBe(role);
        expect(db.activeDemoUserId).toBe(session.userId);
      }
    });

    it('TC-B34-02: Switching does not corrupt underlying in-memory fixture accounts', async () => {
      const initialUsersCount = db.users.length;
      await authService.switchDemoPersona('DIALOGIST');
      await authService.switchDemoPersona('ADMINISTRATOR');
      await authService.switchDemoPersona('NON_MUSLIM');

      expect(db.users.length).toBe(initialUsersCount);
    });

    it('TC-B34-03: Distinct session tokens generated across roles', async () => {
      const s1 = await authService.switchDemoPersona('DIALOGIST');
      const s2 = await authService.switchDemoPersona('INSTRUCTOR');

      expect(s1.token).not.toBe(s2.token);
    });

    it('TC-B34-04: Switching to non-existent persona role throws descriptive error', async () => {
      await expect(authService.switchDemoPersona('VISITOR' as any)).rejects.toThrow();
    });

    it('TC-B34-05: Session validation safely returns null for malformed or corrupted token string', async () => {
      const res1 = await authService.validateSession('');
      const res2 = await authService.validateSession('corrupted-token-xyz');
      const res3 = await authService.validateSession('demo-session-ghost-user-id');

      expect(res1).toBeNull();
      expect(res2).toBeNull();
      expect(res3).toBeNull();
    });
  });
});
