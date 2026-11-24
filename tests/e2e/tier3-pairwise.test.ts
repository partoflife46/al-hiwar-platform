import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import type { Question, UserRole, SupportedLanguage, ConsultationIntent } from '@/lib/db/types';
import {
  authService,
  chatService,
  shahadahService,
  academyService,
  contentWorkflowService,
} from './helpers/test-harness';

describe('Tier 3: Pairwise Combinatorial Testing', () => {
  beforeEach(() => {
    db.reset();
  });

  // ==========================================================================
  // Pairwise Matrix 1: User Role × Language Preference
  // ==========================================================================
  describe('Pairwise 1: User Role × Language Preference Matrix', () => {
    const roles: UserRole[] = [
      'NON_MUSLIM',
      'DIALOGIST',
      'INSTRUCTOR',
      'SUPERVISOR',
      'ADMINISTRATOR',
      'NEW_MUSLIM',
    ];
    const languages: SupportedLanguage[] = ['en', 'fr'];

    for (const role of roles) {
      for (const lang of languages) {
        it(`TC-P01: Role [${role}] × Language [${lang}] establishes valid localized session`, async () => {
          const session = await authService.switchDemoPersona(role);
          expect(session.role).toBe(role);

          // Update user's preferred language in database
          const user = db.findUserById(session.userId)!;
          user.preferredLanguage = lang;
          session.preferredLanguage = lang;

          expect(session.preferredLanguage).toBe(lang);
          expect(session.token).toBeDefined();

          const validated = await authService.validateSession(session.token);
          expect(validated).toBeDefined();
          expect(validated?.preferredLanguage).toBe(lang);
        });
      }
    }
  });

  // ==========================================================================
  // Pairwise Matrix 2: Consultation Intent × Response Mechanism
  // ==========================================================================
  describe('Pairwise 2: Consultation Intent × Response Channel', () => {
    const intents: ConsultationIntent[] = ['LEARN_ABOUT_ISLAM', 'EMBRACE_ISLAM'];
    const responseModes = ['QUICK_REPLY', 'DIRECT_TYPING'] as const;

    for (const intent of intents) {
      for (const mode of responseModes) {
        it(`TC-P02: Intent [${intent}] × Response [${mode}] executes smoothly`, async () => {
          const conv = await chatService.initiateConsultation('usr-seeker-1', intent, 'en');
          expect(conv.intent).toBe(intent);

          await chatService.claimConversation('usr-dialogist-1', conv.id);

          if (mode === 'QUICK_REPLY') {
            const qr = db.getApprovedPredefinedMessages()[0];
            const msg = await chatService.sendMessage({
              conversationId: conv.id,
              senderId: 'usr-dialogist-1',
              content: qr.bodyEn,
              predefinedReplyId: qr.id,
            });
            expect(msg.ok).toBe(true);
            if (msg.ok) {
              expect(msg.data.predefinedReplyId).toBe(qr.id);
            }
          } else {
            const msg = await chatService.sendMessage({
              conversationId: conv.id,
              senderId: 'usr-dialogist-1',
              content: `Direct typing response answering seeker inquiry regarding ${intent}.`,
            });
            expect(msg.ok).toBe(true);
            if (msg.ok) {
              expect(msg.data.predefinedReplyId).toBeNull();
            }
          }

          const history = db.messages.filter((m) => m.conversationId === conv.id);
          expect(history.length).toBe(1);
        });
      }
    }
  });

  // ==========================================================================
  // Pairwise Matrix 3: Audio Recording Mode × Review Decision
  // ==========================================================================
  describe('Pairwise 3: Audio Mode × Dialogist Review Decision', () => {
    const audioModes = [
      { mode: 'LIVE_MIC', mime: 'audio/webm;codecs=opus', url: '/audio/mic-input.webm' },
      { mode: 'FILE_UPLOAD', mime: 'audio/mp4', url: '/audio/upload-fallback.mp4' },
    ];
    const decisions = ['VALIDATE', 'REQUEST_RETAKE'] as const;

    for (const audio of audioModes) {
      for (const dec of decisions) {
        it(`TC-P03: Mode [${audio.mode}] × Decision [${dec}] transitions state appropriately`, async () => {
          const conv = await chatService.initiateConsultation('usr-seeker-1', 'EMBRACE_ISLAM');
          await chatService.claimConversation('usr-dialogist-1', conv.id);

          const subRes = await shahadahService.submitShahadah({
            conversationId: conv.id,
            nonMuslimId: 'usr-seeker-1',
            audioRecordingUrl: audio.url,
            mimeType: audio.mime,
            durationSeconds: 22,
          });

          expect(subRes.ok).toBe(true);
          const subId = (subRes as any).data.id;

          const reviewRes = await shahadahService.reviewSubmission({
            submissionId: subId,
            dialogistId: 'usr-dialogist-1',
            decision: dec,
            feedbackNotes: dec === 'VALIDATE' ? 'Passed with honor' : 'Please repeat Ash-hadu',
          });

          expect(reviewRes.ok).toBe(true);
          if (reviewRes.ok) {
            expect(reviewRes.data.status).toBe(dec === 'VALIDATE' ? 'VALIDATED' : 'RETAKE_REQUESTED');
          }
        });
      }
    }
  });

  // ==========================================================================
  // Pairwise Matrix 4: Profile Completion Formats × Role Elevation
  // ==========================================================================
  describe('Pairwise 4: Profile Demographics × Role Elevation', () => {
    const demographics = [
      { nationality: 'Saudi Arabia', gender: 'MALE' as const, phone: '+966501234567' },
      { nationality: 'France', gender: 'FEMALE' as const, phone: '+33612345678' },
      { nationality: 'United States', gender: 'MALE' as const, phone: '+14155550199' },
      { nationality: 'Indonesia', gender: 'FEMALE' as const, phone: '+628123456789' },
    ];

    for (const demo of demographics) {
      it(`TC-P04: Demographics [${demo.nationality} / ${demo.gender}] promotes role to NEW_MUSLIM and unlocks LMS`, async () => {
        const seeker = db.findUserByEmail('seeker@example.com')!;
        const res = await shahadahService.completeConversionProfile(seeker.id, {
          nationality: demo.nationality,
          gender: demo.gender,
          phoneNumber: demo.phone,
        });

        expect(res.ok).toBe(true);
        expect(seeker.role).toBe('NEW_MUSLIM');
        expect(seeker.nationality).toBe(demo.nationality);

        const progress = db.getLearningProgress(seeker.id);
        expect(progress).toBeDefined();
        expect(progress?.unlockedLessonNumber).toBe(1);
      });
    }
  });

  // ==========================================================================
  // Pairwise Matrix 5: Lesson Advancement Mode × Curriculum Steps (Lessons 1–7)
  // ==========================================================================
  describe('Pairwise 5: Lesson Evaluation Mode × Curriculum Stages', () => {
    it('TC-P05-A: Natural sequential quiz submission advances step-by-step from Lesson 1 to 7', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;

      for (let lessonNum = 1; lessonNum <= 7; lessonNum++) {
        const quizRes = (await academyService.getLessonQuiz(newMuslim.id, lessonNum)) as any;
        expect(quizRes.ok).toBe(true);

        const answers: Record<string, number> = {};
        quizRes.data.forEach((q: Question) => {
          answers[q.id] = q.correctOptionIndex; // 100% correct
        });

        const submitRes = await academyService.submitLessonQuiz(newMuslim.id, lessonNum, answers);
        expect(submitRes.ok).toBe(true);
        if (submitRes.ok) {
          expect(submitRes.data.isPassed).toBe(true);
        }

        const progress = db.getLearningProgress(newMuslim.id)!;
        expect(progress.completedLessonsCount).toBe(lessonNum);
      }

      const finalProgress = db.getLearningProgress(newMuslim.id)!;
      expect(finalProgress.allQuizzesPassed).toBe(true);
    });

    it('TC-P05-B: Presentation "Simulate Pass" demo shortcut advances step-by-step instantly', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;

      for (let lessonNum = 1; lessonNum <= 7; lessonNum++) {
        const prog = await academyService.executeEvaluationShortcut(
          newMuslim.id,
          'PASS_LESSON',
          lessonNum
        );
        expect(prog.completedLessonsCount).toBe(lessonNum);
      }

      const finalProgress = db.getLearningProgress(newMuslim.id)!;
      expect(finalProgress.allQuizzesPassed).toBe(true);
    });
  });

  // ==========================================================================
  // Pairwise Matrix 6: Final Exam Completion Mode × PDF Stamping
  // ==========================================================================
  describe('Pairwise 6: Final Exam Completion × Vector PDF Stamping', () => {
    it('TC-P06-A: Natural 100-Question Exam completion generates verifiable PDF certificate', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const prog = db.getLearningProgress(newMuslim.id)!;
      prog.allQuizzesPassed = true;

      const examQuestions = (await academyService.getFinalExam(newMuslim.id)) as any;
      const answers: Record<string, number> = {};
      examQuestions.data.forEach((q: Question) => {
        answers[q.id] = q.correctOptionIndex;
      });

      const examRes = await academyService.submitFinalExam(newMuslim.id, answers);
      expect(examRes.ok).toBe(true);

      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;
      expect(cert).toBeDefined();

      const pdf = await academyService.generateCertificatePdf(cert.id);
      expect(pdf.ok).toBe(true);
      if (pdf.ok) {
        expect(pdf.data.byteLength).toBeGreaterThan(1000);
      }
    });

    it('TC-P06-B: Presentation "Pass All & Graduate" shortcut generates verifiable PDF certificate', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');

      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;
      expect(cert).toBeDefined();

      const pdf = await academyService.generateCertificatePdf(cert.id);
      expect(pdf.ok).toBe(true);
      if (pdf.ok) {
        expect(pdf.data.byteLength).toBeGreaterThan(1000);
      }
    });
  });

  // ==========================================================================
  // Pairwise Matrix 7: Certificate Status × Public QR Verification
  // ==========================================================================
  describe('Pairwise 7: Certificate Status × Public Verification Route', () => {
    it('TC-P07-A: Active authentic certificate returns valid university credential verification', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      // Lookup via certificate ID
      const resById = await academyService.verifyCertificate(cert.id);
      expect(resById.ok).toBe(true);
      if (resById.ok) {
        expect(resById.data.isRevoked).toBe(false);
      }

      // Lookup via embedded QR hash
      const resByQr = await academyService.verifyCertificate(cert.verificationQrHash);
      expect(resByQr.ok).toBe(true);
      if (resByQr.ok) {
        expect(resByQr.data.id).toBe(cert.id);
      }
    });

    it('TC-P07-B: Admin-revoked certificate returns revocation alert on public verification', async () => {
      const admin = db.findUserByEmail('admin@iu.edu.sa')!;
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      await academyService.revokeCertificate(admin.id, cert.id, 'Plagiarism in Capstone Thesis');

      const verifyRes = await academyService.verifyCertificate(cert.id);
      expect(verifyRes.ok).toBe(true);
      if (verifyRes.ok) {
        expect(verifyRes.data.isRevoked).toBe(true);
        expect(verifyRes.data.revocationReason).toBe('Plagiarism in Capstone Thesis');
      }
    });
  });

  // ==========================================================================
  // Pairwise Matrix 8: Editorial Review Gate × Dialogist Quick Reply Palette
  // ==========================================================================
  describe('Pairwise 8: Supervisor Editorial Gate × Dialogist Palette Synchronization', () => {
    it('TC-P08: Approved quick reply is immediately available to Dialogists; rejected reply is not', async () => {
      const instructor = db.findUserByEmail('instructor@iu.edu.sa')!;
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;

      // Draft 1: To be approved
      const draftApprove = await contentWorkflowService.createPredefinedMessageDraft(instructor.id, {
        shortcut: '/tawheed-deep',
        category: 'THEOLOGY',
        bodyEn: 'Deep dive into Tawheed al-Asma wa al-Sifat.',
        bodyFr: 'Approfondissement du Tawhid al-Asma wa al-Sifat.',
      });

      // Draft 2: To be rejected
      const draftReject = await contentWorkflowService.createPredefinedMessageDraft(instructor.id, {
        shortcut: '/unvetted',
        category: 'MISCONCEPTIONS',
        bodyEn: 'Unvetted content.',
        bodyFr: 'Contenu non verifie.',
      });

      await contentWorkflowService.reviewPredefinedMessage(supervisor.id, draftApprove.id, 'APPROVE');
      await contentWorkflowService.reviewPredefinedMessage(supervisor.id, draftReject.id, 'REJECT');

      const approvedPalette = db.getApprovedPredefinedMessages();
      expect(approvedPalette.some((m) => m.id === draftApprove.id)).toBe(true);
      expect(approvedPalette.some((m) => m.id === draftReject.id)).toBe(false);
    });
  });
});
