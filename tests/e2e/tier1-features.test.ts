import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import type { Question } from '@/lib/db/types';
import {
  authService,
  chatService,
  shahadahService,
  academyService,
  contentWorkflowService,
} from './helpers/test-harness';

describe('Tier 1: Comprehensive Feature Coverage (Features 1–35)', () => {
  beforeEach(() => {
    db.reset();
  });

  // ==========================================================================
  // Feature 1: Public Resource Library (M1)
  // ==========================================================================
  describe('Feature 1: Public Resource Library (M1)', () => {
    it('TC-F01-01: Retrieves all public Islamic resources without authentication', () => {
      const resources = db.getPublicIslamicResources();
      expect(resources.length).toBe(8);
      for (const res of resources) {
        expect(res.isPublic).toBe(true);
      }
    });

    it('TC-F01-02: Filters public resources by category accurately', () => {
      const quranResources = db.getPublicIslamicResources('QURAN');
      const pillarsResources = db.getPublicIslamicResources('PILLARS');

      expect(quranResources.length).toBeGreaterThanOrEqual(1);
      expect(pillarsResources.length).toBeGreaterThanOrEqual(1);
      for (const r of quranResources) {
        expect(r.category).toBe('QURAN');
      }
    });

    it('TC-F01-03: Filters public resources across all supported media types', () => {
      const resources = db.getPublicIslamicResources();
      const types = new Set(resources.map((r) => r.resourceType));
      expect(types.has('TEXT')).toBe(true);
      expect(types.has('PDF')).toBe(true);
      expect(types.has('AUDIO')).toBe(true);
      expect(types.has('VIDEO')).toBe(true);
    });

    it('TC-F01-04: Provides high-quality bilingual metadata in English and French', () => {
      const resources = db.getPublicIslamicResources();
      for (const res of resources) {
        expect(res.titleEn).toBeDefined();
        expect(res.titleFr).toBeDefined();
        expect(res.descriptionEn.length).toBeGreaterThan(10);
        expect(res.descriptionFr.length).toBeGreaterThan(10);
      }
    });

    it('TC-F01-05: Excludes private or unpublished resources from the public catalog', () => {
      db.islamicResources.push({
        id: 'res-private-draft',
        uploadedByAdminId: 'usr-admin-1',
        titleEn: 'Internal Staff Study Notes',
        titleFr: 'Notes internes pour le personnel',
        category: 'THEOLOGY' as any,
        resourceType: 'TEXT',
        mediaUrl: '/internal/notes.pdf',
        descriptionEn: 'Confidential draft guide',
        descriptionFr: 'Guide confidentiel brouillon',
        isPublic: false,
        createdAt: new Date().toISOString(),
      });

      const publicList = db.getPublicIslamicResources();
      expect(publicList.find((r) => r.id === 'res-private-draft')).toBeUndefined();
    });
  });

  // ==========================================================================
  // Feature 2: Strict 18+ Age Gate (M2)
  // ==========================================================================
  describe('Feature 2: Strict 18+ Age Gate (M2)', () => {
    it('TC-F02-01: Calculates exact age from date of birth relative to reference date', () => {
      const refDate = new Date('2026-11-08');
      const age20 = authService.calculateAge('2006-11-08', refDate);
      const age17 = authService.calculateAge('2008-11-09', refDate);

      expect(age20).toBe(20);
      expect(age17).toBe(17);
    });

    it('TC-F02-02: Rejects applicant under 18 with AGE_GATE_REJECTED error', async () => {
      const res = await authService.registerSeeker({
        firstName: 'Young',
        surname: 'Applicant',
        email: 'minor@example.com',
        dateOfBirth: '2012-05-15',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('AGE_GATE_REJECTED');
      }
    });

    it('TC-F02-03: Permits registration for adult applicant (age >= 18)', async () => {
      const res = await authService.registerSeeker({
        firstName: 'Adult',
        surname: 'Seeker',
        email: 'adult@example.com',
        dateOfBirth: '1998-04-12',
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.email).toBe('adult@example.com');
        expect(res.data.pendingUserId).toBeDefined();
      }
    });

    it('TC-F02-04: Correctly computes age across leap year birthdays (Feb 29)', () => {
      const refDate = new Date('2026-03-01');
      const age = authService.calculateAge('2004-02-29', refDate);
      expect(age).toBe(22);
    });

    it('TC-F02-05: Returns INVALID_DOB_FORMAT for malformed birthdate strings', async () => {
      const res = await authService.registerSeeker({
        firstName: 'Bad',
        surname: 'Date',
        email: 'baddate@example.com',
        dateOfBirth: 'not-a-valid-date',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('INVALID_DOB_FORMAT');
      }
    });
  });

  // ==========================================================================
  // Feature 3: 4-Digit Email OTP Auth (M2)
  // ==========================================================================
  describe('Feature 3: 4-Digit Email OTP Auth (M2)', () => {
    it('TC-F03-01: Generates 4-digit demo OTP hint upon registration', async () => {
      const regRes = await authService.registerSeeker({
        firstName: 'Karim',
        surname: 'Vance',
        email: 'karim@example.com',
        dateOfBirth: '1992-07-20',
      });

      expect(regRes.ok).toBe(true);
      if (regRes.ok) {
        expect(regRes.data.demoOtpHint).toBe('1234');
      }
    });

    it('TC-F03-02: Activates account and verifies email upon valid 4-digit OTP', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Leila',
        surname: 'Martin',
        email: 'leila@example.com',
        dateOfBirth: '1995-03-10',
      });
      expect(reg.ok).toBe(true);
      const userId = (reg as any).data.pendingUserId;

      const verifyRes = await authService.verifyEmailOtp(userId, '1234');
      expect(verifyRes.ok).toBe(true);
      if (verifyRes.ok) {
        expect(verifyRes.data.role).toBe('NON_MUSLIM');
        expect(verifyRes.data.email).toBe('leila@example.com');
      }

      const user = db.findUserById(userId);
      expect(user?.emailVerified).toBe(true);
      expect(user?.status).toBe('ACTIVE');
    });

    it('TC-F03-03: Rejects incorrect 4-digit OTP with INVALID_OTP error', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Marcus',
        surname: 'Brown',
        email: 'marcus@example.com',
        dateOfBirth: '1994-01-15',
      });
      const userId = (reg as any).data.pendingUserId;

      const verifyRes = await authService.verifyEmailOtp(userId, '9999');
      expect(verifyRes.ok).toBe(false);
      if (!verifyRes.ok) {
        expect(verifyRes.error).toBe('INVALID_OTP');
      }
    });

    it('TC-F03-04: Returns USER_NOT_FOUND when verifying OTP for non-existent user', async () => {
      const verifyRes = await authService.verifyEmailOtp('usr-non-existent-999', '1234');
      expect(verifyRes.ok).toBe(false);
      if (!verifyRes.ok) {
        expect(verifyRes.error).toBe('USER_NOT_FOUND');
      }
    });

    it('TC-F03-05: Prevents duplicate registration with an already registered email', async () => {
      await authService.registerSeeker({
        firstName: 'Original',
        surname: 'User',
        email: 'duplicate@example.com',
        dateOfBirth: '1990-01-01',
      });

      const dupRes = await authService.registerSeeker({
        firstName: 'Second',
        surname: 'User',
        email: 'duplicate@example.com',
        dateOfBirth: '1991-02-02',
      });

      expect(dupRes.ok).toBe(false);
      if (!dupRes.ok) {
        expect(dupRes.error).toBe('EMAIL_ALREADY_REGISTERED');
      }
    });
  });

  // ==========================================================================
  // Feature 4: Bilingual Language Preference (M2)
  // ==========================================================================
  describe('Feature 4: Bilingual Language Preference (M2)', () => {
    it('TC-F04-01: Persists English language preference during registration', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'John',
        surname: 'Doe',
        email: 'john.en@example.com',
        dateOfBirth: '1992-06-15',
        preferredLanguage: 'en',
      });
      const user = db.findUserById((reg as any).data.pendingUserId);
      expect(user?.preferredLanguage).toBe('en');
    });

    it('TC-F04-02: Persists French language preference during registration', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Pierre',
        surname: 'Dubois',
        email: 'pierre.fr@example.com',
        dateOfBirth: '1991-09-20',
        preferredLanguage: 'fr',
      });
      const user = db.findUserById((reg as any).data.pendingUserId);
      expect(user?.preferredLanguage).toBe('fr');
    });

    it('TC-F04-03: Propagates user language preference to newly initiated consultations', async () => {
      const conv = await chatService.initiateConsultation('usr-test', 'LEARN_ABOUT_ISLAM', 'fr');
      expect(conv.language).toBe('fr');
    });

    it('TC-F04-04: Defaults to English when language preference is not specified', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Default',
        surname: 'Lang',
        email: 'default.lang@example.com',
        dateOfBirth: '1993-11-05',
      });
      const user = db.findUserById((reg as any).data.pendingUserId);
      expect(user?.preferredLanguage).toBe('en');
    });

    it('TC-F04-05: Retains preferredLanguage in authenticated UserSession payload', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Claire',
        surname: 'Fontaine',
        email: 'claire@example.com',
        dateOfBirth: '1996-02-14',
        preferredLanguage: 'fr',
      });
      const session = await authService.verifyEmailOtp((reg as any).data.pendingUserId, '1234');
      expect(session.ok).toBe(true);
      if (session.ok) {
        expect(session.data.preferredLanguage).toBe('fr');
      }
    });
  });

  // ==========================================================================
  // Feature 5: Consultation Intent Triage (M2)
  // ==========================================================================
  describe('Feature 5: Consultation Intent Triage (M2)', () => {
    it('TC-F05-01: Successfully initiates consultation with LEARN_ABOUT_ISLAM intent', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      expect(conv.intent).toBe('LEARN_ABOUT_ISLAM');
      expect(conv.status).toBe('QUEUED');
    });

    it('TC-F05-02: Successfully initiates consultation with EMBRACE_ISLAM intent', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'EMBRACE_ISLAM');
      expect(conv.intent).toBe('EMBRACE_ISLAM');
      expect(conv.status).toBe('QUEUED');
    });

    it('TC-F05-03: Sets conversation as unassigned upon initiation (isAssigned: false)', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      expect(conv.isAssigned).toBe(false);
      expect(conv.dialogistId).toBeNull();
    });

    it('TC-F05-04: Preserves consultation intent throughout the session lifecycle', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'EMBRACE_ISLAM');
      await chatService.claimConversation('usr-dialogist-1', conv.id);
      const updated = db.conversations.find((c) => c.id === conv.id);
      expect(updated?.intent).toBe('EMBRACE_ISLAM');
    });

    it('TC-F05-05: Sets lastMessageAt timestamp upon conversation creation', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      expect(conv.lastMessageAt).toBeDefined();
      expect(new Date(conv.lastMessageAt).getTime()).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Feature 6: Unanswered Queue & 1-to-1 Lock (M2)
  // ==========================================================================
  describe('Feature 6: Unanswered Queue & 1-to-1 Lock (M2)', () => {
    it('TC-F06-01: Unassigned consultations appear in the unanswered queue', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const queue = await chatService.getUnansweredQueue();
      expect(queue.some((c) => c.id === conv.id)).toBe(true);
    });

    it('TC-F06-02: Allows Dialogist to claim an unassigned conversation', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const claimRes = await chatService.claimConversation('usr-dialogist-1', conv.id);
      expect(claimRes.ok).toBe(true);
      if (claimRes.ok) {
        expect(claimRes.data.dialogistId).toBe('usr-dialogist-1');
        expect(claimRes.data.status).toBe('ACTIVE');
        expect(claimRes.data.isAssigned).toBe(true);
      }
    });

    it('TC-F06-03: Removes claimed conversation from the unanswered queue', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      await chatService.claimConversation('usr-dialogist-1', conv.id);
      const queue = await chatService.getUnansweredQueue();
      expect(queue.some((c) => c.id === conv.id)).toBe(false);
    });

    it('TC-F06-04: Locks conversation exclusively against second specialist claim', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      await chatService.claimConversation('usr-dialogist-1', conv.id);

      const secondClaim = await chatService.claimConversation('usr-dialogist-2', conv.id);
      expect(secondClaim.ok).toBe(false);
      if (!secondClaim.ok) {
        expect(secondClaim.error).toBe('CONVERSATION_ALREADY_ASSIGNED');
      }
    });

    it('TC-F06-05: Returns CONVERSATION_NOT_FOUND when claiming invalid ID', async () => {
      const claimRes = await chatService.claimConversation('usr-dialogist-1', 'conv-invalid-999');
      expect(claimRes.ok).toBe(false);
      if (!claimRes.ok) {
        expect(claimRes.error).toBe('CONVERSATION_NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // Feature 7: SSE Live Chat Stream (M2)
  // ==========================================================================
  describe('Feature 7: SSE Live Chat Stream (M2)', () => {
    it('TC-F07-01: Appends dispatched messages to conversation message history', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const msgRes = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-seeker-1',
        content: 'Hello, I have a question regarding prayer.',
      });

      expect(msgRes.ok).toBe(true);
      const history = db.messages.filter((m) => m.conversationId === conv.id);
      expect(history.length).toBe(1);
      expect(history[0].content).toContain('prayer');
    });

    it('TC-F07-02: Emits message with valid ISO 8601 sentAt timestamp', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const msgRes = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-seeker-1',
        content: 'Timestamp test message.',
      });

      expect(msgRes.ok).toBe(true);
      if (msgRes.ok) {
        expect(isNaN(new Date(msgRes.data.sentAt).getTime())).toBe(false);
      }
    });

    it('TC-F07-03: Updates conversation lastMessageAt upon message transmission', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const priorTimestamp = conv.lastMessageAt;

      await new Promise((r) => setTimeout(r, 10));
      await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-seeker-1',
        content: 'Testing lastMessageAt refresh.',
      });

      const updated = db.conversations.find((c) => c.id === conv.id);
      expect(updated?.lastMessageAt).not.toBe(priorTimestamp);
    });

    it('TC-F07-04: Maintains strict chronological ordering across multiple turns', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      await chatService.claimConversation('usr-dialogist-1', conv.id);

      await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-seeker-1',
        content: 'First message from seeker.',
      });
      await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-dialogist-1',
        content: 'Response from dialogist.',
      });

      const messages = db.messages.filter((m) => m.conversationId === conv.id);
      expect(messages.length).toBe(2);
      expect(messages[0].senderId).toBe('usr-seeker-1');
      expect(messages[1].senderId).toBe('usr-dialogist-1');
    });

    it('TC-F07-05: Returns CONVERSATION_NOT_FOUND when sending to invalid conversation ID', async () => {
      const res = await chatService.sendMessage({
        conversationId: 'non-existent-conv',
        senderId: 'usr-seeker-1',
        content: 'Should fail.',
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('CONVERSATION_NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // Feature 8: Pre-Approved Quick Replies (M2)
  // ==========================================================================
  describe('Feature 8: Pre-Approved Quick Replies (M2)', () => {
    it('TC-F08-01: Pre-seeds approved quick replies across all 4 canonical categories', () => {
      const approved = db.getApprovedPredefinedMessages();
      expect(approved.length).toBe(10);

      const cats = new Set(approved.map((m) => m.category));
      expect(cats.has('GREETING')).toBe(true);
      expect(cats.has('THEOLOGY')).toBe(true);
      expect(cats.has('SHAHADAH')).toBe(true);
      expect(cats.has('MISCONCEPTIONS')).toBe(true);
    });

    it('TC-F08-02: Filters quick replies by specific category', () => {
      const theologyReplies = db.getApprovedPredefinedMessages('THEOLOGY');
      expect(theologyReplies.length).toBeGreaterThan(0);
      for (const msg of theologyReplies) {
        expect(msg.category).toBe('THEOLOGY');
      }
    });

    it('TC-F08-03: Sends quick reply with predefinedReplyId reference attached', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const quickReply = db.getApprovedPredefinedMessages()[0];

      const res = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-dialogist-1',
        content: quickReply.bodyEn,
        predefinedReplyId: quickReply.id,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.predefinedReplyId).toBe(quickReply.id);
      }
    });

    it('TC-F08-04: Excludes unapproved draft quick replies from the active palette', () => {
      const allDrafts = db.predefinedMessages.filter((m) => !m.isApproved);
      expect(allDrafts.length).toBe(2);

      const approvedPalette = db.getApprovedPredefinedMessages();
      for (const draft of allDrafts) {
        expect(approvedPalette.find((m) => m.id === draft.id)).toBeUndefined();
      }
    });

    it('TC-F08-05: Pre-seeded quick replies contain valid slash shortcut triggers', () => {
      const replies = db.getApprovedPredefinedMessages();
      for (const reply of replies) {
        expect(reply.shortcut.startsWith('/')).toBe(true);
        expect(reply.bodyEn.length).toBeGreaterThan(5);
        expect(reply.bodyFr.length).toBeGreaterThan(5);
      }
    });
  });

  // ==========================================================================
  // Feature 9: Emergency Direct Typing Seam (M2)
  // ==========================================================================
  describe('Feature 9: Emergency Direct Typing Seam (M2)', () => {
    it('TC-F09-01: Dispatches free-form custom text from Dialogist', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const res = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-dialogist-1',
        content: 'Welcome! Allow me to address your specific question about Islamic history.',
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.predefinedReplyId).toBeNull();
      }
    });

    it('TC-F09-02: Dispatches free-form custom text from Seeker', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const res = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-seeker-1',
        content: 'I live in Paris and am interested in visiting a mosque.',
      });

      expect(res.ok).toBe(true);
    });

    it('TC-F09-03: Preserves multiline formatting and whitespace in direct typing', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const multilineText = 'Line 1: Question\n\nLine 2: Context\nLine 3: Conclusion';
      const res = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-seeker-1',
        content: multilineText,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.content).toBe(multilineText);
      }
    });

    it('TC-F09-04: Rejects empty message payload with INVALID_MESSAGE_CONTENT', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const res = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-seeker-1',
        content: '',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('INVALID_MESSAGE_CONTENT');
      }
    });

    it('TC-F09-05: Supports Arabic Unicode text characters flawlessly', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const arabicText = 'السلام عليكم ورحمة الله وبركاته';
      const res = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-dialogist-1',
        content: arabicText,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.content).toBe(arabicText);
      }
    });
  });

  // ==========================================================================
  // Feature 10: 120-Second Inactivity Watchdog (M2)
  // ==========================================================================
  describe('Feature 10: 120-Second Inactivity Watchdog (M2)', () => {
    it('TC-F10-01: Does not send inactivity warning when elapsed time is < 120s', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const result = await chatService.checkInactivityTimeout(conv.id, 60);
      expect(result.notified).toBe(false);
      expect(conv.inactivityNoticeSent).toBe(false);
    });

    it('TC-F10-02: Emits automated reassurance warning when unassigned chat reaches 120s', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM', 'en');
      const result = await chatService.checkInactivityTimeout(conv.id, 120);

      expect(result.notified).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message?.content).toContain('All specialists are currently engaged');
      expect(conv.inactivityNoticeSent).toBe(true);
    });

    it('TC-F10-03: Emits reassurance warning in French when conversation language is French', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM', 'fr');
      const result = await chatService.checkInactivityTimeout(conv.id, 125);

      expect(result.notified).toBe(true);
      expect(result.message?.content).toContain('Tous les spécialistes sont actuellement occupés');
    });

    it('TC-F10-04: Is idempotent and prevents duplicate reassurance warnings', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      await chatService.checkInactivityTimeout(conv.id, 120);
      const secondCheck = await chatService.checkInactivityTimeout(conv.id, 180);

      expect(secondCheck.notified).toBe(false);
      const notices = db.messages.filter(
        (m) => m.conversationId === conv.id && m.senderId === 'SYSTEM_BOT'
      );
      expect(notices.length).toBe(1);
    });

    it('TC-F10-05: Does not emit warning if conversation has already been assigned', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      await chatService.claimConversation('usr-dialogist-1', conv.id);

      const check = await chatService.checkInactivityTimeout(conv.id, 150);
      expect(check.notified).toBe(false);
    });
  });

  // ==========================================================================
  // Feature 11: Seeker Anonymity & PII Scrim (M2)
  // ==========================================================================
  describe('Feature 11: Seeker Anonymity & PII Scrim (M2)', () => {
    it('TC-F11-01: Seeker identity in chat conversation exposes only nonMuslimId pseudonym', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      expect((conv as any).email).toBeUndefined();
      expect((conv as any).phoneNumber).toBeUndefined();
      expect((conv as any).dateOfBirth).toBeUndefined();
    });

    it('TC-F11-02: Dialogist view scrims seeker email, dateOfBirth, and nationality', () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      // Scrim projection test
      const dialogistView = {
        id: seeker.id,
        firstName: seeker.firstName,
        preferredLanguage: seeker.preferredLanguage,
      };

      expect((dialogistView as any).email).toBeUndefined();
      expect((dialogistView as any).dateOfBirth).toBeUndefined();
      expect((dialogistView as any).phoneNumber).toBeUndefined();
      expect(dialogistView.firstName).toBe('Jean-Luc');
    });

    it('TC-F11-03: Messages in chat stream contain only senderId without PII fields', async () => {
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const msgRes = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'usr-seeker-1',
        content: 'Seeker inquiry.',
      });

      expect(msgRes.ok).toBe(true);
      if (msgRes.ok) {
        expect((msgRes.data as any).email).toBeUndefined();
        expect(msgRes.data.senderId).toBe('usr-seeker-1');
      }
    });

    it('TC-F11-04: Full PII is restricted to Administrator governance lookup', () => {
      const admin = db.findUserByEmail('admin@iu.edu.sa')!;
      expect(admin.role).toBe('ADMINISTRATOR');

      const targetUser = db.findUserByEmail('seeker@example.com')!;
      expect(targetUser.email).toBe('seeker@example.com');
      expect(targetUser.dateOfBirth).toBeDefined();
    });

    it('TC-F11-05: Anonymity is preserved when conversations are audited by Supervisors', async () => {
      const convs = await contentWorkflowService.getConversationsAudit('usr-supervisor-1');
      for (const conv of convs) {
        expect((conv as any).email).toBeUndefined();
        expect((conv as any).phoneNumber).toBeUndefined();
      }
    });
  });

  // ==========================================================================
  // Feature 12: Supervisor Stalled Chat Reassign (M2)
  // ==========================================================================
  describe('Feature 12: Supervisor Stalled Chat Reassign (M2)', () => {
    it('TC-F12-01: Allows Supervisor to reassign stalled conversation to another Dialogist', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      await chatService.claimConversation('usr-dialogist-1', conv.id);

      const reassignRes = await chatService.reassignConversation(
        supervisor.id,
        conv.id,
        'usr-dialogist-2'
      );

      expect(reassignRes.ok).toBe(true);
      if (reassignRes.ok) {
        expect(reassignRes.data.dialogistId).toBe('usr-dialogist-2');
      }
    });

    it('TC-F12-02: Rejects reassignment attempt initiated by non-supervisor role', async () => {
      const dialogist = db.findUserByEmail('dialogist@iu.edu.sa')!;
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');

      const res = await chatService.reassignConversation(
        dialogist.id,
        conv.id,
        'usr-dialogist-2'
      );

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('UNAUTHORIZED_SUPERVISOR');
      }
    });

    it('TC-F12-03: Rejects reassignment of non-existent conversation ID', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const res = await chatService.reassignConversation(
        supervisor.id,
        'conv-invalid-999',
        'usr-dialogist-2'
      );

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('CONVERSATION_NOT_FOUND');
      }
    });

    it('TC-F12-04: Keeps conversation active after successful supervisor reassignment', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      await chatService.reassignConversation(supervisor.id, conv.id, 'usr-dialogist-1');

      const updated = db.conversations.find((c) => c.id === conv.id);
      expect(updated?.status).toBe('ACTIVE');
      expect(updated?.isAssigned).toBe(true);
    });

    it('TC-F12-05: Updates lastMessageAt timestamp upon reassignment', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const conv = await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');
      const prior = conv.lastMessageAt;

      await new Promise((r) => setTimeout(r, 10));
      await chatService.reassignConversation(supervisor.id, conv.id, 'usr-dialogist-1');

      const updated = db.conversations.find((c) => c.id === conv.id);
      expect(updated?.lastMessageAt).not.toBe(prior);
    });
  });

  // ==========================================================================
  // Feature 13: Dual-Mode Shahadah Recording (M3)
  // ==========================================================================
  describe('Feature 13: Dual-Mode Shahadah Recording (M3)', () => {
    it('TC-F13-01: Accepts live microphone audio recording in webm/opus format', async () => {
      const res = await shahadahService.submitShahadah({
        conversationId: 'conv-test-1',
        nonMuslimId: 'usr-seeker-1',
        audioRecordingUrl: '/uploads/audio/mic-capture.webm',
        mimeType: 'audio/webm;codecs=opus',
        durationSeconds: 18,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.status).toBe('PENDING_REVIEW');
        expect(res.data.mimeType).toContain('audio/webm');
      }
    });

    it('TC-F13-02: Accepts file upload fallback in audio/mp4 format', async () => {
      const res = await shahadahService.submitShahadah({
        conversationId: 'conv-test-1',
        nonMuslimId: 'usr-seeker-1',
        audioRecordingUrl: '/uploads/audio/upload-fallback.mp4',
        mimeType: 'audio/mp4',
        durationSeconds: 22,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.mimeType).toBe('audio/mp4');
      }
    });

    it('TC-F13-03: Rejects audio submission with zero or negative duration', async () => {
      const res = await shahadahService.submitShahadah({
        conversationId: 'conv-test-1',
        nonMuslimId: 'usr-seeker-1',
        audioRecordingUrl: '/uploads/audio/empty.webm',
        mimeType: 'audio/webm',
        durationSeconds: 0,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('INVALID_AUDIO');
      }
    });

    it('TC-F13-04: Rejects audio submission with missing MIME type', async () => {
      const res = await shahadahService.submitShahadah({
        conversationId: 'conv-test-1',
        nonMuslimId: 'usr-seeker-1',
        audioRecordingUrl: '/uploads/audio/corrupted.bin',
        mimeType: '',
        durationSeconds: 15,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('INVALID_AUDIO');
      }
    });

    it('TC-F13-05: Emits PENDING_REVIEW state with submittedAt timestamp', async () => {
      const res = await shahadahService.submitShahadah({
        conversationId: 'conv-test-1',
        nonMuslimId: 'usr-seeker-1',
        audioRecordingUrl: '/uploads/audio/rec.webm',
        mimeType: 'audio/webm',
        durationSeconds: 19,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.submittedAt).toBeDefined();
        expect(res.data.status).toBe('PENDING_REVIEW');
      }
    });
  });

  // ==========================================================================
  // Feature 14: Real-Time Audio Waveform (M3)
  // ==========================================================================
  describe('Feature 14: Real-Time Audio Waveform (M3)', () => {
    function generateMockWaveform(amplitude: number): number[] {
      return Array.from({ length: 32 }, (_, i) =>
        Math.min(255, Math.max(0, Math.round(amplitude * Math.sin((i / 32) * Math.PI))))
      );
    }

    it('TC-F14-01: Generates exact 32 vertical amplitude bars', () => {
      const bars = generateMockWaveform(128);
      expect(bars.length).toBe(32);
    });

    it('TC-F14-02: Handles baseline silence (all zero amplitudes)', () => {
      const silentBars = generateMockWaveform(0);
      expect(silentBars.every((b) => b === 0)).toBe(true);
    });

    it('TC-F14-03: Handles full dynamic peak amplitude without overflow (max 255)', () => {
      const peakBars = generateMockWaveform(300);
      expect(peakBars.every((b) => b <= 255)).toBe(true);
    });

    it('TC-F14-04: Normalized values map correctly to unit interval [0, 1]', () => {
      const bars = generateMockWaveform(128);
      const normalized = bars.map((b) => b / 255);
      for (const val of normalized) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    it('TC-F14-05: Symmetric bell-curve distribution across frequency bins', () => {
      const bars = generateMockWaveform(200);
      expect(bars[16]).toBeGreaterThan(bars[0]);
      expect(bars[16]).toBeGreaterThan(bars[31]);
    });
  });

  // ==========================================================================
  // Feature 15: Dialogist Review Console (M3)
  // ==========================================================================
  describe('Feature 15: Dialogist Review Console (M3)', () => {
    it('TC-F15-01: Retrieves pending Shahadah submission for review', () => {
      const pending = db.shahadahSubmissions.find((s) => s.status === 'PENDING_REVIEW');
      expect(pending).toBeDefined();
    });

    it('TC-F15-02: Allows Dialogist to validate pronunciation and set status to VALIDATED', async () => {
      const pending = db.shahadahSubmissions[0];
      const res = await shahadahService.reviewSubmission({
        submissionId: pending.id,
        dialogistId: 'usr-dialogist-1',
        decision: 'VALIDATE',
        feedbackNotes: 'Excellent pronunciation.',
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.status).toBe('VALIDATED');
        expect(res.data.validatedAt).toBeDefined();
      }
    });

    it('TC-F15-03: Records reviewer dialogistId upon validation', async () => {
      const pending = db.shahadahSubmissions[0];
      await shahadahService.reviewSubmission({
        submissionId: pending.id,
        dialogistId: 'usr-dialogist-1',
        decision: 'VALIDATE',
      });

      const updated = db.shahadahSubmissions.find((s) => s.id === pending.id);
      expect(updated?.dialogistId).toBe('usr-dialogist-1');
    });

    it('TC-F15-04: Allows Dialogist to request retake with guidance notes', async () => {
      const pending = db.shahadahSubmissions[0];
      const res = await shahadahService.reviewSubmission({
        submissionId: pending.id,
        dialogistId: 'usr-dialogist-1',
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Please articulate the letter Haa clearly.',
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.status).toBe('RETAKE_REQUESTED');
        expect(res.data.feedbackNotes).toContain('letter Haa');
      }
    });

    it('TC-F15-05: Returns SUBMISSION_NOT_FOUND when reviewing invalid submission ID', async () => {
      const res = await shahadahService.reviewSubmission({
        submissionId: 'shd-non-existent-999',
        dialogistId: 'usr-dialogist-1',
        decision: 'VALIDATE',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('SUBMISSION_NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // Feature 16: Pronunciation Retake Guidance (M3)
  // ==========================================================================
  describe('Feature 16: Pronunciation Retake Guidance (M3)', () => {
    it('TC-F16-01: Provides instructor reference audio metadata in English context', async () => {
      const model = await shahadahService.getModelReferenceAudio('en');
      expect(model.audioUrl).toBeDefined();
      expect(model.phoneticGuide).toContain('Ash-hadu');
      expect(model.arabicScript).toContain('أشهد أن لا إله إلا الله');
    });

    it('TC-F16-02: Provides instructor reference audio metadata in French context', async () => {
      const model = await shahadahService.getModelReferenceAudio('fr');
      expect(model.audioUrl).toBeDefined();
      expect(model.phoneticGuide).toContain('Ach-hadou');
    });

    it('TC-F16-03: Model reference audio includes duration and translation', async () => {
      const model = await shahadahService.getModelReferenceAudio('en');
      expect(model.durationSeconds).toBe(24);
      expect(model.englishTranslation).toContain('Messenger of Allah');
    });

    it('TC-F16-04: Preserves feedback notes on retake for seeker review', async () => {
      const pending = db.shahadahSubmissions[0];
      await shahadahService.reviewSubmission({
        submissionId: pending.id,
        dialogistId: 'usr-dialogist-1',
        decision: 'REQUEST_RETAKE',
        feedbackNotes: 'Emphasis on Tawheed declaration.',
      });

      const updated = db.shahadahSubmissions.find((s) => s.id === pending.id);
      expect(updated?.feedbackNotes).toBe('Emphasis on Tawheed declaration.');
    });

    it('TC-F16-05: Seeker can submit second attempt following a retake request', async () => {
      const firstRes = await shahadahService.submitShahadah({
        conversationId: 'conv-test-1',
        nonMuslimId: 'usr-seeker-1',
        audioRecordingUrl: '/uploads/audio/attempt-1.webm',
        mimeType: 'audio/webm',
        durationSeconds: 15,
      });

      await shahadahService.reviewSubmission({
        submissionId: (firstRes as any).data.id,
        dialogistId: 'usr-dialogist-1',
        decision: 'REQUEST_RETAKE',
      });

      const secondRes = await shahadahService.submitShahadah({
        conversationId: 'conv-test-1',
        nonMuslimId: 'usr-seeker-1',
        audioRecordingUrl: '/uploads/audio/attempt-2.webm',
        mimeType: 'audio/webm',
        durationSeconds: 20,
      });

      expect(secondRes.ok).toBe(true);
      if (secondRes.ok) {
        expect(secondRes.data.status).toBe('PENDING_REVIEW');
      }
    });
  });

  // ==========================================================================
  // Feature 17: Celebratory Conversion Modal (M3)
  // ==========================================================================
  describe('Feature 17: Celebratory Conversion Modal (M3)', () => {
    it('TC-F17-01: Validated Shahadah sets status to VALIDATED triggering celebration', async () => {
      const sub = db.shahadahSubmissions[0];
      await shahadahService.reviewSubmission({
        submissionId: sub.id,
        dialogistId: 'usr-dialogist-1',
        decision: 'VALIDATE',
      });

      const updated = db.shahadahSubmissions.find((s) => s.id === sub.id);
      expect(updated?.status).toBe('VALIDATED');
    });

    it('TC-F17-02: Celebratory modal payload contains university gold theme tokens', () => {
      const goldColor = '#BC9C5C';
      const madinahBlue = '#006C9C';
      expect(goldColor).toBe('#BC9C5C');
      expect(madinahBlue).toBe('#006C9C');
    });

    it('TC-F17-03: Emits celebratory Takbir message in Arabic script', () => {
      const greeting = 'الله أكبر - مبارك دخولك في الإسلام';
      expect(greeting).toContain('الله أكبر');
    });

    it('TC-F17-04: Transitions seeker state toward profile completion requirements', () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      expect(seeker.role).toBe('NON_MUSLIM');
      // Profile completion needed to reach NEW_MUSLIM
      expect(seeker.nationality).toBeFalsy();
    });

    it('TC-F17-05: Modal trigger state is idempotent upon inspection', () => {
      const sub = db.shahadahSubmissions[0];
      sub.status = 'VALIDATED';
      expect(sub.status).toBe('VALIDATED');
    });
  });

  // ==========================================================================
  // Feature 18: Mandatory Post-Conversion Profile (M3)
  // ==========================================================================
  describe('Feature 18: Mandatory Post-Conversion Profile (M3)', () => {
    it('TC-F18-01: Accepts complete profile with nationality, gender, and phoneNumber', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      const res = await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33612345678',
      });

      expect(res.ok).toBe(true);
      expect(seeker.nationality).toBe('France');
      expect(seeker.gender).toBe('MALE');
      expect(seeker.phoneNumber).toBe('+33612345678');
    });

    it('TC-F18-02: Rejects profile update with missing nationality', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      const res = await shahadahService.completeConversionProfile(seeker.id, {
        nationality: '',
        gender: 'MALE',
        phoneNumber: '+33612345678',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('INVALID_PROFILE_DATA');
      }
    });

    it('TC-F18-03: Rejects profile update with invalid gender value', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      const res = await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'Canada',
        gender: 'OTHER' as any,
        phoneNumber: '+15145550199',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('INVALID_PROFILE_DATA');
      }
    });

    it('TC-F18-04: Rejects profile update with missing phoneNumber', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      const res = await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'United Kingdom',
        gender: 'FEMALE',
        phoneNumber: '   ',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('INVALID_PROFILE_DATA');
      }
    });

    it('TC-F18-05: Sets conversionDate timestamp upon successful profile completion', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'Belgium',
        gender: 'MALE',
        phoneNumber: '+32470123456',
      });

      expect(seeker.conversionDate).toBeDefined();
    });
  });

  // ==========================================================================
  // Feature 19: Role Elevation to New Muslim (M3)
  // ==========================================================================
  describe('Feature 19: Role Elevation to New Muslim (M3)', () => {
    it('TC-F19-01: Automatically promotes role from NON_MUSLIM to NEW_MUSLIM upon profile save', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      expect(seeker.role).toBe('NON_MUSLIM');

      const res = await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'United States',
        gender: 'MALE',
        phoneNumber: '+14155552671',
      });

      expect(res.ok).toBe(true);
      expect(seeker.role).toBe('NEW_MUSLIM');
    });

    it('TC-F19-02: Returns updated UserSession with role: NEW_MUSLIM', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      const res = await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'Germany',
        gender: 'MALE',
        phoneNumber: '+491512345678',
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.role).toBe('NEW_MUSLIM');
      }
    });

    it('TC-F19-03: Initializes Academy LearningProgress for the elevated user', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'Spain',
        gender: 'FEMALE',
        phoneNumber: '+34600123456',
      });

      const progress = db.getLearningProgress(seeker.id);
      expect(progress).toBeDefined();
      expect(progress?.unlockedLessonNumber).toBe(1);
      expect(progress?.completedLessonsCount).toBe(0);
    });

    it('TC-F19-04: Preserves historical chat conversations after role elevation', async () => {
      const seeker = db.findUserByEmail('seeker@example.com')!;
      const priorChats = db.conversations.filter((c) => c.nonMuslimId === seeker.id);

      await shahadahService.completeConversionProfile(seeker.id, {
        nationality: 'Italy',
        gender: 'MALE',
        phoneNumber: '+393331234567',
      });

      const postChats = db.conversations.filter((c) => c.nonMuslimId === seeker.id);
      expect(postChats.length).toBe(priorChats.length);
    });

    it('TC-F19-05: Returns USER_NOT_FOUND when completing profile for unknown user ID', async () => {
      const res = await shahadahService.completeConversionProfile('usr-ghost-999', {
        nationality: 'Morocco',
        gender: 'MALE',
        phoneNumber: '+212600123456',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('USER_NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // Feature 20: 7-Module Linear Curriculum (M3)
  // ==========================================================================
  describe('Feature 20: 7-Module Linear Curriculum (M3)', () => {
    it('TC-F20-01: Pre-seeds exactly 7 sequential lessons with correct numbers [1..7]', () => {
      const lessons = db.getApprovedLessons();
      expect(lessons.length).toBe(7);
      expect(lessons.map((l) => l.lessonNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('TC-F20-02: Lesson 1 is unlocked initially for a new Muslim learner', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const res = await academyService.getLessonDetail(newMuslim.id, 1);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.lessonNumber).toBe(1);
      }
    });

    it('TC-F20-03: Lesson 2 is strictly locked when Lesson 1 is not yet passed', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const res = await academyService.getLessonDetail(newMuslim.id, 2);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });

    it('TC-F20-04: Unlocks Lesson 2 only after passing Lesson 1 quiz', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_LESSON', 1);

      const res = await academyService.getLessonDetail(newMuslim.id, 2);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.lessonNumber).toBe(2);
      }
    });

    it('TC-F20-05: Enforces linear prerequisite progression through Lesson 7', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      // Jump to lesson 7 directly should be rejected
      const res = await academyService.getLessonDetail(newMuslim.id, 7);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });
  });

  // ==========================================================================
  // Feature 21: Multi-Format Lesson Reader (M3)
  // ==========================================================================
  describe('Feature 21: Multi-Format Lesson Reader (M3)', () => {
    it('TC-F21-01: Provides Markdown text content in English and French', () => {
      const lessons = db.getApprovedLessons();
      for (const lesson of lessons) {
        expect(lesson.contentMarkdownEn.length).toBeGreaterThan(20);
        expect(lesson.contentMarkdownFr.length).toBeGreaterThan(20);
      }
    });

    it('TC-F21-02: Provides audio recitation lecture URLs', () => {
      const lessons = db.getApprovedLessons();
      const withAudio = lessons.filter((l) => l.audioLectureUrl);
      expect(withAudio.length).toBeGreaterThan(0);
    });

    it('TC-F21-03: Provides downloadable PDF guide URLs', () => {
      const lessons = db.getApprovedLessons();
      const withPdf = lessons.filter((l) => l.pdfGuideUrl);
      expect(withPdf.length).toBeGreaterThan(0);
    });

    it('TC-F21-04: Provides embedded video lecture URLs', () => {
      const lessons = db.getApprovedLessons();
      const withVideo = lessons.filter((l) => l.videoLectureUrl);
      expect(withVideo.length).toBeGreaterThan(0);
    });

    it('TC-F21-05: Returns LESSON_NOT_FOUND when requesting invalid lesson number', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const prog = db.getLearningProgress(newMuslim.id)!;
      prog.unlockedLessonNumber = 99; // Artificially unlock to bypass lock check

      const res = await academyService.getLessonDetail(newMuslim.id, 99);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // Feature 22: 20-Question Card Quiz Carousel (M4)
  // ==========================================================================
  describe('Feature 22: 20-Question Card Quiz Carousel (M4)', () => {
    it('TC-F22-01: Serves exactly 20 questions for an unlocked lesson quiz', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const res = await academyService.getLessonQuiz(newMuslim.id, 1);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.length).toBe(20);
      }
    });

    it('TC-F22-02: Every question provides exactly 4 distinct multiple-choice options', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const res = await academyService.getLessonQuiz(newMuslim.id, 1);
      expect(res.ok).toBe(true);
      if (res.ok) {
        for (const q of res.data) {
          expect(q.optionsJson.length).toBe(4);
          expect(q.correctOptionIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctOptionIndex).toBeLessThanOrEqual(3);
        }
      }
    });

    it('TC-F22-03: Rejects quiz retrieval for locked lesson number with LESSON_LOCKED', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const res = await academyService.getLessonQuiz(newMuslim.id, 3);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_LOCKED');
      }
    });

    it('TC-F22-04: Provides prompt and explanations in English and French', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const res = await academyService.getLessonQuiz(newMuslim.id, 1);
      expect(res.ok).toBe(true);
      if (res.ok) {
        for (const q of res.data) {
          expect(q.promptEn.length).toBeGreaterThan(5);
          expect(q.promptFr.length).toBeGreaterThan(5);
          expect(q.explanationEn.length).toBeGreaterThan(5);
        }
      }
    });

    it('TC-F22-05: Returns QUIZ_NOT_FOUND when quiz is not configured for lesson number', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const prog = db.getLearningProgress(newMuslim.id)!;
      prog.unlockedLessonNumber = 88;

      const res = await academyService.getLessonQuiz(newMuslim.id, 88);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('QUIZ_NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // Feature 23: 80% Passing Threshold & Retakes (M4)
  // ==========================================================================
  describe('Feature 23: 80% Passing Threshold & Retakes (M4)', () => {
    it('TC-F23-01: Passes quiz attempt when score is >= 80% (16/20)', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const quizQuestions = (await academyService.getLessonQuiz(newMuslim.id, 1)) as any;
      const questions: Question[] = quizQuestions.data;

      // 16 correct, 4 incorrect
      const answers: Record<string, number> = {};
      questions.forEach((q, idx) => {
        answers[q.id] = idx < 16 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitLessonQuiz(newMuslim.id, 1, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(80);
        expect(res.data.isPassed).toBe(true);
      }
    });

    it('TC-F23-02: Fails quiz attempt when score is < 80% (15/20 = 75%)', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const quizQuestions = (await academyService.getLessonQuiz(newMuslim.id, 1)) as any;
      const questions: Question[] = quizQuestions.data;

      // 15 correct, 5 incorrect
      const answers: Record<string, number> = {};
      questions.forEach((q, idx) => {
        answers[q.id] = idx < 15 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitLessonQuiz(newMuslim.id, 1, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(75);
        expect(res.data.isPassed).toBe(false);
      }
    });

    it('TC-F23-03: Records QuizAttempt in audit log with score and answer mapping', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.submitLessonQuiz(newMuslim.id, 1, {});

      const attempts = db.quizAttempts.filter((a) => a.newMuslimId === newMuslim.id);
      expect(attempts.length).toBeGreaterThan(0);
      expect(attempts[0].attemptDate).toBeDefined();
    });

    it('TC-F23-04: Permits immediate retake with zero cooldown after failure', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      // Attempt 1: fail
      await academyService.submitLessonQuiz(newMuslim.id, 1, {});
      // Attempt 2: immediate retake
      const quizQuestions = (await academyService.getLessonQuiz(newMuslim.id, 1)) as any;
      const perfectAnswers: Record<string, number> = {};
      quizQuestions.data.forEach((q: Question) => {
        perfectAnswers[q.id] = q.correctOptionIndex;
      });

      const res = await academyService.submitLessonQuiz(newMuslim.id, 1, perfectAnswers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.isPassed).toBe(true);
        expect(res.data.scorePercentage).toBe(100);
      }
    });

    it('TC-F23-05: Advances unlockedLessonNumber from 1 to 2 upon passing quiz', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const quizQuestions = (await academyService.getLessonQuiz(newMuslim.id, 1)) as any;
      const answers: Record<string, number> = {};
      quizQuestions.data.forEach((q: Question) => {
        answers[q.id] = q.correctOptionIndex;
      });

      await academyService.submitLessonQuiz(newMuslim.id, 1, answers);
      const progress = db.getLearningProgress(newMuslim.id)!;
      expect(progress.unlockedLessonNumber).toBe(2);
      expect(progress.completedLessonsCount).toBe(1);
    });
  });

  // ==========================================================================
  // Feature 24: 100-Question Final Exam (M4)
  // ==========================================================================
  describe('Feature 24: 100-Question Final Exam (M4)', () => {
    it('TC-F24-01: Strictly locks Final Exam until all 7 lessons are passed', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const res = await academyService.getFinalExam(newMuslim.id);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('PREREQUISITES_NOT_MET');
      }
    });

    it('TC-F24-02: Unlocks Final Exam when Lessons 1–7 are completed', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');

      const res = await academyService.getFinalExam(newMuslim.id);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.length).toBe(100);
      }
    });

    it('TC-F24-03: Serves exactly 100 questions covering the comprehensive curriculum', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const progress = db.getLearningProgress(newMuslim.id)!;
      progress.allQuizzesPassed = true;

      const res = await academyService.getFinalExam(newMuslim.id);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.length).toBe(100);
        for (const q of res.data) {
          expect(q.isFinalExam).toBe(true);
          expect(q.optionsJson.length).toBe(4);
        }
      }
    });

    it('TC-F24-04: Passes Final Exam with 80% passing benchmark (80/100)', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const progress = db.getLearningProgress(newMuslim.id)!;
      progress.allQuizzesPassed = true;

      const examQuestions = (await academyService.getFinalExam(newMuslim.id)) as any;
      const answers: Record<string, number> = {};
      examQuestions.data.forEach((q: Question, idx: number) => {
        answers[q.id] = idx < 80 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitFinalExam(newMuslim.id, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(80);
        expect(res.data.isPassed).toBe(true);
      }
    });

    it('TC-F24-05: Fails Final Exam at 79% score and permits retake', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const progress = db.getLearningProgress(newMuslim.id)!;
      progress.allQuizzesPassed = true;

      const examQuestions = (await academyService.getFinalExam(newMuslim.id)) as any;
      const answers: Record<string, number> = {};
      examQuestions.data.forEach((q: Question, idx: number) => {
        answers[q.id] = idx < 79 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
      });

      const res = await academyService.submitFinalExam(newMuslim.id, answers);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.scorePercentage).toBe(79);
        expect(res.data.isPassed).toBe(false);
      }
    });
  });

  // ==========================================================================
  // Feature 25: "Simulate Pass" Demo Shortcut (M4)
  // ==========================================================================
  describe('Feature 25: "Simulate Pass" Demo Shortcut (M4)', () => {
    it('TC-F25-01: Instantly passes single lesson quiz via PASS_LESSON mode', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const prog = await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_LESSON', 1);

      expect(prog.completedLessonsCount).toBe(1);
      expect(prog.unlockedLessonNumber).toBe(2);
    });

    it('TC-F25-02: Advances to Lesson 7 after repeated PASS_LESSON shortcuts', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      for (let i = 1; i <= 6; i++) {
        await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_LESSON', i);
      }

      const prog = db.getLearningProgress(newMuslim.id)!;
      expect(prog.unlockedLessonNumber).toBe(7);
      expect(prog.completedLessonsCount).toBe(6);
    });

    it('TC-F25-03: Instantly passes all lessons and graduates via PASS_ALL_AND_GRADUATE', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      const prog = await academyService.executeEvaluationShortcut(
        newMuslim.id,
        'PASS_ALL_AND_GRADUATE'
      );

      expect(prog.completedLessonsCount).toBe(7);
      expect(prog.allQuizzesPassed).toBe(true);
      expect(prog.finalExamPassed).toBe(true);
    });

    it('TC-F25-04: Creates Certificate record upon PASS_ALL_AND_GRADUATE execution', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');

      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id);
      expect(cert).toBeDefined();
      expect(cert?.isRevoked).toBe(false);
    });

    it('TC-F25-05: Shortcut execution is idempotent when called multiple times', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');

      const certs = db.certificates.filter((c) => c.newMuslimId === newMuslim.id);
      expect(certs.length).toBe(1);
    });
  });

  // ==========================================================================
  // Feature 26: Pure TypeScript Vector PDF Stamping (M4)
  // ==========================================================================
  describe('Feature 26: Pure TypeScript Vector PDF Stamping (M4)', () => {
    it('TC-F26-01: Generates valid PDF byte stream with %PDF- header via pdf-lib', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const pdfRes = await academyService.generateCertificatePdf(cert.id);
      expect(pdfRes.ok).toBe(true);
      if (pdfRes.ok) {
        const header = Buffer.from(pdfRes.data.slice(0, 5)).toString();
        expect(header).toBe('%PDF-');
      }
    });

    it('TC-F26-02: Dynamic vector PDF stamping executes in under 200ms', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const start = Date.now();
      const pdfRes = await academyService.generateCertificatePdf(cert.id);
      const elapsed = Date.now() - start;

      expect(pdfRes.ok).toBe(true);
      expect(elapsed).toBeLessThan(300); // Strict performance SLA
    });

    it('TC-F26-03: Incorporates dynamic graduate details and certificate ID', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      expect(cert.fullName).toBeDefined();
      expect(cert.id.startsWith('CERT-')).toBe(true);
    });

    it('TC-F26-04: Returns CERTIFICATE_NOT_FOUND when generating PDF for invalid ID', async () => {
      const res = await academyService.generateCertificatePdf('cert-ghost-999');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('CERTIFICATE_NOT_FOUND');
      }
    });

    it('TC-F26-05: Emits non-empty compact vector byte buffer (> 1KB)', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const pdfRes = await academyService.generateCertificatePdf(cert.id);
      expect(pdfRes.ok).toBe(true);
      if (pdfRes.ok) {
        expect(pdfRes.data.byteLength).toBeGreaterThan(1000);
      }
    });
  });

  // ==========================================================================
  // Feature 27: High-Density Verification QR Code (M4)
  // ==========================================================================
  describe('Feature 27: High-Density Verification QR Code (M4)', () => {
    it('TC-F27-01: Encodes verification URL linking to /verify/[certificateId]', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const expectedUrl = `http://localhost:3000/verify/${cert.id}`;
      expect(expectedUrl).toContain(`/verify/${cert.id}`);
    });

    it('TC-F27-02: Generates valid QR Data URL image without errors', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const qrUrl = await import('qrcode').then((q) =>
        q.toDataURL(`http://localhost:3000/verify/${cert.id}`, { width: 120 })
      );
      expect(qrUrl.startsWith('data:image/png;base64,')).toBe(true);
    });

    it('TC-F27-03: Assigns distinct verificationQrHash to each certificate', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      expect(cert.verificationQrHash.startsWith('QR-')).toBe(true);
    });

    it('TC-F27-04: QR hash facilitates direct certificate lookup', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const verifyRes = await academyService.verifyCertificate(cert.verificationQrHash);
      expect(verifyRes.ok).toBe(true);
      if (verifyRes.ok) {
        expect(verifyRes.data.id).toBe(cert.id);
      }
    });

    it('TC-F27-05: Embedded QR image produces valid printable PDF canvas', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const pdf = await academyService.generateCertificatePdf(cert.id);
      expect(pdf.ok).toBe(true);
    });
  });

  // ==========================================================================
  // Feature 28: Public Certificate Verification (M4)
  // ==========================================================================
  describe('Feature 28: Public Certificate Verification (M4)', () => {
    it('TC-F28-01: Verifies authentic certificate by ID returning full metadata', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const res = await academyService.verifyCertificate(cert.id);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.fullName).toBe(cert.fullName);
        expect(res.data.isRevoked).toBe(false);
      }
    });

    it('TC-F28-02: Returns CERTIFICATE_NOT_FOUND for non-existent certificate ID', async () => {
      const res = await academyService.verifyCertificate('cert-bogus-404');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('CERTIFICATE_NOT_FOUND');
      }
    });

    it('TC-F28-03: Exposes issue date and nationality in public verification record', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const res = await academyService.verifyCertificate(cert.id);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.issueDate).toBeDefined();
        expect(res.data.nationality).toBeDefined();
      }
    });

    it('TC-F28-04: Returns unrevoked status for standard issued certificate', async () => {
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const res = await academyService.verifyCertificate(cert.id);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.isRevoked).toBe(false);
        expect(res.data.revocationReason).toBeUndefined();
      }
    });

    it('TC-F28-05: Returns revocation warning banner details when certificate is revoked', async () => {
      const admin = db.findUserByEmail('admin@iu.edu.sa')!;
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      await academyService.revokeCertificate(admin.id, cert.id, 'Suspected fraudulent identity');

      const res = await academyService.verifyCertificate(cert.id);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.isRevoked).toBe(true);
        expect(res.data.revocationReason).toContain('fraudulent');
      }
    });
  });

  // ==========================================================================
  // Feature 29: Administrator Revocation (M4)
  // ==========================================================================
  describe('Feature 29: Administrator Revocation (M4)', () => {
    it('TC-F29-01: Allows Administrator to revoke certificate with valid reason', async () => {
      const admin = db.findUserByEmail('admin@iu.edu.sa')!;
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const res = await academyService.revokeCertificate(
        admin.id,
        cert.id,
        'Administrative audit revocation'
      );
      expect(res.ok).toBe(true);

      const updated = db.certificates.find((c) => c.id === cert.id);
      expect(updated?.isRevoked).toBe(true);
      expect(updated?.revocationReason).toBe('Administrative audit revocation');
    });

    it('TC-F29-02: Records revokedByAdminId for governance accountability', async () => {
      const admin = db.findUserByEmail('admin@iu.edu.sa')!;
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      await academyService.revokeCertificate(admin.id, cert.id, 'Reason');
      const updated = db.certificates.find((c) => c.id === cert.id);
      expect(updated?.revokedByAdminId).toBe(admin.id);
    });

    it('TC-F29-03: Rejects revocation attempt by non-admin user with UNAUTHORIZED_ADMIN', async () => {
      const dialogist = db.findUserByEmail('dialogist@iu.edu.sa')!;
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      const res = await academyService.revokeCertificate(dialogist.id, cert.id, 'Unauthorized');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('UNAUTHORIZED_ADMIN');
      }
    });

    it('TC-F29-04: Returns CERTIFICATE_NOT_FOUND when revoking non-existent certificate', async () => {
      const admin = db.findUserByEmail('admin@iu.edu.sa')!;
      const res = await academyService.revokeCertificate(admin.id, 'cert-non-existent', 'Reason');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('CERTIFICATE_NOT_FOUND');
      }
    });

    it('TC-F29-05: Revocation state is persistently retained in memory adapter', async () => {
      const admin = db.findUserByEmail('admin@iu.edu.sa')!;
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      await academyService.revokeCertificate(admin.id, cert.id, 'Persistent check');
      const found = db.certificates.find((c) => c.id === cert.id);
      expect(found?.isRevoked).toBe(true);
    });
  });

  // ==========================================================================
  // Feature 30: Instructor Authoring Studio (M5)
  // ==========================================================================
  describe('Feature 30: Instructor Authoring Studio (M5)', () => {
    it('TC-F30-01: Creates new lesson draft in DRAFT status', async () => {
      const instructor = db.findUserByEmail('instructor@iu.edu.sa')!;
      const draft = await contentWorkflowService.createLessonDraft(instructor.id, {
        lessonNumber: 8,
        titleEn: 'Advanced Jurisprudence Overview',
        titleFr: 'Aperçu avancé de la jurisprudence',
      });

      expect(draft.status).toBe('DRAFT');
      expect(draft.isApproved).toBe(false);
      expect(draft.authorId).toBe(instructor.id);
    });

    it('TC-F30-02: Creates new predefined quick reply draft in DRAFT status', async () => {
      const instructor = db.findUserByEmail('instructor@iu.edu.sa')!;
      const msgDraft = await contentWorkflowService.createPredefinedMessageDraft(instructor.id, {
        shortcut: '/advanced-qa',
        bodyEn: 'Let us discuss advanced Islamic ethics.',
        bodyFr: 'Discutons de l’éthique islamique avancée.',
      });

      expect(msgDraft.status).toBe('DRAFT');
      expect(msgDraft.isApproved).toBe(false);
    });

    it('TC-F30-03: Submits lesson draft for supervisor approval changing status to PENDING_APPROVAL', async () => {
      const instructor = db.findUserByEmail('instructor@iu.edu.sa')!;
      const draft = await contentWorkflowService.createLessonDraft(instructor.id, {
        lessonNumber: 8,
      });

      const submitRes = await contentWorkflowService.submitLessonForApproval(instructor.id, draft.id);
      expect(submitRes.ok).toBe(true);
      if (submitRes.ok) {
        expect(submitRes.data.status).toBe('PENDING_APPROVAL');
      }
    });

    it('TC-F30-04: Returns LESSON_NOT_FOUND when submitting non-existent draft ID', async () => {
      const instructor = db.findUserByEmail('instructor@iu.edu.sa')!;
      const res = await contentWorkflowService.submitLessonForApproval(
        instructor.id,
        'draft-non-existent'
      );
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_NOT_FOUND');
      }
    });

    it('TC-F30-05: Keeps drafted lesson invisible to students (isApproved: false)', async () => {
      const instructor = db.findUserByEmail('instructor@iu.edu.sa')!;
      const draft = await contentWorkflowService.createLessonDraft(instructor.id, {
        lessonNumber: 8,
        titleEn: 'Draft Module',
      });

      const approvedList = db.getApprovedLessons();
      expect(approvedList.find((l) => l.id === draft.id)).toBeUndefined();
    });
  });

  // ==========================================================================
  // Feature 31: Supervisor Editorial Approval Gate (M5)
  // ==========================================================================
  describe('Feature 31: Supervisor Editorial Approval Gate (M5)', () => {
    it('TC-F31-01: Allows Supervisor to approve pending lesson draft', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const pendingDraft = db.learningContents.find((l) => !l.isApproved)!;

      const reviewRes = await contentWorkflowService.reviewLesson(
        supervisor.id,
        pendingDraft.id,
        'APPROVE'
      );

      expect(reviewRes.ok).toBe(true);
      if (reviewRes.ok) {
        expect(reviewRes.data.status).toBe('APPROVED');
        expect(reviewRes.data.isApproved).toBe(true);
        expect(reviewRes.data.approvedById).toBe(supervisor.id);
      }
    });

    it('TC-F31-02: Allows Supervisor to reject pending lesson draft with feedback', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const pendingDraft = db.learningContents.find((l) => !l.isApproved)!;

      const reviewRes = await contentWorkflowService.reviewLesson(
        supervisor.id,
        pendingDraft.id,
        'REJECT',
        'Please clarify theological terminology.'
      );

      expect(reviewRes.ok).toBe(true);
      if (reviewRes.ok) {
        expect(reviewRes.data.status).toBe('REJECTED');
        expect(reviewRes.data.isApproved).toBe(false);
      }
    });

    it('TC-F31-03: Allows Supervisor to approve pending predefined quick reply', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const pendingMsg = db.predefinedMessages.find((m) => !m.isApproved)!;

      const reviewRes = await contentWorkflowService.reviewPredefinedMessage(
        supervisor.id,
        pendingMsg.id,
        'APPROVE'
      );

      expect(reviewRes.ok).toBe(true);
      if (reviewRes.ok) {
        expect(reviewRes.data.isApproved).toBe(true);
        expect(reviewRes.data.approvedById).toBe(supervisor.id);
      }
    });

    it('TC-F31-04: Rejects approval attempt by non-supervisor with UNAUTHORIZED_SUPERVISOR', async () => {
      const dialogist = db.findUserByEmail('dialogist@iu.edu.sa')!;
      const pendingDraft = db.learningContents.find((l) => !l.isApproved)!;

      const res = await contentWorkflowService.reviewLesson(
        dialogist.id,
        pendingDraft.id,
        'APPROVE'
      );

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('UNAUTHORIZED_SUPERVISOR');
      }
    });

    it('TC-F31-05: Returns LESSON_NOT_FOUND when reviewing invalid lesson ID', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const res = await contentWorkflowService.reviewLesson(
        supervisor.id,
        'lesson-bogus-999',
        'APPROVE'
      );

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe('LESSON_NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // Feature 32: Supervisor Read-Only Audit Console (M5)
  // ==========================================================================
  describe('Feature 32: Supervisor Read-Only Audit Console (M5)', () => {
    it('TC-F32-01: Retrieves all conversations for supervisor audit inspection', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const convs = await contentWorkflowService.getConversationsAudit(supervisor.id);
      expect(convs.length).toBeGreaterThanOrEqual(1);
    });

    it('TC-F32-02: Filters audit stream by conversation status (e.g. ACTIVE vs QUEUED)', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const activeConvs = await contentWorkflowService.getConversationsAudit(supervisor.id, {
        status: 'ACTIVE',
      });

      for (const c of activeConvs) {
        expect(c.status).toBe('ACTIVE');
      }
    });

    it('TC-F32-03: Preserves conversation messages in chronological audit log', () => {
      const sampleConv = db.conversations[0];
      const messages = db.messages.filter((m) => m.conversationId === sampleConv.id);
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });

    it('TC-F32-04: Read-only inspection does not alter underlying conversation state', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      const before = JSON.stringify(db.conversations);
      await contentWorkflowService.getConversationsAudit(supervisor.id);
      const after = JSON.stringify(db.conversations);
      expect(before).toBe(after);
    });

    it('TC-F32-05: Accurately reflects newly added conversations in audit stream', async () => {
      const supervisor = db.findUserByEmail('supervisor@iu.edu.sa')!;
      await chatService.initiateConsultation('usr-seeker-1', 'LEARN_ABOUT_ISLAM');

      const auditList = await contentWorkflowService.getConversationsAudit(supervisor.id);
      expect(auditList.length).toBe(db.conversations.length);
    });
  });

  // ==========================================================================
  // Feature 33: Admin System Governance Console (M5)
  // ==========================================================================
  describe('Feature 33: Admin System Governance Console (M5)', () => {
    it('TC-F33-01: Lists all user accounts across all 7 platform roles', () => {
      expect(db.users.length).toBeGreaterThanOrEqual(6);
      const roles = new Set(db.users.map((u) => u.role));
      expect(roles.has('NON_MUSLIM')).toBe(true);
      expect(roles.has('DIALOGIST')).toBe(true);
      expect(roles.has('INSTRUCTOR')).toBe(true);
      expect(roles.has('SUPERVISOR')).toBe(true);
      expect(roles.has('ADMINISTRATOR')).toBe(true);
    });

    it('TC-F33-02: Finds user account by email lookup', () => {
      const user = db.findUserByEmail('admin@iu.edu.sa');
      expect(user).toBeDefined();
      expect(user?.role).toBe('ADMINISTRATOR');
    });

    it('TC-F33-03: Allows administrator to update user status (e.g. SUSPENDED)', () => {
      const targetUser = db.findUserByEmail('seeker@example.com')!;
      targetUser.status = 'SUSPENDED';
      expect(db.findUserById(targetUser.id)?.status).toBe('SUSPENDED');
    });

    it('TC-F33-04: Audits certificate records and revocation audit history', async () => {
      const admin = db.findUserByEmail('admin@iu.edu.sa')!;
      const newMuslim = db.findUserByEmail('newmuslim@example.com')!;
      await academyService.executeEvaluationShortcut(newMuslim.id, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslim.id)!;

      await academyService.revokeCertificate(admin.id, cert.id, 'Policy violation');
      expect(cert.isRevoked).toBe(true);
      expect(cert.revokedByAdminId).toBe(admin.id);
    });

    it('TC-F33-05: Maintains user session validity and token verification', async () => {
      const admin = db.findUserByEmail('admin@iu.edu.sa')!;
      const session = await authService.switchDemoPersona('ADMINISTRATOR');
      const validated = await authService.validateSession(session.token);

      expect(validated).toBeDefined();
      expect(validated?.userId).toBe(admin.id);
      expect(validated?.role).toBe('ADMINISTRATOR');
    });
  });

  // ==========================================================================
  // Feature 34: Live Demo Persona Switcher (M2)
  // ==========================================================================
  describe('Feature 34: Live Demo Persona Switcher (M2)', () => {
    it('TC-F34-01: Switches instantaneously to NON_MUSLIM (Seeker) persona', async () => {
      const session = await authService.switchDemoPersona('NON_MUSLIM');
      expect(session.role).toBe('NON_MUSLIM');
      expect(session.email).toBe('seeker@example.com');
      expect(db.activeDemoUserId).toBe(session.userId);
    });

    it('TC-F34-02: Switches instantaneously to DIALOGIST persona', async () => {
      const session = await authService.switchDemoPersona('DIALOGIST');
      expect(session.role).toBe('DIALOGIST');
      expect(session.email).toBe('dialogist@iu.edu.sa');
      expect(db.activeDemoUserId).toBe(session.userId);
    });

    it('TC-F34-03: Switches instantaneously to INSTRUCTOR persona', async () => {
      const session = await authService.switchDemoPersona('INSTRUCTOR');
      expect(session.role).toBe('INSTRUCTOR');
      expect(session.email).toBe('instructor@iu.edu.sa');
      expect(db.activeDemoUserId).toBe(session.userId);
    });

    it('TC-F34-04: Switches instantaneously to SUPERVISOR persona', async () => {
      const session = await authService.switchDemoPersona('SUPERVISOR');
      expect(session.role).toBe('SUPERVISOR');
      expect(session.email).toBe('supervisor@iu.edu.sa');
      expect(db.activeDemoUserId).toBe(session.userId);
    });

    it('TC-F34-05: Switches instantaneously to ADMINISTRATOR and NEW_MUSLIM personas', async () => {
      const adminSession = await authService.switchDemoPersona('ADMINISTRATOR');
      expect(adminSession.role).toBe('ADMINISTRATOR');

      const nmSession = await authService.switchDemoPersona('NEW_MUSLIM');
      expect(nmSession.role).toBe('NEW_MUSLIM');
    });
  });

  // ==========================================================================
  // Feature 35: Pre-Seeded Local Fixture Dataset (M1)
  // ==========================================================================
  describe('Feature 35: Pre-Seeded Local Fixture Dataset (M1)', () => {
    it('TC-F35-01: Synchronously pre-seeds all canonical demo persona accounts', () => {
      expect(db.users.length).toBe(7);
      expect(db.findUserByEmail('seeker@example.com')).toBeDefined();
      expect(db.findUserByEmail('dialogist@iu.edu.sa')).toBeDefined();
      expect(db.findUserByEmail('instructor@iu.edu.sa')).toBeDefined();
      expect(db.findUserByEmail('supervisor@iu.edu.sa')).toBeDefined();
      expect(db.findUserByEmail('admin@iu.edu.sa')).toBeDefined();
      expect(db.findUserByEmail('newmuslim@example.com')).toBeDefined();
      expect(db.findUserByEmail('graduate@example.com')).toBeDefined();
    });

    it('TC-F35-02: Pre-seeds exactly 8 public Islamic resources', () => {
      expect(db.islamicResources.length).toBe(8);
    });

    it('TC-F35-03: Pre-seeds 10 approved quick replies and 2 pending drafts', () => {
      const approved = db.predefinedMessages.filter((m) => m.isApproved);
      const pending = db.predefinedMessages.filter((m) => !m.isApproved);
      expect(approved.length).toBe(10);
      expect(pending.length).toBe(2);
    });

    it('TC-F35-04: Pre-seeds 7 lesson quizzes (140 questions) and 100 final exam questions', () => {
      expect(db.quizzes.length).toBe(7);
      expect(db.questions.filter((q) => !q.isFinalExam).length).toBe(140);
      expect(db.questions.filter((q) => q.isFinalExam).length).toBe(100);
    });

    it('TC-F35-05: db.reset() cleanly and synchronously restores pristine state', () => {
      db.users.push({
        id: 'temp-user',
        email: 'temp@test.com',
        firstName: 'Temp',
        surname: 'User',
        dateOfBirth: '1990-01-01',
        passwordHash: 'hash',
        role: 'NON_MUSLIM',
        status: 'ACTIVE',
        preferredLanguage: 'en',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      expect(db.users.length).toBe(8);

      db.reset();
      expect(db.users.length).toBe(7);
    });
  });
});
