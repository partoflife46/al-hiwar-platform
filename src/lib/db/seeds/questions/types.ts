/**
 * Seed question template contract used to synthesize module quizzes and final exam items.
 */

/** Bilingual multiple-choice template used by the seed question generator. */
export interface SeedQuestionTemplate {
  /** prompt en property. */
  promptEn: string;
  /** prompt fr property. */
  promptFr: string;
  /** options json property. */
  optionsJson: [string, string, string, string];
  /** options fr json property. */
  optionsFrJson: [string, string, string, string];
  /** correct option index property. */
  correctOptionIndex: 0 | 1 | 2 | 3;
  /** explanation en property. */
  explanationEn: string;
  /** explanation fr property. */
  explanationFr: string;
}
