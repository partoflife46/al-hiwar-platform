import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { academyService } from '@/lib/services/academy-service';
import { GET as progressGetRoute, POST as progressPostRoute } from '@/app/api/academy/progress/route';
import { signSessionToken } from '@/lib/security/session-token';
import type { Question } from '@/lib/db/types';

describe('Adversarial Stress Verification: AcademyService & Linear Engine (Milestone 3)', () => {
  const seekerId = 'user-newmuslim-adversarial-1';
  const adminId = 'user-admin-1';

  beforeEach(() => {
    db.reset();

    // Ensure a pristine test student
    db.users.push({
      id: seekerId,
      email: 'adv.seeker@example.com',
      passwordHash: 'hash',
      firstName: 'Tariq',
      surname: 'Ibn-Ziyad',
      dateOfBirth: '1995-04-10',
      nationality: 'Moroccan',
      phoneNumber: '+966501234567',
      role: 'NEW_MUSLIM',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      emailVerified: true,
      conversionDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // ==========================================================================
  // Section 1: Direct URL Access Bypass & Prerequisite Locking
  // ==========================================================================
  describe('1. Direct URL Access Bypass & Prerequisite Locking', () => {
    it('allows access to Lesson 1 when student starts with default progress', async () => {
      const res = await academyService.getLessonDetail(seekerId, 1);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.lessonNumber).toBe(1);
        expect(res.data.isApproved).toBe(true);
      }
    });

    it('strictly rejects access to Lesson 2 with LESSON_LOCKED when only Lesson 1 is unlocked', async () => {
      const res = await academyService.getLessonDetail(seekerId, 2);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });

    it('strictly rejects access to Lesson 4 with LESSON_LOCKED when only Lesson 1 is unlocked', async () => {
      const res = await academyService.getLessonDetail(seekerId, 4);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });

    it('strictly rejects access to Lesson 7 with LESSON_LOCKED when only Lesson 1 is unlocked', async () => {
      const res = await academyService.getLessonDetail(seekerId, 7);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });

    it('strictly rejects fetching quiz for Lesson 2 when only Lesson 1 is unlocked', async () => {
      const res = await academyService.getLessonQuiz(seekerId, 2);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });

    it('strictly rejects fetching quiz for Lesson 4 and Lesson 7 when locked', async () => {
      const res4 = await academyService.getLessonQuiz(seekerId, 4);
      expect(res4.ok).toBe(false);
      if (!res4.ok) expect(res4.error).toBe('LESSON_LOCKED');

      const res7 = await academyService.getLessonQuiz(seekerId, 7);
      expect(res7.ok).toBe(false);
      if (!res7.ok) expect(res7.error).toBe('LESSON_LOCKED');
    });

    it('strictly rejects quiz submission for locked lessons (bypass attempt)', async () => {
      const res = await academyService.submitLessonQuiz(seekerId, 3, { 'fake-q1': 0 });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });

    it('strictly rejects Capstone Final Exam access before completing all 7 lessons', async () => {
      const examRes = await academyService.getFinalExam(seekerId);
      expect(examRes.ok).toBe(false);
      if (!examRes.ok) {
        expect(examRes.error).toBe('PREREQUISITES_NOT_MET');
      }

      const submitRes = await academyService.submitFinalExam(seekerId, {});
      expect(submitRes.ok).toBe(false);
      if (!submitRes.ok) {
        expect(submitRes.error).toBe('PREREQUISITES_NOT_MET');
      }
    });
  });

  // ==========================================================================
  // Section 2: Bounds Testing & Edge Cases
  // ==========================================================================
  describe('2. Bounds Testing & Extreme Edge Cases', () => {
    it('lower bound: accessing lessonNumber: 0 is rejected with LESSON_NOT_FOUND', async () => {
      const res = await academyService.getLessonDetail(seekerId, 0);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_NOT_FOUND');
      }
    });

    it('negative bound: accessing lessonNumber: -1 is rejected with LESSON_NOT_FOUND', async () => {
      const res = await academyService.getLessonDetail(seekerId, -1);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_NOT_FOUND');
      }
    });

    it('extreme negative: accessing lessonNumber: -999 is rejected with LESSON_NOT_FOUND', async () => {
      const res = await academyService.getLessonDetail(seekerId, -999);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_NOT_FOUND');
      }
    });

    it('upper bound behavior: accessing lessonNumber: 8 returns error (LESSON_LOCKED vs LESSON_NOT_FOUND)', async () => {
      // In current AcademyService implementation, lessonNumber > progress.unlockedLessonNumber
      // is evaluated before checking if the lesson exists in the curriculum.
      // Therefore, lesson 8 returns LESSON_LOCKED (matching TC-B20-02 specification).
      const res = await academyService.getLessonDetail(seekerId, 8);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        // Both LESSON_LOCKED and LESSON_NOT_FOUND represent rejection of out-of-curriculum lesson
        expect(['LESSON_LOCKED', 'LESSON_NOT_FOUND']).toContain(res.error);
      }
    });

    it('upper bound post-graduation: accessing lessonNumber: 8 even after graduating all 7 lessons', async () => {
      await academyService.executeEvaluationShortcut(seekerId, 'PASS_ALL_AND_GRADUATE');
      const progress = await academyService.getProgress(seekerId);
      expect(progress.completedLessonsCount).toBe(7);

      const res = await academyService.getLessonDetail(seekerId, 8);
      expect(res.ok).toBe(false);
      // Lesson 8 never exists in the curriculum
      if (!res.ok) {
        expect(['LESSON_LOCKED', 'LESSON_NOT_FOUND']).toContain(res.error);
      }
    });

    it('extreme upper bound: accessing lessonNumber: 999 is rejected', async () => {
      const res = await academyService.getLessonDetail(seekerId, 999);
      expect(res.ok).toBe(false);
    });

    it('non-existent quiz bounds: quiz for lesson 0 or -1 returns QUIZ_NOT_FOUND or LESSON_LOCKED', async () => {
      const q0 = await academyService.getLessonQuiz(seekerId, 0);
      expect(q0.ok).toBe(false);

      const qNeg = await academyService.getLessonQuiz(seekerId, -1);
      expect(qNeg.ok).toBe(false);
    });

    it('submitting empty answers to quiz results in 0% score and failure', async () => {
      const res = await academyService.submitLessonQuiz(seekerId, 1, {});
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(0);
        expect(res.data.isPassed).toBe(false);
      }
    });

    it('submitting out-of-range option index (99 or -1) is treated as incorrect answer', async () => {
      const quizRes = await academyService.getLessonQuiz(seekerId, 1);
      expect(quizRes.ok).toBe(true);
      const questions: Question[] = (quizRes as any).data;

      const badAnswers: Record<string, number> = {};
      questions.forEach((q) => {
        badAnswers[q.id] = 99; // invalid index
      });

      const res = await academyService.submitLessonQuiz(seekerId, 1, badAnswers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(0);
        expect(res.data.isPassed).toBe(false);
      }
    });
  });

  // ==========================================================================
  // Section 3: Progression State Transitions & Idempotency
  // ==========================================================================
  describe('3. Progression State Transitions & Idempotency', () => {
    it('passing Lesson 1 unlocks Lesson 2 while Lesson 3 remains strictly locked', async () => {
      // 1. Initial check
      const initialProgress = await academyService.getProgress(seekerId);
      expect(initialProgress.unlockedLessonNumber).toBe(1);
      expect(initialProgress.completedLessonsCount).toBe(0);

      // 2. Pass Lesson 1 (simulate 16/20 = 80%)
      const quizRes = await academyService.getLessonQuiz(seekerId, 1);
      const questions: Question[] = (quizRes as any).data;
      const answers: Record<string, number> = {};
      questions.forEach((q, idx) => {
        answers[q.id] = idx < 16 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const subRes = await academyService.submitLessonQuiz(seekerId, 1, answers);
      expect(subRes.ok).toBe(true);
      if (subRes.ok) {
        expect(subRes.data.isPassed).toBe(true);
        expect(subRes.data.scorePercentage).toBe(80);
      }

      // 3. Verify progress updated
      const updatedProgress = await academyService.getProgress(seekerId);
      expect(updatedProgress.completedLessonsCount).toBe(1);
      expect(updatedProgress.unlockedLessonNumber).toBe(2);
      expect(updatedProgress.overallProgressPercentage).toBe(14); // 1/7 = 14%

      // 4. Verify Lesson 2 is now accessible
      const l2 = await academyService.getLessonDetail(seekerId, 2);
      expect(l2.ok).toBe(true);

      // 5. Verify Lesson 3 is STILL locked
      const l3 = await academyService.getLessonDetail(seekerId, 3);
      expect(l3.ok).toBe(false);
      if (!l3.ok) {
        expect(l3.error).toBe('LESSON_LOCKED');
      }

      // 6. Verify Lesson 4 through 7 remain locked
      for (let i = 4; i <= 7; i++) {
        const li = await academyService.getLessonDetail(seekerId, i);
        expect(li.ok).toBe(false);
        if (!li.ok) expect(li.error).toBe('LESSON_LOCKED');
      }
    });

    it('failing retake of Lesson 1 does NOT re-lock Lesson 2 (non-regression invariant)', async () => {
      // Unlock Lesson 2
      await academyService.executeEvaluationShortcut(seekerId, 'PASS_LESSON', 1);
      let prog = await academyService.getProgress(seekerId);
      expect(prog.unlockedLessonNumber).toBe(2);

      // Retake Lesson 1 quiz with failing score (0%)
      const failRes = await academyService.submitLessonQuiz(seekerId, 1, {});
      expect(failRes.ok).toBe(true);
      if (failRes.ok) {
        expect(failRes.data.isPassed).toBe(false);
      }

      // Verify Lesson 2 remains unlocked
      prog = await academyService.getProgress(seekerId);
      expect(prog.unlockedLessonNumber).toBe(2);
      expect(prog.completedLessonsCount).toBe(1);

      const l2 = await academyService.getLessonDetail(seekerId, 2);
      expect(l2.ok).toBe(true);
    });

    it('sequential progression through all 7 lessons enables Final Exam', async () => {
      for (let lesson = 1; lesson <= 7; lesson++) {
        // Confirm current lesson is accessible
        const detail = await academyService.getLessonDetail(seekerId, lesson);
        expect(detail.ok).toBe(true);

        // Pass quiz
        await academyService.executeEvaluationShortcut(seekerId, 'PASS_LESSON', lesson);
      }

      const finalProgress = await academyService.getProgress(seekerId);
      expect(finalProgress.completedLessonsCount).toBe(7);
      expect(finalProgress.allQuizzesPassed).toBe(true);

      // Final exam should now be accessible
      const examRes = await academyService.getFinalExam(seekerId);
      expect(examRes.ok).toBe(true);
      if (examRes.ok) {
        expect(examRes.data.length).toBe(100);
      }
    });
  });

  // ==========================================================================
  // Section 4: Demo Shortcuts & Presentation Speed-Run Safety
  // ==========================================================================
  describe('4. Demo Shortcuts & Presentation Speed-Run Safety', () => {
    it('Simulate Pass immediately unlocks next sequential lesson without corrupting user profile', async () => {
      const userBefore = db.findUserById(seekerId)!;
      const initialRole = userBefore.role;
      const initialName = `${userBefore.firstName} ${userBefore.surname}`;

      // Simulate pass on Lesson 1
      const p1 = await academyService.executeEvaluationShortcut(seekerId, 'PASS_LESSON', 1);
      expect(p1.completedLessonsCount).toBe(1);
      expect(p1.unlockedLessonNumber).toBe(2);

      // Verify user profile integrity
      const userAfter = db.findUserById(seekerId)!;
      expect(userAfter.role).toBe(initialRole);
      expect(`${userAfter.firstName} ${userAfter.surname}`).toBe(initialName);
      expect(userAfter.nationality).toBe('Moroccan');

      // Simulate pass on Lesson 2
      const p2 = await academyService.executeEvaluationShortcut(seekerId, 'PASS_LESSON', 2);
      expect(p2.completedLessonsCount).toBe(2);
      expect(p2.unlockedLessonNumber).toBe(3);
    });

    it('Pass All & Graduate completes curriculum, marks final exam passed, and creates certificate', async () => {
      const gradProgress = await academyService.executeEvaluationShortcut(
        seekerId,
        'PASS_ALL_AND_GRADUATE'
      );

      expect(gradProgress.completedLessonsCount).toBe(7);
      expect(gradProgress.unlockedLessonNumber).toBe(7);
      expect(gradProgress.allQuizzesPassed).toBe(true);
      expect(gradProgress.finalExamPassed).toBe(true);

      // Verify certificate issuance
      const certs = db.certificates.filter((c) => c.newMuslimId === seekerId);
      expect(certs.length).toBe(1);
      expect(certs[0].fullName).toBe('Tariq Ibn-Ziyad');
      expect(certs[0].nationality).toBe('Moroccan');
      expect(certs[0].isRevoked).toBe(false);
      expect(certs[0].verificationQrHash).toContain('QR-');
    });

    it('Pass All & Graduate is idempotent and does not create duplicate certificates', async () => {
      await academyService.executeEvaluationShortcut(seekerId, 'PASS_ALL_AND_GRADUATE');
      const certCount1 = db.certificates.filter((c) => c.newMuslimId === seekerId).length;
      expect(certCount1).toBe(1);

      // Run shortcut a second and third time
      await academyService.executeEvaluationShortcut(seekerId, 'PASS_ALL_AND_GRADUATE');
      await academyService.executeEvaluationShortcut(seekerId, 'PASS_ALL_AND_GRADUATE');

      const certCount2 = db.certificates.filter((c) => c.newMuslimId === seekerId).length;
      expect(certCount2).toBe(1); // strictly no duplicate certificates
    });

    it('Progress API route (POST /api/academy/progress) accepts PASS_LESSON and PASS_ALL_AND_GRADUATE', async () => {
      const cookie = `alhiwar_session=${signSessionToken(seekerId)}`;
      const req1 = new NextRequest('http://localhost:3000/api/academy/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie },
        body: JSON.stringify({ userId: seekerId, mode: 'PASS_LESSON', targetLessonNumber: 1 }),
      });

      const res1 = await progressPostRoute(req1);
      const json1 = await res1.json();
      expect(json1.ok).toBe(true);
      expect(json1.data.completedLessonsCount).toBe(1);
      expect(json1.data.unlockedLessonNumber).toBe(2);

      const req2 = new NextRequest('http://localhost:3000/api/academy/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie },
        body: JSON.stringify({ userId: seekerId, mode: 'PASS_ALL_AND_GRADUATE' }),
      });

      const res2 = await progressPostRoute(req2);
      const json2 = await res2.json();
      expect(json2.ok).toBe(true);
      expect(json2.data.finalExamPassed).toBe(true);
    });

    it('Progress API route rejects invalid shortcut mode with 400 INVALID_MODE', async () => {
      const req = new NextRequest('http://localhost:3000/api/academy/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(seekerId)}`,
        },
        body: JSON.stringify({ userId: seekerId, mode: 'INVALID_ATTACK_MODE' }),
      });

      const res = await progressPostRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('INVALID_MODE');
    });

    it('Progress API route (GET /api/academy/progress) returns current progress accurate percentage', async () => {
      await academyService.executeEvaluationShortcut(seekerId, 'PASS_LESSON', 3);

      const req = new NextRequest(`http://localhost:3000/api/academy/progress?userId=${seekerId}`, {
        headers: { cookie: `alhiwar_session=${signSessionToken(seekerId)}` },
      });
      const res = await progressGetRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.completedLessonsCount).toBe(3);
      expect(json.data.overallProgressPercentage).toBe(43); // 3/7
    });
  });

  // ==========================================================================
  // Section 5: Academy Reader URL Parsing Analysis
  // ==========================================================================
  describe('5. Academy Reader URL Parsing & State Display Simulation', () => {
    it('simulates LessonReaderPage parameter evaluation for bounds (0, -1, 8)', () => {
      // Simulate rawId parameter parsing logic from LessonReaderPage:
      // const lessonNumber = parseInt(rawId.replace('lesson-', ''), 10) || 1;

      // 1. rawId = "0": 0 is falsy in JS, so `0 || 1` evaluates to 1!
      const parseLessonId = (rawId: string) => parseInt(rawId.replace('lesson-', ''), 10) || 1;
      expect(parseLessonId('0')).toBe(1); // Edge case: accessing lesson 0 in UI falls back to lesson 1

      // 2. rawId = "-1": -1 is truthy in JS, so evaluates to -1
      expect(parseLessonId('-1')).toBe(-1);

      // 3. rawId = "8": truthy, evaluates to 8
      expect(parseLessonId('8')).toBe(8);

      // 4. rawId = "lesson-2": evaluates to 2
      expect(parseLessonId('lesson-2')).toBe(2);
    });
  });
});
