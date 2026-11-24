import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import { academyService } from '@/lib/services/academy-service';
import type { Question } from '@/lib/db/types';

describe('Quiz Evaluation, 100-Question Final Exam & Demo Shortcut (Task 4.1)', () => {
  const newMuslimId = 'user-newmuslim-1';

  beforeEach(() => {
    db.reset();
  });

  describe('80% Pass Boundary on 20-Question Lesson Quizzes', () => {
    it('16/20 (80%) passes and unlocks Lesson 2', async () => {
      const quizRes = await academyService.getLessonQuiz(newMuslimId, 1);
      expect(quizRes.ok).toBe(true);
      const questions: Question[] = (quizRes as any).data;
      expect(questions).toHaveLength(20);

      const answers: Record<string, number> = {};
      questions.forEach((q, idx) => {
        answers[q.id] = idx < 16 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const submitRes = await academyService.submitLessonQuiz(newMuslimId, 1, answers);
      expect(submitRes.ok).toBe(true);
      if (submitRes.ok) {
        expect(submitRes.data.scorePercentage).toBe(80);
        expect(submitRes.data.isPassed).toBe(true);
      }

      const progress = await academyService.getProgress(newMuslimId);
      expect(progress.completedLessonsCount).toBe(1);
      expect(progress.unlockedLessonNumber).toBe(2);
    });

    it('15/20 (75%) fails and keeps Lesson 2 locked', async () => {
      const quizRes = await academyService.getLessonQuiz(newMuslimId, 1);
      const questions: Question[] = (quizRes as any).data;

      const answers: Record<string, number> = {};
      questions.forEach((q, idx) => {
        answers[q.id] = idx < 15 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const submitRes = await academyService.submitLessonQuiz(newMuslimId, 1, answers);
      expect(submitRes.ok).toBe(true);
      if (submitRes.ok) {
        expect(submitRes.data.scorePercentage).toBe(75);
        expect(submitRes.data.isPassed).toBe(false);
      }

      const progress = await academyService.getProgress(newMuslimId);
      expect(progress.completedLessonsCount).toBe(0);
      expect(progress.unlockedLessonNumber).toBe(1);

      const lesson2Res = await academyService.getLessonDetail(newMuslimId, 2);
      expect(lesson2Res.ok).toBe(false);
      if (!lesson2Res.ok) {
        expect(lesson2Res.error).toBe('LESSON_LOCKED');
      }
    });

    it('permits unlimited quiz retakes with zero cooldown', async () => {
      const quizRes = await academyService.getLessonQuiz(newMuslimId, 1);
      const questions: Question[] = (quizRes as any).data;

      // Fail 3 times in a row
      for (let i = 0; i < 3; i++) {
        const failRes = await academyService.submitLessonQuiz(newMuslimId, 1, {});
        expect(failRes.ok).toBe(true);
        if (failRes.ok) {
          expect(failRes.data.isPassed).toBe(false);
        }
      }

      // Pass immediately on 4th attempt
      const passAnswers: Record<string, number> = {};
      questions.forEach((q) => {
        passAnswers[q.id] = q.correctOptionIndex;
      });
      const passRes = await academyService.submitLessonQuiz(newMuslimId, 1, passAnswers);
      expect(passRes.ok).toBe(true);
      if (passRes.ok) {
        expect(passRes.data.scorePercentage).toBe(100);
        expect(passRes.data.isPassed).toBe(true);
      }

      const progress = await academyService.getProgress(newMuslimId);
      expect(progress.quizAttempts).toHaveLength(4);
      expect(progress.unlockedLessonNumber).toBe(2);
    });
  });

  describe('100-Question Final Exam Gating & Auto-Certification', () => {
    it('locks Final Exam until all 7 lesson quizzes are passed', async () => {
      for (let lesson = 1; lesson <= 6; lesson++) {
        await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_LESSON', lesson);
        const examLocked = await academyService.getFinalExam(newMuslimId);
        expect(examLocked.ok).toBe(false);
        if (!examLocked.ok) {
          expect(examLocked.error).toBe('PREREQUISITES_NOT_MET');
        }
      }

      // Pass Lesson 7
      await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_LESSON', 7);
      const examUnlocked = await academyService.getFinalExam(newMuslimId);
      expect(examUnlocked.ok).toBe(true);
      if (examUnlocked.ok) {
        expect(examUnlocked.data).toHaveLength(100);
      }
    });

    it('79/100 (79%) fails Final Exam and does not generate Certificate', async () => {
      await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_LESSON', 7);
      const examRes = await academyService.getFinalExam(newMuslimId);
      const questions: Question[] = (examRes as any).data;

      const answers: Record<string, number> = {};
      questions.forEach((q, idx) => {
        answers[q.id] = idx < 79 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const subRes = await academyService.submitFinalExam(newMuslimId, answers);
      expect(subRes.ok).toBe(true);
      if (subRes.ok) {
        expect(subRes.data.scorePercentage).toBe(79);
        expect(subRes.data.isPassed).toBe(false);
      }

      const certs = db.certificates.filter((c) => c.newMuslimId === newMuslimId);
      expect(certs).toHaveLength(0);
    });

    it('80/100 (80%) passes Final Exam and auto-generates Certificate with fullName, DOB, and nationality', async () => {
      await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_LESSON', 7);
      const examRes = await academyService.getFinalExam(newMuslimId);
      const questions: Question[] = (examRes as any).data;

      const answers: Record<string, number> = {};
      questions.forEach((q, idx) => {
        answers[q.id] = idx < 80 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const subRes = await academyService.submitFinalExam(newMuslimId, answers);
      expect(subRes.ok).toBe(true);
      if (subRes.ok) {
        expect(subRes.data.scorePercentage).toBe(80);
        expect(subRes.data.isPassed).toBe(true);
      }

      const cert = db.certificates.find((c) => c.newMuslimId === newMuslimId);
      expect(cert).toBeDefined();
      expect(cert?.fullName).toBe('Thomas Anderson');
      expect(cert?.dateOfBirth).toBe('1996-08-22');
      expect(cert?.nationality).toBe('United Kingdom');
      expect(cert?.verificationQrHash).toContain('QR-');
      expect(cert?.isRevoked).toBe(false);
    });
  });
});
