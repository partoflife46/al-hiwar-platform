import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import { chatEventBus } from '@/lib/services/chat-event-bus';
import { shahadahService } from '@/lib/services/shahadah-service';
import type { ChatEvent, ChatMessageEvent } from '@/lib/services/chat-event-bus';

describe('ShahadahService Seam (Milestone 3 / Phase 3)', () => {
  const seekerId = 'user-seeker-1';
  const dialogistId = 'user-dialogist-1';
  const conversationId = 'conv-demo-1';

  beforeEach(() => {
    db.reset();
    chatEventBus.reset();
  });

  // ==========================================================================
  // Group 1: Model Reference Audio & Bilingual Recitation
  // ==========================================================================
  describe('Group 1: Model Reference Audio & Bilingual Recitation', () => {
    it('returns authentic Arabic text with full diacritics', async () => {
      const ref = await shahadahService.getModelReferenceAudio('en');
      expect(ref.arabicScript).toContain('أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ');
      expect(ref.arabicText).toBe(ref.arabicScript);
    });

    it('returns accurate phonetics transliteration', async () => {
      const refEn = await shahadahService.getModelReferenceAudio('en');
      expect(refEn.phoneticGuide).toContain('Ash-hadu an la ilaha illa Allah');

      const refFr = await shahadahService.getModelReferenceAudio('fr');
      expect(refFr.phoneticGuide).toContain('Ach-hadou an la ilaha illa Allah');
    });

    it('returns English translation by default or when language is en', async () => {
      const ref = await shahadahService.getModelReferenceAudio('en');
      expect(ref.englishTranslation).toContain('I bear witness that there is no deity worthy of worship except Allah');
      expect(ref.translation).toBe(ref.englishTranslation);
    });

    it('returns French translation when language is fr', async () => {
      const ref = await shahadahService.getModelReferenceAudio('fr');
      expect(ref.translation).toContain("J'atteste qu'il n'y a de divinité digne d'adoration qu'Allah");
      expect(ref.translationFr).toContain("J'atteste");
    });

    it('includes valid reference audio URL and duration', async () => {
      const ref = await shahadahService.getModelReferenceAudio('en');
      expect(ref.audioUrl).toBeTruthy();
      expect(ref.durationSeconds).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Group 2: Voice Note Submission (submitShahadah)
  // ==========================================================================
  describe('Group 2: Voice Note Submission (submitShahadah)', () => {
    it('successfully records a new voice note submission in PENDING_REVIEW', async () => {
      const result = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8=',
        mimeType: 'audio/webm;codecs=opus',
        durationSeconds: 16,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe('PENDING_REVIEW');
        expect(result.data.conversationId).toBe(conversationId);
        expect(result.data.nonMuslimId).toBe(seekerId);
        expect(result.data.durationSeconds).toBe(16);
        expect(result.data.mimeType).toBe('audio/webm;codecs=opus');
      }
    });

    it('links submission to conversation and appends in-chat voice note message', async () => {
      const initialMessageCount = db.messages.filter((m) => m.conversationId === conversationId).length;

      const result = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/sample-shahadah-jean-luc.webm',
        durationSeconds: 18,
      });

      expect(result.ok).toBe(true);
      const messages = db.messages.filter((m) => m.conversationId === conversationId);
      expect(messages.length).toBe(initialMessageCount + 1);

      const latestMsg = messages[messages.length - 1];
      expect(latestMsg.hasVoiceNote).toBe(true);
      expect(latestMsg.audioUrl).toBe('/audio/sample-shahadah-jean-luc.webm');
      expect(latestMsg.senderId).toBe(seekerId);
    });

    it('broadcasts message event over chatEventBus', async () => {
      const receivedEvents: ChatEvent[] = [];
      chatEventBus.subscribe(conversationId, (event) => {
        receivedEvents.push(event);
      });

      const result = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: 'data:audio/webm;base64,test-payload',
        durationSeconds: 15,
      });

      expect(result.ok).toBe(true);
      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0].type).toBe('message');
      const msgEvent = receivedEvents[0] as ChatMessageEvent;
      expect(msgEvent.message.hasVoiceNote).toBe(true);
      expect(msgEvent.message.audioUrl).toBe('data:audio/webm;base64,test-payload');
    });

    it('updates existing submission when seeker re-submits after retake request', async () => {
      // First submission
      await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/first-take.webm',
        durationSeconds: 14,
      });

      // Dialogist requests retake
      const sub = db.shahadahSubmissions.find((s) => s.conversationId === conversationId)!;
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: sub.id,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Please pronounce the ha clearly.',
      });

      expect(sub.status).toBe('RETAKE_REQUESTED');

      // Seeker re-submits second take
      const reResult = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/second-take.webm',
        durationSeconds: 18,
      });

      expect(reResult.ok).toBe(true);
      if (reResult.ok) {
        expect(reResult.data.id).toBe(sub.id);
        expect(reResult.data.status).toBe('PENDING_REVIEW');
        expect(reResult.data.audioRecordingUrl).toBe('/audio/second-take.webm');
        expect(reResult.data.durationSeconds).toBe(18);
        expect(reResult.data.feedbackNotes).toBeNull();
      }
    });

    it('rejects submission if seeker user is not found (USER_NOT_FOUND)', async () => {
      const result = await shahadahService.submitShahadah({
        seekerId: 'non-existent-user',
        conversationId,
        audioRecordingUrl: '/audio/test.webm',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('USER_NOT_FOUND');
      }
    });

    it('rejects submission if conversation is not found (CONVERSATION_NOT_FOUND)', async () => {
      const result = await shahadahService.submitShahadah({
        seekerId,
        conversationId: 'non-existent-conv',
        audioRecordingUrl: '/audio/test.webm',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CONVERSATION_NOT_FOUND');
      }
    });

    it('rejects submission if seeker does not own conversation (UNAUTHORIZED)', async () => {
      const otherUser = 'user-dialogist-1';
      const result = await shahadahService.submitShahadah({
        seekerId: otherUser,
        conversationId,
        audioRecordingUrl: '/audio/test.webm',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('rejects submission if audio payload is missing or empty (INVALID_AUDIO)', async () => {
      const result = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_AUDIO');
      }
    });
  });

  // ==========================================================================
  // Group 3: Dialogist Review & Retake Guidance (reviewSubmission)
  // ==========================================================================
  describe('Group 3: Dialogist Review & Retake Guidance (reviewSubmission)', () => {
    it('transitions status to VALIDATED and stamps validatedAt upon approval', async () => {
      const subResult = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/valid.webm',
        durationSeconds: 20,
      });
      expect(subResult.ok).toBe(true);
      const submissionId = (subResult as any).data.id;

      const reviewRes = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId,
        decision: 'VALIDATE',
        feedbackNotes: 'MashaAllah, excellent recitation!',
      });

      expect(reviewRes.ok).toBe(true);
      if (reviewRes.ok) {
        expect(reviewRes.data.status).toBe('VALIDATED');
        expect(reviewRes.data.validatedAt).toBeTruthy();
        expect(reviewRes.data.dialogistId).toBe(dialogistId);
        expect(reviewRes.data.feedbackNotes).toBe('MashaAllah, excellent recitation!');
      }
    });

    it('injects celebratory in-chat notification and broadcasts message event', async () => {
      const subResult = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/valid.webm',
      });
      const submissionId = (subResult as any).data.id;

      const receivedEvents: ChatEvent[] = [];
      chatEventBus.subscribe(conversationId, (e) => receivedEvents.push(e));

      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId,
        decision: 'VALIDATE',
      });

      const messages = db.messages.filter((m) => m.conversationId === conversationId);
      const latestMsg = messages[messages.length - 1];
      expect(latestMsg.content).toContain('Mubarak');
      expect(latestMsg.senderId).toBe(dialogistId);

      expect(receivedEvents.length).toBe(1);
      expect((receivedEvents[0] as ChatMessageEvent).message.content).toContain('Mubarak');
    });

    it('transitions status to RETAKE_REQUESTED and attaches feedbackNotes', async () => {
      const subResult = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/imperfect.webm',
      });
      const submissionId = (subResult as any).data.id;

      const reviewRes = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Please focus on the pronunciation of Rasulullah.',
      });

      expect(reviewRes.ok).toBe(true);
      if (reviewRes.ok) {
        expect(reviewRes.data.status).toBe('RETAKE_REQUESTED');
        expect(reviewRes.data.feedbackNotes).toBe('Please focus on the pronunciation of Rasulullah.');
      }
    });

    it('injects retake guidance message referencing model recitation into chat', async () => {
      const subResult = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/imperfect.webm',
      });
      const submissionId = (subResult as any).data.id;

      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Articulate the letters carefully.',
      });

      const messages = db.messages.filter((m) => m.conversationId === conversationId);
      const latestMsg = messages[messages.length - 1];
      expect(latestMsg.content).toContain('Articulate the letters carefully.');
      expect(latestMsg.audioUrl).toBe('/audio/reference-shahadah-ar.webm');
    });

    it('rejects review if reviewer is not a Dialogist/Supervisor/Admin (UNAUTHORIZED)', async () => {
      const subResult = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/test.webm',
      });
      const submissionId = (subResult as any).data.id;

      const reviewRes = await shahadahService.reviewSubmission({
        dialogistId: seekerId, // Seeker is NON_MUSLIM
        submissionId,
        decision: 'VALIDATE',
      });

      expect(reviewRes.ok).toBe(false);
      if (!reviewRes.ok) {
        expect(reviewRes.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('rejects review if submission does not exist (SUBMISSION_NOT_FOUND)', async () => {
      const reviewRes = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: 'ghost-sub-id',
        decision: 'VALIDATE',
      });

      expect(reviewRes.ok).toBe(false);
      if (!reviewRes.ok) {
        expect(reviewRes.error.code).toBe('SUBMISSION_NOT_FOUND');
      }
    });

    it('rejects invalid decision parameter (INVALID_DECISION)', async () => {
      const subResult = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/test.webm',
      });
      const submissionId = (subResult as any).data.id;

      const reviewRes = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId,
        decision: 'MAYBE' as any,
      });

      expect(reviewRes.ok).toBe(false);
      if (!reviewRes.ok) {
        expect(reviewRes.error.code).toBe('INVALID_DECISION');
      }
    });
  });

  // ==========================================================================
  // Group 4: Post-Conversion Profile & Atomic Role Elevation
  // ==========================================================================
  describe('Group 4: Post-Conversion Profile & Atomic Role Elevation', () => {
    beforeEach(async () => {
      // Setup validated submission for seekerId
      const subResult = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/good.webm',
      });
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: (subResult as any).data.id,
        decision: 'VALIDATE',
      });
    });

    it('rejects profile completion if seeker does not exist (USER_NOT_FOUND)', async () => {
      const result = await shahadahService.completeConversionProfile('ghost-user', {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('USER_NOT_FOUND');
      }
    });

    it('blocks profile completion if Shahadah is not yet validated (SHAHADAH_NOT_VALIDATED)', async () => {
      // Create new seeker with pending or missing validation
      const freshUser = {
        id: 'seeker-unvalidated',
        email: 'unval@example.com',
        passwordHash: 'hash',
        firstName: 'Unval',
        surname: 'Test',
        dateOfBirth: '1995-01-01',
        role: 'NON_MUSLIM' as const,
        status: 'ACTIVE' as const,
        preferredLanguage: 'en' as const,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(freshUser);

      const result = await shahadahService.completeConversionProfile('seeker-unvalidated', {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('SHAHADAH_NOT_VALIDATED');
      }
    });

    it('rejects if Nationality is empty (PROFILE_INCOMPLETE)', async () => {
      const result = await shahadahService.completeConversionProfile(seekerId, {
        nationality: '   ',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('PROFILE_INCOMPLETE');
      }
    });

    it('rejects if Gender is missing or not MALE/FEMALE (PROFILE_INCOMPLETE)', async () => {
      const result = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'OTHER' as any,
        phoneNumber: '+33 6 12 34 56 78',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('PROFILE_INCOMPLETE');
      }
    });

    it('rejects if Phone Number is empty (PROFILE_INCOMPLETE)', async () => {
      const result = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('PROFILE_INCOMPLETE');
      }
    });

    it('updates user profile, atomically elevates role to NEW_MUSLIM, and stamps conversionDate', async () => {
      const result = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.role).toBe('NEW_MUSLIM');
        expect(result.data.userId).toBe(seekerId);
      }

      const user = db.findUserById(seekerId)!;
      expect(user.role).toBe('NEW_MUSLIM');
      expect(user.nationality).toBe('France');
      expect(user.gender).toBe('MALE');
      expect(user.phoneNumber).toBe('+33 6 12 34 56 78');
      expect(user.conversionDate).toBeTruthy();
    });

    it('preserves entire pre-existing consultation transcript and messages', async () => {
      const preCount = db.messages.filter((m) => m.conversationId === conversationId).length;
      expect(preCount).toBeGreaterThan(0);

      await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });

      const postCount = db.messages.filter((m) => m.conversationId === conversationId).length;
      expect(postCount).toBe(preCount);
    });

    it('initializes LearningProgress with unlockedLessonNumber: 1 and updates activeDemoUserId', async () => {
      await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });

      const prog = db.getLearningProgress(seekerId);
      expect(prog).toBeDefined();
      expect(prog?.unlockedLessonNumber).toBe(1);
      expect(prog?.completedLessonsCount).toBe(0);
      expect(prog?.allQuizzesPassed).toBe(false);
      expect(prog?.finalExamPassed).toBe(false);

      expect(db.activeDemoUserId).toBe(seekerId);
    });
  });

  // ==========================================================================
  // Group 5: End-to-End Milestone 3 Workflow Lifecycle
  // ==========================================================================
  describe('Group 5: End-to-End Milestone 3 Workflow Lifecycle', () => {
    it('executes complete lifecycle: submission -> retake -> resubmit -> validate -> profile completion -> LMS ready', async () => {
      // 1. Initial submission
      const sub1 = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
        durationSeconds: 12,
      });
      expect(sub1.ok).toBe(true);
      const subId = (sub1 as any).data.id;

      // 2. Dialogist reviews and requests retake with feedback
      const retake = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: subId,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Please listen to the reference audio for the pronounciation of Ash-hadu.',
      });
      expect(retake.ok).toBe(true);

      // 3. Seeker resubmits improved audio
      const sub2 = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take2-perfect.webm',
        durationSeconds: 19,
      });
      expect(sub2.ok).toBe(true);

      // 4. Dialogist validates submission
      const validation = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: subId,
        decision: 'VALIDATE',
        feedbackNotes: 'MashaAllah, perfect recitation. Welcome to Islam!',
      });
      expect(validation.ok).toBe(true);

      // 5. Seeker completes conversion profile
      const profile = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 99 88 77 66',
      });
      expect(profile.ok).toBe(true);

      // 6. Verify role elevated, session active, LMS Lesson 1 unlocked
      const seeker = db.findUserById(seekerId)!;
      expect(seeker.role).toBe('NEW_MUSLIM');
      const progress = db.getLearningProgress(seekerId)!;
      expect(progress.unlockedLessonNumber).toBe(1);
    });
  });
});
