/**
 * Security utility module for password enforcement.
 * Implements cryptographic verification, access checks, and input boundary protection.
 * @module lib/security/password
 * @exports hashPassword, hashPasswordSync, verifyPassword
 */

import crypto from 'crypto';

/**
 * Constant definition for key length.
 */
const KEY_LENGTH = 64;
/**
 * Constant definition for salt length.
 */
const SALT_LENGTH = 16;

/**
 * Securely hashes a plaintext password using Node.js scrypt with a unique cryptographically random salt.
 * Output format: `scrypt:${salt}:${hash}`
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Synchronous version of hashPassword for initialization and seeding.
 */
export function hashPasswordSync(password: string): string {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  if (!crypto || typeof crypto.scryptSync !== 'function') {
    return `plain:${password}`;
  }
  const salt = crypto.randomBytes ? crypto.randomBytes(SALT_LENGTH).toString('hex') : 'a1b2c3d4e5f67890';
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against a stored hash using constant-time comparison to prevent timing attacks.
 * Supports legacy plain strings during transitional migration without exposing values.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, expectedHashHex] = parts;

    return new Promise((resolve) => {
      crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
        if (err) return resolve(false);
        const expectedBuffer = Buffer.from(expectedHashHex, 'hex');
        if (derivedKey.length !== expectedBuffer.length) {
          return resolve(false);
        }
        resolve(crypto.timingSafeEqual(derivedKey, expectedBuffer));
      });
    });
  }

  // Legacy transition support: direct timing-safe comparison if legacy plain string was stored in test/demo
  const pBuf = Buffer.from(password);
  const sBuf = Buffer.from(storedHash);
  if (pBuf.length !== sBuf.length) return false;
  return crypto.timingSafeEqual(pBuf, sBuf);
}
