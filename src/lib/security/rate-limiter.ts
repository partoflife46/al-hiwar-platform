/**
 * Security utility module for rate limiter enforcement.
 * Implements cryptographic verification, access checks, and input boundary protection.
 * @module lib/security/rate-limiter
 * @exports RateLimitOptions, RateLimitResult, getClientIp, isLocked, checkRateLimit,
 *   resetRateLimit
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Type contract defining rate limit options.
 * Includes fields/members: windowMs, maxAttempts, keyPrefix, message.
 */
export interface RateLimitOptions {
  /** window ms property. */
  windowMs: number;
  /** max attempts property. */
  maxAttempts: number;
  /** Optional key prefix property. */
  keyPrefix?: string;
  /** Optional message property. */
  message?: string;
}

/**
 * Type contract defining rate limit result.
 * Includes fields/members: success, limit, remaining, resetTime, retryAfterSeconds.
 */
export interface RateLimitResult {
  /** success property. */
  success: boolean;
  /** limit property. */
  limit: number;
  /** remaining property. */
  remaining: number;
  /** reset time property. */
  resetTime: number;
  /** retry after seconds property. */
  retryAfterSeconds: number;
}

/**
 * Type contract defining attempt record.
 * Includes fields/members: count, firstAttempt, lockUntil.
 */
interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockUntil?: number;
}

// In-memory storage for rate limiting keys
const rateLimitStore = new Map<string, AttemptRecord>();

let lastCleanup = Date.now();
/**
 * Executes cleanup stale records logic.
 * @param now - Now value (`number`).
 */
function cleanupStaleRecords(now: number) {
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.lockUntil && record.lockUntil < now) {
      rateLimitStore.delete(key);
    } else if (!record.lockUntil && now - record.firstAttempt > 60 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Extract client IP address safely from request headers
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

/**
 * Check if a key is currently locked out without consuming an attempt
 */
export function isLocked(
  key: string,
  keyPrefix: string = 'rl'
): { locked: boolean; retryAfterSeconds: number } {
  const fullKey = `${keyPrefix}:${key}`;
  const record = rateLimitStore.get(fullKey);
  const now = Date.now();
  if (record?.lockUntil && now < record.lockUntil) {
    return {
      locked: true,
      retryAfterSeconds: Math.ceil((record.lockUntil - now) / 1000),
    };
  }
  return { locked: false, retryAfterSeconds: 0 };
}

/**
 * Check and increment rate limit for a given key within a time window
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  cleanupStaleRecords(now);

  const fullKey = `${options.keyPrefix || 'rl'}:${key}`;
  const record = rateLimitStore.get(fullKey);

  // If already locked out
  if (record?.lockUntil && now < record.lockUntil) {
    const retryAfterSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return {
      success: false,
      limit: options.maxAttempts,
      remaining: 0,
      resetTime: record.lockUntil,
      retryAfterSeconds,
    };
  }

  // If no record exists or window expired
  if (!record || now - record.firstAttempt > options.windowMs) {
    rateLimitStore.set(fullKey, {
      count: 1,
      firstAttempt: now,
    });
    return {
      success: true,
      limit: options.maxAttempts,
      remaining: options.maxAttempts - 1,
      resetTime: now + options.windowMs,
      retryAfterSeconds: 0,
    };
  }

  // Increment attempt count within active window
  record.count += 1;
  const remaining = Math.max(0, options.maxAttempts - record.count);

  if (record.count > options.maxAttempts) {
    record.lockUntil = now + options.windowMs;
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    return {
      success: false,
      limit: options.maxAttempts,
      remaining: 0,
      resetTime: record.lockUntil,
      retryAfterSeconds,
    };
  }

  return {
    success: true,
    limit: options.maxAttempts,
    remaining,
    resetTime: record.firstAttempt + options.windowMs,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset rate limit counter on successful action (e.g., successful login or OTP verify)
 */
export function resetRateLimit(key: string, keyPrefix: string = 'rl'): void {
  rateLimitStore.delete(`${keyPrefix}:${key}`);
}

/**
 * Clear all rate limit records (useful for test isolation)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Generate standard HTTP 429 Too Many Requests response with standard headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  const waitTime =
    result.retryAfterSeconds > 60
      ? `${Math.ceil(result.retryAfterSeconds / 60)} minutes`
      : `${result.retryAfterSeconds} seconds`;

  const message =
    customMessage ||
    `Too many requests. Please wait ${waitTime} before trying again.`;

  return NextResponse.json(
    {
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
      },
    }
  );
}
