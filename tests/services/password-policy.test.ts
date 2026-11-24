import { describe, it, expect } from 'vitest';
import { evaluatePassword } from '@/lib/security/password-policy';
import { authService } from '@/lib/services/auth-service';
import { db } from '@/lib/db/in-memory-adapter';

describe('NIST SP 800-63B Password Policy & Strength Evaluation', () => {
  it('identifies passwords shorter than 8 characters as WEAK and invalid', () => {
    const res = evaluatePassword('Pass1');
    expect(res.isValid).toBe(false);
    expect(res.hasMinLength).toBe(false);
    expect(res.level).toBe('WEAK');
    expect(res.score).toBe(0);
    expect(res.errorMessageEn).toContain('at least 8 characters');
    expect(res.errorMessageFr).toContain('au moins 8 caractères');
  });

  it('rejects passwords with 8+ characters containing only digits or only letters', () => {
    const onlyDigits = evaluatePassword('1234567890');
    expect(onlyDigits.hasMinLength).toBe(true);
    expect(onlyDigits.hasLetter).toBe(false);
    expect(onlyDigits.hasNumber).toBe(true);
    expect(onlyDigits.isValid).toBe(false);
    expect(onlyDigits.errorMessageEn).toContain('combination of letters and numbers');

    const onlyLetters = evaluatePassword('abcdefghijk');
    expect(onlyLetters.hasMinLength).toBe(true);
    expect(onlyLetters.hasLetter).toBe(true);
    expect(onlyLetters.hasNumber).toBe(false);
    expect(onlyLetters.isValid).toBe(false);
  });

  it('accepts passwords with 8+ characters combining letters and numbers (FAIR / MEDIUM)', () => {
    const validFair = evaluatePassword('madinah2026');
    expect(validFair.hasMinLength).toBe(true);
    expect(validFair.hasLetter).toBe(true);
    expect(validFair.hasNumber).toBe(true);
    expect(validFair.isValid).toBe(true);
    expect(validFair.level).toBe('FAIR');
    expect(validFair.labelEn).toBe('Fair');
    expect(validFair.labelFr).toBe('Moyen');
  });

  it('rates complex passphrases with uppercase, symbols, and 12+ characters as STRONG', () => {
    const strong = evaluatePassword('MinaretGold#2026!');
    expect(strong.isValid).toBe(true);
    expect(strong.hasMinLength).toBe(true);
    expect(strong.hasLetter).toBe(true);
    expect(strong.hasNumber).toBe(true);
    expect(strong.hasUpperLower).toBe(true);
    expect(strong.hasSpecial).toBe(true);
    expect(strong.level).toBe('STRONG');
    expect(strong.labelEn).toBe('Strong');
    expect(strong.labelFr).toBe('Robuste');
  });

  it('safely handles empty or whitespace-only input', () => {
    const empty = evaluatePassword('');
    expect(empty.isValid).toBe(false);
    expect(empty.level).toBe('WEAK');
    expect(empty.score).toBe(0);

    const whitespace = evaluatePassword('       ');
    expect(whitespace.isValid).toBe(false);
    expect(whitespace.level).toBe('WEAK');
  });

  it('authService.registerSeeker rejects weak passwords with PASSWORD_TOO_WEAK', async () => {
    const resOnlyLetters = await authService.registerSeeker({
      firstName: 'Weak',
      surname: 'Tester',
      email: 'weak.pw@example.com',
      dateOfBirth: '1995-01-01',
      password: 'onlyletterslong',
    });

    expect(resOnlyLetters.ok).toBe(false);
    if (!resOnlyLetters.ok) {
      expect(resOnlyLetters.error.code).toBe('PASSWORD_TOO_WEAK');
      expect(resOnlyLetters.error.message).toContain('combination of letters and numbers');
    }

    const resTooShort = await authService.registerSeeker({
      firstName: 'Short',
      surname: 'Tester',
      email: 'short.pw@example.com',
      dateOfBirth: '1995-01-01',
      password: 'short1',
    });

    expect(resTooShort.ok).toBe(false);
    if (!resTooShort.ok) {
      expect(resTooShort.error.code).toBe('PASSWORD_TOO_SHORT');
    }
  });
});
