/**
 * Seeded Academy curriculum content for Lesson 8: Advanced Supplementary Module: Daily Supplications (Al-Adhkar).
 * Contains bilingual English and French markdown modules and media links.
 */

import type { LearningContent } from '../../types';
import { NOW_ISO } from '../constants';

/**
 * Creates the initial seeded `LearningContent` record for lesson 8 (`lesson-draft-8`).
 * @returns Seeded bilingual lesson object with media references and approval metadata.
 */
export function createLesson8(): LearningContent {
  return {
    id: "lesson-draft-8",
    lessonNumber: 8,
    titleEn: "Advanced Supplementary Module: Daily Supplications (Al-Adhkar)",
    titleFr: "Module Suppl\u00e9mentaire Avanc\u00e9 : Les Invocations Quotidiennes (Al-Adhkar)",
    contentMarkdownEn: "# Supplementary Draft: Morning and Evening Remembrances (Al-Adhkar)\\n\\nA curated collection of authentic Prophetic supplications from *Hisn Al-Muslim* (Fortress of the Muslim) for morning, evening, sleep, and travel.",
    contentMarkdownFr: "# Brouillon Suppl\u00e9mentaire : Les Invocations du Matin et du Soir (Al-Adhkar)\\n\\nUn recueil d\u2019invocations proph\u00e9tiques authentiques tir\u00e9es de *La Citadelle du Musulman* pour le matin, le soir, le sommeil et le voyage.",
    pdfGuideUrl: "/academy/guides/lesson-8-adhkar.pdf",
    audioLectureUrl: null,
    videoLectureUrl: null,
    status: "PENDING_APPROVAL",
    isApproved: false,
    authorId: "user-instructor-1",
    approvedById: null,
    createdAt: NOW_ISO,
  };
}
