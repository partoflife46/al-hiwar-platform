/**
 * Initial database seed fixtures for constants records.
 * Supplies deterministic bilingual demo data for local development and automated tests.
 * @module lib/db/seeds/constants
 * @exports NOW_ISO, TEST_SCRYPT_HASH, ADMIN_SCRYPT_HASH, GRADUATE_SCRYPT_HASH
 */

export const NOW_ISO = '2026-11-08T18:00:00.000Z';

// Precomputed scrypt hashes to allow zero-crypto browser execution & SSR safety
export const TEST_SCRYPT_HASH =
  'scrypt:a1b2c3d4e5f67890:03f26f34dff3f5bbb41d018ea9858525721acdfaad76551e20357b5170846be2cd3f1ae2d24a57d5f56c91198721d100c148e2f82b42e9f4be4211a1111abef4';
/**
 * Constant definition for admin scrypt hash.
 */
export const ADMIN_SCRYPT_HASH = TEST_SCRYPT_HASH;
/**
 * Constant definition for graduate scrypt hash.
 */
export const GRADUATE_SCRYPT_HASH = TEST_SCRYPT_HASH;
