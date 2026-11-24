/**
 * Module architecture and API reference for `src/lib/db/seeds/users.ts`.
 *
 * Exported symbols:
 * - `createInitialUsers` (Function): create initial users definition.
 *
 * Internal dependencies:
 * - `../types`
 * - `./constants`
 *
 * @module lib/db/seeds/users
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Initial database seed fixtures for users records.
 * Supplies deterministic bilingual demo data for local development and automated tests.
 * @module lib/db/seeds/users
 * @exports createInitialUsers
 */

import type { User } from "../types";
import { NOW_ISO, TEST_SCRYPT_HASH, ADMIN_SCRYPT_HASH, GRADUATE_SCRYPT_HASH } from "./constants";

/**
 * Executes create initial users logic.
 * @returns Value of type `User[]`.
 */
export function createInitialUsers(): User[] {
  const isTest = process.env.NODE_ENV === 'test';

  if (!isTest) {
    return []; // Clean production/dev: strictly zero pre-existing accounts
  }

  const operationalAccounts: User[] = [
    {
      id: 'user-admin-1',
      email: 'admin@alhiwar.org',
      passwordHash: ADMIN_SCRYPT_HASH,
      firstName: 'Ustadh Tariq',
      surname: 'Al-Ansari',
      dateOfBirth: '1988-01-25',
      role: 'ADMINISTRATOR',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      emailVerified: true,
      verificationOtp: null,
      nationality: 'Saudi Arabia',
      gender: 'MALE',
      phoneNumber: '+966 50 445 6677',
      conversionDate: null,
      title: 'Platform Administrator',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
    {
      id: 'user-graduate-1',
      email: 'graduate@example.com',
      passwordHash: GRADUATE_SCRYPT_HASH,
      firstName: 'Zayd',
      surname: 'Ibrahim',
      dateOfBirth: '1995-04-12',
      role: 'NEW_MUSLIM',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      emailVerified: true,
      verificationOtp: null,
      nationality: 'United Kingdom',
      gender: 'MALE',
      phoneNumber: '+44 7700 900555',
      conversionDate: '2026-10-15T10:00:00.000Z',
      title: 'Certified Graduate (Al Hiwar Islamic Academy)',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  ];

  const testFixtures: User[] = [
    {
      id: 'user-seeker-1',
      email: 'seeker@example.com',
      passwordHash: TEST_SCRYPT_HASH,
      firstName: 'Jean-Luc',
      surname: 'Dubois',
      dateOfBirth: '1999-05-14', // Age 27 (26+)
      role: 'NON_MUSLIM',
      status: 'ACTIVE',
      preferredLanguage: 'fr',
      emailVerified: true,
      verificationOtp: null,
      nationality: null,
      gender: null,
      phoneNumber: null,
      conversionDate: null,
      title: 'Inquirer (French / English)',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
    {
      id: 'user-newmuslim-1',
      email: 'newmuslim@example.com',
      passwordHash: TEST_SCRYPT_HASH,
      firstName: 'Thomas',
      surname: 'Anderson',
      dateOfBirth: '1996-08-22', // Age 30 (29+)
      role: 'NEW_MUSLIM',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      emailVerified: true,
      verificationOtp: null,
      nationality: 'United Kingdom',
      gender: 'MALE',
      phoneNumber: '+44 7700 900412',
      conversionDate: '2026-11-01T14:30:00.000Z',
      title: 'New Muslim Learner (British)',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
    {
      id: 'user-dialogist-1',
      email: 'dialogist@iu.edu.sa',
      passwordHash: TEST_SCRYPT_HASH,
      firstName: 'Sheikh Ahmad',
      surname: 'Al-Madani',
      dateOfBirth: '1985-03-10',
      role: 'DIALOGIST',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      emailVerified: true,
      verificationOtp: null,
      nationality: 'Saudi Arabia',
      gender: 'MALE',
      phoneNumber: '+966 50 112 3344',
      conversionDate: null,
      title: 'Faculty of Sharia — Specialist Dialogist',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
    {
      id: 'user-instructor-1',
      email: 'instructor@iu.edu.sa',
      passwordHash: TEST_SCRYPT_HASH,
      firstName: 'Dr. Ibrahim',
      surname: 'Al-Harbi',
      dateOfBirth: '1980-11-19',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      emailVerified: true,
      verificationOtp: null,
      nationality: 'Saudi Arabia',
      gender: 'MALE',
      phoneNumber: '+966 50 223 4455',
      conversionDate: null,
      title: 'Faculty of Arabic & Islamic Studies',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
    {
      id: 'user-supervisor-1',
      email: 'supervisor@iu.edu.sa',
      passwordHash: TEST_SCRYPT_HASH,
      firstName: 'Prof. Khalid',
      surname: 'Al-Qasim',
      dateOfBirth: '1975-07-04',
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      emailVerified: true,
      verificationOtp: null,
      nationality: 'Saudi Arabia',
      gender: 'MALE',
      phoneNumber: '+966 50 334 5566',
      conversionDate: null,
      title: 'Senior Sharia Supervisor',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  ];

  return [...testFixtures, ...operationalAccounts];
}

