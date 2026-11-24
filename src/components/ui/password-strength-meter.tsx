'use client';

/**
 * Module architecture and API reference for
 *   `src/components/ui/password-strength-meter.tsx`.
 *
 * Exported symbols:
 * - `PasswordStrengthMeter` (Const): password strength meter definition.
 *
 * Internal dependencies:
 * - `@/lib/security/password-policy`
 *
 * @module components/ui/password-strength-meter
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * UI presentation module for password strength meter within the ui workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/ui/password-strength-meter
 * @exports PasswordStrengthMeter
 */

import React from 'react';
import { evaluatePassword } from '@/lib/security/password-policy';
import { Check, ShieldCheck } from 'lucide-react';

/**
 * Type contract defining password strength meter props.
 * Includes fields/members: password, lang, className.
 */
interface PasswordStrengthMeterProps {
  password?: string;
  lang?: 'en' | 'fr';
  className?: string;
}

/**
 * Renders the password strength meter interface component.
 * @param props - Destructured input containing password, lang, className.
 */
export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password = '',
  lang = 'en',
  className = '',
}) => {
  const isFr = lang === 'fr';
  const evaluation = React.useMemo(() => evaluatePassword(password), [password]);
  const trimmed = password.trim();

  if (trimmed.length === 0) {
    return (
      <div className={`space-y-1.5 pt-1 ${className}`}>
        <div className="flex items-center justify-between text-xs text-[#5F7383]">
          <span>{isFr ? 'Niveau de sécurité :' : 'Password Strength:'}</span>
          <span className="font-mono text-[11px] text-[#5F7383]">8+ {isFr ? 'caractères' : 'chars'}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 h-2">
          <div className="h-full rounded-full bg-[#E2E8F0]" />
          <div className="h-full rounded-full bg-[#E2E8F0]" />
          <div className="h-full rounded-full bg-[#E2E8F0]" />
        </div>
        <p className="text-[11px] text-[#5F7383]">
          {isFr
            ? 'Combinez au moins 8 caractères avec des lettres et des chiffres.'
            : 'Combine at least 8 characters with letters and numbers.'}
        </p>
      </div>
    );
  }

  // Segment colors based on score and level (using guaranteed hex utility classes)
  const segment1Color =
    evaluation.level === 'WEAK'
      ? 'bg-[#DC2626]'
      : evaluation.level === 'FAIR'
      ? 'bg-[#D97706]'
      : 'bg-[#0D7A5F]';

  const segment2Color =
    evaluation.level === 'FAIR'
      ? 'bg-[#D97706]'
      : evaluation.level === 'STRONG'
      ? 'bg-[#0D7A5F]'
      : 'bg-[#E2E8F0]';

  const segment3Color = evaluation.level === 'STRONG' ? 'bg-[#0D7A5F]' : 'bg-[#E2E8F0]';

  const badgeClasses =
    evaluation.level === 'WEAK'
      ? 'text-[#DC2626] bg-[#FEE2E2] border border-[#FECACA]'
      : evaluation.level === 'FAIR'
      ? 'text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A]'
      : 'text-white bg-[#0D7A5F] border border-[#0D7A5F] shadow-sm';

  const levelLabel = isFr ? evaluation.labelFr : evaluation.labelEn;

  return (
    <div className={`space-y-2 pt-1 ${className}`} aria-live="polite">
      {/* Top Bar: Label & Strength Status Badge */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#5F7383] font-medium flex items-center gap-1.5">
          {evaluation.level === 'STRONG' && (
            <ShieldCheck className="w-4 h-4 text-[#0D7A5F]" />
          )}
          {isFr ? 'Niveau de sécurité :' : 'Password Strength:'}
        </span>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeClasses}`}>
            {levelLabel}
          </span>
          <span className="font-mono tabular-nums text-[11px] text-[#5F7383]">
            {trimmed.length}/8
          </span>
        </div>
      </div>

      {/* 3-Segment Progress Bar */}
      <div
        className="grid grid-cols-3 gap-1.5 h-2"
        role="progressbar"
        aria-valuenow={evaluation.score}
        aria-valuemin={0}
        aria-valuemax={4}
      >
        <div className={`h-full rounded-full transition-all duration-300 ${segment1Color}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${segment2Color}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${segment3Color}`} />
      </div>

      {/* Strong Status Banner */}
      {evaluation.level === 'STRONG' && (
        <div className="flex items-center gap-1.5 text-xs text-[#0D7A5F] font-semibold bg-[#E6F4F0] border border-[#A3D9C9] rounded-lg px-2.5 py-1.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#0D7A5F]" />
          <span>
            {isFr
              ? '✓ Mot de passe robuste et hautement sécurisé !'
              : '✓ Password is strong and highly secure!'}
          </span>
        </div>
      )}

      {/* Checklist Indicators */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] pt-0.5">
        <span
          className={`inline-flex items-center gap-1 ${
            evaluation.hasMinLength ? 'text-[#0D7A5F] font-semibold' : 'text-[#5F7383]'
          }`}
        >
          {evaluation.hasMinLength ? (
            <Check className="w-3.5 h-3.5 text-[#0D7A5F]" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] inline-block" />
          )}
          {isFr ? '8+ caractères' : '8+ characters'}
        </span>

        <span
          className={`inline-flex items-center gap-1 ${
            evaluation.hasLetter && evaluation.hasNumber
              ? 'text-[#0D7A5F] font-semibold'
              : 'text-[#5F7383]'
          }`}
        >
          {evaluation.hasLetter && evaluation.hasNumber ? (
            <Check className="w-3.5 h-3.5 text-[#0D7A5F]" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] inline-block" />
          )}
          {isFr ? 'Lettres & chiffres' : 'Letters & numbers'}
        </span>

        <span
          className={`inline-flex items-center gap-1 ${
            evaluation.hasUpperLower || evaluation.hasSpecial
              ? 'text-[#0D7A5F] font-semibold'
              : 'text-[#94A3B8]'
          }`}
        >
          {evaluation.hasUpperLower || evaluation.hasSpecial ? (
            <Check className="w-3.5 h-3.5 text-[#0D7A5F]" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] inline-block" />
          )}
          {isFr ? 'Majuscule / symbole (optionnel)' : 'Uppercase / symbol (optional)'}
        </span>
      </div>
    </div>
  );
};
