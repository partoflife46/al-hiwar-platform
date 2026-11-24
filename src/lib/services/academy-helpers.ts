/**
 * Application service module implementing academy helpers business rules.
 * Coordinates domain invariants, persistence updates, and structured Result responses.
 * @module lib/services/academy-helpers
 * @exports scoreQuestions, ensureGraduationCertificate
 */

import type { InMemoryDatabaseAdapter } from '@/lib/db/in-memory-adapter';
import type { Certificate, Question } from '@/lib/db/types';

/**
 * Counts correct answers for a list of multiple-choice questions and returns percentage score.
 */
export function scoreQuestions(
  questions: Question[],
  answers: Record<string, number>
): number {
  if (questions.length === 0) return 0;
  let correctCount = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctOptionIndex) {
      correctCount += 1;
    }
  }
  return Math.round((correctCount / questions.length) * 100);
}

/**
 * Ensures an active (non-revoked) graduation certificate exists for a New Muslim learner.
 */
export function ensureGraduationCertificate(
  store: InMemoryDatabaseAdapter,
  newMuslimId: string,
  finalAttemptId: string
): Certificate {
  const existing = store.certificates.find(
    (c) => c.newMuslimId === newMuslimId && !c.isRevoked
  );
  if (existing) return existing;

  const user = store.findUserById(newMuslimId);
  const fullName = user ? `${user.firstName} ${user.surname}` : 'New Muslim Graduate';
  const certId = `CERT-IU-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  const cert: Certificate = {
    id: certId,
    newMuslimId,
    finalAttemptId,
    fullName,
    dateOfBirth: user?.dateOfBirth || '2000-01-01',
    nationality: user?.nationality || 'International',
    issueDate: now,
    verificationQrHash: `QR-${certId}`,
    pdfFileUrl: `/api/certificates/${certId}/download`,
    isRevoked: false,
    revocationReason: null,
    revokedByAdminId: null,
    createdAt: now,
  };
  store.certificates.push(cert);
  return cert;
}
