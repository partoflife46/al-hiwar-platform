/**
 * Authentication sign-in portal with active-session switcher and password reset request.
 */

'use client';

/**
 * Module architecture and API reference for `src/app/login/page.tsx`.
 *
 * Exported symbols:
 * - `LoginPage` (Function): login page definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `@/lib/context/language-context`
 * - `@/components/auth/login-copy`
 *
 * @module app/login/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { UserSession } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import {
  getPostLoginPath,
  getWorkspaceForRole,
  LOGIN_COPY,
  VISITOR_LOGOUT_SESSION,
} from '@/components/auth/login-copy';

/** Renders the signed-in session overview card allowing quick workspace entry or logout. */
function ActiveSessionCard({
  user,
  isFr,
  onSignOut,
}: {
  user: UserSession;
  isFr: boolean;
  onSignOut: () => void;
}) {
  const copy = LOGIN_COPY[isFr ? 'fr' : 'en'];
  const workspace = getWorkspaceForRole(user.role, isFr);

  return (
    <Card className="p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] bg-white shadow-lg space-y-5">
      <div className="pb-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-[#0D7A5F] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>{copy.currentlySignedIn}</span>
          </div>
          <div className="text-base font-extrabold text-[#082233]">
            {user.firstName} {user.surname}
          </div>
          <div className="text-xs text-[#475569]">{user.email}</div>
        </div>
        <Badge variant="primary" className="font-mono self-start sm:self-center">
          {user.role}
        </Badge>
      </div>

      <div className="space-y-2.5">
        <Link
          href={workspace.href}
          className={buttonVariants({
            variant: 'primary',
            className: 'w-full justify-center gap-2 font-bold',
          })}
        >
          <span>{workspace.label}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
        <Link
          href="/profile"
          className={buttonVariants({
            variant: 'outline',
            className: 'w-full justify-center gap-2 font-semibold',
          })}
        >
          <User className="w-4 h-4 text-[#006C9C]" aria-hidden="true" />
          <span>{copy.manageProfile}</span>
        </Link>
        <Button
          type="button"
          variant="outline"
          onClick={onSignOut}
          className="w-full justify-center gap-2 font-semibold text-[#B91C1C] border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>{copy.signOutSwitch}</span>
        </Button>
      </div>
    </Card>
  );
}

/** Renders the Al Hiwar login page supporting email/password auth and password recovery. */
export default function LoginPage() {
  const router = useRouter();
  const { language, setLanguage, isFr } = useLanguage();
  const copy = LOGIN_COPY[language];

  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [resetMessage, setResetMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  /**
   * Memoized handler/selector for fetch session.
   */
  const fetchSession = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (res.ok) setCurrentUser((await res.json()).data);
    } catch {
      // ignore offline session probe
    }
  }, []);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    fetchSession();
    /**
     * Executes on role changed logic.
     * @param e - E value (`Event`).
     */
    const onRoleChanged = (e: Event) => {
      const detail = (e as CustomEvent<UserSession>).detail;
      if (detail) setCurrentUser(detail);
      else fetchSession();
    };
    window.addEventListener('alhiwar:role-changed', onRoleChanged);
    return () => window.removeEventListener('alhiwar:role-changed', onRoleChanged);
  }, [fetchSession]);

  /**
   * Asynchronously executes handle sign out for switch logic.
   */
  const handleSignOutForSwitch = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(VISITOR_LOGOUT_SESSION);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('alhiwar:role-changed', {
            detail: VISITOR_LOGOUT_SESSION,
          })
        );
      }
    } catch {
      // ignore logout error
    }
  };

  /**
   * Asynchronously executes handle login logic.
   * @param e - E value (`React.FormEvent`).
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const serverRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await serverRes.json();
      if (!serverRes.ok || !json.ok) {
        setErrorMsg(json.message || copy.errInvalidCreds);
        return;
      }
      const session: UserSession = json.data;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('alhiwar:role-changed', { detail: session })
        );
      }
      router.push(getPostLoginPath(session.role));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : copy.errLoginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Asynchronously executes handle forgot password logic.
   */
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg(copy.errEnterEmailFirst);
      return;
    }
    setErrorMsg(null);
    setResetMessage(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setResetMessage(isFr ? copy.resetSentFr : json.message);
      } else {
        setErrorMsg(json.message || copy.errResetFailed);
      }
    } catch {
      setErrorMsg(copy.errResetNetwork);
    }
  };

  const isSignedIn = Boolean(currentUser && currentUser.role !== 'VISITOR');

  return (
    <div className="mx-auto max-w-xl px-5 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="gold" className="text-xs font-bold uppercase tracking-wider">
          {copy.badge}
        </Badge>
        <div className="flex items-center gap-1.5 text-xs">
          {(
            [
              { id: 'en', label: 'English' },
              { id: 'fr', label: 'Français' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={language === opt.id}
              onClick={() => setLanguage(opt.id)}
              className={`min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1 rounded-lg font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${
                language === opt.id
                  ? 'bg-[#006C9C] text-white shadow-sm'
                  : 'bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#082233]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082233] text-balance">
          {isSignedIn ? copy.signedInTitle : copy.signInTitle}
        </h1>
        <p className="text-xs sm:text-sm text-[#475569]">
          {isSignedIn ? copy.signedInDesc : copy.signInDesc}
        </p>
      </div>

      {isSignedIn && currentUser ? (
        <ActiveSessionCard
          user={currentUser}
          isFr={isFr}
          onSignOut={handleSignOutForSwitch}
        />
      ) : (
        <Card className="p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] bg-white shadow-lg space-y-5">
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

          {resetMessage && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{resetMessage}</span>
            </div>
          )}

          {/* Form landmark */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-[#082233]"
              >
                {copy.emailLabel}
              </label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-bold text-[#082233]"
                >
                  {copy.pwdLabel}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="min-h-[44px] px-2 -my-2 text-xs font-semibold text-[#006C9C] hover:underline inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
                >
                  <KeyRound className="w-3 h-3" aria-hidden="true" />
                  <span>{copy.forgotPwd}</span>
                </button>
              </div>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full py-3 font-bold gap-2"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>{isLoading ? copy.signingIn : copy.signInBtn}</span>
            </Button>
          </form>

          <div className="text-center text-xs text-[#475569] pt-4 border-t border-[#E2E8F0]">
            {copy.newToPlatform}
            <Link
              href="/register"
              className="inline-flex items-center min-h-[44px] px-1 font-bold text-[#006C9C] hover:underline"
            >
              {copy.createAccount}
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
