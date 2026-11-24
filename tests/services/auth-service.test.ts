import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import {
  authService,
  calculateAge,
  isAdult,
} from '@/lib/services/auth-service';

describe('AuthService & Age Gate Seam (Task 2.1)', () => {
  beforeEach(() => {
    db.reset();
  });

  describe('calculateAge and isAdult calendar arithmetic', () => {
    it('calculates age correctly for adult born 25 years ago', () => {
      const refDate = new Date('2026-05-14T12:00:00Z');
      const age = calculateAge('2001-05-14', refDate);
      expect(age).toBe(25);
      expect(isAdult('2001-05-14', refDate)).toBe(true);
    });

    it('calculates age correctly for minor born 16 years ago', () => {
      const refDate = new Date('2026-05-14T12:00:00Z');
      const age = calculateAge('2010-05-14', refDate);
      expect(age).toBe(16);
      expect(isAdult('2010-05-14', refDate)).toBe(false);
    });

    it('returns isAdult = true on exact 18th birthday', () => {
      const refDate = new Date('2026-05-14T00:00:00Z');
      const age = calculateAge('2008-05-14', refDate);
      expect(age).toBe(18);
      expect(isAdult('2008-05-14', refDate)).toBe(true);
    });

    it('returns isAdult = false on 17 years and 364 days (day before 18th birthday)', () => {
      const refDate = new Date('2026-05-13T23:59:59Z');
      const age = calculateAge('2008-05-14', refDate);
      expect(age).toBe(17);
      expect(isAdult('2008-05-14', refDate)).toBe(false);
    });

    it('returns isAdult = true on 18 years and 1 day', () => {
      const refDate = new Date('2026-05-15T00:00:00Z');
      const age = calculateAge('2008-05-14', refDate);
      expect(age).toBe(18);
      expect(isAdult('2008-05-14', refDate)).toBe(true);
    });

    it('handles leap year birthdays (born Feb 29, 2008 evaluated on Feb 28, 2026 -> 17, rejected)', () => {
      const refDate = new Date('2026-02-28T12:00:00Z');
      const age = calculateAge('2008-02-29', refDate);
      expect(age).toBe(17);
      expect(isAdult('2008-02-29', refDate)).toBe(false);
    });

    it('handles leap year birthdays (born Feb 29, 2008 evaluated on Mar 1, 2026 -> 18, accepted)', () => {
      const refDate = new Date('2026-03-01T12:00:00Z');
      const age = calculateAge('2008-02-29', refDate);
      expect(age).toBe(18);
      expect(isAdult('2008-02-29', refDate)).toBe(true);
    });

    it('handles leap year reference dates (born Feb 29, 2004 evaluated on Feb 29, 2024 -> 20, accepted)', () => {
      const refDate = new Date('2024-02-29T12:00:00Z');
      const age = calculateAge('2004-02-29', refDate);
      expect(age).toBe(20);
      expect(isAdult('2004-02-29', refDate)).toBe(true);
    });

    it('handles invalid date strings gracefully', () => {
      expect(calculateAge('invalid-date')).toBe(-1);
      expect(isAdult('not-a-date')).toBe(false);
    });
  });

  describe('registerSeeker', () => {
    it('rejects registration when age < 18 with AGE_GATE_REJECTED and minAge: 18', async () => {
      const result = await authService.registerSeeker({
        firstName: 'Young',
        surname: 'Seeker',
        email: 'minor@example.com',
        dateOfBirth: '2015-01-01',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('AGE_GATE_REJECTED');
        expect(result.error.minAge).toBe(18);
        expect(result.error.message).toContain('18 years or older');
      }
    });

    it('rejects registration when required fields are missing', async () => {
      const result = await authService.registerSeeker({
        firstName: '',
        surname: '',
        email: 'incomplete@example.com',
        dateOfBirth: '2000-01-01',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('MISSING_FIELDS');
      }
    });

    it('allows registration when age >= 18 and creates PENDING_VERIFICATION user', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const result = await authService.registerSeeker({
        firstName: 'Adult',
        surname: 'Seeker',
        email: 'adult.seeker@example.com',
        dateOfBirth: '1995-06-20',
        preferredLanguage: 'fr',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.email).toBe('adult.seeker@example.com');
        expect(result.data.pendingUserId).toBeDefined();
        expect(result.data.demoOtpHint).toMatch(/^\d{6}$/);

        const createdUser = db.findUserById(result.data.pendingUserId);
        expect(createdUser).toBeDefined();
        expect(createdUser?.status).toBe('PENDING_VERIFICATION');
        expect(createdUser?.emailVerified).toBe(false);
        expect(createdUser?.verificationOtp).toBe(result.data.demoOtpHint);
        expect(createdUser?.preferredLanguage).toBe('fr');
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEMO OTP] Passcode for adult.seeker@example.com is:')
      );
      consoleSpy.mockRestore();
    });

    it('generates a 6-digit numeric OTP and stores it on user record', async () => {
      const result = await authService.registerSeeker({
        firstName: 'Numeric',
        surname: 'Check',
        email: 'numeric.check@example.com',
        dateOfBirth: '2000-01-01',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const otpNum = parseInt(result.data.demoOtpHint || '', 10);
        expect(otpNum).toBeGreaterThanOrEqual(100000);
        expect(otpNum).toBeLessThanOrEqual(999999);
      }
    });

    it('rejects duplicate registration for already verified active email with EMAIL_ALREADY_EXISTS', async () => {
      // Existing active user from seed data (e.g. Jean-Luc Dubois: seeker@example.com)
      const result = await authService.registerSeeker({
        firstName: 'Jean-Luc',
        surname: 'Dubois',
        email: 'seeker@example.com',
        dateOfBirth: '1999-05-14',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('EMAIL_ALREADY_EXISTS');
      }
    });
  });

  describe('verifyEmailOtp', () => {
    it('rejects invalid or mismatched 4-digit OTP code with INVALID_OTP', async () => {
      const regResult = await authService.registerSeeker({
        firstName: 'Test',
        surname: 'Otp',
        email: 'otp.test@example.com',
        dateOfBirth: '1990-01-01',
      });
      expect(regResult.ok).toBe(true);
      if (!regResult.ok) return;

      const verifyResult = await authService.verifyEmailOtp(regResult.data.pendingUserId, '0000');
      expect(verifyResult.ok).toBe(false);
      if (!verifyResult.ok) {
        expect(verifyResult.error.code).toBe('INVALID_OTP');
      }
    });

    it('accepts correct OTP, activates user (ACTIVE, emailVerified: true), clears OTP, and returns UserSession', async () => {
      const regResult = await authService.registerSeeker({
        firstName: 'Active',
        surname: 'Candidate',
        email: 'active.candidate@example.com',
        dateOfBirth: '1992-04-10',
      });
      expect(regResult.ok).toBe(true);
      if (!regResult.ok) return;

      const otp = regResult.data.demoOtpHint!;
      const verifyResult = await authService.verifyEmailOtp(regResult.data.pendingUserId, otp);

      expect(verifyResult.ok).toBe(true);
      if (verifyResult.ok) {
        expect(verifyResult.data.userId).toBe(regResult.data.pendingUserId);
        expect(verifyResult.data.role).toBe('NON_MUSLIM');
        expect(verifyResult.data.token).toContain('alhiwar_');

        const user = db.findUserById(regResult.data.pendingUserId);
        expect(user?.status).toBe('ACTIVE');
        expect(user?.emailVerified).toBe(true);
        expect(user?.verificationOtp).toBeNull();
      }
    });

    it('returns USER_NOT_FOUND when verifying non-existent user', async () => {
      const verifyResult = await authService.verifyEmailOtp('non-existent-user-id', '1234');
      expect(verifyResult.ok).toBe(false);
      if (!verifyResult.ok) {
        expect(verifyResult.error.code).toBe('USER_NOT_FOUND');
      }
    });
  });

  describe('login and validateSession', () => {
    it('rejects login for unverified pending user', async () => {
      const reg = await authService.registerSeeker({
        firstName: 'Pending',
        surname: 'Login',
        email: 'pending.login@example.com',
        dateOfBirth: '1998-08-08',
      });
      expect(reg.ok).toBe(true);

      const loginRes = await authService.login({ email: 'pending.login@example.com' });
      expect(loginRes.ok).toBe(false);
      if (!loginRes.ok) {
        expect(loginRes.error.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('authenticates active user and returns UserSession', async () => {
      const loginRes = await authService.login({ email: 'dialogist@iu.edu.sa', password: 'password123' });
      expect(loginRes.ok).toBe(true);
      if (loginRes.ok) {
        expect(loginRes.data.role).toBe('DIALOGIST');
        expect(loginRes.data.firstName).toBe('Sheikh Ahmad');
      }
    });

    it('validates authentic session token and decodes UserSession', async () => {
      const loginRes = await authService.login({ email: 'dialogist@iu.edu.sa', password: 'password123' });
      expect(loginRes.ok).toBe(true);
      if (!loginRes.ok) return;

      const session = await authService.validateSession(loginRes.data.token);
      expect(session).not.toBeNull();
      expect(session?.role).toBe('DIALOGIST');
      expect(session?.userId).toBe(loginRes.data.userId);
    });

    it('returns null for invalid or expired session token', async () => {
      const session = await authService.validateSession('invalid-garbage-token');
      expect(session).toBeNull();
    });
  });

  describe('switchDemoPersona', () => {
    it('switches to DIALOGIST and returns Sheikh Ahmad Al-Madani session', async () => {
      const session = await authService.switchDemoPersona('DIALOGIST');
      expect(session.role).toBe('DIALOGIST');
      expect(session.firstName).toBe('Sheikh Ahmad');
      expect(db.activeDemoUserId).toBe(session.userId);
    });

    it('switches to NEW_MUSLIM and returns Thomas Anderson session', async () => {
      const session = await authService.switchDemoPersona('NEW_MUSLIM');
      expect(session.role).toBe('NEW_MUSLIM');
      expect(session.firstName).toBe('Thomas');
      expect(db.activeDemoUserId).toBe(session.userId);
    });

    it('switches to INSTRUCTOR and returns Dr. Ibrahim Al-Harbi session', async () => {
      const session = await authService.switchDemoPersona('INSTRUCTOR');
      expect(session.role).toBe('INSTRUCTOR');
      expect(session.firstName).toBe('Dr. Ibrahim');
    });

    it('switches to SUPERVISOR and returns Prof. Khalid Al-Qasim session', async () => {
      const session = await authService.switchDemoPersona('SUPERVISOR');
      expect(session.role).toBe('SUPERVISOR');
      expect(session.firstName).toBe('Prof. Khalid');
    });

    it('switches to ADMINISTRATOR and returns Ustadh Tariq Al-Ansari session', async () => {
      const session = await authService.switchDemoPersona('ADMINISTRATOR');
      expect(session.role).toBe('ADMINISTRATOR');
      expect(session.firstName).toBe('Ustadh Tariq');
    });

    it('switches to NON_MUSLIM and returns Jean-Luc Dubois session', async () => {
      const session = await authService.switchDemoPersona('NON_MUSLIM');
      expect(session.role).toBe('NON_MUSLIM');
      expect(session.firstName).toBe('Jean-Luc');
    });

    it('switches to VISITOR and clears activeDemoUserId', async () => {
      const session = await authService.switchDemoPersona('VISITOR');
      expect(session.role).toBe('VISITOR');
      expect(db.activeDemoUserId).toBeNull();
    });
  });
});
