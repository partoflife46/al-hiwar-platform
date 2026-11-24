import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  checkRateLimit,
  isLocked,
  resetRateLimit,
  clearAllRateLimits,
  getClientIp,
  createRateLimitResponse,
} from '@/lib/security/rate-limiter';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as verifyOtpPost } from '@/app/api/auth/verify-otp/route';

describe('Rate Limiter Module & Security Middleware', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe('1. In-Memory Rate Limiter Core Logic', () => {
    it('allows requests within limit and decrements remaining attempts', () => {
      const key = 'test-client-1';
      const options = { windowMs: 60000, maxAttempts: 3, keyPrefix: 'test' };

      const res1 = checkRateLimit(key, options);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = checkRateLimit(key, options);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = checkRateLimit(key, options);
      expect(res3.success).toBe(true);
      expect(res3.remaining).toBe(0);

      // 4th request exceeds the limit
      const res4 = checkRateLimit(key, options);
      expect(res4.success).toBe(false);
      expect(res4.remaining).toBe(0);
      expect(res4.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('locks out subsequent requests once maxAttempts is exceeded', () => {
      const key = 'test-client-lock';
      const options = { windowMs: 10000, maxAttempts: 2, keyPrefix: 'test' };

      checkRateLimit(key, options);
      checkRateLimit(key, options);
      const exceed = checkRateLimit(key, options);
      expect(exceed.success).toBe(false);

      // Verify isLocked returns true
      const lockStatus = isLocked(key, 'test');
      expect(lockStatus.locked).toBe(true);
      expect(lockStatus.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('resets counter when resetRateLimit is called', () => {
      const key = 'test-client-reset';
      const options = { windowMs: 60000, maxAttempts: 2, keyPrefix: 'test' };

      checkRateLimit(key, options);
      checkRateLimit(key, options);
      checkRateLimit(key, options); // locked

      expect(isLocked(key, 'test').locked).toBe(true);
      resetRateLimit(key, 'test');
      expect(isLocked(key, 'test').locked).toBe(false);

      const fresh = checkRateLimit(key, options);
      expect(fresh.success).toBe(true);
      expect(fresh.remaining).toBe(1);
    });

    it('generates standard RFC-compliant HTTP 429 response', async () => {
      const result = {
        success: false,
        limit: 5,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfterSeconds: 60,
      };

      const res = createRateLimitResponse(result);
      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('60');
      expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');

      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('extracts client IP from x-forwarded-for, x-real-ip, or fallback', () => {
      const reqWithForwarded = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
      });
      expect(getClientIp(reqWithForwarded)).toBe('203.0.113.195');

      const reqWithRealIp = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: { 'x-real-ip': '198.51.100.22' },
      });
      expect(getClientIp(reqWithRealIp)).toBe('198.51.100.22');

      const reqEmpty = new NextRequest('http://localhost:3000/api/auth/login');
      expect(getClientIp(reqEmpty)).toBe('127.0.0.1');
    });
  });

  describe('2. Endpoint Rate Limiting Integration', () => {
    it('returns HTTP 429 when IP rate limit is exceeded on /api/auth/verify-otp', async () => {
      const testIp = '192.0.2.100';

      // Send 50 requests up to the test threshold
      for (let i = 0; i < 50; i++) {
        const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': testIp,
          },
          body: JSON.stringify({ userId: 'u1', otpCode: '123456' }),
        });
        await verifyOtpPost(req);
      }

      // The 51st request must trigger HTTP 429
      const blockedReq = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': testIp,
        },
        body: JSON.stringify({ userId: 'u1', otpCode: '123456' }),
      });
      const blockedRes = await verifyOtpPost(blockedReq);
      expect(blockedRes.status).toBe(429);
      const json = await blockedRes.json();
      expect(json.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(blockedRes.headers.get('Retry-After')).toBeDefined();
    });

    it('returns HTTP 429 when failed login attempts exceed threshold for an account', async () => {
      const targetEmail = 'brute-target@example.com';

      // Send 5 failed login attempts (each returns 401)
      for (let i = 0; i < 5; i++) {
        const req = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, password: 'wrongpassword' }),
        });
        const res = await loginPost(req);
        expect(res.status).toBe(401);
      }

      // 6th attempt is immediately blocked with HTTP 429
      const blockedReq = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: 'any' }),
      });
      const blockedRes = await loginPost(blockedReq);
      expect(blockedRes.status).toBe(429);
      const json = await blockedRes.json();
      expect(json.error).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
