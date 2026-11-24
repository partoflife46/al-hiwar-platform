import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { shahadahService } from '@/lib/services/shahadah-service';
import { academyService } from '@/lib/services/academy-service';
import { chatEventBus } from '@/lib/services/chat-event-bus';
import { POST as uploadPost, GET as uploadGet } from '@/app/api/shahadah/upload/route';
import { POST as reviewPost, GET as reviewGet } from '@/app/api/shahadah/review/route';
import { POST as profilePost, GET as profileGet } from '@/app/api/shahadah/profile/route';
import { signSessionToken } from '@/lib/security/session-token';

describe('Adversarial Stress Verification: ShahadahService & Conversion Seam (Milestone 3)', () => {
  const seekerId = 'user-seeker-1';
  const otherSeekerId = 'user-seeker-2';
  const dialogistId = 'user-dialogist-1';
  const supervisorId = 'user-supervisor-1';
  const conversationId = 'conv-demo-1';

  beforeEach(() => {
    db.reset();
    chatEventBus.reset();

    // Register an additional seeker for multi-user isolation tests
    if (!db.findUserById(otherSeekerId)) {
      db.users.push({
        id: otherSeekerId,
        email: 'other_seeker@example.com',
        passwordHash: 'hash',
        firstName: 'Sarah',
        surname: 'Connor',
        dateOfBirth: '1996-03-15',
        role: 'NON_MUSLIM',
        status: 'ACTIVE',
        preferredLanguage: 'en',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  // =========================================================================
  // SUITE 1: VOICE NOTE SUBMISSION ADVERSARIAL STRESS & PAYLOAD VALIDATION
  // =========================================================================
  describe('Suite 1: Voice Note Submission Adversarial Stress & Payload Validation', () => {
    it('1. Rejects empty string audioRecordingUrl ("") with INVALID_AUDIO', async () => {
      const res = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '',
        durationSeconds: 15,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('INVALID_AUDIO');
        expect(res.error.message).toContain('required');
      }
    });

    it('2. Rejects whitespace-only audioRecordingUrl ("   ") with INVALID_AUDIO', async () => {
      const res = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '    ',
        durationSeconds: 15,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('INVALID_AUDIO');
      }
    });

    it('3. Rejects missing audio payload (both audioRecordingUrl and audioData undefined) with INVALID_AUDIO', async () => {
      const res = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        durationSeconds: 15,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('INVALID_AUDIO');
      }
    });

    it('4. Rejects zero-length audio recording duration (durationSeconds: 0) with INVALID_AUDIO', async () => {
      const res = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/uploads/audio/zero-len.webm',
        durationSeconds: 0,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('INVALID_AUDIO');
        expect(res.error.message).toContain('greater than zero');
      }
    });

    it('5. Rejects negative audio recording durations (-1, -60) with INVALID_AUDIO', async () => {
      const res1 = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/uploads/audio/neg.webm',
        durationSeconds: -1,
      });
      expect(res1.ok).toBe(false);
      if (!res1.ok) {
        expect(res1.error.code).toBe('INVALID_AUDIO');
      }

      const res2 = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/uploads/audio/neg.webm',
        durationSeconds: -60,
      });
      expect(res2.ok).toBe(false);
      if (!res2.ok) {
        expect(res2.error.code).toBe('INVALID_AUDIO');
      }
    });

    it('6. Rejects submission when conversation does not exist with CONVERSATION_NOT_FOUND', async () => {
      const res = await shahadahService.submitShahadah({
        seekerId,
        conversationId: 'ghost-conversation-id',
        audioRecordingUrl: '/uploads/audio/valid.webm',
        durationSeconds: 15,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('CONVERSATION_NOT_FOUND');
      }
    });

    it('7. Rejects submission when seeker user does not exist with USER_NOT_FOUND', async () => {
      const res = await shahadahService.submitShahadah({
        seekerId: 'ghost-user-id',
        conversationId,
        audioRecordingUrl: '/uploads/audio/valid.webm',
        durationSeconds: 15,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('USER_NOT_FOUND');
      }
    });

    it('8. Rejects unauthorized submission when user does not own the consultation session with UNAUTHORIZED', async () => {
      // conversationId belongs to seekerId ('user-seeker-1'). otherSeekerId ('user-seeker-2') attempts to submit
      const res = await shahadahService.submitShahadah({
        seekerId: otherSeekerId,
        conversationId,
        audioRecordingUrl: '/uploads/audio/impostor.webm',
        durationSeconds: 15,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('UNAUTHORIZED');
        expect(res.error.message).toContain('does not own');
      }
    });

    it('9. HTTP API POST /api/shahadah/upload: enforces authentication and conversationId validation with HTTP 400 / 403', async () => {
      // Mismatched seekerId vs authenticated session -> HTTP 403
      const reqMismatchedSeeker = new NextRequest('http://localhost:3000/api/shahadah/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(seekerId)}`,
        },
        body: JSON.stringify({
          seekerId: otherSeekerId,
          conversationId,
          audioRecordingUrl: '/audio/test.webm',
        }),
      });
      const resMismatched = await uploadPost(reqMismatchedSeeker);
      expect(resMismatched.status).toBe(403);
      const jsonMismatched = await resMismatched.json();
      expect(jsonMismatched.error).toBe('FORBIDDEN');

      // Missing conversationId -> HTTP 400
      const reqNoConv = new NextRequest('http://localhost:3000/api/shahadah/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(seekerId)}`,
        },
        body: JSON.stringify({ seekerId, audioRecordingUrl: '/audio/test.webm' }),
      });
      const resNoConv = await uploadPost(reqNoConv);
      expect(resNoConv.status).toBe(400);
      const jsonNoConv = await resNoConv.json();
      expect(jsonNoConv.error).toBe('MISSING_FIELDS');
    });

    it('10. HTTP API POST /api/shahadah/upload: rejects invalid/empty audio and zero duration with HTTP 400', async () => {
      const reqEmptyAudio = new NextRequest('http://localhost:3000/api/shahadah/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(seekerId)}`,
        },
        body: JSON.stringify({
          seekerId,
          conversationId,
          audioRecordingUrl: '',
          durationSeconds: 15,
        }),
      });
      const resEmpty = await uploadPost(reqEmptyAudio);
      expect(resEmpty.status).toBe(400);
      const jsonEmpty = await resEmpty.json();
      expect(jsonEmpty.error).toBe('INVALID_AUDIO');

      const reqZeroDuration = new NextRequest('http://localhost:3000/api/shahadah/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(seekerId)}`,
        },
        body: JSON.stringify({
          seekerId,
          conversationId,
          audioRecordingUrl: '/uploads/audio/zero.webm',
          durationSeconds: 0,
        }),
      });
      const resZero = await uploadPost(reqZeroDuration);
      expect(resZero.status).toBe(400);
      const jsonZero = await resZero.json();
      expect(jsonZero.error).toBe('INVALID_AUDIO');
    });

    it('11. HTTP API POST /api/shahadah/upload: returns HTTP 201 and persists submission on valid payload', async () => {
      const req = new NextRequest('http://localhost:3000/api/shahadah/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(seekerId)}`,
        },
        body: JSON.stringify({
          seekerId,
          conversationId,
          audioRecordingUrl: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8=',
          mimeType: 'audio/webm;codecs=opus',
          durationSeconds: 18,
        }),
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.status).toBe('PENDING_REVIEW');
      expect(json.data.durationSeconds).toBe(18);
    });

    it('12. Default MIME handling: omitting or passing empty mimeType defaults safely to audio/webm;codecs=opus', async () => {
      const resDefault = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/uploads/audio/no-mime.webm',
        durationSeconds: 12,
      });

      expect(resDefault.ok).toBe(true);
      if (resDefault.ok) {
        expect(resDefault.data.mimeType).toBe('audio/webm;codecs=opus');
      }

      const resEmptyMime = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/uploads/audio/empty-mime.webm',
        mimeType: '',
        durationSeconds: 14,
      });

      expect(resEmptyMime.ok).toBe(true);
      if (resEmptyMime.ok) {
        expect(resEmptyMime.data.mimeType).toBe('audio/webm;codecs=opus');
      }
    });
  });

  // =========================================================================
  // SUITE 2: RETAKE WORKFLOW & GUIDANCE SEAM STRESS TESTS
  // =========================================================================
  describe('Suite 2: Retake Workflow & Guidance Seam Stress Tests', () => {
    it('13. Dialogist requests retake with feedback: status becomes RETAKE_REQUESTED and feedback notes attached', async () => {
      const subRes = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
        durationSeconds: 15,
      });
      expect(subRes.ok).toBe(true);
      const subId = (subRes as any).data.id;

      const reviewRes = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: subId,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Please articulate the guttural hā in Muhammadan clearly.',
      });

      expect(reviewRes.ok).toBe(true);
      if (reviewRes.ok) {
        expect(reviewRes.data.status).toBe('RETAKE_REQUESTED');
        expect(reviewRes.data.feedbackNotes).toBe('Please articulate the guttural hā in Muhammadan clearly.');
        expect(reviewRes.data.dialogistId).toBe(dialogistId);
      }
    });

    it('14. Retake request embeds model reference audio clip into in-chat guidance message', async () => {
      const subRes = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
        durationSeconds: 15,
      });
      const subId = (subRes as any).data.id;

      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: subId,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Focus on correct tajweed.',
      });

      const messages = db.messages.filter((m) => m.conversationId === conversationId);
      const retakeMsg = messages[messages.length - 1];
      expect(retakeMsg).toBeDefined();
      expect(retakeMsg.senderId).toBe(dialogistId);
      expect(retakeMsg.content).toContain('Focus on correct tajweed.');
      expect(retakeMsg.audioUrl).toBe('/audio/reference-shahadah-ar.webm');
    });

    it('15. Reference audio is accessible via service and GET /api/shahadah/upload endpoint in EN and FR', async () => {
      const refEn = await shahadahService.getModelReferenceAudio('en');
      expect(refEn.audioUrl).toBe('/audio/reference-shahadah-ar.webm');
      expect(refEn.arabicScript).toContain('أَشْهَدُ');
      expect(refEn.phoneticGuide).toContain('Ash-hadu');
      expect(refEn.englishTranslation).toContain('I bear witness');

      const refFr = await shahadahService.getModelReferenceAudio('fr');
      expect(refFr.phoneticGuide).toContain('Ach-hadou');
      expect(refFr.translation).toContain("J'atteste");

      const reqEn = new NextRequest('http://localhost:3000/api/shahadah/upload?type=reference&language=en');
      const apiResEn = await uploadGet(reqEn);
      expect(apiResEn.status).toBe(200);
      const apiJsonEn = await apiResEn.json();
      expect(apiJsonEn.ok).toBe(true);
      expect(apiJsonEn.data.language).toBe('en');

      const reqFr = new NextRequest('http://localhost:3000/api/shahadah/upload?type=reference&language=fr');
      const apiResFr = await uploadGet(reqFr);
      expect(apiResFr.status).toBe(200);
      const apiJsonFr = await apiResFr.json();
      expect(apiJsonFr.ok).toBe(true);
      expect(apiJsonFr.data.language).toBe('fr');
    });

    it('16. Seeker re-records after retake request: preserves all prior chat context and messages', async () => {
      // 1. Initial consultation message
      const initialMsgCount = db.messages.filter((m) => m.conversationId === conversationId).length;

      // 2. Submit initial take
      await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
        durationSeconds: 14,
      });

      // 3. Dialogist requests retake
      const sub = db.shahadahSubmissions.find((s) => s.conversationId === conversationId)!;
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: sub.id,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Please listen to the reference clip and repeat.',
      });

      // 4. Seeker submits take 2
      const reSub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take2-improved.webm',
        durationSeconds: 19,
      });

      expect(reSub.ok).toBe(true);

      // Verify chat context: initial messages + take1 voice note + dialogist retake notice + take2 voice note
      const currentMessages = db.messages.filter((m) => m.conversationId === conversationId);
      expect(currentMessages.length).toBe(initialMsgCount + 3);

      // Verify the latest message is seeker take 2
      const latestMsg = currentMessages[currentMessages.length - 1];
      expect(latestMsg.hasVoiceNote).toBe(true);
      expect(latestMsg.audioUrl).toBe('/audio/take2-improved.webm');
      expect(latestMsg.senderId).toBe(seekerId);
    });

    it('17. Re-recording updates existing submission record in-place without creating orphaned duplicates', async () => {
      // Submit take 1
      const sub1 = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
        durationSeconds: 15,
      });
      const subId1 = (sub1 as any).data.id;

      // Request retake
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: subId1,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Articulate clearly',
      });

      // Re-record take 2
      const sub2 = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take2.webm',
        durationSeconds: 20,
      });
      const subId2 = (sub2 as any).data.id;

      // Must be same submission ID (in-place update)
      expect(subId2).toBe(subId1);

      // Exactly 1 submission record exists for this conversation in database
      const conversationSubs = db.shahadahSubmissions.filter((s) => s.conversationId === conversationId);
      expect(conversationSubs.length).toBe(1);

      // State reset to PENDING_REVIEW, feedbackNotes cleared
      expect(conversationSubs[0].status).toBe('PENDING_REVIEW');
      expect(conversationSubs[0].audioRecordingUrl).toBe('/audio/take2.webm');
      expect(conversationSubs[0].durationSeconds).toBe(20);
      expect(conversationSubs[0].feedbackNotes).toBeNull();
    });

    it('18. Multiple consecutive retake cycles (Cycle 1 -> Cycle 2 -> Validate) maintains sequence integrity', async () => {
      // Take 1
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
      });
      const subId = (sub as any).data.id;

      // Retake 1
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: subId,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Retake 1 feedback',
      });
      expect(db.shahadahSubmissions.find((s) => s.id === subId)!.status).toBe('RETAKE_REQUESTED');

      // Take 2
      await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take2.webm',
      });
      expect(db.shahadahSubmissions.find((s) => s.id === subId)!.status).toBe('PENDING_REVIEW');

      // Retake 2
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: subId,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Retake 2 feedback',
      });
      expect(db.shahadahSubmissions.find((s) => s.id === subId)!.status).toBe('RETAKE_REQUESTED');

      // Take 3
      await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take3.webm',
      });
      expect(db.shahadahSubmissions.find((s) => s.id === subId)!.status).toBe('PENDING_REVIEW');

      // Validation
      const finalVal = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: subId,
        decision: 'VALIDATE',
        feedbackNotes: 'MashaAllah, perfect recitation!',
      });
      expect(finalVal.ok).toBe(true);
      expect(db.shahadahSubmissions.find((s) => s.id === subId)!.status).toBe('VALIDATED');
    });

    it('19. Retake request with empty or whitespace feedback notes defaults to institutional guidance copy', async () => {
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
      });
      const subId = (sub as any).data.id;

      const reviewRes = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: subId,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: '   ',
      });

      expect(reviewRes.ok).toBe(true);
      if (reviewRes.ok) {
        expect(reviewRes.data.feedbackNotes).toBe(
          'Please practice pronunciation with the authentic reference clip and record again.'
        );
      }
    });

    it('20. Unauthorized review attempt: non-dialogist (e.g. Seeker) attempting review is rejected with UNAUTHORIZED', async () => {
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
      });
      const subId = (sub as any).data.id;

      const reviewRes = await shahadahService.reviewSubmission({
        dialogistId: seekerId, // Seeker is NON_MUSLIM
        submissionId: subId,
        decision: 'VALIDATE',
      });

      expect(reviewRes.ok).toBe(false);
      if (!reviewRes.ok) {
        expect(reviewRes.error.code).toBe('UNAUTHORIZED');
        expect(reviewRes.error.message).toContain('Only qualified dialogists');
      }
    });

    it('21. Reviewing non-existent submission is rejected with SUBMISSION_NOT_FOUND', async () => {
      const reviewRes = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: 'ghost-submission-id',
        decision: 'VALIDATE',
      });

      expect(reviewRes.ok).toBe(false);
      if (!reviewRes.ok) {
        expect(reviewRes.error.code).toBe('SUBMISSION_NOT_FOUND');
      }
    });

    it('22. Reviewing with invalid decision parameter is rejected with INVALID_DECISION', async () => {
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
      });
      const subId = (sub as any).data.id;

      const reviewRes = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: subId,
        decision: 'REJECT' as any,
      });

      expect(reviewRes.ok).toBe(false);
      if (!reviewRes.ok) {
        expect(reviewRes.error.code).toBe('INVALID_DECISION');
      }
    });

    it('23. HTTP API POST /api/shahadah/review: enforces parameter validation and permissions', async () => {
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
      });
      const subId = (sub as any).data.id;

      // Missing fields
      const reqMissing = new NextRequest('http://localhost:3000/api/shahadah/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dialogistId }),
      });
      const resMissing = await reviewPost(reqMissing);
      expect(resMissing.status).toBe(400);

      // Unauthorized role via API
      const reqUnauth = new NextRequest('http://localhost:3000/api/shahadah/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogistId: seekerId,
          submissionId: subId,
          decision: 'VALIDATE',
        }),
      });
      const resUnauth = await reviewPost(reqUnauth);
      expect(resUnauth.status).toBe(403);

      // Valid review via API
      const reqValid = new NextRequest('http://localhost:3000/api/shahadah/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogistId,
          submissionId: subId,
          decision: 'VALIDATE',
          feedbackNotes: 'Approved via API',
        }),
      });
      const resValid = await reviewPost(reqValid);
      expect(resValid.status).toBe(200);
      const jsonValid = await resValid.json();
      expect(jsonValid.ok).toBe(true);
      expect(jsonValid.data.status).toBe('VALIDATED');
    });
  });

  // =========================================================================
  // SUITE 3: VALIDATION & PROFILE COMPLETION GATING ADVERSARIAL TESTS
  // =========================================================================
  describe('Suite 3: Validation & Profile Completion Gating Adversarial Tests', () => {
    it('24. Profile completion attempt with NO prior Shahadah submission is strictly REJECTED with SHAHADAH_NOT_VALIDATED', async () => {
      const res = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('SHAHADAH_NOT_VALIDATED');
        expect(res.error.message).toContain('officially validated');
      }
    });

    it('25. Profile completion attempt while submission is in PENDING_REVIEW is strictly REJECTED with SHAHADAH_NOT_VALIDATED', async () => {
      await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/pending.webm',
        durationSeconds: 15,
      });

      const res = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('SHAHADAH_NOT_VALIDATED');
      }
    });

    it('26. Profile completion attempt while submission is in RETAKE_REQUESTED is strictly REJECTED with SHAHADAH_NOT_VALIDATED', async () => {
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
      });
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: (sub as any).data.id,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Fix pronunciation',
      });

      const res = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('SHAHADAH_NOT_VALIDATED');
      }
    });

    it('27. Incomplete profile submission: missing or whitespace nationality is REJECTED with PROFILE_INCOMPLETE', async () => {
      // Validate first
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
      });
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: (sub as any).data.id,
        decision: 'VALIDATE',
      });

      const resEmpty = await shahadahService.completeConversionProfile(seekerId, {
        nationality: '',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });
      expect(resEmpty.ok).toBe(false);
      if (!resEmpty.ok) {
        expect(resEmpty.error.code).toBe('PROFILE_INCOMPLETE');
      }

      const resWhitespace = await shahadahService.completeConversionProfile(seekerId, {
        nationality: '     ',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });
      expect(resWhitespace.ok).toBe(false);
      if (!resWhitespace.ok) {
        expect(resWhitespace.error.code).toBe('PROFILE_INCOMPLETE');
      }
    });

    it('28. Incomplete profile submission: missing or whitespace phoneNumber is REJECTED with PROFILE_INCOMPLETE', async () => {
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
      });
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: (sub as any).data.id,
        decision: 'VALIDATE',
      });

      const resEmpty = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '',
      });
      expect(resEmpty.ok).toBe(false);
      if (!resEmpty.ok) {
        expect(resEmpty.error.code).toBe('PROFILE_INCOMPLETE');
      }

      const resWhitespace = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '   ',
      });
      expect(resWhitespace.ok).toBe(false);
      if (!resWhitespace.ok) {
        expect(resWhitespace.error.code).toBe('PROFILE_INCOMPLETE');
      }
    });

    it('29. Incomplete profile submission: missing or invalid gender is REJECTED with PROFILE_INCOMPLETE', async () => {
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/take1.webm',
      });
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: (sub as any).data.id,
        decision: 'VALIDATE',
      });

      const resInvalidGender = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'OTHER' as any,
        phoneNumber: '+33 6 12 34 56 78',
      });
      expect(resInvalidGender.ok).toBe(false);
      if (!resInvalidGender.ok) {
        expect(resInvalidGender.error.code).toBe('PROFILE_INCOMPLETE');
      }

      const resEmptyGender = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: '' as any,
        phoneNumber: '+33 6 12 34 56 78',
      });
      expect(resEmptyGender.ok).toBe(false);
      if (!resEmptyGender.ok) {
        expect(resEmptyGender.error.code).toBe('PROFILE_INCOMPLETE');
      }
    });

    it('30. Profile completion for non-existent user returns USER_NOT_FOUND', async () => {
      const res = await shahadahService.completeConversionProfile('ghost-seeker-id', {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('USER_NOT_FOUND');
      }
    });

    it('31. Valid profile completion: atomic role elevation to NEW_MUSLIM, conversionDate stamped, chat history preserved, and Academy Lesson 1 unlocked', async () => {
      // 1. Setup validated Shahadah
      const preChatCount = db.messages.filter((m) => m.conversationId === conversationId).length;
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/valid.webm',
      });
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: (sub as any).data.id,
        decision: 'VALIDATE',
      });

      const postValidateChatCount = db.messages.filter((m) => m.conversationId === conversationId).length;

      // 2. Complete profile
      const result = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'United Kingdom',
        gender: 'MALE',
        phoneNumber: '+44 7911 123456',
      });

      // 3. Verify Session
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.role).toBe('NEW_MUSLIM');
        expect(result.data.userId).toBe(seekerId);
        expect(result.data.token).toContain(`alhiwar_${seekerId}`);
      }

      // 4. Verify User record in DB
      const user = db.findUserById(seekerId)!;
      expect(user.role).toBe('NEW_MUSLIM');
      expect(user.nationality).toBe('United Kingdom');
      expect(user.gender).toBe('MALE');
      expect(user.phoneNumber).toBe('+44 7911 123456');
      expect(user.conversionDate).toBeTruthy();
      expect(new Date(user.conversionDate!).getTime()).toBeLessThanOrEqual(Date.now());

      // 5. Verify chat history preservation
      const postProfileChatCount = db.messages.filter((m) => m.conversationId === conversationId).length;
      expect(postProfileChatCount).toBe(postValidateChatCount);
      expect(postProfileChatCount).toBeGreaterThan(preChatCount);

      // 6. Verify Academy Lesson 1 Unlocked
      const progress = db.getLearningProgress(seekerId)!;
      expect(progress).toBeDefined();
      expect(progress.unlockedLessonNumber).toBe(1);
      expect(progress.completedLessonsCount).toBe(0);
      expect(progress.allQuizzesPassed).toBe(false);

      // Lesson 1 is accessible
      const lesson1 = await academyService.getLessonDetail(seekerId, 1);
      expect(lesson1.ok).toBe(true);

      // Lesson 2 is strictly locked
      const lesson2 = await academyService.getLessonDetail(seekerId, 2);
      expect(lesson2.ok).toBe(false);
      if (!lesson2.ok) {
        expect(lesson2.error).toBe('LESSON_LOCKED');
      }

      // Final exam is strictly locked
      const exam = await academyService.getFinalExam(seekerId);
      expect(exam.ok).toBe(false);
      if (!exam.ok) {
        expect(exam.error).toBe('PREREQUISITES_NOT_MET');
      }
    });

    it('32. HTTP API POST /api/shahadah/profile: sets session cookie and rejects unvalidated/incomplete payloads', async () => {
      const seekerCookie = `alhiwar_session=${signSessionToken(seekerId)}`;
      // Missing fields -> 400 PROFILE_INCOMPLETE
      const reqMissing = new NextRequest('http://localhost:3000/api/shahadah/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: seekerCookie },
        body: JSON.stringify({ seekerId }),
      });
      const resMissing = await profilePost(reqMissing);
      expect(resMissing.status).toBe(400);

      // Unvalidated -> 400 SHAHADAH_NOT_VALIDATED
      const reqUnval = new NextRequest('http://localhost:3000/api/shahadah/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: seekerCookie },
        body: JSON.stringify({
          seekerId,
          nationality: 'Canada',
          gender: 'FEMALE',
          phoneNumber: '+1 416 555 0199',
        }),
      });
      const resUnval = await profilePost(reqUnval);
      expect(resUnval.status).toBe(400);
      const jsonUnval = await resUnval.json();
      expect(jsonUnval.error).toBe('SHAHADAH_NOT_VALIDATED');

      // Now validate
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/valid.webm',
      });
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: (sub as any).data.id,
        decision: 'VALIDATE',
      });

      // Submit valid profile via API
      const reqValid = new NextRequest('http://localhost:3000/api/shahadah/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: seekerCookie },
        body: JSON.stringify({
          seekerId,
          nationality: 'Canada',
          gender: 'FEMALE',
          phoneNumber: '+1 416 555 0199',
        }),
      });
      const resValid = await profilePost(reqValid);
      expect(resValid.status).toBe(200);
      const jsonValid = await resValid.json();
      expect(jsonValid.ok).toBe(true);
      expect(jsonValid.data.role).toBe('NEW_MUSLIM');

      // Cookie check
      const cookie = resValid.cookies.get('alhiwar_session');
      expect(cookie).toBeDefined();
      expect(cookie?.value).toContain(`alhiwar_${seekerId}`);
    });
  });

  // =========================================================================
  // SUITE 4: CONCURRENCY, RACE CONDITIONS & REPEAT PROFILES
  // =========================================================================
  describe('Suite 4: Concurrency, Race Conditions & Repeat Profiles', () => {
    it('33. Rapid concurrent submissions from same seeker resolve cleanly with exactly 1 DB record', async () => {
      const submissions = Array.from({ length: 5 }, (_, i) =>
        shahadahService.submitShahadah({
          seekerId,
          conversationId,
          audioRecordingUrl: `/audio/concurrent-take-${i}.webm`,
          durationSeconds: 15 + i,
        })
      );

      const results = await Promise.all(submissions);
      for (const r of results) {
        expect(r.ok).toBe(true);
      }

      // Exactly 1 submission in DB for this conversation
      const subs = db.shahadahSubmissions.filter((s) => s.conversationId === conversationId);
      expect(subs.length).toBe(1);
      expect(subs[0].status).toBe('PENDING_REVIEW');
    });

    it('34. Already converted NEW_MUSLIM can update profile without resetting conversionDate or Academy progress', async () => {
      // Validate and convert
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/valid.webm',
      });
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: (sub as any).data.id,
        decision: 'VALIDATE',
      });
      await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });

      const initialUser = db.findUserById(seekerId)!;
      const originalConversionDate = initialUser.conversionDate;
      expect(originalConversionDate).toBeTruthy();

      // Advance Academy progress to Lesson 3
      await academyService.executeEvaluationShortcut(seekerId, 'PASS_LESSON', 1);
      await academyService.executeEvaluationShortcut(seekerId, 'PASS_LESSON', 2);
      const progBefore = db.getLearningProgress(seekerId)!;
      expect(progBefore.unlockedLessonNumber).toBe(3);

      // Update profile demographics
      const updateRes = await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'Morocco',
        gender: 'MALE',
        phoneNumber: '+212 6 00 00 00 00',
      });

      expect(updateRes.ok).toBe(true);
      const updatedUser = db.findUserById(seekerId)!;
      expect(updatedUser.nationality).toBe('Morocco');
      expect(updatedUser.phoneNumber).toBe('+212 6 00 00 00 00');
      // conversionDate must NOT be overwritten or reset
      expect(updatedUser.conversionDate).toBe(originalConversionDate);

      // Academy progress must NOT be reset
      const progAfter = db.getLearningProgress(seekerId)!;
      expect(progAfter.unlockedLessonNumber).toBe(3);
    });

    it('35. GET /api/shahadah/profile queries accurate seeker demographics and completion status', async () => {
      const seekerCookie = `alhiwar_session=${signSessionToken(seekerId)}`;
      // Query before completion
      const reqBefore = new NextRequest(`http://localhost:3000/api/shahadah/profile?seekerId=${seekerId}`, {
        headers: { cookie: seekerCookie },
      });
      const resBefore = await profileGet(reqBefore);
      expect(resBefore.status).toBe(200);
      const jsonBefore = await resBefore.json();
      expect(jsonBefore.data.isProfileCompleted).toBe(false);

      // Complete profile
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/valid.webm',
      });
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: (sub as any).data.id,
        decision: 'VALIDATE',
      });
      await shahadahService.completeConversionProfile(seekerId, {
        nationality: 'Germany',
        gender: 'MALE',
        phoneNumber: '+49 170 1234567',
      });

      // Query after completion
      const reqAfter = new NextRequest(`http://localhost:3000/api/shahadah/profile?seekerId=${seekerId}`, {
        headers: { cookie: seekerCookie },
      });
      const resAfter = await profileGet(reqAfter);
      expect(resAfter.status).toBe(200);
      const jsonAfter = await resAfter.json();
      expect(jsonAfter.data.isProfileCompleted).toBe(true);
      expect(jsonAfter.data.nationality).toBe('Germany');
      expect(jsonAfter.data.phoneNumber).toBe('+49 170 1234567');
      expect(jsonAfter.data.role).toBe('NEW_MUSLIM');
    });
  });

  // =========================================================================
  // SUITE 5: FINDING #118 - ANTI-TAMPERING & HORIZONTAL AUTHORIZATION VERIFICATION
  // =========================================================================
  describe('Suite 5: Finding #118 - Anti-Tampering & Horizontal Authorization Verification', () => {
    it('36. Unauthenticated attacker request to /api/shahadah/upload is REJECTED with HTTP 401', async () => {
      const attackReq = new NextRequest('http://localhost:3000/api/shahadah/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seekerId,
          conversationId,
          audioRecordingUrl: '/audio/malicious-replacement.webm',
          durationSeconds: 15,
        }),
      });

      const res = await uploadPost(attackReq);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('UNAUTHORIZED');
    });

    it('37. Authenticated User A attempting to replace User B recording is REJECTED with HTTP 403', async () => {
      // User B (otherSeekerId) is authenticated, but supplies User A's (seekerId) conversation and profile
      const attackReq = new NextRequest('http://localhost:3000/api/shahadah/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(otherSeekerId)}`,
        },
        body: JSON.stringify({
          seekerId, // victim
          conversationId, // victim's conversation
          audioRecordingUrl: '/audio/malicious-replacement.webm',
          durationSeconds: 15,
        }),
      });

      const res = await uploadPost(attackReq);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('FORBIDDEN');
    });

    it('38. User A submits their own authorized recording: persists successfully with HTTP 201', async () => {
      const validReq = new NextRequest('http://localhost:3000/api/shahadah/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(seekerId)}`,
        },
        body: JSON.stringify({
          conversationId,
          audioRecordingUrl: '/audio/authentic-recitation.webm',
          durationSeconds: 22,
        }),
      });

      const res = await uploadPost(validReq);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.status).toBe('PENDING_REVIEW');
      expect(json.data.audioRecordingUrl).toBe('/audio/authentic-recitation.webm');
    });

    it('39. Modifying an already VALIDATED Shahadah is strictly REJECTED with HTTP 409 Conflict', async () => {
      // Create and validate submission
      const sub = await shahadahService.submitShahadah({
        seekerId,
        conversationId,
        audioRecordingUrl: '/audio/initial.webm',
      });
      expect(sub.ok).toBe(true);

      const review = await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: (sub as any).data.id,
        decision: 'VALIDATE',
      });
      expect(review.ok).toBe(true);

      // Attempt replacement after validation
      const replaceReq = new NextRequest('http://localhost:3000/api/shahadah/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(seekerId)}`,
        },
        body: JSON.stringify({
          conversationId,
          audioRecordingUrl: '/audio/unwanted-retake.webm',
        }),
      });

      const res = await uploadPost(replaceReq);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toBe('SUBMISSION_ALREADY_FINALIZED');
    });

    it('40. Stale review decision targeting outdated attempt is REJECTED with HTTP 409 Conflict', async () => {
      const freshConvId = `conv-stale-${Date.now()}`;
      db.conversations.push({
        id: freshConvId,
        nonMuslimId: seekerId,
        dialogistId,
        language: 'en',
        status: 'ACTIVE',
        isAssigned: true,
        inactivityNoticeSent: false,
        intent: 'EMBRACE_ISLAM',
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      });

      // Submit attempt 1
      const sub1 = await shahadahService.submitShahadah({
        seekerId,
        conversationId: freshConvId,
        audioRecordingUrl: '/audio/take1.webm',
      });
      expect(sub1.ok).toBe(true);
      expect((sub1 as any).data.attemptNumber).toBe(1);

      // Retake: Submit attempt 2
      const sub2 = await shahadahService.submitShahadah({
        seekerId,
        conversationId: freshConvId,
        audioRecordingUrl: '/audio/take2.webm',
      });
      expect(sub2.ok).toBe(true);
      expect((sub2 as any).data.attemptNumber).toBe(2);

      // Reviewer sends stale decision targeting attempt 1
      const staleReviewReq = new NextRequest('http://localhost:3000/api/shahadah/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(dialogistId)}`,
        },
        body: JSON.stringify({
          dialogistId,
          submissionId: (sub1 as any).data.id,
          decision: 'VALIDATE',
          attemptNumber: 1, // Stale! Current is 2
        }),
      });

      const res = await reviewPost(staleReviewReq);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toBe('STALE_SUBMISSION_ATTEMPT');
    });

    it('41. Multiple recording attempts preserve immutable historical records in previousAttempts', async () => {
      const freshConvId = `conv-history-${Date.now()}`;
      db.conversations.push({
        id: freshConvId,
        nonMuslimId: seekerId,
        dialogistId,
        language: 'en',
        status: 'ACTIVE',
        isAssigned: true,
        inactivityNoticeSent: false,
        intent: 'EMBRACE_ISLAM',
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      });

      // Take 1
      const sub1 = await shahadahService.submitShahadah({
        seekerId,
        conversationId: freshConvId,
        audioRecordingUrl: '/audio/take1.webm',
        durationSeconds: 15,
      });
      expect(sub1.ok).toBe(true);

      // Request retake on take 1
      await shahadahService.reviewSubmission({
        dialogistId,
        submissionId: (sub1 as any).data.id,
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Need clearer vowels',
      });

      // Take 2
      const sub2 = await shahadahService.submitShahadah({
        seekerId,
        conversationId: freshConvId,
        audioRecordingUrl: '/audio/take2.webm',
        durationSeconds: 20,
      });
      expect(sub2.ok).toBe(true);

      const submission = db.shahadahSubmissions.find((s) => s.conversationId === freshConvId)!;
      expect(submission.attemptNumber).toBe(2);
      expect((submission as any).previousAttempts.length).toBe(1);
      expect((submission as any).previousAttempts[0].attemptNumber).toBe(1);
      expect((submission as any).previousAttempts[0].audioRecordingUrl).toBe('/audio/take1.webm');
      expect((submission as any).previousAttempts[0].durationSeconds).toBe(15);
      expect((submission as any).previousAttempts[0].feedbackNotes).toBe('Need clearer vowels');
    });
  });
});
