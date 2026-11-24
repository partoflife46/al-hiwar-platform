/**
 * Module architecture and API reference for `src/lib/db/seeds/questions.ts`.
 *
 * Exported symbols:
 * - `createInitialQuestions` (Function): create initial questions definition.
 *
 * Internal dependencies:
 * - `../types`
 * - `./questions/types`
 * - `./questions/lesson-1`
 * - `./questions/lesson-2`
 * - `./questions/lesson-3`
 * - `./questions/lesson-4`
 * - `./questions/lesson-5`
 * - `./questions/lesson-6`
 * - `./questions/lesson-7`
 *
 * @module lib/db/seeds/questions
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Curriculum quiz and 100-question capstone final exam question generator.
 */

import type { Question } from "../types";
import type { SeedQuestionTemplate } from "./questions/types";
import { LESSON_1_QUESTIONS } from "./questions/lesson-1";
import { LESSON_2_QUESTIONS } from "./questions/lesson-2";
import { LESSON_3_QUESTIONS } from "./questions/lesson-3";
import { LESSON_4_QUESTIONS } from "./questions/lesson-4";
import { LESSON_5_QUESTIONS } from "./questions/lesson-5";
import { LESSON_6_QUESTIONS } from "./questions/lesson-6";
import { LESSON_7_QUESTIONS } from "./questions/lesson-7";

/**
 * Constant definition for lesson question templates.
 */
const LESSON_QUESTION_TEMPLATES: Record<number, SeedQuestionTemplate[]> = {
  1: LESSON_1_QUESTIONS,
  2: LESSON_2_QUESTIONS,
  3: LESSON_3_QUESTIONS,
  4: LESSON_4_QUESTIONS,
  5: LESSON_5_QUESTIONS,
  6: LESSON_6_QUESTIONS,
  7: LESSON_7_QUESTIONS,
};

/** Generates 20 questions per curriculum module plus the 100-question final exam bank. */
export function createInitialQuestions(): Question[] {
  const questions: Question[] = [];

  // 1. Generate 20 questions for each of the 7 lesson quizzes (7 * 20 = 140 questions)
  for (let lessonNumber = 1; lessonNumber <= 7; lessonNumber++) {
    const templates = LESSON_QUESTION_TEMPLATES[lessonNumber];
    const quizId = `quiz-lesson-${lessonNumber}`;

    for (let qIndex = 0; qIndex < 20; qIndex++) {
      const tpl = templates[qIndex % templates.length];
      const variantSuffixEn =
        qIndex < 5 ? '' : ` (Review Scenario ${Math.floor(qIndex / 5) + 1}.${(qIndex % 5) + 1})`;
      const variantSuffixFr =
        qIndex < 5 ? '' : ` (Cas d’étude ${Math.floor(qIndex / 5) + 1}.${(qIndex % 5) + 1})`;

      questions.push({
        id: `q-l${lessonNumber}-${qIndex + 1}`,
        quizId,
        lessonNumber,
        isFinalExam: false,
        promptEn: `${tpl.promptEn}${variantSuffixEn}`,
        promptFr: `${tpl.promptFr}${variantSuffixFr}`,
        optionsJson: [...tpl.optionsJson] as [string, string, string, string],
        optionsFrJson: [...tpl.optionsFrJson] as [string, string, string, string],
        correctOptionIndex: tpl.correctOptionIndex,
        explanationEn: tpl.explanationEn,
        explanationFr: tpl.explanationFr,
      });
    }
  }

  // 2. Generate 100 questions for the Capstone Final Exam across all 7 curriculum modules
  const allTemplates: Array<{ lessonNumber: number; tpl: SeedQuestionTemplate }> = [];
  for (let lessonNumber = 1; lessonNumber <= 7; lessonNumber++) {
    for (const tpl of LESSON_QUESTION_TEMPLATES[lessonNumber]) {
      allTemplates.push({ lessonNumber, tpl });
    }
  }

  for (let i = 0; i < 100; i++) {
    const { lessonNumber, tpl } = allTemplates[i % allTemplates.length];
    const cycle = Math.floor(i / allTemplates.length) + 1;

    questions.push({
      id: `q-final-${i + 1}`,
      quizId: null,
      lessonNumber,
      isFinalExam: true,
      promptEn: `[Module ${lessonNumber} · Q${i + 1}] ${tpl.promptEn}${cycle > 1 ? ` (Application ${cycle})` : ''}`,
      promptFr: `[Module ${lessonNumber} · Q${i + 1}] ${tpl.promptFr}${cycle > 1 ? ` (Application ${cycle})` : ''}`,
      optionsJson: [...tpl.optionsJson] as [string, string, string, string],
      optionsFrJson: [...tpl.optionsFrJson] as [string, string, string, string],
      correctOptionIndex: tpl.correctOptionIndex,
      explanationEn: tpl.explanationEn,
      explanationFr: tpl.explanationFr,
    });
  }

  return questions;
}

