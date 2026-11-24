/**
 * Module architecture and API reference for `src/hooks/use-academy-roadmap.ts`.
 *
 * Exported symbols:
 * - `useAcademyRoadmap` (Function): use academy roadmap definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/lib/services/academy-service`
 * - `@/lib/db/types`
 * - `@/lib/context/language-context`
 *
 * @module hooks/use-academy-roadmap
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Client state and side-effect hook module for use academy roadmap.
 * Coordinates API requests, live state synchronization, and UI callback handlers.
 * @module hooks/use-academy-roadmap
 * @exports useAcademyRoadmap
 */

import * as React from "react";
import { db } from "@/lib/db/in-memory-adapter";
import { academyService, type AcademyProgress } from "@/lib/services/academy-service";
import type { Certificate, LearningContent, UserSession } from "@/lib/db/types";
import { useLanguage } from "@/lib/context/language-context";

/**
 * Loads authenticated Academy lessons, quiz progress, and certificate status.
 */
export function useAcademyRoadmap() {
  const { language, setLanguage, isFr } = useLanguage();
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const [progress, setProgress] = React.useState<AcademyProgress | null>(null);
  const [lessons, setLessons] = React.useState<LearningContent[]>([]);
  const [certificate, setCertificate] = React.useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  /**
   * Memoized handler/selector for load academy state.
   */
  const loadAcademyState = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Get current session
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!res.ok) {
        setIsLoading(false);
        return;
      }
      const json = await res.json();
      const session: UserSession = json.data;
      setCurrentUser(session);

      // 2. Try loading authoritative server Academy state
      try {
        const acRes = await fetch(`/api/academy?type=progress&userId=${session.userId}`, {
          cache: 'no-store',
        });
        if (acRes.ok) {
          const acJson = await acRes.json();
          if (acJson.ok && acJson.data) {
            setLessons(acJson.data.lessons || db.getApprovedLessons());
            setProgress(acJson.data.progress);
            setCertificate(acJson.data.certificate || null);
            return;
          }
        }
      } catch {
        // Fallback to local adapter in isolated test env
      }

      // 3. Fallback to in-memory service (unit test env)
      const approved = db.getApprovedLessons();
      setLessons(approved);
      const userProgress = await academyService.getProgress(session.userId);
      setProgress(userProgress);
      const localCert =
        db.certificates.find((c) => c.newMuslimId === session.userId && !c.isRevoked) || null;
      setCertificate(localCert);
    } catch (err) {
      console.error('Failed to load academy state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    loadAcademyState();

    /** Handles handle role changed interaction. */
    const handleRoleChanged = () => loadAcademyState();
    window.addEventListener('alhiwar:role-changed', handleRoleChanged);
    return () => window.removeEventListener('alhiwar:role-changed', handleRoleChanged);
  }, [loadAcademyState]);

  const unlockedLesson = progress?.unlockedLessonNumber || 1;
  const completedCount = progress?.completedLessonsCount || 0;
  const progressPercent = progress?.overallProgressPercentage || 0;
  const isFinalExamEligible = (progress?.allQuizzesPassed || completedCount >= 7);

  return {
    language,
    setLanguage,
    isFr,
    currentUser,
    progress,
    lessons,
    certificate,
    isLoading,
    unlockedLesson,
    completedCount,
    progressPercent,
    isFinalExamEligible,
  };
}
