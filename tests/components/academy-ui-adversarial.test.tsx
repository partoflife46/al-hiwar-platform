import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { db } from '@/lib/db/in-memory-adapter';
import LessonReaderPage from '@/app/academy/lessons/[id]/page';
import AcademyRoadmapPage from '@/app/academy/page';

// Mock next/navigation
const mockUseParams = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Adversarial UI Testing: Academy Roadmap & Lesson Reader (Milestone 3)', () => {
  const testStudentSession = {
    userId: 'user-newmuslim-1',
    email: 'newmuslim@example.com',
    firstName: 'Tariq',
    surname: 'Ibn-Ziyad',
    role: 'NEW_MUSLIM',
    status: 'ACTIVE',
    preferredLanguage: 'en',
  };

  beforeEach(() => {
    db.reset();
    cleanup();

    // Mock global fetch to return demo session
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/auth/session') || url.includes('/api/auth/demo-switch')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: testStudentSession,
          }),
        };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ ok: false }),
      };
    }) as any;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Suite 1: Lesson Reader Direct Access & Gating Screens
  // ==========================================================================
  describe('Suite 1: Lesson Reader Direct Access & Gating Screens', () => {
    it('renders educational content for unlocked Module 1', async () => {
      mockUseParams.mockReturnValue({ id: '1' });

      render(<LessonReaderPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Pillars of Islam/i);
        expect(
          screen.getByRole('link', { name: /proceed to module 1 quiz/i })
        ).toBeInTheDocument();
      });
    });

    it('renders strict LOCKED gating screen when attempting direct URL access to Module 2', async () => {
      mockUseParams.mockReturnValue({ id: '2' });

      render(<LessonReaderPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Module 2 is Currently Locked/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Please pass the Module 1 Quiz with a score of 80% or higher to unlock this module/i)
        ).toBeInTheDocument();
      });

      // Verify educational reading content and quiz CTA are NOT present
      expect(screen.queryByText(/Proceed to Module 2 Quiz/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /return to roadmap/i })).toBeInTheDocument();
    });

    it('renders strict LOCKED gating screen when attempting direct URL access to Module 4', async () => {
      mockUseParams.mockReturnValue({ id: '4' });

      render(<LessonReaderPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Module 4 is Currently Locked/i)
        ).toBeInTheDocument();
      });
    });

    it('renders strict LOCKED gating screen when attempting direct URL access to Module 7', async () => {
      mockUseParams.mockReturnValue({ id: '7' });

      render(<LessonReaderPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Module 7 is Currently Locked/i)
        ).toBeInTheDocument();
      });
    });

    it('renders NOT FOUND view when accessing negative lesson index (e.g. -1)', async () => {
      mockUseParams.mockReturnValue({ id: '-1' });

      render(<LessonReaderPage />);

      await waitFor(() => {
        expect(screen.getByText(/Module -1 Not Found/i)).toBeInTheDocument();
        expect(
          screen.getByText(/The requested curriculum module does not exist or has not been approved/i)
        ).toBeInTheDocument();
      });
    });

    it('exposes edge case in lesson 0: parseInt("0") || 1 causes Module 0 to fall back to Module 1', async () => {
      mockUseParams.mockReturnValue({ id: '0' });

      render(<LessonReaderPage />);

      // In JavaScript, `parseInt("0") || 1` evaluates to 1 because 0 is falsy.
      // Therefore, the page unexpectedly loads Module 1 instead of showing Not Found!
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Pillars of Islam/i);
      });
    });

    it('renders LOCKED view for Module 8 instead of NOT FOUND due to upper bound evaluation order', async () => {
      mockUseParams.mockReturnValue({ id: '8' });

      render(<LessonReaderPage />);

      await waitFor(() => {
        // Because lessonNumber > progress.unlockedLessonNumber (8 > 1) returns LESSON_LOCKED,
        // the page shows the Locked screen rather than Not Found screen
        expect(
          screen.getByText(/Module 8 is Currently Locked/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Suite 2: Academy Roadmap Page & Sequential Visual Indicators
  // ==========================================================================
  describe('Suite 2: Academy Roadmap Page & Sequential Visual Indicators', () => {
    it('initial roadmap renders Module 1 active, Modules 2-7 locked, and Final Exam locked', async () => {
      render(<AcademyRoadmapPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Al Hiwar Islamic Academy Curriculum Roadmap/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Curriculum Progress: 0 of 7 Modules Passed/i)
        ).toBeInTheDocument();
      });

      // Module 1 is active with Study Module button
      expect(screen.getByRole('button', { name: /study module/i })).toBeInTheDocument();

      // Modules 2-7 show Locked buttons
      const lockedButtons = screen.getAllByRole('button', { name: /locked/i });
      expect(lockedButtons.length).toBe(6); // modules 2 to 7

      // Final exam shows prerequisites message
      expect(
        screen.getByRole('button', { name: /complete modules 1–7 to unlock/i })
      ).toBeDisabled();
    });

    it('does not display any demo speed-run or simulation shortcut buttons on the student roadmap', async () => {
      render(<AcademyRoadmapPage />);

      await waitFor(() => {
        expect(screen.getByText(/Al Hiwar Islamic Academy Curriculum Roadmap/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /simulate pass/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /demo speed-run/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/Curriculum Evaluation Tools/i)).not.toBeInTheDocument();
    });

    it('unlocks Module 2 on the roadmap while keeping Module 3 locked when Module 1 is passed', async () => {
      const prog = db.getLearningProgress(testStudentSession.userId)!;
      prog.completedLessonsCount = 1;
      prog.unlockedLessonNumber = 2;

      render(<AcademyRoadmapPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Curriculum Progress: 1 of 7 Modules Passed/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/14% Completed/i)).toBeInTheDocument();
      });

      // Module 1 now has Review Module button
      expect(screen.getByRole('button', { name: /review module/i })).toBeInTheDocument();

      // Module 2 is now active with Study Module button
      expect(screen.getByRole('button', { name: /study module/i })).toBeInTheDocument();

      // Modules 3-7 remain locked (5 locked module buttons remaining)
      const lockedButtons = screen.getAllByRole('button', { name: /locked/i });
      expect(lockedButtons.length).toBe(5);
    });

    it('renders Passed & Certified state and verifies certificate on roadmap when curriculum is completed', async () => {
      const prog = db.getLearningProgress(testStudentSession.userId)!;
      prog.completedLessonsCount = 7;
      prog.unlockedLessonNumber = 7;
      prog.allQuizzesPassed = true;
      prog.finalExamPassed = true;

      db.certificates.push({
        id: 'cert-test-graduate',
        newMuslimId: testStudentSession.userId,
        finalAttemptId: 'attempt-test-1',
        fullName: 'Tariq Ibn-Ziyad',
        dateOfBirth: '1995-01-01',
        nationality: 'Saudi',
        issueDate: new Date().toISOString(),
        verificationQrHash: 'test-qr-hash',
        pdfFileUrl: '/certificates/cert-test-graduate.pdf',
        isRevoked: false,
        revocationReason: null,
        createdAt: new Date().toISOString(),
      });

      render(<AcademyRoadmapPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Curriculum Progress: 7 of 7 Modules Passed/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/100% Completed/i)).toBeInTheDocument();
        expect(screen.getByText(/Passed & Certified/i)).toBeInTheDocument();
      });

      // Verify certificate in db
      const certs = db.certificates.filter((c) => c.newMuslimId === testStudentSession.userId);
      expect(certs.length).toBe(1);
      expect(certs[0].isRevoked).toBe(false);
    });
  });
});
