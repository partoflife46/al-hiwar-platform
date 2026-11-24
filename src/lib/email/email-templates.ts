/**
 * Module architecture and API reference for `src/lib/email/email-templates.ts`.
 *
 * Exported symbols:
 * - `RenderedEmailTemplate` (Interface): rendered email template definition.
 * - `buildOtpEmailTemplate` (Function): build otp email template definition.
 * - `buildPasswordResetTemplate` (Function): build password reset template definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 *
 * @module lib/email/email-templates
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Shared platform module for email templates utilities and configuration.
 * Exports typed helpers consumed across the Al-Hiwar web application.
 * @module lib/email/email-templates
 * @exports RenderedEmailTemplate, buildOtpEmailTemplate, buildPasswordResetTemplate
 */

import type { SupportedLanguage } from '@/lib/db/types';

/**
 * Type contract defining rendered email template.
 * Includes fields/members: subject, text, html.
 */
export interface RenderedEmailTemplate {
  subject: string;
  text: string;
  html: string;
}

/**
 * Builds the localized 6-digit OTP verification email subject, plain text, and HTML body.
 */
export function buildOtpEmailTemplate(
  otp: string,
  language: SupportedLanguage = 'en'
): RenderedEmailTemplate {
  const isFr = language === 'fr';
  const subject = isFr
    ? 'Al Hiwar — Votre code de vérification à 6 chiffres'
    : 'Al Hiwar — Your 6-Digit Email Verification Code';

  const text = isFr
    ? `Votre code de vérification Al Hiwar est : ${otp}. Ce code expire dans 5 minutes.`
    : `Your Al Hiwar verification code is: ${otp}. This code expires in 5 minutes.`;

  const heading = isFr ? 'Vérification de votre compte Al Hiwar' : 'Verify Your Al Hiwar Account';
  const intro = isFr
    ? 'Veuillez saisir le code de sécurité ci-dessous pour confirmer votre adresse e-mail :'
    : 'Please enter the verification code below to confirm your email address:';
  const footer = isFr
    ? 'Ce code est à usage unique et expire dans 5 minutes (limite de 5 tentatives).'
    : 'This single-use code expires in 5 minutes (maximum 5 verification attempts).';

  const html = [
    '<div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:24px;',
    'border:1px solid #E2E8F0;border-radius:12px;background:#ffffff;">',
    `<h2 style="color:#082233;margin-top:0;">${heading}</h2>`,
    `<p style="color:#475569;font-size:14px;line-height:1.6;">${intro}</p>`,
    '<div style="text-align:center;margin:28px 0;">',
    '<span style="font-family:monospace;font-size:32px;font-weight:bold;letter-spacing:6px;',
    `color:#006C9C;background:#F0F9FF;padding:12px 24px;border-radius:8px;">${otp}</span>`,
    '</div>',
    `<p style="color:#64748B;font-size:12px;">${footer}</p>`,
    '</div>',
  ].join('');

  return { subject, text, html };
}

/**
 * Builds the localized password reset email subject, plain text, and HTML body.
 */
export function buildPasswordResetTemplate(
  resetUrl: string,
  language: SupportedLanguage = 'en'
): RenderedEmailTemplate {
  const isFr = language === 'fr';
  const subject = isFr
    ? 'Al Hiwar — Réinitialisation de votre mot de passe'
    : 'Al Hiwar — Password Reset Instructions';

  const text = isFr
    ? `Pour réinitialiser votre mot de passe Al Hiwar (valide 15 min) : ${resetUrl}`
    : `To reset your Al Hiwar password (valid 15 minutes): ${resetUrl}`;

  const heading = isFr ? 'Réinitialisation de mot de passe' : 'Reset Your Password';
  const intro = isFr
    ? 'Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :'
    : 'Click the button below to choose a new password:';
  const cta = isFr ? 'Réinitialiser mon mot de passe' : 'Reset Password';
  const footer = isFr
    ? 'Ce lien expirera dans 15 minutes.'
    : 'This link will expire in 15 minutes.';

  const html = [
    '<div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:24px;',
    'border:1px solid #E2E8F0;border-radius:12px;background:#ffffff;">',
    `<h2 style="color:#082233;margin-top:0;">${heading}</h2>`,
    `<p style="color:#475569;font-size:14px;line-height:1.6;">${intro}</p>`,
    '<div style="text-align:center;margin:24px 0;">',
    `<a href="${resetUrl}" style="background:#006C9C;color:#ffffff;text-decoration:none;`,
    `padding:12px 24px;font-weight:bold;font-size:14px;border-radius:8px;">${cta}</a>`,
    '</div>',
    `<p style="color:#64748B;font-size:12px;">${footer}</p>`,
    '</div>',
  ].join('');

  return { subject, text, html };
}
