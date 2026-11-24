/**
 * NIST SP 800-63B & OWASP Aligned Password Policy & Strength Evaluator
 * 
 * Rules:
 * 1. Minimum 8 characters.
 * 2. Requires a combination of letters (a-z, A-Z) and numbers (0-9).
 * 3. Provides real-time strength score (Weak, Fair, Strong) based on length, mixed case, and symbols.
 */

export interface PasswordEvaluation {
  /** score property. */
  score: number; // 0 (empty/too short), 1 (weak), 2 (fair), 3 (good), 4 (strong)
  /** level property. */
  level: 'WEAK' | 'FAIR' | 'STRONG';
  /** label en property. */
  labelEn: string;
  /** label fr property. */
  labelFr: string;
  /** has min length property. */
  hasMinLength: boolean;
  /** has letter property. */
  hasLetter: boolean;
  /** has number property. */
  hasNumber: boolean;
  /** has upper lower property. */
  hasUpperLower: boolean;
  /** has special property. */
  hasSpecial: boolean;
  /** is valid property. */
  isValid: boolean;
  /** Optional error message en property. */
  errorMessageEn?: string;
  /** Optional error message fr property. */
  errorMessageFr?: string;
}

/**
 * Executes evaluate password logic.
 * @param password - Password value (`string`).
 * @returns Value of type `PasswordEvaluation`.
 */
export function evaluatePassword(password: string): PasswordEvaluation {
  const p = (password || '').trim();
  const hasMinLength = p.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasLower = /[a-z]/.test(p);
  const hasUpper = /[A-Z]/.test(p);
  const hasUpperLower = hasLower && hasUpper;
  const hasSpecial = /[^a-zA-Z0-9]/.test(p);

  let score = 0;
  if (!hasMinLength) {
    return {
      score: 0,
      level: 'WEAK',
      labelEn: 'Weak',
      labelFr: 'Faible',
      hasMinLength: false,
      hasLetter,
      hasNumber,
      hasUpperLower,
      hasSpecial,
      isValid: false,
      errorMessageEn: 'Password must be at least 8 characters long.',
      errorMessageFr: 'Le mot de passe doit comporter au moins 8 caractères.',
    };
  }

  score += 1; // hasMinLength is true
  if (hasLetter && hasNumber) score += 1;
  if (p.length >= 10 && (hasUpperLower || hasSpecial)) score += 1;
  if (p.length >= 12 && hasSpecial && hasUpperLower) score += 1;

  let level: 'WEAK' | 'FAIR' | 'STRONG' = 'WEAK';
  let labelEn = 'Weak';
  let labelFr = 'Faible';

  if (score <= 1) {
    level = 'WEAK';
    labelEn = 'Weak';
    labelFr = 'Faible';
  } else if (score === 2) {
    level = 'FAIR';
    labelEn = 'Fair';
    labelFr = 'Moyen';
  } else {
    level = 'STRONG';
    labelEn = 'Strong';
    labelFr = 'Robuste';
  }

  const isValid = hasMinLength && hasLetter && hasNumber;

  let errorMessageEn: string | undefined;
  let errorMessageFr: string | undefined;

  if (!hasMinLength) {
    errorMessageEn = 'Password must be at least 8 characters long.';
    errorMessageFr = 'Le mot de passe doit comporter au moins 8 caractères.';
  } else if (!hasLetter || !hasNumber) {
    errorMessageEn = 'Password must contain a combination of letters and numbers.';
    errorMessageFr = 'Le mot de passe doit contenir une combinaison de lettres et de chiffres.';
  }

  return {
    score,
    level,
    labelEn,
    labelFr,
    hasMinLength,
    hasLetter,
    hasNumber,
    hasUpperLower,
    hasSpecial,
    isValid,
    errorMessageEn,
    errorMessageFr,
  };
}
