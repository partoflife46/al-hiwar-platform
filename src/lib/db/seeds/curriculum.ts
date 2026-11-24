/**
 * Academy curriculum seed barrel assembling the 7 core approved lessons,
 * the pending supplementary lesson draft, and the 7 module quiz descriptors.
 */

import type { LearningContent, Quiz } from '../types';
import { createLesson1 } from './lessons/lesson-1';
import { createLesson2 } from './lessons/lesson-2';
import { createLesson3 } from './lessons/lesson-3';
import { createLesson4 } from './lessons/lesson-4';
import { createLesson5 } from './lessons/lesson-5';
import { createLesson6 } from './lessons/lesson-6';
import { createLesson7 } from './lessons/lesson-7';
import { createLesson8 } from './lessons/lesson-8';

/**
 * Builds the complete list of seeded Academy `LearningContent` records.
 * @returns Ordered array of 7 approved lessons plus 1 pending draft lesson.
 */
export function createInitialLearningContents(): LearningContent[] {
  return [
    createLesson1(),
    createLesson2(),
    createLesson3(),
    createLesson4(),
    createLesson5(),
    createLesson6(),
    createLesson7(),
    createLesson8(),
  ];
}

/**
 * Builds the 7 published lesson quiz definitions (20 questions each, 80% pass threshold).
 * @returns Array of seeded `Quiz` descriptors aligned with lessons 1 through 7.
 */
export function createInitialQuizzes(): Quiz[] {
  return [1, 2, 3, 4, 5, 6, 7].map((num) => ({
    id: `quiz-lesson-${num}`,
    lessonId: `lesson-${num}`,
    lessonNumber: num,
    passingPercentage: 80.0,
    totalQuestions: 20,
    isPublished: true,
  }));
}
