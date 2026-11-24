import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db, getDb } from '@/lib/db/in-memory-adapter';
import { createInitialUsers, createInitialSeedState } from '@/lib/db/seed-data';
import { ok, err, type Result } from '@/lib/db/types';

describe('Dual-Driver Pre-Seeded In-Memory Database (Task 1.3)', () => {
  beforeEach(() => {
    db.reset();
  });

  it('provides Result<T, E> discriminated union helpers', () => {
    const success: Result<number, string> = ok(42);
    const failure: Result<number, string> = err('NOT_FOUND');

    expect(success).toEqual({ ok: true, data: 42 });
    expect(failure).toEqual({ ok: false, error: 'NOT_FOUND' });
  });

  it('maintains singleton state on globalThis.__alHiwarDb and resets cleanly', () => {
    const instance1 = getDb();
    const initialCount = instance1.users.length;
    instance1.users.push({
      ...instance1.users[0],
      id: 'temp-user-id',
      email: 'temp@example.com',
    });
    expect(getDb().users.length).toBe(initialCount + 1);

    db.reset();
    expect(getDb().users.length).toBe(initialCount);
  });

  it('pre-seeds all 6 Demo Persona Accounts with canonical roles and metadata', () => {
    const expectedPersonas = [
      { email: 'seeker@example.com', role: 'NON_MUSLIM', firstName: 'Jean-Luc', surname: 'Dubois' },
      { email: 'newmuslim@example.com', role: 'NEW_MUSLIM', firstName: 'Thomas', surname: 'Anderson' },
      { email: 'dialogist@iu.edu.sa', role: 'DIALOGIST', firstName: 'Ahmad', surname: 'Al-Madani' },
      { email: 'instructor@iu.edu.sa', role: 'INSTRUCTOR', firstName: 'Ibrahim', surname: 'Al-Harbi' },
      { email: 'supervisor@iu.edu.sa', role: 'SUPERVISOR', firstName: 'Khalid', surname: 'Al-Qasim' },
      { email: 'admin@iu.edu.sa', role: 'ADMINISTRATOR', firstName: 'Tariq', surname: 'Al-Ansari' },
    ] as const;

    expect(db.users.length).toBe(7);

    for (const persona of expectedPersonas) {
      const user = db.findUserByEmail(persona.email);
      expect(user).toBeDefined();
      expect(user?.role).toBe(persona.role);
      expect(user?.firstName).toContain(persona.firstName);
      expect(user?.surname).toContain(persona.surname);
      expect(user?.emailVerified).toBe(true);
    }

    const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
    const progress = db.getLearningProgress(newMuslim.id);
    expect(progress).toBeDefined();
    expect(progress?.unlockedLessonNumber).toBe(1);
    expect(progress?.completedLessonsCount).toBe(0);
  });

  it('pre-seeds 8 Public Islamic Resources across all categories and formats in EN/FR', () => {
    expect(db.islamicResources.length).toBe(8);

    const categories = new Set(db.islamicResources.map((r) => r.category));
    expect(categories.has('QURAN')).toBe(true);
    expect(categories.has('PROPHET')).toBe(true);
    expect(categories.has('PILLARS')).toBe(true);
    expect(categories.has('ETHICS')).toBe(true);
    expect(categories.has('MISCONCEPTIONS')).toBe(true);

    const types = new Set(db.islamicResources.map((r) => r.resourceType));
    expect(types.has('TEXT')).toBe(true);
    expect(types.has('PDF')).toBe(true);
    expect(types.has('AUDIO')).toBe(true);
    expect(types.has('VIDEO')).toBe(true);

    for (const res of db.islamicResources) {
      expect(res.isPublic).toBe(true);
      expect(res.titleEn.length).toBeGreaterThan(3);
      expect(res.titleFr.length).toBeGreaterThan(3);
    }
  });

  it('pre-seeds 10 Approved Predefined Messages + 2 Pending Drafts across categories', () => {
    const approved = db.predefinedMessages.filter((m) => m.isApproved);
    const pending = db.predefinedMessages.filter((m) => !m.isApproved);

    expect(approved.length).toBe(10);
    expect(pending.length).toBe(2);

    const categories = new Set(approved.map((m) => m.category));
    expect(categories).toEqual(new Set(['GREETING', 'THEOLOGY', 'SHAHADAH', 'MISCONCEPTIONS']));

    for (const msg of db.predefinedMessages) {
      expect(msg.bodyEn.length).toBeGreaterThan(10);
      expect(msg.bodyFr.length).toBeGreaterThan(10);
      expect(msg.shortcut.startsWith('/')).toBe(true);
    }
  });

  it('pre-seeds all 7 Sequential Academy Lessons + 1 unapproved Instructor draft', () => {
    const approvedLessons = db.learningContents
      .filter((l) => l.isApproved)
      .sort((a, b) => a.lessonNumber - b.lessonNumber);
    const unapprovedLessons = db.learningContents.filter((l) => !l.isApproved);

    expect(approvedLessons.length).toBe(7);
    expect(unapprovedLessons.length).toBe(1);
    expect(unapprovedLessons[0].status).toBe('PENDING_APPROVAL');

    expect(approvedLessons.map((l) => l.lessonNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(approvedLessons[0].titleEn).toContain('Pillars of Islam');
    expect(approvedLessons[1].titleEn).toContain('Purification');
    expect(approvedLessons[2].titleEn).toContain('Daily Prayers');
    expect(approvedLessons[3].titleEn).toContain('Al-Fatihah');
    expect(approvedLessons[4].titleEn).toContain('Prophet Muhammad');
    expect(approvedLessons[5].titleEn).toContain('Values');
    expect(approvedLessons[6].titleEn).toContain('Common Questions');
  });

  it('pre-seeds 20 Questions per Lesson Quiz (140 total) and 100 Final Exam Questions', () => {
    expect(db.quizzes.length).toBe(7);

    for (const quiz of db.quizzes) {
      expect(quiz.passingPercentage).toBe(80);
      expect(quiz.totalQuestions).toBe(20);
      const quizQuestions = db.questions.filter((q) => q.quizId === quiz.id && !q.isFinalExam);
      expect(quizQuestions.length).toBe(20);

      for (const q of quizQuestions) {
        expect(q.promptEn.length).toBeGreaterThan(5);
        expect(q.promptFr.length).toBeGreaterThan(5);
        expect(q.optionsJson.length).toBe(4);
        expect(q.correctOptionIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctOptionIndex).toBeLessThanOrEqual(3);
      }
    }

    expect(db.finalExam.totalQuestions).toBe(100);
    expect(db.finalExam.passingPercentage).toBe(80);

    const finalExamQuestions = db.questions.filter((q) => q.isFinalExam);
    expect(finalExamQuestions.length).toBe(100);

    for (const q of finalExamQuestions) {
      expect(q.promptEn.length).toBeGreaterThan(5);
      expect(q.promptFr.length).toBeGreaterThan(5);
      expect(q.optionsJson.length).toBe(4);
      expect(q.correctOptionIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctOptionIndex).toBeLessThanOrEqual(3);
    }
  });

  it('pre-seeds 1 Sample Active Conversation with a pending Shahadah audio submission', () => {
    const seeker = db.findUserByEmail('seeker@example.com')!;
    const dialogist = db.findUserByEmail('dialogist@iu.edu.sa')!;

    expect(db.conversations.length).toBeGreaterThanOrEqual(1);
    const activeConv = db.conversations.find(
      (c) => c.nonMuslimId === seeker.id && c.dialogistId === dialogist.id
    );
    expect(activeConv).toBeDefined();
    expect(activeConv?.status).toBe('ACTIVE');
    expect(activeConv?.isAssigned).toBe(true);

    const convMessages = db.messages.filter((m) => m.conversationId === activeConv!.id);
    expect(convMessages.length).toBeGreaterThanOrEqual(2);

    const shahadah = db.shahadahSubmissions.find((s) => s.conversationId === activeConv!.id);
    expect(shahadah).toBeDefined();
    expect(shahadah?.status).toBe('PENDING_REVIEW');
    expect(shahadah?.nonMuslimId).toBe(seeker.id);
    expect(shahadah?.dialogistId).toBe(dialogist.id);
  });

  it('guarantees zero accounts and pure database in production/development mode', () => {
    vi.stubEnv('NODE_ENV', 'development');
    try {
      const cleanUsers = createInitialUsers();
      expect(cleanUsers).toEqual([]);
      const cleanState = createInitialSeedState();
      expect(cleanState.users).toEqual([]);
      expect(cleanState.certificates).toEqual([]);
      expect(cleanState.learningProgress).toEqual([]);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
