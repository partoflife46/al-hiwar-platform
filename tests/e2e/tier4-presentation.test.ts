import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import {
  authService,
  chatService,
  shahadahService,
  academyService,
  contentWorkflowService,
} from './helpers/test-harness';

describe('Tier 4: Real-World Presentation Scenarios (Classroom Demonstration Runbook)', () => {
  beforeEach(() => {
    db.reset();
  });

  // ==========================================================================
  // Full 6-Step Presentation Journey (06-IPD.md § Task 5.2)
  // ==========================================================================
  describe('Full Classroom Demonstration Runbook (Steps 1 to 6)', () => {
    it('Executes the complete end-to-end presentation runbook without error', async () => {
      // ----------------------------------------------------------------------
      // Step 1: Visitor Discovery, Age Gate & Account Onboarding
      // ----------------------------------------------------------------------
      // 1.1 Visitor unauthenticated inspection of public library
      const publicResources = db.getPublicIslamicResources();
      expect(publicResources.length).toBe(8);
      const quranResource = publicResources.find((r) => r.category === 'QURAN')!;
      expect(quranResource.titleEn).toContain('Qur');

      // 1.2 Minor age rejection verification
      const minorAttempt = await authService.registerSeeker({
        firstName: 'Young',
        surname: 'Seeker',
        email: 'minor@example.com',
        dateOfBirth: '2015-01-01',
      });
      expect(minorAttempt.ok).toBe(false);

      // 1.3 Valid 18+ adult registration
      const regRes = await authService.registerSeeker({
        firstName: 'Jean-Luc',
        surname: 'Dubois',
        email: 'jeanluc.presentation@example.com',
        dateOfBirth: '1996-05-14', // 30 years old
        preferredLanguage: 'fr',
      });
      expect(regRes.ok).toBe(true);
      const pendingUserId = (regRes as any).data.pendingUserId;
      expect((regRes as any).data.demoOtpHint).toBe('1234');

      // 1.4 Submit 4-digit OTP to activate account
      const otpRes = await authService.verifyEmailOtp(pendingUserId, '1234');
      expect(otpRes.ok).toBe(true);
      const seekerSession = (otpRes as any).data;
      expect(seekerSession.role).toBe('NON_MUSLIM');
      expect(seekerSession.preferredLanguage).toBe('fr');

      // ----------------------------------------------------------------------
      // Step 2: Live 1-on-1 Consultation & Dialogist Engagement
      // ----------------------------------------------------------------------
      // 2.1 Seeker opens dialogue page and selects EMBRACE_ISLAM intent
      const conversation = await chatService.initiateConsultation(
        seekerSession.userId,
        'EMBRACE_ISLAM',
        seekerSession.preferredLanguage
      );
      expect(conversation.status).toBe('QUEUED');
      expect(conversation.isAssigned).toBe(false);

      // 2.2 Switch Persona to DIALOGIST
      const dialogistSession = await authService.switchDemoPersona('DIALOGIST');
      expect(dialogistSession.role).toBe('DIALOGIST');

      // 2.3 Dialogist views queue and claims conversation exclusively
      const queue = await chatService.getUnansweredQueue();
      expect(queue.some((c) => c.id === conversation.id)).toBe(true);

      const claimRes = await chatService.claimConversation(dialogistSession.userId, conversation.id);
      expect(claimRes.ok).toBe(true);

      // 2.4 Dialogist sends pre-approved quick reply in French
      const frenchGreeting = db.getApprovedPredefinedMessages('GREETING')[0];
      const replyRes = await chatService.sendMessage({
        conversationId: conversation.id,
        senderId: dialogistSession.userId,
        content: frenchGreeting.bodyFr,
        predefinedReplyId: frenchGreeting.id,
      });
      expect(replyRes.ok).toBe(true);

      // 2.5 Dialogist uses emergency direct typing seam for custom guidance
      const directMsg = await chatService.sendMessage({
        conversationId: conversation.id,
        senderId: dialogistSession.userId,
        content: 'Bienvenue! Vous pouvez enregistrer votre Shahada avec le microphone ci-dessous.',
      });
      expect(directMsg.ok).toBe(true);

      // ----------------------------------------------------------------------
      // Step 3: Shahadah Voice Recording & Pronunciation Validation
      // ----------------------------------------------------------------------
      // 3.1 Seeker records and submits Shahadah voice note
      const shahadahRes = await shahadahService.submitShahadah({
        conversationId: conversation.id,
        nonMuslimId: seekerSession.userId,
        audioRecordingUrl: '/uploads/audio/presentation-recording.webm',
        mimeType: 'audio/webm;codecs=opus',
        durationSeconds: 26,
      });
      expect(shahadahRes.ok).toBe(true);
      const submissionId = (shahadahRes as any).data.id;

      // 3.2 Dialogist plays audio and validates pronunciation
      const reviewRes = await shahadahService.reviewSubmission({
        submissionId,
        dialogistId: dialogistSession.userId,
        decision: 'VALIDATE',
        feedbackNotes: 'Mabruk! Pronunciation of the two testimonies is verified.',
      });
      expect(reviewRes.ok).toBe(true);
      expect((reviewRes as any).data.status).toBe('VALIDATED');

      // ----------------------------------------------------------------------
      // Step 4: Mandatory Profile Completion & Role Elevation
      // ----------------------------------------------------------------------
      // 4.1 Seeker completes mandatory demographic profile
      const profileRes = await shahadahService.completeConversionProfile(seekerSession.userId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33612345678',
      });
      expect(profileRes.ok).toBe(true);
      const newMuslimSession = (profileRes as any).data;
      expect(newMuslimSession.role).toBe('NEW_MUSLIM');

      // 4.2 Confirm Academy progress initialized
      const progress = await academyService.getProgress(seekerSession.userId);
      expect(progress.unlockedLessonNumber).toBe(1);
      expect(progress.completedLessonsCount).toBe(0);

      // ----------------------------------------------------------------------
      // Step 5: 7-Module Sequential LMS & Capstone Examination
      // ----------------------------------------------------------------------
      // 5.1 Step through Lessons 1 to 6 using presentation Simulate Pass shortcut
      for (let l = 1; l <= 6; l++) {
        const prog = await academyService.executeEvaluationShortcut(
          seekerSession.userId,
          'PASS_LESSON',
          l
        );
        expect(prog.completedLessonsCount).toBe(l);
        expect(prog.unlockedLessonNumber).toBe(l + 1);
      }

      // 5.2 Pass Lesson 7 to unlock Capstone Final Exam
      const lesson7Prog = await academyService.executeEvaluationShortcut(
        seekerSession.userId,
        'PASS_LESSON',
        7
      );
      expect(lesson7Prog.completedLessonsCount).toBe(7);
      expect(lesson7Prog.allQuizzesPassed).toBe(true);

      // 5.3 Retrieve 100-Question Final Exam
      const examRes = await academyService.getFinalExam(seekerSession.userId);
      expect(examRes.ok).toBe(true);
      const examQuestions = (examRes as any).data;
      expect(examQuestions.length).toBe(100);

      // 5.4 Submit Final Exam answers with 90% score (90 correct answers)
      const examAnswers: Record<string, number> = {};
      examQuestions.forEach((q: any, idx: number) => {
        examAnswers[q.id] = idx < 90 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const examSubmitRes = await academyService.submitFinalExam(
        seekerSession.userId,
        examAnswers
      );
      expect(examSubmitRes.ok).toBe(true);
      expect((examSubmitRes as any).data.isPassed).toBe(true);
      expect((examSubmitRes as any).data.scorePercentage).toBe(90);

      // ----------------------------------------------------------------------
      // Step 6: Vector PDF Certificate Stamping & QR Verification
      // ----------------------------------------------------------------------
      // 6.1 Certificate record is issued and available in database
      const cert = db.certificates.find((c) => c.newMuslimId === seekerSession.userId)!;
      expect(cert).toBeDefined();
      expect(cert.fullName).toContain('Jean-Luc Dubois');
      expect(cert.isRevoked).toBe(false);

      // 6.2 Stamp Vector PDF via pure TypeScript in under 300ms
      const stampStart = Date.now();
      const pdfRes = await academyService.generateCertificatePdf(cert.id);
      const stampElapsed = Date.now() - stampStart;

      expect(pdfRes.ok).toBe(true);
      expect(stampElapsed).toBeLessThan(350); // Real-time SLA
      if (pdfRes.ok) {
        const header = Buffer.from(pdfRes.data.slice(0, 5)).toString();
        expect(header).toBe('%PDF-');
        expect(pdfRes.data.byteLength).toBeGreaterThan(1000);
      }

      // 6.3 Public Verification via QR hash
      const verifyRes = await academyService.verifyCertificate(cert.verificationQrHash);
      expect(verifyRes.ok).toBe(true);
      if (verifyRes.ok) {
        expect(verifyRes.data.fullName).toContain('Jean-Luc Dubois');
        expect(verifyRes.data.isRevoked).toBe(false);
      }

      // 6.4 Administrative Governance: Admin tests revocation override
      const adminSession = await authService.switchDemoPersona('ADMINISTRATOR');
      const revokeRes = await academyService.revokeCertificate(
        adminSession.userId,
        cert.id,
        'Classroom presentation test revocation'
      );
      expect(revokeRes.ok).toBe(true);

      const postRevokeVerify = await academyService.verifyCertificate(cert.id);
      expect(postRevokeVerify.ok).toBe(true);
      if (postRevokeVerify.ok) {
        expect(postRevokeVerify.data.isRevoked).toBe(true);
        expect(postRevokeVerify.data.revocationReason).toBe(
          'Classroom presentation test revocation'
        );
      }

      // 6.5 Supervisor Read-Only Audit Console verification
      const supervisorSession = await authService.switchDemoPersona('SUPERVISOR');
      const auditConvs = await contentWorkflowService.getConversationsAudit(supervisorSession.userId);
      expect(auditConvs.some((c) => c.id === conversation.id)).toBe(true);
    });
  });

  // ==========================================================================
  // Rapid Repeatability & Zero-Config Presentation Idempotency
  // ==========================================================================
  describe('Presentation Rehearsal Repeatability', () => {
    it('Can reset and execute 3 consecutive presentation speed-runs in sub-second intervals', async () => {
      for (let run = 1; run <= 3; run++) {
        db.reset();

        // Instant speed-run
        const seeker = db.findUserByEmail('seeker@example.com')!;
        await shahadahService.completeConversionProfile(seeker.id, {
          nationality: 'Presentation State',
          gender: 'MALE',
          phoneNumber: '+1000000000',
        });

        const graduateProg = await academyService.executeEvaluationShortcut(
          seeker.id,
          'PASS_ALL_AND_GRADUATE'
        );
        expect(graduateProg.finalExamPassed).toBe(true);

        const cert = db.certificates.find((c) => c.newMuslimId === seeker.id)!;
        expect(cert).toBeDefined();

        const pdfRes = await academyService.generateCertificatePdf(cert.id);
        expect(pdfRes.ok).toBe(true);
      }
    });
  });
});
