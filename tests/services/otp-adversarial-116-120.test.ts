import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import { authService } from '@/lib/services/auth-service';
import { POST as verifyOtpPost } from '@/app/api/auth/verify-otp/route';
import { POST as registerPost } from '@/app/api/auth/register/route';

describe('Adversarial & Regression Verification: Findings #116, #117, #119, #120', () => {
  beforeEach(() => {
    db.reset();
  });

  // =========================================================================
  // FINDING #116: OTP ATTEMPT EXHAUSTION PREVENTION
  // =========================================================================
  describe('Finding #116: OTP Attempt Exhaustion by Third Parties', () => {
    it('Attacker submitting invalid OTPs with only a victim email CANNOT exhaust victim attempt allowance', async () => {
      // 1. Legitimate user registers
      const reg = await authService.registerSeeker({
        firstName: 'Victim',
        surname: 'User',
        email: 'victim@example.com',
        password: 'Password123!',
        dateOfBirth: '1995-01-01',
      });
      expect(reg.ok).toBe(true);
      const pendingUserId = (reg as any).data.pendingUserId;
      const victim = db.findUserById(pendingUserId)!;
      const correctOtp = victim.verificationOtp!;
      expect(victim.otpAttempts || 0).toBe(0);

      // 2. Attacker makes 10 requests using only victim email
      for (let i = 0; i < 10; i++) {
        const attackReq = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'victim@example.com',
            otpCode: '000000',
          }),
        });
        const res = await verifyOtpPost(attackReq);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe('INVALID_OTP');
      }

      // 3. Verify victim's attempts counter was NOT touched / exhausted
      const victimAfterAttack = db.findUserById(pendingUserId)!;
      expect(victimAfterAttack.otpAttempts || 0).toBe(0);

      // 4. Legitimate user verifies with their pendingUserId and correct OTP
      const legitReq = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingUserId,
          otpCode: correctOtp,
        }),
      });
      const legitRes = await verifyOtpPost(legitReq);
      expect(legitRes.status).toBe(200);
      const legitJson = await legitRes.json();
      expect(legitJson.ok).toBe(true);

      const verifiedVictim = db.findUserById(pendingUserId)!;
      expect(verifiedVictim.emailVerified).toBe(true);
      expect(verifiedVictim.status).toBe('ACTIVE');
    });

    it('Invalid OTP submitted with legitimate pendingUserId increments attempts correctly', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Legit',
        surname: 'User',
        email: 'legit@example.com',
        password: 'Password123!',
        dateOfBirth: '1995-01-01',
      });
      const pendingUserId = (reg as any).data.pendingUserId;

      const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingUserId,
          otpCode: '999999',
        }),
      });
      const res = await verifyOtpPost(req);
      expect(res.status).toBe(400);

      const user = db.findUserById(pendingUserId)!;
      expect(user.otpAttempts).toBe(1);
    });
  });

  // =========================================================================
  // FINDING #117: OTP ACCOUNT ENUMERATION PREVENTION
  // =========================================================================
  describe('Finding #117: OTP Account Enumeration', () => {
    it('Returns identical HTTP status and generic error for existing vs non-existing userId', async () => {
      // 1. Existing user with wrong code
      const reg = await authService.registerSeeker({
        firstName: 'Target',
        surname: 'User',
        email: 'target@example.com',
        password: 'Password123!',
        dateOfBirth: '1995-01-01',
      });
      const pendingUserId = (reg as any).data.pendingUserId;

      const reqExisting = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingUserId,
          otpCode: '000000',
        }),
      });
      const resExisting = await verifyOtpPost(reqExisting);
      const jsonExisting = await resExisting.json();

      // 2. Non-existent user
      const reqNonExistent = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-non-existent-id-99999',
          otpCode: '000000',
        }),
      });
      const resNonExistent = await verifyOtpPost(reqNonExistent);
      const jsonNonExistent = await resNonExistent.json();

      // Verify indistinguishable responses
      expect(resExisting.status).toBe(400);
      expect(resNonExistent.status).toBe(400);
      expect(jsonExisting.error).toBe('INVALID_OTP');
      expect(jsonNonExistent.error).toBe('INVALID_OTP');
      expect(jsonExisting.message).toBe(jsonNonExistent.message);
    });
  });

  // =========================================================================
  // FINDING #119: NUMERIC OTP INPUT CRASH & ATTEMPT CONSUMPTION
  // =========================================================================
  describe('Finding #119: Numeric OTP Input Handling', () => {
    it('Rejects numeric OTP {"otp": 123456} with HTTP 400 without crashing (no 500) and without incrementing attempts', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Numeric',
        surname: 'Tester',
        email: 'numeric@example.com',
        password: 'Password123!',
        dateOfBirth: '1995-01-01',
      });
      const pendingUserId = (reg as any).data.pendingUserId;
      const userBefore = db.findUserById(pendingUserId)!;
      expect(userBefore.otpAttempts || 0).toBe(0);

      const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingUserId,
          otp: 123456, // Numeric payload instead of string
        }),
      });

      const res = await verifyOtpPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('INVALID_OTP_FORMAT');

      // Crucial: attempt counter MUST NOT be incremented
      const userAfter = db.findUserById(pendingUserId)!;
      expect(userAfter.otpAttempts || 0).toBe(0);
    });

    it('Rejects null, object, and array OTP with HTTP 400 and preserves attempt counter', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Malformed',
        surname: 'Tester',
        email: 'malformed@example.com',
        password: 'Password123!',
        dateOfBirth: '1995-01-01',
      });
      const pendingUserId = (reg as any).data.pendingUserId;

      const malformedPayloads = [
        { userId: pendingUserId, otp: null },
        { userId: pendingUserId, otp: {} },
        { userId: pendingUserId, otp: [1, 2, 3] },
        { userId: pendingUserId, otp: true },
      ];

      for (const payload of malformedPayloads) {
        const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const res = await verifyOtpPost(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.ok).toBe(false);
      }

      const userAfter = db.findUserById(pendingUserId)!;
      expect(userAfter.otpAttempts || 0).toBe(0);
    });
  });

  // =========================================================================
  // FINDING #120: REGISTRATION OTP SCREEN TRANSITION
  // =========================================================================
  describe('Finding #120: Registration Response & Transition Integrity', () => {
    it('POST /api/auth/register returns 201 with pendingUserId, without leaking raw OTP in response', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Transition',
          surname: 'Tester',
          email: 'transition@example.com',
          password: 'Password123!',
          dateOfBirth: '1995-01-01',
          preferredLanguage: 'en',
        }),
      });

      const res = await registerPost(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.pendingUserId).toBeDefined();
      expect(json.data.pendingUserId).toContain('user-seeker-');
      expect(json.data.email).toBe('transition@example.com');
      // devOtpCode must NOT be exposed
      expect(json.data.devOtpCode).toBeUndefined();
    });
  });

  // =========================================================================
  // FINDINGS #111 & #112: SESSION COOKIE ATTRIBUTES & NO TOKEN LEAK IN JSON
  // =========================================================================
  describe('Findings #111 & #112: Session Security', () => {
    it('Verify-OTP sets HttpOnly cookie for session management', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Cookie',
        surname: 'Security',
        email: 'cookie.sec@example.com',
        password: 'Password123!',
        dateOfBirth: '1995-01-01',
      });
      const pendingUserId = (reg as any).data.pendingUserId;
      const user = db.findUserById(pendingUserId)!;

      const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingUserId,
          otpCode: user.verificationOtp,
        }),
      });

      const res = await verifyOtpPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.userId).toBe(pendingUserId);

      // Finding #112: cookie set with HttpOnly
      const cookie = res.cookies.get('alhiwar_session');
      expect(cookie).toBeDefined();
      expect(cookie?.httpOnly).toBe(true);
    });
  });
});
