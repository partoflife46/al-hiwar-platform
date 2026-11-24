import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { chatService } from '@/lib/services/chat-service';
import { chatEventBus } from '@/lib/services/chat-event-bus';
import { GET as streamRoute } from '@/app/api/chat/stream/route';
import { POST as claimRoute } from '@/app/api/chat/claim/route';
import { signSessionToken } from '@/lib/security/session-token';

describe('Adversarial Stress Verification: ChatService & ChatEventBus (Milestone 2)', () => {
  beforeEach(() => {
    db.reset();
    chatEventBus.reset();

    // Register test dialogists and supervisor
    for (let i = 1; i <= 10; i++) {
      db.users.push({
        id: `user-dialogist-stress-${i}`,
        email: `dialogist_stress_${i}@iu.edu.sa`,
        passwordHash: 'hash',
        firstName: `Sheikh-${i}`,
        surname: `Al-Madani-${i}`,
        dateOfBirth: '1985-01-01',
        role: 'DIALOGIST',
        status: 'ACTIVE',
        preferredLanguage: i % 2 === 0 ? 'fr' : 'en',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    db.users.push({
      id: 'user-seeker-stress-1',
      email: 'seeker_stress@example.com',
      passwordHash: 'hash',
      firstName: 'John',
      surname: 'Seeker',
      dateOfBirth: '1998-05-12',
      role: 'NON_MUSLIM',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    chatEventBus.reset();
  });

  // Helper to read SSE stream chunks
  async function readSseStreamUntil(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    targetString: string,
    timeoutMs: number = 3000
  ): Promise<string> {
    const decoder = new TextDecoder();
    let accumulated = '';
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const { value, done } = await Promise.race([
        reader.read(),
        new Promise<{ value: undefined; done: boolean }>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout waiting for '${targetString}'`)), timeoutMs)
        ),
      ]);

      if (value) {
        accumulated += decoder.decode(value, { stream: true });
        if (accumulated.includes(targetString)) {
          return accumulated;
        }
      }
      if (done) break;
    }
    return accumulated;
  }

  // =========================================================================
  // SUITE 1: RACE CONDITIONS & CONCURRENCY TESTS
  // =========================================================================
  describe('Race Condition & Concurrency Stress Tests', () => {
    it('1. Service layer: 10 Dialogists simultaneously claiming the exact same consultation produces exactly 1 winner and 9 CONVERSATION_ALREADY_CLAIMED errors', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');
      expect(conv.status).toBe('QUEUED');
      expect(conv.isAssigned).toBe(false);

      // Listen for claim events on event bus
      const claimEvents: any[] = [];
      const unsub = chatEventBus.subscribe(conv.id, (e) => {
        if (e.type === 'conversation_claimed') claimEvents.push(e);
      });

      // 10 dialogists claim concurrently
      const claimPromises = Array.from({ length: 10 }, (_, i) =>
        chatService.claimConversation(`user-dialogist-stress-${i + 1}`, conv.id)
      );

      const results = await Promise.all(claimPromises);
      unsub();

      const successes = results.filter((r) => r.ok);
      const failures = results.filter((r) => !r.ok);

      // Exactly 1 winner
      expect(successes.length).toBe(1);
      // Exactly 9 rejections
      expect(failures.length).toBe(9);

      // Verify all rejected claims failed with CONVERSATION_ALREADY_CLAIMED
      for (const fail of failures) {
        expect(!fail.ok && fail.error.code).toBe('CONVERSATION_ALREADY_CLAIMED');
        expect(!fail.ok && fail.error.message).toContain('already been claimed');
      }

      // Verify state in database
      const winner = successes[0];
      if (winner.ok) {
        expect(winner.data.isAssigned).toBe(true);
        expect(winner.data.status).toBe('ACTIVE');
        expect(winner.data.dialogistId).toMatch(/^user-dialogist-stress-\d+$/);

        const dbConv = db.conversations.find((c) => c.id === conv.id);
        expect(dbConv?.dialogistId).toBe(winner.data.dialogistId);
        expect(dbConv?.status).toBe('ACTIVE');
        expect(dbConv?.isAssigned).toBe(true);
      }

      // Event bus received exactly 1 claim event
      expect(claimEvents.length).toBe(1);
    });

    it('2. HTTP API layer: 10 concurrent POST /api/chat/claim requests result in exactly 1 HTTP 200 and 9 HTTP 409 responses', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');

      const requests = Array.from({ length: 10 }, (_, i) => {
        const req = new NextRequest('http://localhost:3000/api/chat/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dialogistId: `user-dialogist-stress-${i + 1}`,
            conversationId: conv.id,
          }),
        });
        return claimRoute(req);
      });

      const responses = await Promise.all(requests);
      const statuses = responses.map((r) => r.status);
      const bodies = await Promise.all(responses.map((r) => r.json()));

      const okResponses = responses.filter((r) => r.status === 200);
      const conflictResponses = responses.filter((r) => r.status === 409);

      expect(okResponses.length).toBe(1);
      expect(conflictResponses.length).toBe(9);

      // Verify 409 bodies contain CONVERSATION_ALREADY_CLAIMED
      const conflictBodies = bodies.filter((b) => !b.ok);
      expect(conflictBodies.length).toBe(9);
      for (const b of conflictBodies) {
        expect(b.ok).toBe(false);
        expect(b.error).toBe('CONVERSATION_ALREADY_CLAIMED');
      }

      // Verify 200 body has conversation data
      const okBody = bodies.find((b) => b.ok);
      expect(okBody).toBeDefined();
      expect(okBody.ok).toBe(true);
      expect(okBody.data.status).toBe('ACTIVE');
      expect(okBody.data.isAssigned).toBe(true);
    });

    it('3. Winner dialogist re-claiming is idempotent (HTTP 200), competitor receives HTTP 409', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');

      // Dialogist 1 claims
      const req1 = new NextRequest('http://localhost:3000/api/chat/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogistId: 'user-dialogist-stress-1',
          conversationId: conv.id,
        }),
      });
      const res1 = await claimRoute(req1);
      expect(res1.status).toBe(200);

      // Dialogist 1 claims AGAIN (idempotent retry)
      const req1Retry = new NextRequest('http://localhost:3000/api/chat/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogistId: 'user-dialogist-stress-1',
          conversationId: conv.id,
        }),
      });
      const res1Retry = await claimRoute(req1Retry);
      expect(res1Retry.status).toBe(200);

      // Competitor Dialogist 2 attempts to claim
      const req2 = new NextRequest('http://localhost:3000/api/chat/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogistId: 'user-dialogist-stress-2',
          conversationId: conv.id,
        }),
      });
      const res2 = await claimRoute(req2);
      expect(res2.status).toBe(409);
      const body2 = await res2.json();
      expect(body2.error).toBe('CONVERSATION_ALREADY_CLAIMED');
    });

    it('4. Rejects claim attempt with 403 when sender is unauthorized role', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');

      const req = new NextRequest('http://localhost:3000/api/chat/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogistId: 'user-seeker-stress-1', // NON_MUSLIM cannot claim
          conversationId: conv.id,
        }),
      });
      const res = await claimRoute(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('UNAUTHORIZED_SENDER');
    });

    it('5. Rejects claim attempt with 404 when conversation does not exist', async () => {
      const req = new NextRequest('http://localhost:3000/api/chat/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogistId: 'user-dialogist-stress-1',
          conversationId: 'non-existent-conv-id',
        }),
      });
      const res = await claimRoute(req);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('CONVERSATION_NOT_FOUND');
    });
  });

  // =========================================================================
  // SUITE 2: INACTIVITY WATCHDOG STRESS & BOUNDARY TESTS
  // =========================================================================
  describe('Inactivity Watchdog Stress & Boundary Tests', () => {
    it('6. Boundary tests: exactly 119s yields no notice, 119.99s yields no notice, 120.0s injects reassurance notice', async () => {
      const convEn = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');

      // Test boundary: 0s
      const res0 = await chatService.checkInactivityTimeout(convEn.id, 0);
      expect(res0.notified).toBe(false);
      expect(convEn.inactivityNoticeSent).toBe(false);

      // Test boundary: 60s
      const res60 = await chatService.checkInactivityTimeout(convEn.id, 60);
      expect(res60.notified).toBe(false);
      expect(convEn.inactivityNoticeSent).toBe(false);

      // Test boundary: 119s
      const res119 = await chatService.checkInactivityTimeout(convEn.id, 119);
      expect(res119.notified).toBe(false);
      expect(convEn.inactivityNoticeSent).toBe(false);

      // Test boundary: 119.99s
      const res119_99 = await chatService.checkInactivityTimeout(convEn.id, 119.99);
      expect(res119_99.notified).toBe(false);
      expect(convEn.inactivityNoticeSent).toBe(false);

      // No message in db yet
      const msgsBefore = db.messages.filter((m) => m.conversationId === convEn.id);
      expect(msgsBefore.length).toBe(0);

      // Test exact threshold: 120.0s
      const res120 = await chatService.checkInactivityTimeout(convEn.id, 120.0);
      expect(res120.notified).toBe(true);
      expect(convEn.inactivityNoticeSent).toBe(true);
      expect(convEn.status).toBe('QUEUED'); // Must NOT cancel or close consultation!

      // Verify injected reassurance message
      expect(res120.message).toBeDefined();
      expect(res120.message?.senderId).toBe('system');
      expect(res120.message?.content).toContain('All specialists are currently engaged');
      expect(res120.message?.content).toContain('Your chat remains open and a specialist will join shortly');

      // Verify presence in db
      const msgsAfter = db.messages.filter((m) => m.conversationId === convEn.id);
      expect(msgsAfter.length).toBe(1);
      expect(msgsAfter[0].id).toBe(res120.message?.id);
    });

    it('7. French conversation injects official French reassurance message at 120s', async () => {
      const convFr = await chatService.initiateConsultation('user-seeker-stress-1', 'EMBRACE_ISLAM', 'fr');

      const res = await chatService.checkInactivityTimeout(convFr.id, 120);
      expect(res.notified).toBe(true);
      expect(res.message?.content).toContain('Tous nos spécialistes sont actuellement en consultation');
      expect(res.message?.content).toContain('Votre salon reste ouvert et un spécialiste vous rejoindra dans les plus brefs délais');
    });

    it('8. Suppresses duplicates on subsequent evaluations (120s, 125s, 180s, 300s)', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');

      // First trigger at 120s
      const res1 = await chatService.checkInactivityTimeout(conv.id, 120);
      expect(res1.notified).toBe(true);

      // Subsequent checks MUST be suppressed
      const res2 = await chatService.checkInactivityTimeout(conv.id, 125);
      expect(res2.notified).toBe(false);

      const res3 = await chatService.checkInactivityTimeout(conv.id, 180);
      expect(res3.notified).toBe(false);

      const res4 = await chatService.checkInactivityTimeout(conv.id, 300);
      expect(res4.notified).toBe(false);

      // Verify db still only has exactly 1 message
      const msgs = db.messages.filter((m) => m.conversationId === conv.id);
      expect(msgs.length).toBe(1);
    });

    it('9. Concurrency stress on watchdog: 10 concurrent evaluations at 120s injects reassurance notice exactly once', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');

      // Listen for inactivity warning events
      const warningEvents: any[] = [];
      const unsub = chatEventBus.subscribe(conv.id, (e) => {
        if (e.type === 'inactivity_warning') warningEvents.push(e);
      });

      // 10 concurrent evaluations at 120s
      const promises = Array.from({ length: 10 }, () =>
        chatService.checkInactivityTimeout(conv.id, 120)
      );
      const results = await Promise.all(promises);
      unsub();

      const notifiedCount = results.filter((r) => r.notified).length;
      expect(notifiedCount).toBe(1);

      // DB messages must contain exactly ONE message
      const msgs = db.messages.filter((m) => m.conversationId === conv.id);
      expect(msgs.length).toBe(1);

      // Event bus received exactly 1 warning event
      expect(warningEvents.length).toBe(1);
    });

    it('10. Immune to watchdog if claimed or active before timeout', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');
      await chatService.claimConversation('user-dialogist-stress-1', conv.id);

      // Now active and claimed
      expect(conv.isAssigned).toBe(true);
      expect(conv.status).toBe('ACTIVE');

      const res = await chatService.checkInactivityTimeout(conv.id, 300);
      expect(res.notified).toBe(false);
      expect(conv.inactivityNoticeSent).toBe(false);

      const msgs = db.messages.filter((m) => m.conversationId === conv.id);
      expect(msgs.length).toBe(0);
    });

    it('11. Fake timer test: advancing time from 0 to 119s yields no notice, advancing to 120s triggers watchdog', async () => {
      vi.useFakeTimers();
      const baseTime = new Date('2026-11-08T12:00:00.000Z');
      vi.setSystemTime(baseTime);

      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');

      // Advance 119 seconds (119_000 ms)
      vi.advanceTimersByTime(119_000);
      const res119 = await chatService.checkInactivityTimeout(conv.id); // without elapsedSeconds arg, uses Date.now()
      expect(res119.notified).toBe(false);
      expect(conv.inactivityNoticeSent).toBe(false);

      // Advance 1 more second (120_000 ms total)
      vi.advanceTimersByTime(1_000);
      const res120 = await chatService.checkInactivityTimeout(conv.id);
      expect(res120.notified).toBe(true);
      expect(conv.inactivityNoticeSent).toBe(true);

      // Advance 60 more seconds (180_000 ms total)
      vi.advanceTimersByTime(60_000);
      const res180 = await chatService.checkInactivityTimeout(conv.id);
      expect(res180.notified).toBe(false);

      vi.useRealTimers();
    });
  });

  // =========================================================================
  // SUITE 3: SSE CONNECTION LIFECYCLE & LISTENER LEAK VERIFICATION
  // =========================================================================
  describe('SSE Connection Lifecycle & Listener Leak Checks', () => {
    it('12. Connects to SSE stream, receives handshake, receives live message, and disconnects cleanly', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');
      const channel = `chat:${conv.id}`;

      const initialListeners = (chatEventBus as any).emitter.listenerCount(channel);
      expect(initialListeners).toBe(0);

      const ac = new AbortController();
      const req = new NextRequest(`http://localhost:3000/api/chat/stream?conversationId=${conv.id}`, {
        headers: { cookie: `alhiwar_session=${signSessionToken('user-seeker-stress-1')}` },
        signal: ac.signal,
      });

      const res = await streamRoute(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/event-stream');

      // Listener is registered
      const activeListeners = (chatEventBus as any).emitter.listenerCount(channel);
      expect(activeListeners).toBe(1);

      const reader = res.body?.getReader();
      expect(reader).toBeDefined();
      if (!reader) return;

      // 1. Initial Handshake event
      const handshakeChunk = await readSseStreamUntil(reader, 'event: connected');
      expect(handshakeChunk).toContain('event: connected');
      expect(handshakeChunk).toContain(conv.id);

      // 2. Dispatch a message via ChatService
      const msgResult = await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-seeker-stress-1',
        content: 'Testing live SSE streaming message',
      });
      expect(msgResult.ok).toBe(true);

      // 3. Receive message through SSE stream
      const messageChunk = await readSseStreamUntil(reader, 'Testing live SSE streaming message');
      expect(messageChunk).toContain('event: message');
      expect(messageChunk).toContain('Testing live SSE streaming message');

      // 4. Disconnect via AbortController
      ac.abort();

      // Give event loop tick for abort listener to execute
      await new Promise((r) => setTimeout(r, 10));

      // Verify listener count returned to 0 (NO ZOMBIE LISTENERS)
      const finalListeners = (chatEventBus as any).emitter.listenerCount(channel);
      expect(finalListeners).toBe(0);
    });

    it('13. Disconnect via ReadableStream.cancel() cleans up listener and heartbeat timer', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');
      const channel = `chat:${conv.id}`;

      const req = new NextRequest(`http://localhost:3000/api/chat/stream?conversationId=${conv.id}`, {
        headers: { cookie: `alhiwar_session=${signSessionToken('user-seeker-stress-1')}` },
      });
      const res = await streamRoute(req);
      const reader = res.body?.getReader();
      expect(reader).toBeDefined();
      if (!reader) return;

      expect((chatEventBus as any).emitter.listenerCount(channel)).toBe(1);

      // Read initial handshake
      await readSseStreamUntil(reader, 'event: connected');

      // Cancel reader directly
      await reader.cancel();

      await new Promise((r) => setTimeout(r, 10));

      expect((chatEventBus as any).emitter.listenerCount(channel)).toBe(0);
    });

    it('14. Rapid Reconnect Stress Test (50 cycles): zero listener accumulation / zero memory leak', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');
      const channel = `chat:${conv.id}`;

      expect((chatEventBus as any).emitter.listenerCount(channel)).toBe(0);

      // Perform 50 rapid connect-disconnect cycles
      for (let i = 0; i < 50; i++) {
        const ac = new AbortController();
        const req = new NextRequest(`http://localhost:3000/api/chat/stream?conversationId=${conv.id}`, {
          headers: { cookie: `alhiwar_session=${signSessionToken('user-seeker-stress-1')}` },
          signal: ac.signal,
        });

        const res = await streamRoute(req);
        expect((chatEventBus as any).emitter.listenerCount(channel)).toBe(1);

        const reader = res.body?.getReader();
        if (reader) {
          await readSseStreamUntil(reader, 'event: connected');
        }

        // Abort to simulate disconnect
        ac.abort();
        await new Promise((r) => setTimeout(r, 2));

        // Listener must be removed immediately
        expect((chatEventBus as any).emitter.listenerCount(channel)).toBe(0);
      }

      // After 50 cycles, listener count must be exactly 0
      expect((chatEventBus as any).emitter.listenerCount(channel)).toBe(0);
    });

    it('15. Concurrent Multi-Client Fan-Out: 5 simultaneous clients receive messages; bulk teardown returns listener count to 0', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');
      const channel = `chat:${conv.id}`;

      const clientControllers: AbortController[] = [];
      const clientReaders: ReadableStreamDefaultReader<Uint8Array>[] = [];

      // Connect 5 clients (e.g. Seeker, Dialogist, 3 Supervisor monitors)
      for (let i = 0; i < 5; i++) {
        const ac = new AbortController();
        clientControllers.push(ac);
        const req = new NextRequest(`http://localhost:3000/api/chat/stream?conversationId=${conv.id}`, {
          headers: { cookie: `alhiwar_session=${signSessionToken('user-seeker-stress-1')}` },
          signal: ac.signal,
        });
        const res = await streamRoute(req);
        const reader = res.body?.getReader();
        if (reader) {
          clientReaders.push(reader);
          await readSseStreamUntil(reader, 'event: connected');
        }
      }

      expect((chatEventBus as any).emitter.listenerCount(channel)).toBe(5);

      // Publish a message via chatService
      await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-seeker-stress-1',
        content: 'Broadcast message to 5 clients',
      });

      // Verify all 5 readers received the message
      const readPromises = clientReaders.map((r) =>
        readSseStreamUntil(r, 'Broadcast message to 5 clients')
      );
      const receivedChunks = await Promise.all(readPromises);
      for (const chunk of receivedChunks) {
        expect(chunk).toContain('Broadcast message to 5 clients');
      }

      // Disconnect first 3 clients
      for (let i = 0; i < 3; i++) {
        clientControllers[i].abort();
      }
      await new Promise((r) => setTimeout(r, 10));
      expect((chatEventBus as any).emitter.listenerCount(channel)).toBe(2);

      // Disconnect remaining 2 clients
      for (let i = 3; i < 5; i++) {
        clientControllers[i].abort();
      }
      await new Promise((r) => setTimeout(r, 10));
      expect((chatEventBus as any).emitter.listenerCount(channel)).toBe(0);
    });

    it('16. Reconnecting client replays message history and replayed inactivity notice', async () => {
      const conv = await chatService.initiateConsultation('user-seeker-stress-1', 'LEARN_ABOUT_ISLAM', 'en');

      // Send 2 messages
      await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-seeker-stress-1',
        content: 'History message 1',
      });
      await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'user-seeker-stress-1',
        content: 'History message 2',
      });

      // Trigger inactivity notice
      await chatService.checkInactivityTimeout(conv.id, 120);

      // New client connects without lastEventId
      const ac = new AbortController();
      const req = new NextRequest(`http://localhost:3000/api/chat/stream?conversationId=${conv.id}`, {
        headers: { cookie: `alhiwar_session=${signSessionToken('user-seeker-stress-1')}` },
        signal: ac.signal,
      });

      const res = await streamRoute(req);
      const reader = res.body?.getReader();
      expect(reader).toBeDefined();
      if (!reader) return;

      const initialReplay = await readSseStreamUntil(reader, 'event: inactivity_warning');
      expect(initialReplay).toContain('event: connected');
      expect(initialReplay).toContain('History message 1');
      expect(initialReplay).toContain('History message 2');
      expect(initialReplay).toContain('event: message');
      expect(initialReplay).toContain('event: inactivity_warning');

      ac.abort();
      await new Promise((r) => setTimeout(r, 10));
      expect((chatEventBus as any).emitter.listenerCount(`chat:${conv.id}`)).toBe(0);
    });

    it('17. SSE stream rejects missing conversationId (400) or non-existent conversation (404)', async () => {
      const authHeaders = { cookie: `alhiwar_session=${signSessionToken('user-seeker-stress-1')}` };
      // Missing conversationId
      const reqMissing = new NextRequest('http://localhost:3000/api/chat/stream', {
        headers: authHeaders,
      });
      const resMissing = await streamRoute(reqMissing);
      expect(resMissing.status).toBe(400);

      // Non-existent conversation
      const reqNotFound = new NextRequest('http://localhost:3000/api/chat/stream?conversationId=non-existent', {
        headers: authHeaders,
      });
      const resNotFound = await streamRoute(reqNotFound);
      expect(resNotFound.status).toBe(404);
    });
  });
});
