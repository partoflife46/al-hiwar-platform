import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '@/lib/db/in-memory-adapter';
import { authService } from '@/lib/services/auth-service';
import { getSessionFromRequest } from '@/lib/security/rbac';
import { signSessionToken, verifySessionToken } from '@/lib/security/session-token';
import { GET as staffGet, POST as staffPost } from '@/app/api/staff/route';
import { GET as messagesGet, POST as messagesPost } from '@/app/api/chat/messages/route';
import { GET as streamGet } from '@/app/api/chat/stream/route';
import { GET as queueGet } from '@/app/api/chat/queue/route';
import { GET as initiateGet, POST as initiatePost } from '@/app/api/chat/initiate/route';
import { POST as claimPost } from '@/app/api/chat/claim/route';
import { GET as reviewGet, POST as reviewPost } from '@/app/api/shahadah/review/route';
import { GET as uploadGet } from '@/app/api/shahadah/upload/route';
import { GET as profileGet, POST as profilePost } from '@/app/api/shahadah/profile/route';
import { GET as academyGet, POST as academyPost } from '@/app/api/academy/route';
import { GET as progressGet, POST as progressPost } from '@/app/api/academy/progress/route';
import { GET as audioGet } from '@/app/audio/[slug]/route';
import { GET as certDownloadGet } from '@/app/api/certificates/[id]/download/route';
import { POST as forgotPasswordPost } from '@/app/api/auth/forgot-password/route';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as uploadPost } from '@/app/api/shahadah/upload/route';
import { PUT as profilePut } from '@/app/api/user/profile/route';
import { GET as resourcesGet } from '@/app/api/resources/route';
import { POST as staffUploadPost } from '@/app/api/staff/upload/route';

describe('P0 Security Hardening Regression Suite', () => {
  const seeker1Id = 'user-seeker-1';
  const seeker2Id = 'user-seeker-p0-other';
  const dialogistId = 'user-dialogist-1';
  const adminId = 'user-admin-1';
  const conv1Id = 'conv-demo-1';

  beforeEach(() => {
    db.reset();
    if (!db.findUserById(seeker2Id)) {
      db.users.push({
        id: seeker2Id,
        email: 'other-seeker@example.com',
        passwordHash: 'hash',
        firstName: 'Other',
        surname: 'Seeker',
        dateOfBirth: '1994-01-01',
        role: 'NON_MUSLIM',
        status: 'ACTIVE',
        preferredLanguage: 'en',
        emailVerified: true,
        verificationOtp: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('1. HMAC-SHA256 Signed Session Cookies', () => {
    it('rejects unsigned or forged alhiwar_session tokens in rbac and authService', async () => {
      const forgedTokens = [
        `alhiwar_${adminId}_99999999`,
        `alhiwar_${adminId}_123456.${'0'.repeat(64)}`,
        `${signSessionToken(seeker1Id).replace(seeker1Id, adminId)}`,
        'alhiwar_user-admin-1',
      ];

      for (const forged of forgedTokens) {
        expect(verifySessionToken(forged)).toBeNull();
        expect(await authService.validateSession(forged)).toBeNull();

        const req = new NextRequest('http://localhost:3000/api/staff', {
          headers: { cookie: `alhiwar_session=${forged}` },
        });
        expect(getSessionFromRequest(req)).toBeNull();
      }

      const validAdminToken = signSessionToken(adminId);
      expect(verifySessionToken(validAdminToken)).toBe(adminId);
      const validSession = await authService.validateSession(validAdminToken);
      expect(validSession?.userId).toBe(adminId);
      expect(validSession?.role).toBe('ADMINISTRATOR');
    });
  });

  describe('2. Strict requireAuth() and Conversation/Resource Ownership Enforcement', () => {
    it('returns 401 when unauthenticated across all protected endpoints', async () => {
      const checks = [
        messagesGet(new NextRequest(`http://localhost:3000/api/chat/messages?conversationId=${conv1Id}`)),
        messagesPost(
          new NextRequest('http://localhost:3000/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId: conv1Id, senderId: seeker1Id, content: 'hi' }),
          })
        ),
        streamGet(new NextRequest(`http://localhost:3000/api/chat/stream?conversationId=${conv1Id}`)),
        queueGet(new NextRequest('http://localhost:3000/api/chat/queue')),
        initiateGet(new NextRequest(`http://localhost:3000/api/chat/initiate?seekerId=${seeker1Id}`)),
        initiatePost(
          new NextRequest('http://localhost:3000/api/chat/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nonMuslimId: seeker1Id, intent: 'LEARN_ABOUT_ISLAM' }),
          })
        ),
        reviewGet(new NextRequest(`http://localhost:3000/api/shahadah/review?conversationId=${conv1Id}`)),
        uploadGet(new NextRequest(`http://localhost:3000/api/shahadah/upload?conversationId=${conv1Id}`)),
        uploadGet(new NextRequest(`http://localhost:3000/api/shahadah/upload?seekerId=${seeker1Id}`)),
        profileGet(new NextRequest(`http://localhost:3000/api/shahadah/profile?seekerId=${seeker1Id}`)),
        profilePost(
          new NextRequest('http://localhost:3000/api/shahadah/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              seekerId: seeker1Id,
              nationality: 'Canada',
              gender: 'MALE',
              phoneNumber: '+14165550100',
            }),
          })
        ),
        academyGet(new NextRequest(`http://localhost:3000/api/academy?type=progress&userId=${seeker1Id}`)),
        academyPost(
          new NextRequest('http://localhost:3000/api/academy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SUBMIT_QUIZ', userId: seeker1Id, lessonNumber: 1, answers: {} }),
          })
        ),
        progressGet(new NextRequest(`http://localhost:3000/api/academy/progress?userId=${seeker1Id}`)),
        progressPost(
          new NextRequest('http://localhost:3000/api/academy/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: seeker1Id, mode: 'PASS_ALL_AND_GRADUATE' }),
          })
        ),
        audioGet(new NextRequest('http://localhost:3000/audio/private-recording-123.wav'), {
          params: Promise.resolve({ slug: 'private-recording-123.wav' }),
        }),
      ];

      const responses = await Promise.all(checks);
      for (const res of responses) {
        expect(res.status).toBe(401);
      }

      // SEC-11: Public educational audio in public/audio/ is accessible without authentication
      const publicAudioRes = await audioGet(
        new NextRequest('http://localhost:3000/audio/sample-shahadah-jean-luc.wav'),
        { params: Promise.resolve({ slug: 'sample-shahadah-jean-luc.wav' }) }
      );
      expect(publicAudioRes.status).toBe(200);

      // Public certificate verification endpoint remains accessible
      const certRes = await academyGet(
        new NextRequest('http://localhost:3000/api/academy?type=certificate&certificateId=cert-graduate-1')
      );
      expect(certRes.status).toBe(200);
    });

    it('returns 403 on horizontal cross-user IDOR attempts while allowing owner & staff', async () => {
      const otherCookie = { cookie: `alhiwar_session=${signSessionToken(seeker2Id)}` };
      const ownerCookie = { cookie: `alhiwar_session=${signSessionToken(seeker1Id)}` };
      const staffCookie = { cookie: `alhiwar_session=${signSessionToken(dialogistId)}` };

      // Other seeker cannot read seeker1's messages, stream, review, upload, profile, initiate, or academy
      expect((await messagesGet(new NextRequest(`http://localhost:3000/api/chat/messages?conversationId=${conv1Id}`, { headers: otherCookie }))).status).toBe(403);
      expect((await streamGet(new NextRequest(`http://localhost:3000/api/chat/stream?conversationId=${conv1Id}`, { headers: otherCookie }))).status).toBe(403);
      expect((await queueGet(new NextRequest('http://localhost:3000/api/chat/queue', { headers: otherCookie }))).status).toBe(403);
      expect((await initiateGet(new NextRequest(`http://localhost:3000/api/chat/initiate?seekerId=${seeker1Id}`, { headers: otherCookie }))).status).toBe(403);
      expect((await reviewGet(new NextRequest(`http://localhost:3000/api/shahadah/review?conversationId=${conv1Id}`, { headers: otherCookie }))).status).toBe(403);
      expect((await uploadGet(new NextRequest(`http://localhost:3000/api/shahadah/upload?conversationId=${conv1Id}`, { headers: otherCookie }))).status).toBe(403);
      expect((await uploadGet(new NextRequest(`http://localhost:3000/api/shahadah/upload?seekerId=${seeker1Id}`, { headers: otherCookie }))).status).toBe(403);
      expect((await profileGet(new NextRequest(`http://localhost:3000/api/shahadah/profile?seekerId=${seeker1Id}`, { headers: otherCookie }))).status).toBe(403);
      expect((await academyGet(new NextRequest(`http://localhost:3000/api/academy?type=progress&userId=${seeker1Id}`, { headers: otherCookie }))).status).toBe(403);
      expect((await progressGet(new NextRequest(`http://localhost:3000/api/academy/progress?userId=${seeker1Id}`, { headers: otherCookie }))).status).toBe(403);

      // Owner & staff are permitted
      expect((await messagesGet(new NextRequest(`http://localhost:3000/api/chat/messages?conversationId=${conv1Id}`, { headers: ownerCookie }))).status).toBe(200);
      expect((await messagesGet(new NextRequest(`http://localhost:3000/api/chat/messages?conversationId=${conv1Id}`, { headers: staffCookie }))).status).toBe(200);
      expect((await queueGet(new NextRequest('http://localhost:3000/api/chat/queue', { headers: staffCookie }))).status).toBe(200);
    });

    it('protects private .data/audio recordings from non-owners with HTTP 403', async () => {
      const runtimeAudioDir = path.join(process.cwd(), '.data', 'audio');
      const testSlug = `p0-test-private-${Date.now()}.wav`;
      const testFile = path.join(runtimeAudioDir, testSlug);
      fs.mkdirSync(runtimeAudioDir, { recursive: true });
      fs.writeFileSync(testFile, Buffer.from('RIFFtestaudio'));

      try {
        db.shahadahSubmissions.push({
          id: 'sub-private-audio-test',
          conversationId: conv1Id,
          nonMuslimId: seeker1Id,
          dialogistId,
          audioRecordingUrl: `/audio/${testSlug}`,
          mimeType: 'audio/wav',
          durationSeconds: 10,
          status: 'PENDING_REVIEW',
          attemptNumber: 1,
          submittedAt: new Date().toISOString(),
        });

        const otherRes = await audioGet(
          new NextRequest(`http://localhost:3000/audio/${testSlug}`, {
            headers: { cookie: `alhiwar_session=${signSessionToken(seeker2Id)}` },
          }),
          { params: Promise.resolve({ slug: testSlug }) }
        );
        expect(otherRes.status).toBe(403);

        const ownerRes = await audioGet(
          new NextRequest(`http://localhost:3000/audio/${testSlug}`, {
            headers: { cookie: `alhiwar_session=${signSessionToken(seeker1Id)}` },
          }),
          { params: Promise.resolve({ slug: testSlug }) }
        );
        expect(ownerRes.status).toBe(200);
        expect(ownerRes.headers.get('Cache-Control')).toBe('private, no-store');

        const staffRes = await audioGet(
          new NextRequest(`http://localhost:3000/audio/${testSlug}`, {
            headers: { cookie: `alhiwar_session=${signSessionToken(dialogistId)}` },
          }),
          { params: Promise.resolve({ slug: testSlug }) }
        );
        expect(staffRes.status).toBe(200);
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
  });

  describe('3. Non-Test Production Restrictions (No dialogistId Fallback, No SHORTCUT)', () => {
    it('rejects unauthenticated body.dialogistId spoofing on /api/chat/claim & /api/shahadah/review when NODE_ENV !== test', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const claimRes = await claimPost(
        new NextRequest('http://localhost:3000/api/chat/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dialogistId, conversationId: conv1Id }),
        })
      );
      expect(claimRes.status).toBe(401);

      const reviewRes = await reviewPost(
        new NextRequest('http://localhost:3000/api/shahadah/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dialogistId, submissionId: 'sub-any', decision: 'VALIDATE' }),
        })
      );
      expect(reviewRes.status).toBe(401);
    });

    it('rejects SHORTCUT / PASS_ALL_AND_GRADUATE with 403 when NODE_ENV !== test', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const headers = {
        'Content-Type': 'application/json',
        cookie: `alhiwar_session=${signSessionToken(seeker1Id)}`,
      };

      const acRes = await academyPost(
        new NextRequest('http://localhost:3000/api/academy', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'SHORTCUT', mode: 'PASS_ALL_AND_GRADUATE' }),
        })
      );
      expect(acRes.status).toBe(403);

      const progRes = await progressPost(
        new NextRequest('http://localhost:3000/api/academy/progress', {
          method: 'POST',
          headers,
          body: JSON.stringify({ mode: 'PASS_ALL_AND_GRADUATE' }),
        })
      );
      expect(progRes.status).toBe(403);
    });
  });

  describe('4. Staff API Sensitive Field Sanitization', () => {
    it('never leaks passwordHash, verificationOtp, or otpHash in CREATE_USER & UPDATE_USER responses', async () => {
      const adminHeaders = {
        'Content-Type': 'application/json',
        cookie: `alhiwar_session=${signSessionToken(adminId)}`,
      };

      const createRes = await staffPost(
        new NextRequest('http://localhost:3000/api/staff', {
          method: 'POST',
          headers: adminHeaders,
          body: JSON.stringify({
            action: 'CREATE_USER',
            firstName: 'Test',
            surname: 'Member',
            email: 'p0-sanitized@example.com',
            role: 'NON_MUSLIM',
            password: 'strongpassword123',
          }),
        })
      );
      expect(createRes.status).toBe(200);
      const createJson = await createRes.json();
      expect(createJson.ok).toBe(true);
      expect(createJson.data).not.toHaveProperty('passwordHash');
      expect(createJson.data).not.toHaveProperty('verificationOtp');
      expect(createJson.data).not.toHaveProperty('otpHash');

      const updateRes = await staffPost(
        new NextRequest('http://localhost:3000/api/staff', {
          method: 'POST',
          headers: adminHeaders,
          body: JSON.stringify({
            action: 'UPDATE_USER',
            userId: createJson.data.id,
            firstName: 'Updated',
            surname: 'Member',
            email: 'p0-sanitized@example.com',
            role: 'NON_MUSLIM',
            status: 'ACTIVE',
          }),
        })
      );
      expect(updateRes.status).toBe(200);
      const updateJson = await updateRes.json();
      expect(updateJson.ok).toBe(true);
      expect(updateJson.data).not.toHaveProperty('passwordHash');
      expect(updateJson.data).not.toHaveProperty('verificationOtp');
      expect(updateJson.data).not.toHaveProperty('otpHash');
    });
  });

  describe('6. Role-Based Staff Data Isolation & Conversation Privacy (FR 76 & FR 78)', () => {
    const dialogist2Id = 'user-dialogist-2';
    const instructorId = 'user-instructor-1';
    const supervisorId = 'user-supervisor-1';

    beforeEach(() => {
      // Ensure dialogist-2 exists
      if (!db.findUserById(dialogist2Id)) {
        db.users.push({
          id: dialogist2Id,
          email: 'dialogist2@alhiwar.org',
          passwordHash: 'hash',
          firstName: 'Second',
          surname: 'Dialogist',
          dateOfBirth: '1990-01-01',
          role: 'DIALOGIST',
          status: 'ACTIVE',
          preferredLanguage: 'en',
          emailVerified: true,
          verificationOtp: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    it('FR 76 & 78: Dialogist receives strictly filtered data in GET /api/staff', async () => {
      const dialogist1Cookie = { cookie: `alhiwar_session=${signSessionToken(dialogistId)}` };

      const res = await staffGet(
        new NextRequest('http://localhost:3000/api/staff', { headers: dialogist1Cookie })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);

      // FR 78: User profiles, progress, certificates, shahadah submissions must NOT be exposed to Dialogist
      expect(json.data.allUsers).toEqual([]);
      expect(json.data.shahadahSubmissions).toEqual([]);
      expect(json.data.studentProgress).toEqual([]);
      expect(json.data.certificates).toEqual([]);
      expect(json.data.allLessons).toEqual([]);

      // FR 76: Conversations in allConversations must only belong to dialogistId or be in unanswered queue
      const otherAssigned = json.data.allConversations.some(
        (c: any) => c.isAssigned && c.dialogistId && c.dialogistId !== dialogistId
      );
      expect(otherAssigned).toBe(false);
    });

    it('FR 76 & 78: Instructor receives curriculum only and is blocked from user data and conversations', async () => {
      const instructorCookie = { cookie: `alhiwar_session=${signSessionToken(instructorId)}` };

      const res = await staffGet(
        new NextRequest('http://localhost:3000/api/staff', { headers: instructorCookie })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);

      // Instructor has curriculum access
      expect(Array.isArray(json.data.allLessons)).toBe(true);
      expect(json.data.allLessons.length).toBeGreaterThan(0);

      // Blocked from all private data
      expect(json.data.allConversations).toEqual([]);
      expect(json.data.allUsers).toEqual([]);
      expect(json.data.shahadahSubmissions).toEqual([]);
      expect(json.data.studentProgress).toEqual([]);
      expect(json.data.certificates).toEqual([]);
    });

    it('FR 76: Dialogist cannot access messages of another dialogist assigned conversation', async () => {
      // conv1Id is assigned to dialogistId (user-dialogist-1)
      const conv = db.conversations.find((c) => c.id === conv1Id);
      expect(conv?.dialogistId).toBe(dialogistId);

      // Dialogist 2 tries to read conv1's messages
      const dialogist2Cookie = { cookie: `alhiwar_session=${signSessionToken(dialogist2Id)}` };
      const d2Res = await messagesGet(
        new NextRequest(`http://localhost:3000/api/chat/messages?conversationId=${conv1Id}`, {
          headers: dialogist2Cookie,
        })
      );
      expect(d2Res.status).toBe(403);

      // Instructor tries to read conv1's messages
      const instructorCookie = { cookie: `alhiwar_session=${signSessionToken(instructorId)}` };
      const instRes = await messagesGet(
        new NextRequest(`http://localhost:3000/api/chat/messages?conversationId=${conv1Id}`, {
          headers: instructorCookie,
        })
      );
      expect(instRes.status).toBe(403);

      // Assigned Dialogist 1 can read
      const dialogist1Cookie = { cookie: `alhiwar_session=${signSessionToken(dialogistId)}` };
      const d1Res = await messagesGet(
        new NextRequest(`http://localhost:3000/api/chat/messages?conversationId=${conv1Id}`, {
          headers: dialogist1Cookie,
        })
      );
      expect(d1Res.status).toBe(200);

      // Supervisor can audit
      const supervisorCookie = { cookie: `alhiwar_session=${signSessionToken(supervisorId)}` };
      const supRes = await messagesGet(
        new NextRequest(`http://localhost:3000/api/chat/messages?conversationId=${conv1Id}`, {
          headers: supervisorCookie,
        })
      );
      expect(supRes.status).toBe(200);
    });
  });

  describe('7. Additional Hardened Security Boundaries (SEC-01 to SEC-13)', () => {
    it('SEC-03: Certificate Download Route blocks unauthenticated (401) and IDOR non-owners (403)', async () => {
      // 1. Unauthenticated -> 401
      const unauthRes = await certDownloadGet(
        new NextRequest('http://localhost:3000/api/certificates/cert-graduate-1/download'),
        { params: Promise.resolve({ id: 'cert-graduate-1' }) }
      );
      expect(unauthRes.status).toBe(401);

      // 2. Other user -> 403
      const otherCookie = { cookie: `alhiwar_session=${signSessionToken(seeker2Id)}` };
      const idorRes = await certDownloadGet(
        new NextRequest('http://localhost:3000/api/certificates/cert-graduate-1/download', {
          headers: otherCookie,
        }),
        { params: Promise.resolve({ id: 'cert-graduate-1' }) }
      );
      expect(idorRes.status).toBe(403);

      // 3. Supervisor -> 200
      const supervisorCookie = { cookie: `alhiwar_session=${signSessionToken('user-supervisor-1')}` };
      const supRes = await certDownloadGet(
        new NextRequest('http://localhost:3000/api/certificates/cert-graduate-1/download', {
          headers: supervisorCookie,
        }),
        { params: Promise.resolve({ id: 'cert-graduate-1' }) }
      );
      expect(supRes.status).toBe(200);
      expect(supRes.headers.get('Content-Type')).toBe('application/pdf');
    });

    it('SEC-04: Forgot Password resists malicious Host header injection', async () => {
      const evilHostReq = new NextRequest('http://evil-attacker.com/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: 'evil-attacker.com',
        },
        body: JSON.stringify({ email: 'seeker@example.com' }),
      });
      const res = await forgotPasswordPost(evilHostReq);
      expect(res.status).toBe(200);
      const user = db.findUserByEmail('seeker@example.com');
      expect(user?.passwordResetTokenHash).toBeDefined();
    });

    it('SEC-05 & SEC-06: Unified login credential error message prevents user enumeration', async () => {
      const nonExistentReq = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'non-existent-user@example.com', password: 'Password123!' }),
      });
      const wrongPassReq = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'seeker1@example.com', password: 'WrongPassword123!' }),
      });

      const res1 = await loginPost(nonExistentReq);
      const res2 = await loginPost(wrongPassReq);

      expect(res1.status).toBe(401);
      expect(res2.status).toBe(401);

      const json1 = await res1.json();
      const json2 = await res2.json();
      expect(json1.error).toBe('INVALID_CREDENTIALS');
      expect(json2.error).toBe('INVALID_CREDENTIALS');
      expect(json1.message).toBe(json2.message);
    });

    it('SEC-09: Audio upload route rejects oversized payloads >15MB with HTTP 413', async () => {
      const seekerCookie = { cookie: `alhiwar_session=${signSessionToken(seeker1Id)}` };
      // >20MB string (~15MB decoded)
      const oversizedAudio = 'A'.repeat(21 * 1024 * 1024);

      const req = new NextRequest('http://localhost:3000/api/shahadah/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...seekerCookie,
        },
        body: JSON.stringify({
          seekerId: seeker1Id,
          conversationId: conv1Id,
          audioData: oversizedAudio,
        }),
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('SEC-10: Chat message length >4000 characters is rejected with HTTP 400', async () => {
      const seekerCookie = { cookie: `alhiwar_session=${signSessionToken(seeker1Id)}` };
      const longMessage = 'x'.repeat(4001);

      const req = new NextRequest('http://localhost:3000/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...seekerCookie,
        },
        body: JSON.stringify({
          conversationId: conv1Id,
          content: longMessage,
        }),
      });

      const res = await messagesPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('MESSAGE_TOO_LONG');
    });

    it('SEC-12: Profile password change requires currentPassword verification', async () => {
      const seekerCookie = { cookie: `alhiwar_session=${signSessionToken(seeker1Id)}` };

      // 1. Missing current password
      const noCurrentPassReq = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...seekerCookie,
        },
        body: JSON.stringify({
          password: 'NewStrongPassword123!',
        }),
      });
      const res1 = await profilePut(noCurrentPassReq);
      expect(res1.status).toBe(400);
      const json1 = await res1.json();
      expect(json1.error).toBe('CURRENT_PASSWORD_REQUIRED');

      // 2. Wrong current password
      const wrongCurrentPassReq = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...seekerCookie,
        },
        body: JSON.stringify({
          currentPassword: 'WrongPassword!',
          password: 'NewStrongPassword123!',
        }),
      });
      const res2 = await profilePut(wrongCurrentPassReq);
      expect(res2.status).toBe(400);
      const json2 = await res2.json();
      expect(json2.error).toBe('INVALID_CURRENT_PASSWORD');
    });
  });

  describe('8. Audit Read-Only Enforcement for ADMINISTRATOR and SUPERVISOR (FR 75, FR 76, 05-BSD §3)', () => {
    const supervisorId = 'user-supervisor-1';
    const adminId = 'user-admin-1';
    const dialogistId = 'user-dialogist-1';
    const testConvId = 'conv-audit-readonly-test';

    beforeEach(async () => {
      const existing = db.conversations.find((c) => c.id === testConvId);
      if (!existing) {
        db.conversations.push({
          id: testConvId,
          nonMuslimId: 'user-seeker-1',
          dialogistId,
          intent: 'LEARN_ABOUT_ISLAM',
          language: 'en',
          status: 'ACTIVE',
          isAssigned: true,
          inactivityNoticeSent: false,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        });
      }
    });

    it('rejects POST /api/chat/messages from ADMINISTRATOR and SUPERVISOR with HTTP 403', async () => {
      for (const roleId of [adminId, supervisorId]) {
        const cookie = { cookie: `alhiwar_session=${signSessionToken(roleId)}` };
        const req = new NextRequest('http://localhost:3000/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...cookie,
          },
          body: JSON.stringify({
            conversationId: testConvId,
            senderId: roleId,
            content: 'Audit user attempting to send message',
          }),
        });

        const res = await messagesPost(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.ok).toBe(false);
        expect(json.error).toBe('UNAUTHORIZED_SENDER');
        expect(json.message).toContain('not authorized to send messages');
      }
    });

    it('rejects POST /api/chat/claim from ADMINISTRATOR and SUPERVISOR with HTTP 403', async () => {
      const queuedConvId = 'conv-queued-for-claim-audit';
      db.conversations.push({
        id: queuedConvId,
        nonMuslimId: 'user-seeker-1',
        dialogistId: null,
        intent: 'LEARN_ABOUT_ISLAM',
        language: 'en',
        status: 'QUEUED',
        isAssigned: false,
        inactivityNoticeSent: false,
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      });

      for (const roleId of [adminId, supervisorId]) {
        const cookie = { cookie: `alhiwar_session=${signSessionToken(roleId)}` };
        const req = new NextRequest('http://localhost:3000/api/chat/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...cookie,
          },
          body: JSON.stringify({
            conversationId: queuedConvId,
          }),
        });

        const res = await claimPost(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.ok).toBe(false);
        expect(json.error).toBe('UNAUTHORIZED_SENDER');
        expect(json.message).toContain('Only qualified dialogists can claim conversations');
      }
    });

    it('allows GET /api/chat/messages and GET /api/chat/stream for ADMINISTRATOR and SUPERVISOR for audit', async () => {
      for (const roleId of [adminId, supervisorId]) {
        const cookie = { cookie: `alhiwar_session=${signSessionToken(roleId)}` };

        // 1. GET messages
        const getMsgReq = new NextRequest(`http://localhost:3000/api/chat/messages?conversationId=${testConvId}`, {
          headers: cookie,
        });
        const msgRes = await messagesGet(getMsgReq);
        expect(msgRes.status).toBe(200);
        const msgJson = await msgRes.json();
        expect(msgJson.ok).toBe(true);
        expect(Array.isArray(msgJson.data)).toBe(true);

        // 2. GET stream
        const streamReq = new NextRequest(`http://localhost:3000/api/chat/stream?conversationId=${testConvId}`, {
          headers: cookie,
        });
        const streamRes = await streamGet(streamReq);
        expect(streamRes.status).toBe(200);
        expect(streamRes.headers.get('Content-Type')).toContain('text/event-stream');
      }
    });
  });

  describe('9. FR 68: Public Resource Deletion by Administrator & Non-Admin Rejection', () => {
    const adminId = 'user-admin-1';
    const supervisorId = 'user-supervisor-1';
    const instructorId = 'user-instructor-1';
    const dialogistId = 'user-dialogist-1';
    const testResourceId = 'res-to-delete-fr68';

    beforeEach(() => {
      if (!db.islamicResources.some((r) => r.id === testResourceId)) {
        db.islamicResources.push({
          id: testResourceId,
          category: 'ETHICS',
          titleEn: 'Temporary Ethics Guide to Delete',
          titleFr: 'Guide temporaire d éthique à supprimer',
          descriptionEn: 'Test resource destined for administrative deletion.',
          descriptionFr: 'Ressource de test destinée à la suppression administrative.',
          resourceType: 'PDF',
          mediaUrl: '/resources/temp-ethics.pdf',
          uploadedByAdminId: adminId,
          isPublic: true,
          createdAt: new Date().toISOString(),
        });
      }
    });

    it('rejects POST /api/staff DELETE_RESOURCE by non-admin roles with HTTP 403 FORBIDDEN', async () => {
      for (const nonAdminId of [supervisorId, instructorId, dialogistId]) {
        const cookie = { cookie: `alhiwar_session=${signSessionToken(nonAdminId)}` };
        const req = new NextRequest('http://localhost:3000/api/staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...cookie,
          },
          body: JSON.stringify({
            action: 'DELETE_RESOURCE',
            resourceId: testResourceId,
          }),
        });

        const res = await staffPost(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.ok).toBe(false);
        expect(json.error).toBe('FORBIDDEN');
        expect(json.message).toContain('Only Administrators may delete public Islamic resources.');
      }

      // Verify the resource is still in the database
      expect(db.islamicResources.some((r) => r.id === testResourceId)).toBe(true);
    });

    it('allows POST /api/staff DELETE_RESOURCE by ADMINISTRATOR (HTTP 200) and resource is removed from GET /api/resources', async () => {
      // 1. Verify resource currently appears in public GET /api/resources
      const initialGetReq = new NextRequest('http://localhost:3000/api/resources');
      const initialGetRes = await resourcesGet(initialGetReq);
      expect(initialGetRes.status).toBe(200);
      const initialGetJson = await initialGetRes.json();
      expect(initialGetJson.ok).toBe(true);
      expect(initialGetJson.data.some((r: any) => r.id === testResourceId)).toBe(true);

      // 2. Administrator executes DELETE_RESOURCE
      const adminCookie = { cookie: `alhiwar_session=${signSessionToken(adminId)}` };
      const deleteReq = new NextRequest('http://localhost:3000/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminCookie,
        },
        body: JSON.stringify({
          action: 'DELETE_RESOURCE',
          resourceId: testResourceId,
        }),
      });

      const deleteRes = await staffPost(deleteReq);
      expect(deleteRes.status).toBe(200);
      const deleteJson = await deleteRes.json();
      expect(deleteJson.ok).toBe(true);
      expect(deleteJson.message).toBe('Resource deleted successfully');

      // 3. Verify resource is now absent from public GET /api/resources
      const afterGetReq = new NextRequest('http://localhost:3000/api/resources');
      const afterGetRes = await resourcesGet(afterGetReq);
      expect(afterGetRes.status).toBe(200);
      const afterGetJson = await afterGetRes.json();
      expect(afterGetJson.ok).toBe(true);
      expect(afterGetJson.data.some((r: any) => r.id === testResourceId)).toBe(false);
    });
  });

  describe('10. FR 68: Public Resource Updating by Administrator & Non-Admin Rejection', () => {
    const adminId = 'user-admin-1';
    const supervisorId = 'user-supervisor-1';
    const instructorId = 'user-instructor-1';
    const dialogistId = 'user-dialogist-1';
    const testResourceId = 'res-to-update-fr68';

    beforeEach(() => {
      const existing = db.islamicResources.find((r) => r.id === testResourceId);
      if (existing) {
        existing.titleEn = 'Original Ethics Monograph';
        existing.titleFr = 'Monographie d éthique originale';
        existing.category = 'ETHICS';
        existing.resourceType = 'TEXT';
        existing.mediaUrl = '/resources/original-ethics.txt';
      } else {
        db.islamicResources.push({
          id: testResourceId,
          category: 'ETHICS',
          titleEn: 'Original Ethics Monograph',
          titleFr: 'Monographie d éthique originale',
          descriptionEn: 'Original description of ethics.',
          descriptionFr: 'Description originale d éthique.',
          resourceType: 'TEXT',
          mediaUrl: '/resources/original-ethics.txt',
          uploadedByAdminId: adminId,
          isPublic: true,
          createdAt: new Date().toISOString(),
        });
      }
    });

    it('rejects POST /api/staff UPDATE_RESOURCE by non-admin roles with HTTP 403 FORBIDDEN', async () => {
      for (const nonAdminId of [supervisorId, instructorId, dialogistId]) {
        const cookie = { cookie: `alhiwar_session=${signSessionToken(nonAdminId)}` };
        const req = new NextRequest('http://localhost:3000/api/staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...cookie,
          },
          body: JSON.stringify({
            action: 'UPDATE_RESOURCE',
            resourceId: testResourceId,
            titleEn: 'Malicious Hijacked Title',
            mediaUrl: '/resources/malicious.pdf',
          }),
        });

        const res = await staffPost(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.ok).toBe(false);
        expect(json.error).toBe('FORBIDDEN');
        expect(json.message).toContain('Only Administrators may update public Islamic resources.');
      }

      // Verify the resource has not been altered
      const unmodified = db.islamicResources.find((r) => r.id === testResourceId);
      expect(unmodified?.titleEn).toBe('Original Ethics Monograph');
    });

    it('allows POST /api/staff UPDATE_RESOURCE by ADMINISTRATOR (HTTP 200) and new data is reflected in GET /api/resources', async () => {
      const adminCookie = { cookie: `alhiwar_session=${signSessionToken(adminId)}` };
      const updateReq = new NextRequest('http://localhost:3000/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminCookie,
        },
        body: JSON.stringify({
          action: 'UPDATE_RESOURCE',
          resourceId: testResourceId,
          titleEn: 'Updated Noble Quran Monograph',
          titleFr: 'Monographie mise à jour sur le Noble Coran',
          category: 'QURAN',
          resourceType: 'PDF',
          mediaUrl: '/resources/updated-quran-monograph.pdf',
          descriptionEn: 'Updated academic monograph description.',
          descriptionFr: 'Description mise à jour pour la monographie académique.',
        }),
      });

      const updateRes = await staffPost(updateReq);
      expect(updateRes.status).toBe(200);
      const updateJson = await updateRes.json();
      expect(updateJson.ok).toBe(true);
      expect(updateJson.data.titleEn).toBe('Updated Noble Quran Monograph');
      expect(updateJson.data.category).toBe('QURAN');
      expect(updateJson.data.resourceType).toBe('PDF');
      expect(updateJson.data.mediaUrl).toBe('/resources/updated-quran-monograph.pdf');

      // Verify immediate reflection on public GET /api/resources
      const getReq = new NextRequest('http://localhost:3000/api/resources');
      const getRes = await resourcesGet(getReq);
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.ok).toBe(true);

      const found = getJson.data.find((r: any) => r.id === testResourceId);
      expect(found).toBeDefined();
      expect(found.titleEn).toBe('Updated Noble Quran Monograph');
      expect(found.titleFr).toBe('Monographie mise à jour sur le Noble Coran');
      expect(found.category).toBe('QURAN');
      expect(found.resourceType).toBe('PDF');
      expect(found.mediaUrl).toBe('/resources/updated-quran-monograph.pdf');
    });
  });

  describe('Administrator Direct Media Upload Service (POST /api/staff/upload)', () => {
    it('rejects POST /api/staff/upload by unauthenticated request with HTTP 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/staff/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: 'sample.pdf', fileData: 'mock content' }),
      });

      const res = await staffUploadPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('UNAUTHORIZED');
    });

    it('rejects POST /api/staff/upload by non-administrator roles with HTTP 403 FORBIDDEN', async () => {
      for (const nonAdminId of [dialogistId, seeker1Id]) {
        const req = new NextRequest('http://localhost:3000/api/staff/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `alhiwar_session=${signSessionToken(nonAdminId)}`,
          },
          body: JSON.stringify({ fileName: 'sample.pdf', fileData: 'mock content' }),
        });

        const res = await staffUploadPost(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.ok).toBe(false);
        expect(json.error).toBe('FORBIDDEN');
      }
    });

    it('rejects unsupported file extensions with HTTP 400 UNSUPPORTED_FILE_TYPE', async () => {
      const req = new NextRequest('http://localhost:3000/api/staff/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(adminId)}`,
        },
        body: JSON.stringify({ fileName: 'script.exe', fileData: 'binary content' }),
      });

      const res = await staffUploadPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('UNSUPPORTED_FILE_TYPE');
    });

    it('allows valid PDF and audio uploads by ADMINISTRATOR with HTTP 200 and public URL', async () => {
      const req = new NextRequest('http://localhost:3000/api/staff/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `alhiwar_session=${signSessionToken(adminId)}`,
        },
        body: JSON.stringify({
          fileName: 'tafsir-monograph.pdf',
          fileData: '%PDF-1.4 mock content data',
          mimeType: 'application/pdf',
        }),
      });

      const res = await staffUploadPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.url).toMatch(/^\/uploads\/resources\/\d+-tafsir-monograph\.pdf$/);
      expect(json.filename).toContain('tafsir-monograph.pdf');

      // Verify file was physically written to public/uploads/resources
      const filePath = path.join(process.cwd(), 'public', json.url.replace(/^\//, ''));
      expect(fs.existsSync(filePath)).toBe(true);
      // Clean up test file
      fs.unlinkSync(filePath);
    });
  });
});
