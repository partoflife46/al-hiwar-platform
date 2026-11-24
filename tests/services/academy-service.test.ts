import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import { academyService } from '@/lib/services/academy-service';
import type { Question } from '@/lib/db/types';

describe('AcademyService Deep Module Seam (Task 3.3)', () => {
  const newMuslimId = 'user-newmuslim-1';
  const adminId = 'user-admin-1';

  beforeEach(() => {
    db.reset();
  });

  describe('getProgress and linear initialization', () => {
    it('initializes default progress for new student with Lesson 1 unlocked and 0 completed', async () => {
      const progress = await academyService.getProgress('new-student-id');
      expect(progress.unlockedLessonNumber).toBe(1);
      expect(progress.completedLessonsCount).toBe(0);
      expect(progress.activeLessonNumber).toBe(1);
      expect(progress.overallProgressPercentage).toBe(0);
      expect(progress.allQuizzesPassed).toBe(false);
      expect(progress.finalExamPassed).toBe(false);
    });

    it('calculates progress percentage accurately based on completed lessons count', async () => {
      await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_LESSON', 1);
      const prog1 = await academyService.getProgress(newMuslimId);
      expect(prog1.completedLessonsCount).toBe(1);
      expect(prog1.overallProgressPercentage).toBe(14); // 1/7 = 14%

      await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_LESSON', 3);
      const prog3 = await academyService.getProgress(newMuslimId);
      expect(prog3.completedLessonsCount).toBe(3);
      expect(prog3.overallProgressPercentage).toBe(43); // 3/7 = 43%
    });
  });

  describe('getLessonDetail and prerequisite locking', () => {
    it('permits access to Lesson 1 initially', async () => {
      const res = await academyService.getLessonDetail(newMuslimId, 1);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.lessonNumber).toBe(1);
        expect(res.data.titleEn).toContain('Pillars of Islam');
      }
    });

    it('rejects access to Lesson 2 with LESSON_LOCKED when Lesson 1 is unpassed', async () => {
      const res = await academyService.getLessonDetail(newMuslimId, 2);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });

    it('rejects jump to Lesson 7 with LESSON_LOCKED', async () => {
      const res = await academyService.getLessonDetail(newMuslimId, 7);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });

    it('TC-B20-01 lower bound: Lesson 0 is rejected with LESSON_NOT_FOUND', async () => {
      const res = await academyService.getLessonDetail(newMuslimId, 0);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_NOT_FOUND');
      }
    });

    it('TC-B20-02 upper bound: Lesson 8 is rejected with LESSON_LOCKED', async () => {
      const res = await academyService.getLessonDetail(newMuslimId, 8);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });
  });

  describe('Lesson Quizzes & Grading', () => {
    it('serves 20 questions for unlocked Lesson 1 quiz', async () => {
      const res = await academyService.getLessonQuiz(newMuslimId, 1);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.length).toBe(20);
      }
    });

    it('rejects quiz retrieval for locked Lesson 2 with LESSON_LOCKED', async () => {
      const res = await academyService.getLessonQuiz(newMuslimId, 2);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });

    it('evaluates quiz: 16/20 (80%) passes, records attempt, and unlocks Lesson 2', async () => {
      const quizRes = await academyService.getLessonQuiz(newMuslimId, 1);
      expect(quizRes.ok).toBe(true);
      const questions: Question[] = (quizRes as any).data;

      const answers: Record<string, number> = {};
      // Answer first 16 correctly, remaining 4 incorrectly
      questions.forEach((q, idx) => {
        answers[q.id] = idx < 16 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitLessonQuiz(newMuslimId, 1, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(80);
        expect(res.data.isPassed).toBe(true);
      }

      // Lesson 2 is now unlocked
      const l2 = await academyService.getLessonDetail(newMuslimId, 2);
      expect(l2.ok).toBe(true);
    });

    it('evaluates quiz: 15/20 (75%) fails and keeps Lesson 2 locked', async () => {
      const quizRes = await academyService.getLessonQuiz(newMuslimId, 1);
      const questions: Question[] = (quizRes as any).data;

      const answers: Record<string, number> = {};
      questions.forEach((q, idx) => {
        answers[q.id] = idx < 15 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitLessonQuiz(newMuslimId, 1, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(75);
        expect(res.data.isPassed).toBe(false);
      }

      const l2 = await academyService.getLessonDetail(newMuslimId, 2);
      expect(l2.ok).toBe(false);
      if (!l2.ok) {
        expect(l2.error).toBe('LESSON_LOCKED');
      }
    });
  });

  describe('Final Exam & Certification', () => {
    it('blocks final exam before completing lessons with PREREQUISITES_NOT_MET', async () => {
      const res = await academyService.getFinalExam(newMuslimId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('PREREQUISITES_NOT_MET');
      }
    });

    it('allows final exam when all 7 lessons are completed', async () => {
      await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_LESSON', 7);
      const res = await academyService.getFinalExam(newMuslimId);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.length).toBe(100);
      }
    });

    it('graduates and generates certificate upon passing final exam', async () => {
      await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_LESSON', 7);
      const examRes = await academyService.getFinalExam(newMuslimId);
      expect(examRes.ok).toBe(true);
      const questions = (examRes as any).data;

      const answers: Record<string, number> = {};
      questions.forEach((q: Question) => {
        answers[q.id] = q.correctOptionIndex;
      });

      const subRes = await academyService.submitFinalExam(newMuslimId, answers);
      expect(subRes.ok).toBe(true);
      if (subRes.ok) {
        expect(subRes.data.isPassed).toBe(true);
      }

      const certs = db.certificates.filter((c) => c.newMuslimId === newMuslimId);
      expect(certs.length).toBe(1);

      const verifyRes = await academyService.verifyCertificate(certs[0].id);
      expect(verifyRes.ok).toBe(true);
      if (verifyRes.ok) {
        expect(verifyRes.data.isRevoked).toBe(false);
      }
    });

    it('admin can revoke certificate', async () => {
      await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslimId)!;
      expect(cert).toBeDefined();

      const revokeRes = await academyService.revokeCertificate(
        adminId,
        cert.id,
        'Academic integrity violation'
      );
      expect(revokeRes.ok).toBe(true);
      expect(cert.isRevoked).toBe(true);
      expect(cert.revocationReason).toBe('Academic integrity violation');
    });

    it('non-admin cannot revoke certificate', async () => {
      await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslimId)!;

      const revokeRes = await academyService.revokeCertificate(
        newMuslimId,
        cert.id,
        'Attempt'
      );
      expect(revokeRes.ok).toBe(false);
      if (!revokeRes.ok) {
        expect(revokeRes.error).toBe('UNAUTHORIZED_ADMIN');
      }
    });
  });

  describe('Presentation Demo Shortcut', () => {
    it('PASS_LESSON unlocks the next module immediately', async () => {
      const prog = await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_LESSON', 1);
      expect(prog.completedLessonsCount).toBe(1);
      expect(prog.unlockedLessonNumber).toBe(2);

      const l2 = await academyService.getLessonDetail(newMuslimId, 2);
      expect(l2.ok).toBe(true);
    });

    it('PASS_ALL_AND_GRADUATE unlocks all modules, final exam, and qualifies certificate', async () => {
      const prog = await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_ALL_AND_GRADUATE');
      expect(prog.completedLessonsCount).toBe(7);
      expect(prog.allQuizzesPassed).toBe(true);
      expect(prog.finalExamPassed).toBe(true);

      const certs = db.certificates.filter((c) => c.newMuslimId === newMuslimId);
      expect(certs.length).toBeGreaterThan(0);
    });
  });
});
