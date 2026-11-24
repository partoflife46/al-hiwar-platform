import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db/in-memory-adapter';
import {
  authService,
  calculateAge,
  isAdult,
} from '@/lib/services/auth-service';
import type { UserRole, UserSession } from '@/lib/db/types';
import { POST as demoSwitchPost, GET as demoSwitchGet } from '@/app/api/auth/demo-switch/route';
import { POST as registerPost } from '@/app/api/auth/register/route';
import { POST as verifyOtpPost } from '@/app/api/auth/verify-otp/route';
import { signSessionToken } from '@/lib/security/session-token';

describe('Adversarial Empirical Verification: AuthService & PersonaSwitcher (Milestone 2)', () => {
  beforeEach(() => {
    db.reset();
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SUITE 1: EXACT CALENDAR AGE CALCULATION BOUNDARY (Feature 2)
  // =========================================================================
  describe('Suite 1: Exact Calendar Age Calculation Boundary (17y 364d vs 18y 0d)', () => {
    it('1. Exact 18th birthday passes eligibility (18y 0d); 1 day before fails (17y 364d); 1 day after passes (18y 1d)', () => {
      const refDate = new Date('2026-11-08T00:00:00Z');

      // Exactly 18 years 0 days
      const exact18Dob = '2008-11-08';
      expect(calculateAge(exact18Dob, refDate)).toBe(18);
      expect(isAdult(exact18Dob, refDate)).toBe(true);

      // Exactly 17 years 364 days (birthday is tomorrow)
      const dayBeforeDob = '2008-11-09';
      expect(calculateAge(dayBeforeDob, refDate)).toBe(17);
      expect(isAdult(dayBeforeDob, refDate)).toBe(false);

      // 18 years 1 day (birthday was yesterday)
      const dayAfterDob = '2008-11-07';
      expect(calculateAge(dayAfterDob, refDate)).toBe(18);
      expect(isAdult(dayAfterDob, refDate)).toBe(true);
    });

    it('2. Calendar year boundary: Jan 1 reference date boundary test', () => {
      const refJan1 = new Date('2026-01-01T00:00:00Z');

      // Born on Jan 1, 2008 evaluated on Jan 1, 2026: turns exactly 18
      expect(calculateAge('2008-01-01', refJan1)).toBe(18);
      expect(isAdult('2008-01-01', refJan1)).toBe(true);

      // Born on Jan 2, 2008 evaluated on Jan 1, 2026: 17y 364d -> must fail
      expect(calculateAge('2008-01-02', refJan1)).toBe(17);
      expect(isAdult('2008-01-02', refJan1)).toBe(false);

      // Born on Dec 31, 2007 evaluated on Jan 1, 2026: 18y 1d -> passes
      expect(calculateAge('2007-12-31', refJan1)).toBe(18);
      expect(isAdult('2007-12-31', refJan1)).toBe(true);
    });

    it('3. Calendar year boundary: Dec 31 reference date boundary test', () => {
      const refDec31 = new Date('2026-12-31T23:59:59Z');

      // Born Dec 31, 2008 evaluated on Dec 31, 2026: exactly 18y 0d -> passes
      expect(calculateAge('2008-12-31', refDec31)).toBe(18);
      expect(isAdult('2008-12-31', refDec31)).toBe(true);

      // Born Jan 1, 2009 evaluated on Dec 31, 2026: 17y 364d -> must fail
      expect(calculateAge('2009-01-01', refDec31)).toBe(17);
      expect(isAdult('2009-01-01', refDec31)).toBe(false);

      // Born Dec 30, 2008 evaluated on Dec 31, 2026: 18y 1d -> passes
      expect(calculateAge('2008-12-30', refDec31)).toBe(18);
      expect(isAdult('2008-12-30', refDec31)).toBe(true);
    });

    it('4. Exhaustive 12-month calendar boundary generator (all 12 months verified on mid-month day 15)', () => {
      for (let month = 1; month <= 12; month++) {
        const mm = month.toString().padStart(2, '0');
        const ref = new Date(`2026-${mm}-15T12:00:00Z`);

        // Exact 18th birthday
        const exactDob = `2008-${mm}-15`;
        expect(calculateAge(exactDob, ref)).toBe(18);
        expect(isAdult(exactDob, ref)).toBe(true);

        // Day before 18th birthday (17y 364d)
        const dayBeforeDob = `2008-${mm}-16`;
        expect(calculateAge(dayBeforeDob, ref)).toBe(17);
        expect(isAdult(dayBeforeDob, ref)).toBe(false);

        // Day after 18th birthday (18y 1d)
        const dayAfterDob = `2008-${mm}-14`;
        expect(calculateAge(dayAfterDob, ref)).toBe(18);
        expect(isAdult(dayAfterDob, ref)).toBe(true);
      }
    });

    it('5. End-to-end registerSeeker rejects 17y 364d with AGE_GATE_REJECTED and accepts 18y 0d', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-08T12:00:00Z'));

      // 17y 364d: born 2008-11-09 -> MUST FAIL
      const failRes = await authService.registerSeeker({
        firstName: 'Almost',
        surname: 'Adult',
        email: 'almost.adult@example.com',
        dateOfBirth: '2008-11-09',
      });
      expect(failRes.ok).toBe(false);
      if (!failRes.ok) {
        expect(failRes.error.code).toBe('AGE_GATE_REJECTED');
        expect(failRes.error.minAge).toBe(18);
        expect(failRes.error.message).toContain('18 years or older');
      }

      // 18y 0d: born 2008-11-08 -> MUST PASS
      const passRes = await authService.registerSeeker({
        firstName: 'Exact',
        surname: 'Adult',
        email: 'exact.adult@example.com',
        dateOfBirth: '2008-11-08',
      });
      expect(passRes.ok).toBe(true);
      if (passRes.ok) {
        expect(passRes.data.email).toBe('exact.adult@example.com');
        expect(passRes.data.demoOtpHint).toMatch(/^\d{6}$/);
      }

      vi.useRealTimers();
    });

    it('6. Timezone format resilience: supports ISO strings with Z and offset without day drift', () => {
      const ref = new Date('2026-06-15T00:00:00Z');

      // Exact date format YYYY-MM-DD
      expect(calculateAge('2008-06-15', ref)).toBe(18);

      // Date object constructed with explicit UTC
      const dateObj = new Date(Date.UTC(2008, 5, 15, 0, 0, 0));
      expect(calculateAge(dateObj, ref)).toBe(18);

      // Date before 18th birthday as Date object
      const dateBeforeObj = new Date(Date.UTC(2008, 5, 16, 0, 0, 0));
      expect(calculateAge(dateBeforeObj, ref)).toBe(17);
    });

    it('7. Upper and lower extreme age boundaries & invalid format handling', () => {
      const ref = new Date('2026-01-01T00:00:00Z');

      // Newborn (0 years old) -> false
      expect(calculateAge('2026-01-01', ref)).toBe(0);
      expect(isAdult('2026-01-01', ref)).toBe(false);

      // Centenarian (100 years old, born 1926) -> true
      expect(calculateAge('1926-01-01', ref)).toBe(100);
      expect(isAdult('1926-01-01', ref)).toBe(true);

      // 120-year-old elder (born 1906) -> true
      expect(calculateAge('1906-01-01', ref)).toBe(120);
      expect(isAdult('1906-01-01', ref)).toBe(true);

      // Future birthdate -> negative age
      expect(calculateAge('2030-01-01', ref)).toBe(-4);
      expect(isAdult('2030-01-01', ref)).toBe(false);

      // Invalid strings return -1 and isAdult = false
      expect(calculateAge('not-a-date', ref)).toBe(-1);
      expect(calculateAge('', ref)).toBe(-1);
      expect(isAdult('invalid', ref)).toBe(false);
      expect(calculateAge(null as any, ref)).toBe(-1);
      expect(calculateAge(undefined as any, ref)).toBe(-1);
    });
  });

  // =========================================================================
  // SUITE 2: LEAP DAY BOUNDARY ARITHMETIC (Leap Year vs Non-Leap Year)
  // =========================================================================
  describe('Suite 2: Leap Day Boundary Arithmetic (Feb 28 vs March 1)', () => {
    it('8. Born Feb 29, 2008 evaluated in non-leap year (2026): Feb 28 is age 17 (FAIL); March 1 is age 18 (PASS)', () => {
      // Born on leap day: 2008-02-29
      const leapDob = '2008-02-29';

      // Evaluation on Feb 28, 2026 (non-leap year, 17y 364d): MUST FAIL
      const refFeb28 = new Date('2026-02-28T12:00:00Z');
      expect(calculateAge(leapDob, refFeb28)).toBe(17);
      expect(isAdult(leapDob, refFeb28)).toBe(false);

      // Evaluation on March 1, 2026 (non-leap year, turned 18): MUST PASS
      const refMar01 = new Date('2026-03-01T12:00:00Z');
      expect(calculateAge(leapDob, refMar01)).toBe(18);
      expect(isAdult(leapDob, refMar01)).toBe(true);
    });

    it('9. Born Feb 29, 2004 evaluated in leap year (2024): Feb 28 is 19 (FAIL); Feb 29 is 20 (PASS); Mar 1 is 20 (PASS)', () => {
      const leapDob = '2004-02-29';

      // Feb 28, 2024: day before 20th birthday -> age 19
      const refFeb28 = new Date('2024-02-28T12:00:00Z');
      expect(calculateAge(leapDob, refFeb28)).toBe(19);

      // Feb 29, 2024: exact 20th birthday -> age 20
      const refFeb29 = new Date('2024-02-29T12:00:00Z');
      expect(calculateAge(leapDob, refFeb29)).toBe(20);

      // Mar 1, 2024: day after 20th birthday -> age 20
      const refMar01 = new Date('2024-03-01T12:00:00Z');
      expect(calculateAge(leapDob, refMar01)).toBe(20);
    });

    it('10. Reverse leap boundaries: Born Feb 28 vs March 1, 2008 evaluated on Feb 28, 2026', () => {
      const refFeb28 = new Date('2026-02-28T12:00:00Z');

      // Born Feb 28, 2008: turns 18 on Feb 28, 2026 -> PASS
      expect(calculateAge('2008-02-28', refFeb28)).toBe(18);
      expect(isAdult('2008-02-28', refFeb28)).toBe(true);

      // Born March 1, 2008: 17 on Feb 28, 2026 -> FAIL
      expect(calculateAge('2008-03-01', refFeb28)).toBe(17);
      expect(isAdult('2008-03-01', refFeb28)).toBe(false);

      // Born March 1, 2008 evaluated on March 1, 2026 -> turns 18 -> PASS
      const refMar01 = new Date('2026-03-01T12:00:00Z');
      expect(calculateAge('2008-03-01', refMar01)).toBe(18);
      expect(isAdult('2008-03-01', refMar01)).toBe(true);
    });

    it('11. registerSeeker HTTP route respects leap day boundary in simulated time', async () => {
      // Set system time to Feb 28, 2026
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T12:00:00Z'));

      const failReq = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Leap',
          surname: 'Seeker',
          email: 'leap.fail@example.com',
          dateOfBirth: '2008-02-29',
        }),
      });
      const failRes = await registerPost(failReq);
      expect(failRes.status).toBe(400);
      const failBody = await failRes.json();
      expect(failBody.error).toBe('AGE_GATE_REJECTED');
      expect(failBody.minAge).toBe(18);

      // Advance system time to March 1, 2026
      vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));

      const passReq = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Leap',
          surname: 'Seeker',
          email: 'leap.pass@example.com',
          dateOfBirth: '2008-02-29',
        }),
      });
      const passRes = await registerPost(passReq);
      expect(passRes.status).toBe(201);
      const passBody = await passRes.json();
      expect(passBody.ok).toBe(true);
      expect(passBody.data.demoOtpHint).toMatch(/^\d{6}$/);

      vi.useRealTimers();
    });
  });

  // =========================================================================
  // SUITE 3: INVALID AND EXPIRED 4-DIGIT OTP REJECTION (Feature 3)
  // =========================================================================
  describe('Suite 3: Invalid and Expired 4-Digit OTP Rejection', () => {
    it('12. Rejects invalid OTP formats: length mismatch, non-numeric, whitespace, injection payloads', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Otp',
        surname: 'Tester',
        email: 'otp.formats@example.com',
        dateOfBirth: '1995-01-01',
      });
      expect(reg.ok).toBe(true);
      if (!reg.ok) return;

      const userId = reg.data.pendingUserId;
      const validOtp = reg.data.demoOtpHint!;

      // Adversarial candidate codes
      const adversarialCodes = [
        '',                     // empty string
        '   ',                  // whitespace only
        '1',                    // 1 digit
        '12',                   // 2 digits
        '123',                  // 3 digits
        '12345',                // 5 digits
        '1234567890',           // 10 digits
        'abcd',                 // letters
        '12a4',                 // alphanumeric
        ' 1234 ',               // leading/trailing whitespace around non-matching
        '0000',                 // 4 digits but wrong
        '9999' === validOtp ? '1111' : '9999', // 4 digits but guaranteed wrong
        "' OR '1'='1",          // SQL injection
        '{"$gt": ""}',          // NoSQL injection
        '<script>alert(1)</script>', // XSS payload
        'null',                 // string null
        'undefined',            // string undefined
      ];

      for (const code of adversarialCodes) {
        const verifyRes = await authService.verifyEmailOtp(userId, code);
        expect(verifyRes.ok).toBe(false);
        if (!verifyRes.ok) {
          expect(verifyRes.error.code).toBe('INVALID_OTP');
          expect(verifyRes.error.message).toContain('Invalid or expired');
        }
      }

      // Verify user remains unverified and pending
      const user = db.findUserById(userId);
      expect(user?.status).toBe('PENDING_VERIFICATION');
      expect(user?.emailVerified).toBe(false);
      expect(user?.verificationOtp).toBe(validOtp);
    });

    it('13. Replay attack rejection: Valid OTP can be used once; subsequent replay attempts fail with INVALID_OTP', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Replay',
        surname: 'Victim',
        email: 'replay.victim@example.com',
        dateOfBirth: '1990-05-15',
      });
      expect(reg.ok).toBe(true);
      if (!reg.ok) return;

      const userId = reg.data.pendingUserId;
      const validOtp = reg.data.demoOtpHint!;

      // 1st attempt: Valid OTP succeeds
      const firstAttempt = await authService.verifyEmailOtp(userId, validOtp);
      expect(firstAttempt.ok).toBe(true);
      if (firstAttempt.ok) {
        expect(firstAttempt.data.userId).toBe(userId);
        expect(firstAttempt.data.role).toBe('NON_MUSLIM');
      }

      // Check user record: OTP cleared, status ACTIVE
      const activeUser = db.findUserById(userId);
      expect(activeUser?.emailVerified).toBe(true);
      expect(activeUser?.status).toBe('ACTIVE');
      expect(activeUser?.verificationOtp).toBeNull();

      // 2nd attempt: Replay of same OTP MUST FAIL with INVALID_OTP
      const replayAttempt = await authService.verifyEmailOtp(userId, validOtp);
      expect(replayAttempt.ok).toBe(false);
      if (!replayAttempt.ok) {
        expect(replayAttempt.error.code).toBe('INVALID_OTP');
        expect(replayAttempt.error.message).toContain('Invalid or expired');
      }

      // 3rd through 10th attempts: 8 rapid duplicate calls all fail
      const burstAttempts = await Promise.all(
        Array.from({ length: 8 }, () => authService.verifyEmailOtp(userId, validOtp))
      );
      for (const attempt of burstAttempts) {
        expect(attempt.ok).toBe(false);
        if (!attempt.ok) {
          expect(attempt.error.code).toBe('INVALID_OTP');
        }
      }
    });

    it('14. OTP re-issuance invalidates prior code (superseded OTP fails, new OTP passes)', async () => {
      // First registration creates OTP 1
      const reg1 = await authService.registerSeeker({
        firstName: 'Resend',
        surname: 'User',
        email: 'resend.otp@example.com',
        dateOfBirth: '1992-03-20',
      });
      expect(reg1.ok).toBe(true);
      if (!reg1.ok) return;

      const otp1 = reg1.data.demoOtpHint!;
      const userId = reg1.data.pendingUserId;

      // Second registration with same email while pending re-issues OTP 2
      const reg2 = await authService.registerSeeker({
        firstName: 'Resend',
        surname: 'User',
        email: 'resend.otp@example.com',
        dateOfBirth: '1992-03-20',
      });
      expect(reg2.ok).toBe(true);
      if (!reg2.ok) return;

      const otp2 = reg2.data.demoOtpHint!;
      expect(reg2.data.pendingUserId).toBe(userId);

      // Verify that old OTP 1 is now invalidated / expired
      if (otp1 !== otp2) {
        const verifyOld = await authService.verifyEmailOtp(userId, otp1);
        expect(verifyOld.ok).toBe(false);
        if (!verifyOld.ok) {
          expect(verifyOld.error.code).toBe('INVALID_OTP');
        }
      }

      // Verify that new OTP 2 succeeds
      const verifyNew = await authService.verifyEmailOtp(userId, otp2);
      expect(verifyNew.ok).toBe(true);
      if (verifyNew.ok) {
        expect(verifyNew.data.role).toBe('NON_MUSLIM');
      }
    });

    it('15. Verifying OTP for non-existent userId returns USER_NOT_FOUND', async () => {
      const res = await authService.verifyEmailOtp('non-existent-user-id-99999', '1234');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('USER_NOT_FOUND');
      }

      const resEmpty = await authService.verifyEmailOtp('', '1234');
      expect(resEmpty.ok).toBe(false);
      if (!resEmpty.ok) {
        expect(resEmpty.error.code).toBe('USER_NOT_FOUND');
      }
    });

    it('16. HTTP API POST /api/auth/verify-otp returns 400 for invalid/expired OTP and sets session cookie on success', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Http',
        surname: 'Verify',
        email: 'http.verify@example.com',
        dateOfBirth: '1994-08-12',
      });
      expect(reg.ok).toBe(true);
      if (!reg.ok) return;

      // Invalid OTP HTTP request -> 400
      const invalidReq = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: reg.data.pendingUserId,
          otpCode: '0000',
        }),
      });
      const invalidRes = await verifyOtpPost(invalidReq);
      expect(invalidRes.status).toBe(400);
      const invalidBody = await invalidRes.json();
      expect(invalidBody.error).toBe('INVALID_OTP');

      // Valid OTP HTTP request -> 200 with alhiwar_session cookie
      const validReq = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: reg.data.pendingUserId,
          otpCode: reg.data.demoOtpHint,
        }),
      });
      const validRes = await verifyOtpPost(validReq);
      expect(validRes.status).toBe(200);
      const validBody = await validRes.json();
      expect(validBody.ok).toBe(true);
      expect(validBody.data.token).toContain('alhiwar_');

      // Check cookie
      const setCookie = validRes.headers.get('set-cookie');
      expect(setCookie).toContain('alhiwar_session=');
    });
  });

  // =========================================================================
  // SUITE 4: RAPID PERSONA SWAPPING ACROSS ALL 7 ROLES (Feature 34)
  // =========================================================================
  describe('Suite 4: Rapid Persona Swapping Across All 7 Roles (Session Isolation & Token Cleanliness)', () => {
    const ALL_7_ROLES: UserRole[] = [
      'VISITOR',
      'NON_MUSLIM',
      'DIALOGIST',
      'INSTRUCTOR',
      'SUPERVISOR',
      'NEW_MUSLIM',
      'ADMINISTRATOR',
    ];

    it('17. Deterministic sequential switching across all 7 roles for 10 cycles (70 transitions): session state and activeDemoUserId transition cleanly', async () => {
      for (let cycle = 0; cycle < 10; cycle++) {
        for (const role of ALL_7_ROLES) {
          const session = await authService.switchDemoPersona(role);

          // Assert correct role in returned session
          expect(session.role).toBe(role);

          if (role === 'VISITOR') {
            expect(session.userId).toBe('visitor');
            expect(session.email).toBe('visitor@example.com');
            expect(session.firstName).toBe('Visitor');
            expect(session.token).toBe('visitor_session_token');
            expect(db.activeDemoUserId).toBeNull();
          } else {
            expect(db.activeDemoUserId).toBe(session.userId);
            expect(session.token).toMatch(
              new RegExp(`^alhiwar_${session.userId}_[a-zA-Z0-9]+\\.[0-9a-f]{64}$`)
            );

            // Validate that the returned demo user matches seeded identity
            const demoUser = db.findDemoUserByRole(role);
            expect(demoUser).toBeDefined();
            expect(session.userId).toBe(demoUser?.id);
            expect(session.email).toBe(demoUser?.email);
            expect(session.firstName).toBe(demoUser?.firstName);
            expect(session.surname).toBe(demoUser?.surname);
          }

          // Empirical session validation: validateSession must reproduce identical clean session
          const validated = await authService.validateSession(session.token);
          expect(validated).not.toBeNull();
          expect(validated?.role).toBe(role);
          expect(validated?.userId).toBe(session.userId);
          expect(validated?.email).toBe(session.email);
        }
      }
    });

    it('18. Pseudo-random persona swapping stress (100 rapid random transitions): zero residual token contamination', async () => {
      let previousRole: UserRole | null = null;
      let previousSession: UserSession | null = null;

      for (let i = 0; i < 100; i++) {
        const targetRole = ALL_7_ROLES[Math.floor(Math.random() * ALL_7_ROLES.length)];
        const currentSession = await authService.switchDemoPersona(targetRole);

        expect(currentSession.role).toBe(targetRole);

        // Verify activeDemoUserId invariant
        if (targetRole === 'VISITOR') {
          expect(db.activeDemoUserId).toBeNull();
        } else {
          expect(db.activeDemoUserId).toBe(currentSession.userId);
        }

        // Validate current session token
        const validated = await authService.validateSession(currentSession.token);
        expect(validated).not.toBeNull();
        expect(validated?.role).toBe(targetRole);
        expect(validated?.userId).toBe(currentSession.userId);

        // Verify zero residual contamination from previous role
        if (previousRole && previousRole !== targetRole && previousSession) {
          expect(validated?.role).not.toBe(previousRole);
          expect(validated?.userId).not.toBe(previousSession.userId);
          expect(validated?.email).not.toBe(previousSession.email);
        }

        previousRole = targetRole;
        previousSession = currentSession;
      }
    });

    it('19. Historical token isolation: tokens issued to Persona A retain Identity A even after switching to Persona B or VISITOR', async () => {
      // 1. Issue tokens for all 7 personas
      const issuedSessions: Record<UserRole, UserSession> = {} as any;
      for (const role of ALL_7_ROLES) {
        issuedSessions[role] = await authService.switchDemoPersona(role);
      }

      // Current active persona is ADMINISTRATOR
      expect(db.activeDemoUserId).toBe(issuedSessions['ADMINISTRATOR'].userId);

      // Validate each previously issued token: MUST resolve to original persona identity, NOT ADMINISTRATOR
      for (const role of ALL_7_ROLES) {
        const session = issuedSessions[role];
        const validated = await authService.validateSession(session.token);
        expect(validated).not.toBeNull();
        expect(validated?.role).toBe(role);
        expect(validated?.userId).toBe(session.userId);
        expect(validated?.email).toBe(session.email);
      }

      // Now switch active persona to VISITOR (activeDemoUserId = null)
      await authService.switchDemoPersona('VISITOR');
      expect(db.activeDemoUserId).toBeNull();

      // Validate all non-visitor tokens again: must STILL validate to their respective personas
      for (const role of ALL_7_ROLES) {
        if (role === 'VISITOR') continue;
        const session = issuedSessions[role];
        const validated = await authService.validateSession(session.token);
        expect(validated).not.toBeNull();
        expect(validated?.role).toBe(role);
        expect(validated?.userId).toBe(session.userId);
      }
    });

    it('20. Switching to non-existent or unrecognized role throws descriptive error', async () => {
      await expect(authService.switchDemoPersona('SUPER_ADMIN' as any)).rejects.toThrow(
        /Demo persona for role SUPER_ADMIN not found/
      );
      await expect(authService.switchDemoPersona('UNKNOWN' as any)).rejects.toThrow();
    });

    it('21. Session validation rejects corrupted, partial, spoofed, or inactive-user tokens safely returning null', async () => {
      // 1. Structural token corruptions and non-existent IDs
      const spoofedTokens = [
        '',
        '   ',
        'visitor',
        'alhiwar',
        'alhiwar_',
        'alhiwar__12345',
        'alhiwar_non-existent-user-id_12345',
        'alhiwar_ghost_9999999999',
        'token-admin',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      ];

      for (const token of spoofedTokens) {
        const session = await authService.validateSession(token);
        expect(session).toBeNull();
      }

      // 2. Pending verification user token is rejected (status !== ACTIVE)
      const reg = await authService.registerSeeker({
        firstName: 'Pending',
        surname: 'Seeker',
        email: 'pending.token@example.com',
        dateOfBirth: '1990-01-01',
      });
      expect(reg.ok).toBe(true);
      if (reg.ok) {
        const pendingToken = `alhiwar_${reg.data.pendingUserId}_${Date.now()}`;
        const pendingSession = await authService.validateSession(pendingToken);
        expect(pendingSession).toBeNull();
      }

      // 3. Suspended user token is rejected (status === SUSPENDED)
      const suspendedUser = {
        id: 'user-suspended-test',
        email: 'suspended@iu.edu.sa',
        passwordHash: 'hash',
        firstName: 'Suspended',
        surname: 'User',
        dateOfBirth: '1990-01-01',
        role: 'NON_MUSLIM' as UserRole,
        status: 'SUSPENDED' as const,
        preferredLanguage: 'en' as const,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(suspendedUser);

      const suspendedToken = `alhiwar_${suspendedUser.id}_${Date.now()}`;
      const suspendedSession = await authService.validateSession(suspendedToken);
      expect(suspendedSession).toBeNull();
    });
  });

  // =========================================================================
  // SUITE 5: DEMO SWITCH ROUTE HANDLER STRESS
  // =========================================================================
  describe('Suite 5: Demo Switch Route Handler Stress', () => {
    it('23. HTTP route POST /api/auth/demo-switch sets cookie for authenticated roles and deletes cookie for VISITOR', async () => {
      // 1. Switch to DIALOGIST: sets cookie
      const dialogistReq = new NextRequest('http://localhost:3000/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'DIALOGIST' }),
      });
      const dialogistRes = await demoSwitchPost(dialogistReq);
      expect(dialogistRes.status).toBe(200);
      const dialogistBody = await dialogistRes.json();
      expect(dialogistBody.ok).toBe(true);
      expect(dialogistBody.data.role).toBe('DIALOGIST');

      const cookieSet = dialogistRes.headers.get('set-cookie');
      expect(cookieSet).toContain('alhiwar_session=');
      expect(cookieSet).toContain('alhiwar_user-dialogist-1_');

      // 2. Switch to VISITOR: deletes cookie
      const visitorReq = new NextRequest('http://localhost:3000/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'VISITOR' }),
      });
      const visitorRes = await demoSwitchPost(visitorReq);
      expect(visitorRes.status).toBe(200);
      const visitorBody = await visitorRes.json();
      expect(visitorBody.ok).toBe(true);
      expect(visitorBody.data.role).toBe('VISITOR');

      const visitorCookieHeader = visitorRes.headers.get('set-cookie');
      expect(visitorCookieHeader).toContain('alhiwar_session=;'); // Deleted / expired cookie
      expect(db.activeDemoUserId).toBeNull();

      // 3. Rejects missing role with 400
      const missingRoleReq = new NextRequest('http://localhost:3000/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const missingRes = await demoSwitchPost(missingRoleReq);
      expect(missingRes.status).toBe(400);

      // 4. Rejects invalid role with 500
      const invalidRoleReq = new NextRequest('http://localhost:3000/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'NON_EXISTENT_ROLE' }),
      });
      const invalidRes = await demoSwitchPost(invalidRoleReq);
      expect(invalidRes.status).toBe(500);
    });

    it('24. HTTP route GET /api/auth/demo-switch correctly reads cookie or activeDemoUserId or defaults to VISITOR', async () => {
      // 1. With active signed session cookie
      const validCookie = signSessionToken('user-supervisor-1');
      const reqWithCookie = new NextRequest('http://localhost:3000/api/auth/demo-switch', {
        headers: {
          cookie: `alhiwar_session=${validCookie}`,
        },
      });
      const resWithCookie = await demoSwitchGet(reqWithCookie);
      expect(resWithCookie.status).toBe(200);
      const bodyWithCookie = await resWithCookie.json();
      expect(bodyWithCookie.ok).toBe(true);
      expect(bodyWithCookie.data.role).toBe('SUPERVISOR');
      expect(bodyWithCookie.data.firstName).toBe('Prof. Khalid');

      // 2. Without cookie, but with db.activeDemoUserId set
      db.activeDemoUserId = 'user-instructor-1';
      const reqNoCookieWithDb = new NextRequest('http://localhost:3000/api/auth/demo-switch');
      const resNoCookieWithDb = await demoSwitchGet(reqNoCookieWithDb);
      expect(resNoCookieWithDb.status).toBe(200);
      const bodyNoCookieWithDb = await resNoCookieWithDb.json();
      expect(bodyNoCookieWithDb.ok).toBe(true);
      expect(bodyNoCookieWithDb.data.role).toBe('INSTRUCTOR');
      expect(bodyNoCookieWithDb.data.firstName).toBe('Dr. Ibrahim');

      // 3. Without cookie, and with db.activeDemoUserId = null -> defaults to VISITOR
      db.activeDemoUserId = null;
      const reqDefault = new NextRequest('http://localhost:3000/api/auth/demo-switch');
      const resDefault = await demoSwitchGet(reqDefault);
      expect(resDefault.status).toBe(200);
      const bodyDefault = await resDefault.json();
      expect(bodyDefault.ok).toBe(true);
      expect(bodyDefault.data.role).toBe('VISITOR');
    });
  });
});
