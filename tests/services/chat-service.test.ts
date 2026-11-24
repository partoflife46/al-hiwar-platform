import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import { chatService } from '@/lib/services/chat-service';
import { chatEventBus } from '@/lib/services/chat-event-bus';

describe('ChatService Domain Seam (Milestone 2 - Task 2.3)', () => {
  beforeEach(() => {
    db.reset();
    chatEventBus.reset();
    db.users.push({
      id: 'user-seeker-2',
      email: 'seeker2@example.com',
      passwordHash: 'hash',
      firstName: 'Pierre',
      surname: 'Laurent',
      dateOfBirth: '1995-01-01',
      role: 'NON_MUSLIM',
      status: 'ACTIVE',
      preferredLanguage: 'fr',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  afterEach(() => {
    chatEventBus.reset();
  });

  // Group 1: Consultation Creation & Intent Triage
  describe('Consultation Creation & Intent Triage', () => {
    it('creates new queued consultation with specified intent and language', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'fr');

      expect(conv.id).toMatch(/^conv-/);
      expect(conv.nonMuslimId).toBe('user-seeker-2');
      expect(conv.intent).toBe('LEARN_ABOUT_ISLAM');
      expect(conv.language).toBe('fr');
      expect(conv.status).toBe('QUEUED');
      expect(conv.isAssigned).toBe(false);
      expect(conv.dialogistId).toBeNull();
      expect(conv.inactivityNoticeSent).toBe(false);
    });

    it('idempotently resumes existing unclosed consultation for the same seeker', async () => {
      const conv1 = await chatService.initiateConsultation('user-seeker-2', 'EMBRACE_ISLAM', 'en');
      const conv2 = await chatService.initiateConsultation('user-seeker-2', 'EMBRACE_ISLAM', 'en');

      expect(conv1.id).toBe(conv2.id);
    });
  });

  // Group 2: Unanswered Queue
  describe('Unanswered Queue', () => {
    it('returns only unassigned queued conversations ordered by createdAt ASC', async () => {
      // Clear any pre-seeded conversations to have clean test queue
      db.state.conversations = [];

      const olderTime = new Date(Date.now() - 50000).toISOString();
      const newerTime = new Date(Date.now() - 10000).toISOString();

      const conv1 = {
        id: 'conv-older',
        nonMuslimId: 'user-seeker-1',
        dialogistId: null,
        language: 'en' as const,
        intent: 'LEARN_ABOUT_ISLAM' as const,
        status: 'QUEUED' as const,
        isAssigned: false,
        inactivityNoticeSent: false,
        lastMessageAt: olderTime,
        createdAt: olderTime,
      };

      const conv2 = {
        id: 'conv-newer',
        nonMuslimId: 'user-seeker-1',
        dialogistId: null,
        language: 'en' as const,
        intent: 'LEARN_ABOUT_ISLAM' as const,
        status: 'QUEUED' as const,
        isAssigned: false,
        inactivityNoticeSent: false,
        lastMessageAt: newerTime,
        createdAt: newerTime,
      };

      const convAssigned = {
        id: 'conv-assigned',
        nonMuslimId: 'user-seeker-1',
        dialogistId: 'user-dialogist-1',
        language: 'en' as const,
        intent: 'LEARN_ABOUT_ISLAM' as const,
        status: 'ACTIVE' as const,
        isAssigned: true,
        inactivityNoticeSent: false,
        lastMessageAt: newerTime,
        createdAt: newerTime,
      };

      db.conversations.push(conv2, conv1, convAssigned);

      const queue = await chatService.getUnansweredQueue();
      expect(queue.length).toBe(2);
      expect(queue[0].id).toBe('conv-older');
      expect(queue[1].id).toBe('conv-newer');
    });
  });

  // Group 3: Exclusive 1-to-1 Specialist Lock & Collision Rejection
  describe('Exclusive 1-to-1 Specialist Lock', () => {
    it('first dialogist successfully claims queued inquiry and sets ACTIVE status', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      const result = await chatService.claimConversation('user-dialogist-1', conv.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.isAssigned).toBe(true);
        expect(result.data.dialogistId).toBe('user-dialogist-1');
        expect(result.data.status).toBe('ACTIVE');
      }
    });

    it('second dialogist attempting to claim returns CONVERSATION_ALREADY_CLAIMED', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      const claim1 = await chatService.claimConversation('user-dialogist-1', conv.id);
      expect(claim1.ok).toBe(true);

      // Create a second dialogist user
      db.users.push({
        id: 'user-dialogist-2',
        email: 'dialogist2@iu.edu.sa',
        passwordHash: 'hash',
        firstName: 'Sheikh Omar',
        surname: 'Al-Madani',
        dateOfBirth: '1988-01-01',
        role: 'DIALOGIST',
        status: 'ACTIVE',
        preferredLanguage: 'en',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const claim2 = await chatService.claimConversation('user-dialogist-2', conv.id);
      expect(claim2.ok).toBe(false);
      if (!claim2.ok) {
        expect(claim2.error.code).toBe('CONVERSATION_ALREADY_CLAIMED');
      }
    });

    it('rejects claim attempt from unauthorized role (e.g. NON_MUSLIM or VISITOR)', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      const result = await chatService.claimConversation('user-seeker-2', conv.id);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('UNAUTHORIZED_SENDER');
      }
    });

    it('rejects claim attempt from ADMINISTRATOR and SUPERVISOR (pure read-only audit mode)', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      for (const auditUser of ['user-admin-1', 'user-supervisor-1']) {
        const result = await chatService.claimConversation(auditUser, conv.id);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('UNAUTHORIZED_SENDER');
          expect(result.error.message).toContain('Only qualified dialogists can claim');
        }
      }
    });
  });

  // Group 4: Message Dispatch & Canned Quick Replies
  describe('Message Dispatch & Canned Quick Replies', () => {
    it('seeker dispatches regular text message into conversation', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      const result = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-seeker-2',
        content: 'Hello Sheikh, I have a question about prayer.',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.content).toBe('Hello Sheikh, I have a question about prayer.');
        expect(result.data.senderId).toBe('user-seeker-2');
        expect(db.messages.some((m) => m.id === result.data.id)).toBe(true);
      }
    });

    it('dialogist dispatches approved canned quick reply via predefinedReplyId', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      await chatService.claimConversation('user-dialogist-1', conv.id);

      // pm-1 is a seeded approved template in seed-data
      const result = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-dialogist-1',
        content: '',
        predefinedReplyId: 'pm-1',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.predefinedReplyId).toBe('pm-1');
        expect(result.data.content.length).toBeGreaterThan(10);
      }
    });

    it('rejects message referencing unapproved draft quick reply', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      await chatService.claimConversation('user-dialogist-1', conv.id);

      // Add draft unapproved message
      db.predefinedMessages.push({
        id: 'pm-draft-1',
        shortcut: '/draft',
        category: 'GREETING',
        bodyEn: 'Draft text',
        bodyFr: 'Texte ébauche',
        authorId: 'user-instructor-1',
        approvedById: null,
        isApproved: false,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
      });

      const result = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-dialogist-1',
        content: '',
        predefinedReplyId: 'pm-draft-1',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_MESSAGE');
      }
    });

    it('rejects empty message with no text, voice note, or canned reply', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      const result = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-seeker-2',
        content: '   ',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_MESSAGE');
      }
    });

    it('rejects message from third-party user not part of the conversation', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      await chatService.claimConversation('user-dialogist-1', conv.id);

      const result = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-newmuslim-1',
        content: 'I want to interject.',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('UNAUTHORIZED_SENDER');
      }
    });

    it('rejects message sent by ADMINISTRATOR and SUPERVISOR (audit read-only mode)', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      await chatService.claimConversation('user-dialogist-1', conv.id);

      for (const auditUser of ['user-admin-1', 'user-supervisor-1']) {
        const result = await chatService.sendMessage({
          conversationId: conv.id,
          senderId: auditUser,
          content: 'Audit user sending a message',
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('UNAUTHORIZED_SENDER');
          expect(result.error.message).toContain('not authorized to send messages');
        }
      }
    });
  });

  // Group 5: 120-Second Inactivity Watchdog
  describe('120-Second Inactivity Watchdog', () => {
    it('checkInactivityTimeout returns false if elapsed time is under 120s', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      const result = await chatService.checkInactivityTimeout(conv.id, 60);

      expect(result.notified).toBe(false);
      expect(conv.inactivityNoticeSent).toBe(false);
    });

    it('checkInactivityTimeout auto-injects reassurance message when elapsed >= 120s', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      const result = await chatService.checkInactivityTimeout(conv.id, 120);

      expect(result.notified).toBe(true);
      expect(conv.inactivityNoticeSent).toBe(true);
      expect(conv.status).toBe('QUEUED'); // Session remains open and queued!
      expect(result.message?.senderId).toBe('system');
      expect(result.message?.content).toContain('All specialists are currently engaged');
    });

    it('injects French reassurance message when conversation language is French', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'fr');
      const result = await chatService.checkInactivityTimeout(conv.id, 125);

      expect(result.notified).toBe(true);
      expect(result.message?.content).toContain('Tous nos spécialistes sont actuellement en consultation');
    });

    it('does not duplicate inactivity warning on subsequent checks', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      await chatService.checkInactivityTimeout(conv.id, 130);

      const secondCheck = await chatService.checkInactivityTimeout(conv.id, 150);
      expect(secondCheck.notified).toBe(false);
    });

    it('does not fire watchdog for already claimed conversations', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-2', 'LEARN_ABOUT_ISLAM', 'en');
      await chatService.claimConversation('user-dialogist-1', conv.id);

      const result = await chatService.checkInactivityTimeout(conv.id, 200);
      expect(result.notified).toBe(false);
    });

    it('automatically fires 120s inactivity notice via managed timer without manual checkInactivityTimeout call (FR 26 & NFR 18)', async () => {
      vi.useFakeTimers();
      const baseTime = new Date('2026-11-08T12:00:00.000Z');
      vi.setSystemTime(baseTime);

      const conv = await chatService.initiateConsultation('user-seeker-timer-auto', 'LEARN_ABOUT_ISLAM', 'en');
      expect(conv.inactivityNoticeSent).toBe(false);

      // Advance 119 seconds
      vi.advanceTimersByTime(119_000);
      expect(conv.inactivityNoticeSent).toBe(false);
      expect(db.messages.some((m) => m.conversationId === conv.id && m.senderId === 'system')).toBe(false);

      // Advance 1 more second (120s total)
      vi.advanceTimersByTime(1_000);
      // Managed timer fired automatically without any manual checkInactivityTimeout call!
      expect(conv.inactivityNoticeSent).toBe(true);
      const sysMsg = db.messages.find((m) => m.conversationId === conv.id && m.senderId === 'system');
      expect(sysMsg).toBeDefined();
      expect(sysMsg?.content).toContain('All specialists are currently engaged');

      vi.useRealTimers();
    });

    it('triggerInactivityChecks sweeps all active queued conversations', async () => {
      db.state.conversations = [];
      const pastTime = new Date(Date.now() - 150000).toISOString();

      const conv1: any = {
        id: 'conv-timeout-1',
        nonMuslimId: 'user-seeker-1',
        dialogistId: null,
        language: 'en',
        intent: 'LEARN_ABOUT_ISLAM',
        status: 'QUEUED',
        isAssigned: false,
        inactivityNoticeSent: false,
        lastMessageAt: pastTime,
        createdAt: pastTime,
      };

      const conv2: any = {
        id: 'conv-timeout-2',
        nonMuslimId: 'user-seeker-1',
        dialogistId: null,
        language: 'fr',
        intent: 'EMBRACE_ISLAM',
        status: 'QUEUED',
        isAssigned: false,
        inactivityNoticeSent: false,
        lastMessageAt: pastTime,
        createdAt: pastTime,
      };

      db.conversations.push(conv1, conv2);

      const result = await chatService.triggerInactivityChecks();
      expect(result.notifiedConversationIds).toContain('conv-timeout-1');
      expect(result.notifiedConversationIds).toContain('conv-timeout-2');
      expect(result.notifiedConversationIds.length).toBe(2);
    });
  });

  // Group 6: Supervisor Stalled Chat Reassignment
  describe('Supervisor Stalled Chat Reassignment', () => {
    it('supervisor can reassign conversation to another dialogist', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-1', 'LEARN_ABOUT_ISLAM', 'en');
      const result = await chatService.reassignConversation(
        'user-supervisor-1',
        conv.id,
        'user-dialogist-1'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.dialogistId).toBe('user-dialogist-1');
        expect(result.data.isAssigned).toBe(true);
      }
    });

    it('non-supervisor is rejected from reassigning conversation', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-1', 'LEARN_ABOUT_ISLAM', 'en');
      const result = await chatService.reassignConversation(
        'user-seeker-1',
        conv.id,
        'user-dialogist-1'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('UNAUTHORIZED_SENDER');
      }
    });
  });

  // Group 7: ChatEventBus Pub/Sub & Unsubscribe Behavior
  describe('ChatEventBus Pub/Sub', () => {
    it('subscribers receive published messages and unsubscribe halts delivery', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-1', 'LEARN_ABOUT_ISLAM', 'en');
      const received: any[] = [];

      const unsubscribe = chatEventBus.subscribe(conv.id, (event) => {
        received.push(event);
      });

      await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-seeker-1',
        content: 'First event test message',
      });

      expect(received.length).toBe(1);
      expect(received[0].type).toBe('message');

      unsubscribe();

      await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-seeker-1',
        content: 'Second message after unsubscribe',
      });

      expect(received.length).toBe(1);
    });
  });

  // Group 8: In-Chat Consultation Options Prompt & Choice History
  describe('In-Chat Options Prompt & Choice History', () => {
    it('delivers two consultation options in chat history and updates intent when seeker selects a choice', async () => {
      const conv = await chatService.initiateConsultation(
        'user-seeker-2',
        'LEARN_ABOUT_ISLAM',
        'en',
        { includeIntentPrompt: true }
      );

      const initialMsgs = db.messages.filter((m) => m.conversationId === conv.id);
      expect(initialMsgs.length).toBe(1);
      expect(initialMsgs[0].messageType).toBe('INTENT_PROMPT');

      const choiceRes = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-seeker-2',
        content: 'I want to embrace Islam (Declare Shahadah)',
        messageType: 'INTENT_CHOICE',
        selectedIntent: 'EMBRACE_ISLAM',
      });

      expect(choiceRes.ok).toBe(true);
      expect(conv.intent).toBe('EMBRACE_ISLAM');

      const history = db.messages.filter((m) => m.conversationId === conv.id);
      expect(history.length).toBe(2);
      expect(history[1].messageType).toBe('INTENT_CHOICE');
      expect(history[1].selectedIntent).toBe('EMBRACE_ISLAM');
    });
  });
});
