/**
 * Security utility module for session token enforcement.
 * Implements cryptographic verification, access checks, and input boundary protection.
 * @module lib/security/session-token
 * @exports GUEST_SESSION_ID, getSessionSecret, signSessionToken, verifySessionToken
 */

import crypto from 'crypto';
import { getServerFs } from '@/lib/db/server-fs';

/**
 * Constant definition for session prefix.
 */
const SESSION_PREFIX = 'alhiwar_';
/**
 * Constant definition for guest session id.
 */
export const GUEST_SESSION_ID = 'visitor_session_token';
/**
 * Constant definition for hex 64 re.
 */
const HEX_64_RE = /^[0-9a-f]{64}$/;
/**
 * Constant definition for nonce re.
 */
const NONCE_RE = /^[a-zA-Z0-9]+$/;

declare global {
  // eslint-disable-next-line no-var
  var __alhiwarSessionSecret: string | undefined;
}

/**
 * Resolve the HMAC-SHA256 signing secret consistently across route bundles and restarts.
 * Uses env secret when configured, or persists a CSPRNG secret in `.data/.session-secret`
 * for non-test local/production servers.
 */
export function getSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET || process.env.AUTH_SECRET;
  if (envSecret && envSecret.trim().length > 0) {
    return envSecret;
  }

  // SEC-13: Warn in production if SESSION_SECRET is not explicitly set in environment
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[SECURITY WARNING] SESSION_SECRET is missing in production environment. ' +
      'Please configure SESSION_SECRET for secure multi-instance session verification.'
    );
  }

  if (globalThis.__alhiwarSessionSecret) {
    return globalThis.__alhiwarSessionSecret;
  }

  const nodeMods = getServerFs();
  if (nodeMods) {
    try {
      const secretFilePath = nodeMods.path.join(process.cwd(), '.data', '.session-secret');
      if (nodeMods.fs.existsSync(secretFilePath)) {
        const stored = nodeMods.fs.readFileSync(secretFilePath, 'utf8').trim();
        if (stored.length >= 32) {
          globalThis.__alhiwarSessionSecret = stored;
          return stored;
        }
      }
      nodeMods.fs.mkdirSync(nodeMods.path.dirname(secretFilePath), { recursive: true });
      const generated = crypto.randomBytes(32).toString('hex');
      nodeMods.fs.writeFileSync(secretFilePath, generated, { mode: 0o600 });
      globalThis.__alhiwarSessionSecret = generated;
      return generated;
    } catch {
      // Fallback to in-process CSPRNG secret if filesystem is read-only
    }
  }

  const ephemeral = crypto.randomBytes(32).toString('hex');
  globalThis.__alhiwarSessionSecret = ephemeral;
  return ephemeral;
}

/**
 * Executes compute signature logic.
 * @param userId - User id value (`string`).
 * @param nonce - Nonce value (`string`).
 * @returns Value of type `string`.
 */
function computeSignature(userId: string, nonce: string): string {
  if (typeof crypto.createHmac !== 'function') {
    throw new Error('HMAC-SHA256 requires a server-side Node.js runtime');
  }
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(`alhiwar:${userId}:${nonce}`)
    .digest('hex');
}

/**
 * Create an HMAC-SHA256 signed `alhiwar_session` token for `userId`.
 * Format: `alhiwar_<userId>_<nonce>.<64-char-hmac-hex>`
 */
export function signSessionToken(userId: string): string {
  if (!userId) {
    throw new Error('Cannot sign session token without userId');
  }
  const nonce = `${Date.now()}${crypto.randomBytes(12).toString('hex')}`;
  const signature = computeSignature(userId, nonce);
  return `${SESSION_PREFIX}${userId}_${nonce}.${signature}`;
}

/**
 * Verify an `alhiwar_session` token using constant-time HMAC comparison.
 * Returns the authenticated `userId` if valid, or `null` if unsigned/tampered/malformed.
 */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (typeof crypto.createHmac !== 'function' || typeof crypto.timingSafeEqual !== 'function') {
    return null;
  }
  if (!token || !token.startsWith(SESSION_PREFIX)) {
    return null;
  }

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx <= SESSION_PREFIX.length) {
    return null;
  }

  const body = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  if (!HEX_64_RE.test(providedSig)) {
    return null;
  }

  const lastUnderscore = body.lastIndexOf('_');
  if (lastUnderscore <= SESSION_PREFIX.length) {
    return null;
  }

  const userId = body.slice(SESSION_PREFIX.length, lastUnderscore);
  const nonce = body.slice(lastUnderscore + 1);
  if (!userId || !nonce || !NONCE_RE.test(nonce)) {
    return null;
  }

  // SEC-07: Check absolute session lifetime (7 days max) if nonce carries timestamp prefix
  const timestampStr = nonce.slice(0, 13);
  if (/^\d{13}$/.test(timestampStr)) {
    const timestamp = parseInt(timestampStr, 10);
    const MAX_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    const age = Date.now() - timestamp;
    if (age < -60000 || age > MAX_SESSION_AGE_MS) {
      return null;
    }
  }

  const expectedSig = computeSignature(userId, nonce);
  const providedBuf = Buffer.from(providedSig, 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');

  if (providedBuf.length !== expectedBuf.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  return userId;
}
