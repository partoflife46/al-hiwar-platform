import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import { authService } from '@/lib/services/auth-service';
import { chatService } from '@/lib/services/chat-service';
import { shahadahService } from '@/lib/services/shahadah-service';
import { academyService } from '@/lib/services/academy-service';
import { contentWorkflowService } from '@/lib/services/content-workflow-service';
import type { Question } from '@/lib/db/types';

describe('End-to-End Full Platform Journey (Task 5.2)', () => {
  beforeEach(() => {
    db.reset();
  });

  it('executes the complete unbroken lifecycle from Visitor -> 18+ Seeker -> Live Dialogue -> Shahadah Retake & Validation -> New Muslim -> 7 Lessons & Quizzes -> 100-Q Final Exam -> PDF Certificate -> Staff Governance', async () => {
    // ========================================================================
    // 1. Under-18 visitor blocked at registration (AGE_GATE_REJECTED)
    // ========================================================================
    const underageRes = await authService.registerSeeker({
      firstName: 'Young',
      surname: 'Visitor',
      email: 'minor@example.com',
      dateOfBirth: '2015-05-10', // Age < 18
      preferredLanguage: 'fr',
    });
    expect(underageRes.ok).toBe(false);
    if (!underageRes.ok) {
      expect(underageRes.error.code).toBe('AGE_GATE_REJECTED');
    }

    // ========================================================================
    // 2. Adult visitor (18+) registers -> verifies 4-digit email OTP -> selects French
    // ========================================================================
    const adultRes = await authService.registerSeeker({
      firstName: 'Henri',
      surname: 'Moreau',
      email: 'henri.moreau@example.fr',
      dateOfBirth: '1997-03-21',
      preferredLanguage: 'fr',
    });
    expect(adultRes.ok).toBe(true);
    if (!adultRes.ok) return;

    const { pendingUserId, demoOtpHint } = adultRes.data;
    expect(demoOtpHint).toMatch(/^\d{6}$/);

    const otpRes = await authService.verifyEmailOtp(pendingUserId, demoOtpHint!);
    expect(otpRes.ok).toBe(true);
    if (!otpRes.ok) return;
    expect(otpRes.data.role).toBe('NON_MUSLIM');
    expect(otpRes.data.preferredLanguage).toBe('fr');

    const seekerId = otpRes.data.userId;

    // ========================================================================
    // 3. Non-Muslim starts live dialogue -> 120s timeout message triggers ->
    //    Dialogist claims conversation (second Dialogist blocked from claiming)
    // ========================================================================
    const conversation = await chatService.initiateConsultation(
      seekerId,
      'EMBRACE_ISLAM',
      'fr'
    );
    expect(conversation.status).toBe('QUEUED');
    expect(conversation.isAssigned).toBe(false);

    // 120s timeout reassurance triggers if unanswered
    const timeoutRes = await chatService.checkInactivityTimeout(conversation.id, 125);
    expect(timeoutRes.notified).toBe(true);
    expect(timeoutRes.message?.content).toContain('spécialistes');

    // First Dialogist claims conversation
    const dialogist1Id = 'user-dialogist-1';
    const claim1 = await chatService.claimConversation(dialogist1Id, conversation.id);
    expect(claim1.ok).toBe(true);

    // Second Dialogist created by Admin is blocked from claiming the same conversation
    const secondDialogistRes = await contentWorkflowService.createStaffAccount({
      adminId: 'user-admin-1',
      firstName: 'Sheikh Bilal',
      surname: 'Al-Makki',
      email: 'bilal@iu.edu.sa',
      role: 'DIALOGIST',
      dateOfBirth: '1986-09-12',
    });
    expect(secondDialogistRes.ok).toBe(true);
    if (!secondDialogistRes.ok) return;

    const claim2 = await chatService.claimConversation(
      secondDialogistRes.data.id,
      conversation.id
    );
    expect(claim2.ok).toBe(false);
    if (!claim2.ok) {
      expect(claim2.error.code).toBe('CONVERSATION_ALREADY_CLAIMED');
    }

    // Privacy check: Dialogist sees only firstName
    const sanitizedView = chatService.sanitizeForDialogist(conversation);
    expect(sanitizedView.seekerFirstName).toBe('Henri');
    expect((sanitizedView as any).surname).toBeUndefined();

    // ========================================================================
    // 4. Dialogist sends supervisor-approved quick reply
    // ========================================================================
    const approvedTemplates = db.getApprovedPredefinedMessages();
    expect(approvedTemplates.length).toBeGreaterThan(0);

    const quickReplyRes = await chatService.sendMessage({
      conversationId: conversation.id,
      senderId: dialogist1Id,
      content: '',
      predefinedReplyId: approvedTemplates[0].id,
    });
    expect(quickReplyRes.ok).toBe(true);
    if (quickReplyRes.ok) {
      expect(quickReplyRes.data.content.length).toBeGreaterThan(5);
    }

    // ========================================================================
    // 5. Non-Muslim submits Shahadah voice note -> Dialogist requests retake first
    //    (attaching reference audio) -> Non-Muslim resubmits -> Dialogist validates
    // ========================================================================
    const sub1 = await shahadahService.submitShahadah({
      conversationId: conversation.id,
      seekerId,
      audioRecordingUrl: 'data:audio/webm;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA',
      mimeType: 'audio/webm;codecs=opus',
      durationSeconds: 14,
    });
    expect(sub1.ok).toBe(true);
    if (!sub1.ok) return;
    expect(sub1.data.status).toBe('PENDING_REVIEW');

    // Dialogist requests retake first (attaches model reference audio)
    const retakeReview = await shahadahService.reviewSubmission({
      dialogistId: dialogist1Id,
      submissionId: sub1.data.id,
      decision: 'REQUEST_RETAKE',
      feedbackNotes: 'Please articulate "Ash-hadu" clearly following the reference clip.',
    });
    expect(retakeReview.ok).toBe(true);
    if (retakeReview.ok) {
      expect(retakeReview.data.status).toBe('RETAKE_REQUESTED');
    }

    // Verify reference audio was attached in conversation messages
    const msgsAfterRetake = db.messages.filter((m) => m.conversationId === conversation.id);
    expect(msgsAfterRetake.some((m) => Boolean(m.audioUrl))).toBe(true);

    // Non-Muslim resubmits Shahadah voice note
    const sub2 = await shahadahService.submitShahadah({
      conversationId: conversation.id,
      seekerId,
      audioRecordingUrl: 'data:audio/webm;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA_RETAKE2',
      mimeType: 'audio/webm;codecs=opus',
      durationSeconds: 18,
    });
    expect(sub2.ok).toBe(true);
    if (!sub2.ok) return;

    // Dialogist validates Shahadah -> Congratulation message sent
    const validateReview = await shahadahService.reviewSubmission({
      dialogistId: dialogist1Id,
      submissionId: sub2.data.id,
      decision: 'VALIDATE',
      feedbackNotes: 'Mubarak! Authentic pronunciation verified.',
    });
    expect(validateReview.ok).toBe(true);
    if (validateReview.ok) {
      expect(validateReview.data.status).toBe('VALIDATED');
    }

    const msgsAfterValidation = db.messages.filter(
      (m) => m.conversationId === conversation.id
    );
    expect(
      msgsAfterValidation.some((m) => m.content.includes('Mubarak'))
    ).toBe(true);

    // ========================================================================
    // 6. User prompted for mandatory profile update (Nationality, Gender, Phone) ->
    //    confirms -> role converts to NEW_MUSLIM while preserving chat history
    // ========================================================================
    const msgCountBeforeElevation = db.messages.filter(
      (m) => m.conversationId === conversation.id
    ).length;

    const elevationRes = await shahadahService.completeConversionProfile(seekerId, {
      nationality: 'France',
      gender: 'MALE',
      phoneNumber: '+33 6 12 34 56 78',
    });
    expect(elevationRes.ok).toBe(true);
    if (elevationRes.ok) {
      expect(elevationRes.data.role).toBe('NEW_MUSLIM');
    }

    const msgCountAfterElevation = db.messages.filter(
      (m) => m.conversationId === conversation.id
    ).length;
    expect(msgCountAfterElevation).toBe(msgCountBeforeElevation);

    // ========================================================================
    // 7. New Muslim completes Lessons 1–7 sequentially (passing 20-question quizzes
    //    at >= 80%) -> unlocks and passes 100-question Final Exam at >= 80% ->
    //    PDF Certificate automatically generated with Full Name, DOB, and Nationality
    // ========================================================================
    for (let lessonNum = 1; lessonNum <= 7; lessonNum++) {
      const lessonDetail = await academyService.getLessonDetail(seekerId, lessonNum);
      expect(lessonDetail.ok).toBe(true);

      const quizRes = await academyService.getLessonQuiz(seekerId, lessonNum);
      expect(quizRes.ok).toBe(true);
      const questions: Question[] = (quizRes as any).data;
      expect(questions).toHaveLength(20);

      // Answer 18/20 (90% >= 80%) correctly
      const quizAnswers: Record<string, number> = {};
      questions.forEach((q, idx) => {
        quizAnswers[q.id] = idx < 18 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const submitQuiz = await academyService.submitLessonQuiz(
        seekerId,
        lessonNum,
        quizAnswers
      );
      expect(submitQuiz.ok).toBe(true);
      if (submitQuiz.ok) {
        expect(submitQuiz.data.isPassed).toBe(true);
        expect(submitQuiz.data.scorePercentage).toBe(90);
      }
    }

    // 100-Question Final Exam is now unlocked
    const finalExamRes = await academyService.getFinalExam(seekerId);
    expect(finalExamRes.ok).toBe(true);
    const finalQuestions: Question[] = (finalExamRes as any).data;
    expect(finalQuestions).toHaveLength(100);

    // Answer 88/100 (88% >= 80%) correctly
    const finalAnswers: Record<string, number> = {};
    finalQuestions.forEach((q, idx) => {
      finalAnswers[q.id] = idx < 88 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
    });

    const submitFinal = await academyService.submitFinalExam(seekerId, finalAnswers);
    expect(submitFinal.ok).toBe(true);
    if (submitFinal.ok) {
      expect(submitFinal.data.isPassed).toBe(true);
      expect(submitFinal.data.scorePercentage).toBe(88);
    }

    // Verify Certificate automatically generated with Full Name, DOB, and Nationality
    const issuedCert = db.certificates.find((c) => c.newMuslimId === seekerId)!;
    expect(issuedCert).toBeDefined();
    expect(issuedCert.fullName).toBe('Henri Moreau');
    expect(issuedCert.dateOfBirth).toBe('1997-03-21');
    expect(issuedCert.nationality).toBe('France');

    // Generate Vector PDF Certificate
    const pdfRes = await academyService.generateCertificatePdf(issuedCert.id);
    expect(pdfRes.ok).toBe(true);
    if (pdfRes.ok) {
      const pdfText = Buffer.from(pdfRes.data).toString('latin1');
      expect(pdfText.slice(0, 5)).toBe('%PDF-');
      expect(pdfText).toContain('Henri Moreau');
      expect(pdfText).toContain('France');
      expect(pdfText).toContain('1997-03-21');
    }

    // ========================================================================
    // 8. Instructor submits content -> Supervisor approves it ->
    //    Administrator uploads an IslamicResource and creates a new staff account
    // ========================================================================
    const lessonDraftRes = await contentWorkflowService.createOrUpdateLessonDraft({
      instructorId: 'user-instructor-1',
      lessonNumber: 8,
      titleEn: 'Advanced Fiqh of Worship',
      titleFr: 'Fiqh avancé de l’adoration',
      contentMarkdownEn: '# Advanced Fiqh',
      contentMarkdownFr: '# Fiqh Avancé',
    });
    expect(lessonDraftRes.ok).toBe(true);
    if (!lessonDraftRes.ok) return;
    expect(lessonDraftRes.data.isApproved).toBe(false);

    const approveLessonRes = await contentWorkflowService.reviewLessonContent({
      supervisorId: 'user-supervisor-1',
      lessonId: lessonDraftRes.data.id,
      decision: 'APPROVE',
    });
    expect(approveLessonRes.ok).toBe(true);
    if (approveLessonRes.ok) {
      expect(approveLessonRes.data.isApproved).toBe(true);
    }

    const uploadResourceRes = await contentWorkflowService.uploadIslamicResource({
      adminId: 'user-admin-1',
      titleEn: 'The Virtues of Madinah Al-Munawwarah',
      titleFr: 'Les Vertus de Médine l’Illuminée',
      category: 'PROPHET',
      resourceType: 'PDF',
      mediaUrl: '/resources/virtues-of-madinah.pdf',
      descriptionEn: 'Authentic hadith collection on the prophetic city.',
      descriptionFr: 'Collection authentique de hadiths sur la ville prophétique.',
    });
    expect(uploadResourceRes.ok).toBe(true);
    if (uploadResourceRes.ok) {
      expect(uploadResourceRes.data.uploadedByAdminId).toBe('user-admin-1');
    }
  });
});
