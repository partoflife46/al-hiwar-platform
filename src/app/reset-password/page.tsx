/**
 * Password reset completion portal accessed from time-limited recovery email links.
 */

'use client';

/**
 * Module architecture and API reference for `src/app/reset-password/page.tsx`.
 *
 * Exported symbols:
 * - `ResetPasswordPage` (Function): reset password page definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `@/lib/context/language-context`
 * - `@/components/ui/password-strength-meter`
 * - `@/lib/security/password-policy`
 *
 * @module app/reset-password/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { SupportedLanguage } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LogIn,
} from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { evaluatePassword } from '@/lib/security/password-policy';

/**
 * Constant definition for reset copy.
 */
const RESET_COPY: Record<
  SupportedLanguage,
  {
    badge: string;
    heading: string;
    subtitle: string;
    updatedTitle: string;
    proceedSignIn: string;
    missingLinkNotice: string;
    emailLabel: string;
    newPwdLabel: string;
    confirmPwdLabel: string;
    updatingBtn: string;
    updateBtn: string;
    loading: string;
    errMismatch: string;
    errWeak: string;
    errFailed: string;
    errNetwork: string;
    successDefault: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    badge: 'Al Hiwar Platform • Security & Credentials',
    heading: 'Reset Your Password',
    subtitle:
      'Create a new, secure password to restore access to your account.',
    updatedTitle: 'Password Updated!',
    proceedSignIn: 'Proceed to Sign In',
    missingLinkNotice:
      'Notice: Missing password reset token. Please ensure you clicked the full link from your reset email.',
    emailLabel: 'Email Address',
    newPwdLabel: 'New Password (8+ chars, letters & numbers) *',
    confirmPwdLabel: 'Confirm New Password',
    updatingBtn: 'Updating…',
    updateBtn: 'Update Password',
    loading: 'Loading reset portal…',
    errMismatch: 'Passwords do not match. Please re-enter.',
    errWeak:
      'Password must be at least 8 characters long and contain letters and numbers.',
    errFailed: 'Failed to reset password',
    errNetwork: 'Network error',
    successDefault: 'Password successfully updated.',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    badge: 'Sécurité & Identifiants • Al Hiwar',
    heading: 'Réinitialiser votre mot de passe',
    subtitle:
      'Créez un nouveau mot de passe sécurisé pour restaurer l’accès à votre compte.',
    updatedTitle: 'Mot de passe mis à jour !',
    proceedSignIn: 'Aller à la page de connexion',
    missingLinkNotice:
      'Remarque : Jeton de réinitialisation manquant. Veuillez cliquer sur le lien complet reçu dans votre e-mail.',
    emailLabel: 'Adresse e-mail',
    newPwdLabel:
      'Nouveau mot de passe (8+ caractères, combinaison lettres & chiffres) *',
    confirmPwdLabel: 'Confirmer le nouveau mot de passe',
    updatingBtn: 'Mise à jour…',
    updateBtn: 'Mettre à jour le mot de passe',
    loading: 'Chargement du portail de réinitialisation…',
    errMismatch: 'Les mots de passe ne correspondent pas. Veuillez ressaisir.',
    errWeak:
      'Le mot de passe doit comporter au moins 8 caractères et combiner lettres et chiffres.',
    errFailed: 'Échec de réinitialisation du mot de passe',
    errNetwork: 'Erreur réseau',
    successDefault: 'Mot de passe mis à jour avec succès.',
  },
};

/** Renders the interactive password-reset form bound to query string recovery parameters. */
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const { language, setLanguage, isFr } = useLanguage();
  const copy = RESET_COPY[language];
  const resetCode = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = React.useState(emailParam);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  /**
   * Asynchronously executes handle submit logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg(copy.errMismatch);
      return;
    }
    const pwEval = evaluatePassword(newPassword);
    if (!pwEval.isValid) {
      const policyMsg = isFr ? pwEval.errorMessageFr : pwEval.errorMessageEn;
      setErrorMsg(policyMsg || copy.errWeak);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token: resetCode,
          newPassword: newPassword.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || copy.errFailed);
        return;
      }
      setSuccessMsg(
        isFr ? copy.successDefault : json.message || copy.successDefault
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : copy.errNetwork);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="gold" className="text-xs font-bold uppercase tracking-wider">
          {copy.badge}
        </Badge>
        <div className="flex items-center gap-1 rounded-xl bg-white border border-[#E2E8F0] p-1 text-xs">
          {(
            [
              { id: 'en', label: 'English' },
              { id: 'fr', label: 'Français' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLanguage(opt.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${
                language === opt.id
                  ? 'bg-[#006C9C] text-white shadow-sm'
                  : 'text-[#5F7383] hover:text-[#082233]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082233] text-balance">
          {copy.heading}
        </h1>
        <p className="text-xs sm:text-sm text-[#5F7383]">{copy.subtitle}</p>
      </div>

      <Card className="p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] bg-white shadow-lg space-y-5">
        {successMsg ? (
          <div
            role="status"
            aria-live="polite"
            className="text-center space-y-4 py-4 animate-in fade-in"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-emerald-950">
              {copy.updatedTitle}
            </h3>
            <p className="text-xs text-emerald-800">{successMsg}</p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="primary" className="font-bold gap-2">
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  {copy.proceedSignIn}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!resetCode && (
              <div
                role="status"
                className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-800"
              >
                {copy.missingLinkNotice}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="reset-email"
                className="block text-xs font-bold text-[#082233]"
              >
                {copy.emailLabel}
              </label>
              <Input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reset-new-password"
                className="block text-xs font-bold text-[#082233]"
              >
                {copy.newPwdLabel}
              </label>
              <Input
                id="reset-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <PasswordStrengthMeter password={newPassword} lang={language} />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-bold text-[#082233]"
              >
                {copy.confirmPwdLabel}
              </label>
              <Input
                id="reset-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !resetCode}
              className="w-full py-3 font-bold gap-2"
            >
              <KeyRound className="w-4 h-4" aria-hidden="true" />
              {isLoading ? copy.updatingBtn : copy.updateBtn}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

/** Suspense loading fallback for the password reset portal. */
function ResetLoadingFallback() {
  const { language } = useLanguage();
  return (
    <div className="p-8 text-center text-sm text-slate-500">
      {RESET_COPY[language].loading}
    </div>
  );
}

/** Renders the Suspense-wrapped password reset page. */
export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<ResetLoadingFallback />}>
      <ResetPasswordForm />
    </React.Suspense>
  );
}
