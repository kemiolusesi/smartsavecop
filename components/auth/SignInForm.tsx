'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, MailCheck, ShieldCheck, UserRound, X } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { hashBackupCode } from '@/utils/mfa';
import { getAuthErrorMessage } from '@/lib/utils/authError';

type AuthMode = 'signup' | 'login';
type MfaMode = 'totp' | 'backup';
type MfaFactor = { id: string; status?: string; factor_type?: string };
type AuthUserWithMetadata = { app_metadata?: Record<string, unknown> } | null | undefined;

function getSafeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard';
  }

  return value;
}

function isExistingEmailError(message = '') {
  return /already|registered|exists|duplicate/i.test(message);
}

function displayNameFromEmail(email: string) {
  return email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || 'Smart Save Member';
}

function getSiteUrl() {
  return window.location.origin;
}

function getAuthErrorNotice(errorCode: string | null, message: string | null) {
  if (message?.trim()) return message.trim();

  if (!errorCode) return null;

  if (errorCode === 'missing_auth_code') {
    return 'The sign-in link is missing its verification code. Please request a fresh link and try again.';
  }

  if (errorCode === 'auth_callback_failed') {
    return 'We could not complete that auth link. Please request a fresh link or sign in with your password.';
  }

  return errorCode;
}

function hasAdminClaim(user: AuthUserWithMetadata) {
  return user?.app_metadata?.is_admin === true;
}

function getPasswordRules(password: string) {
  return [
    { label: '12 characters minimum', met: password.length >= 12 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = useMemo(() => getSafeReturnTo(searchParams.get('returnTo')), [searchParams]);
  const hasConfirmedEmail = searchParams.get('confirmed') === 'true';
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaUserId, setMfaUserId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMode, setMfaMode] = useState<MfaMode>('totp');
  const [error, setError] = useState<string | null>(() =>
    getAuthErrorNotice(searchParams.get('error'), searchParams.get('message'))
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    hasConfirmedEmail
      ? 'Email confirmed! Please log in to proceed to your onboarding session.'
      : searchParams.get('registered')
        ? 'Registration completed. Log in to continue to your dashboard.'
        : null
  );

  const isSignup = mode === 'signup';
  const passwordRules = useMemo(() => getPasswordRules(password), [password]);
  const passwordScore = passwordRules.filter((rule) => rule.met).length;
  const isPasswordStrong = passwordRules.every((rule) => rule.met);
  const hasPasswordInput = password.length > 0;
  const strengthLabel = isPasswordStrong ? 'Strong password' : 'Keep strengthening';
  const strengthFillClass = isPasswordStrong ? 'bg-[#D4AF37]' : 'bg-red-500';
  const strengthTextClass = isPasswordStrong ? 'text-[#D4AF37]' : 'text-red-500 dark:text-red-300';
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = !isSubmitting && (!isSignup || (isPasswordStrong && passwordsMatch));
  const errorMessage = error && typeof error === 'string' ? error : '';
  const noticeMessage = notice || '';

  function isInvalidLoginError(message = '') {
    return /invalid login credentials|invalid credentials|incorrect password|wrong password/i.test(message);
  }

  async function handlePasswordReset() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Enter your email address so we can send your reset link.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${getSiteUrl()}/auth/callback?type=recovery`,
      });

      if (resetError) {
        setError(getAuthErrorMessage(resetError));
        return;
      }

      setNotice('Password reset email sent. Check your inbox.');
      setPasswordResetSent(true);
      setShowForgotPassword(false);
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyMfaCode() {
    if (!mfaFactorId || mfaCode.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });

      if (challengeError) {
        setError(getAuthErrorMessage(challengeError));
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });

      if (verifyError) {
        setError('Invalid code. Please try again.');
        return;
      }

      const destination = await getPostSignInDestination(mfaUserId || undefined);
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyBackupCode() {
    const normalizedCode = mfaCode.trim().toUpperCase();

    if (!mfaUserId || normalizedCode.length !== 8) {
      setError('Enter an 8-character backup code.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const codeHash = await hashBackupCode(mfaUserId, normalizedCode);
      const { data, error: updateError } = await supabase
        .from('mfa_backup_codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('user_id', mfaUserId)
        .eq('code_hash', codeHash)
        .eq('used', false)
        .select('id')
        .maybeSingle();

      if (updateError || !data) {
        setError('Invalid code. Please try again.');
        return;
      }

      const destination = await getPostSignInDestination(mfaUserId || undefined);
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mfaMode === 'backup') {
      await verifyBackupCode();
      return;
    }

    await verifyMfaCode();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setNotice(null);
    setShowForgotPassword(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError('Enter your email and password to continue.');
      setIsSubmitting(false);
      return;
    }

    if (isSignup && !isPasswordStrong) {
      setError('Use a stronger password that satisfies every security requirement.');
      setIsSubmitting(false);
      return;
    }

    if (isSignup && !passwordsMatch) {
      setError('Confirm password must match your secure password exactly.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim() || displayNameFromEmail(normalizedEmail),
            },
            emailRedirectTo: `${getSiteUrl()}/auth/callback?type=signup`,
          },
        });

        console.error('RAW SIGNUP ERROR:', JSON.stringify(signUpError));

        if (signUpError) {
          const msg = getAuthErrorMessage(signUpError);
          const displayMsg = msg === '{}' || !msg
            ? 'Account creation failed. Please check that your email is valid and try again. If the problem persists contact smartsavecooperative@gmail.com'
            : msg;
          if (isExistingEmailError(displayMsg)) {
            setMode('login');
            setError('This email already has a Smart Save account. Log in with your password to continue.');
            return;
          }

          setError(displayMsg);
          return;
        }

        const noNewIdentity = data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;

        if (noNewIdentity) {
          setMode('login');
          setError('This email already has a Smart Save account. Log in with your password to continue.');
          return;
        }

        if (data?.user && !data?.session) {
          setError(null);
          setSuccessMessage(
            'Account created! Please check your email to confirm your account before signing in.'
          );
          setFullName('');
          setEmail(normalizedEmail);
          setPassword('');
          setConfirmPassword('');
          return;
        }

        if (data?.session) {
          try {
            await fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: normalizedEmail,
                type: 'welcome',
                memberName: fullName.trim() || displayNameFromEmail(normalizedEmail),
                details: {},
              }),
            });
          } catch {
            // Email failure should never block onboarding.
          }

          router.push('/onboarding');
          router.refresh();
          return;
        }

        setError('Signup failed. Please try again.');
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        const message = getAuthErrorMessage(signInError);
        if (isInvalidLoginError(message)) {
          setError('Invalid login credentials. Please check your email and password.');
          setShowForgotPassword(true);
          return;
        }

        setError(message);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, onboarding_completed, approval_status, is_active')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (profileError) {
        setError(getAuthErrorMessage(profileError));
        return;
      }

      if (profileData?.is_admin === true) {
        router.replace('/admin');
        router.refresh();
        return;
      }

      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) {
        setError(getAuthErrorMessage(factorsError));
        return;
      }

      const verifiedTotpFactor = factorsData.totp.find((factor: MfaFactor) => factor.status === 'verified');

      if (verifiedTotpFactor) {
        setMfaRequired(true);
        setMfaFactorId(verifiedTotpFactor.id);
        setMfaUserId(data.user?.id || '');
        setMfaCode('');
        setMfaMode('totp');
        setPassword('');
        return;
      }

      const {
        data: { user: signedInUser },
      } = await supabase.auth.getUser();

      if (hasAdminClaim(signedInUser || data.user)) {
        router.replace('/admin');
        router.refresh();
        return;
      }

      if (!profileData?.onboarding_completed) {
        router.replace('/onboarding');
        return;
      }

      if (profileData.approval_status !== 'approved' || profileData.is_active !== true) {
        router.replace('/pending-activation');
        return;
      }

      router.replace('/dashboard');
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function getPostSignInDestination(userId?: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (hasAdminClaim(user)) {
      return '/admin';
    }

    const activeUserId = userId || user?.id;
    if (!activeUserId) return '/dashboard';

    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin, onboarding_completed, approval_status, is_active')
      .eq('user_id', activeUserId)
      .maybeSingle();

    if (profileData?.is_admin === true) {
      return '/admin';
    }

    if (!profileData?.onboarding_completed) {
      return '/onboarding';
    }

    if (profileData.approval_status !== 'approved' || profileData.is_active !== true) {
      return '/pending-activation';
    }

    return '/dashboard';
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-alabaster px-4 py-16 font-sans text-brand-ink dark:bg-[#0A0A0A] dark:text-white sm:py-20">
      <div className="absolute inset-0 brand-grid" aria-hidden="true" />
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(212, 175, 55, 0.16) 0%, rgba(245, 240, 232, 0) 72%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[-12%] left-1/2 h-[620px] w-[920px] -translate-x-1/2 rounded-full opacity-[0.24] blur-3xl dark:hidden"
        style={{
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.78) 0%, rgba(30,144,255,0.4) 48%, rgba(245,240,232,0) 76%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.035] blur-3xl dark:opacity-[0.08]"
        style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, #0093D8 48%, transparent 72%)' }}
        aria-hidden="true"
      />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-xl flex-col items-center justify-center gap-10">
        <div className="flex w-full flex-col items-center text-center">
          <div className="relative flex w-full items-center justify-center">
            <Link href="/" className="inline-flex items-center justify-center gap-3" aria-label="Back to Smart Save home">
              <img
                src="/logo.png"
                alt="Smart Save Cooperative Logo"
                width={48}
                height={48}
                className="h-12 w-auto"
                style={{ width: '48px', height: '48px', maxWidth: '48px', objectFit: 'contain' }}
              />
              <div>
                <p className="text-sm font-bold leading-none text-brand-ink dark:text-white">Smart Save</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-amber dark:text-[#D4AF37]/80">
                  Cooperative
                </p>
              </div>
            </Link>
            <Link
              href="/"
              aria-label="Cancel sign in and return home"
              className="absolute right-8 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-brand-ink transition hover:text-[#D4AF37] dark:text-white sm:right-2"
            >
              <X size={22} />
            </Link>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(196,160,48,0.25)] bg-[rgba(196,160,48,0.10)] px-3.5 py-1.5 text-xs font-medium text-[#8B6914] dark:border-[#D4AF37]/20 dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]">
              <ShieldCheck size={13} />
              Secure member access
            </div>
            <h1 className="mx-auto my-8 max-w-xl text-center text-4xl font-black leading-tight tracking-normal text-[#1A1410] dark:text-white sm:my-10 sm:text-5xl">
              The Modern Ecosystem for Shared Wealth and Security
            </h1>
            <p className="mx-auto max-w-md text-center text-base leading-7 text-[#6B5E4E] dark:text-white/50">
              Create or access your Smart Save profile with email and password. Your dashboard, onboarding progress,
              and unfinished routes stay protected.
            </p>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-[#E0D5C5] bg-[#FFFFFF] p-5 shadow-[0_8px_32px_rgba(139,109,56,0.12)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/30 sm:p-7">
          {passwordResetSent ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                <MailCheck size={30} />
              </div>
              <h2 className="text-2xl font-bold text-brand-ink dark:text-white">Password reset email sent.</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500 dark:text-white/45">
                Check your inbox and follow the link to create a new password.
              </p>
            </div>
          ) : verificationSent ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-emerald/15 bg-brand-mint text-brand-emerald dark:border-[#9DC03A]/20 dark:bg-[#9DC03A]/10 dark:text-[#9DC03A]">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="text-2xl font-bold text-brand-ink dark:text-white">Verification link sent!</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500 dark:text-white/45">
                Please check your email to activate your account. Once verified, return here and log in to proceed to
                your onboarding session.
              </p>
              <button
                type="button"
                onClick={() => {
                  setVerificationSent(false);
                  setMode('login');
                  setNotice('Email confirmed? Log in with your password to continue to onboarding.');
                }}
                className="mt-8 inline-flex items-center justify-center rounded-xl border border-brand-border bg-brand-ghost px-5 py-3 text-sm font-semibold text-brand-ink transition-all hover:border-brand-input dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:border-white/20 dark:hover:text-white"
              >
                Continue to Log In
              </button>
            </div>
          ) : mfaRequired ? (
            <div className="flex min-h-[420px] flex-col justify-center">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                  <ShieldCheck size={30} />
                </div>
                <h2 className="text-2xl font-bold text-brand-ink dark:text-white">Two-factor verification</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-white/45">
                  {mfaMode === 'totp'
                    ? 'Enter the 6-digit code from your authenticator app'
                    : 'Enter one of your saved 8-character backup codes'}
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600 dark:text-red-300">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <label className="flex w-full flex-col gap-2">
                  <span className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-white/40">
                    {mfaMode === 'totp' ? 'Authenticator Code' : 'Backup Code'}
                  </span>
                  <input
                    value={mfaCode}
                    onChange={(event) => {
                      const nextValue =
                        mfaMode === 'totp'
                          ? event.target.value.replace(/\D/g, '').slice(0, 6)
                          : event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8);
                      setMfaCode(nextValue);
                      setError(null);
                    }}
                    inputMode={mfaMode === 'totp' ? 'numeric' : 'text'}
                    autoComplete="one-time-code"
                    className="block h-12 w-full appearance-none rounded-xl border border-[#D4C9B8] bg-[#FDFAF5] px-4 py-3.5 text-center font-mono text-lg font-black tracking-[0.35em] text-[#1A1410] outline-none transition-all placeholder:text-[#A09080] focus:border-[#C4A030] focus:ring-2 focus:ring-[rgba(196,160,48,0.15)] dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/20 dark:focus:border-[#D4AF37]/50"
                    placeholder={mfaMode === 'totp' ? '000000' : 'ABCDEFGH'}
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || (mfaMode === 'totp' ? mfaCode.length !== 6 : mfaCode.length !== 8)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-bold text-brand-ink shadow-lg shadow-[#D4AF37]/10 transition-all hover:bg-[#F5D06B] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:opacity-60 disabled:shadow-none dark:disabled:bg-white/[0.08] dark:disabled:text-white/30"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify'}
                  <ArrowRight size={16} />
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setMfaMode((current) => (current === 'totp' ? 'backup' : 'totp'));
                  setMfaCode('');
                  setError(null);
                }}
                className="mt-5 text-center text-sm font-bold text-brand-amber underline-offset-4 transition hover:underline dark:text-[#D4AF37]"
              >
                {mfaMode === 'totp' ? 'Lost access? Use a backup code' : 'Use authenticator app instead'}
              </button>
            </div>
          ) : (
            <>
          <div className="mb-6 grid w-full grid-cols-2 rounded-xl border border-brand-border bg-[#EDE8DF] p-1 dark:border-white/[0.08] dark:bg-white/[0.04]">
            {(['signup', 'login'] as AuthMode[]).map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                onClick={() => {
                  setMode(nextMode);
                  setError(null);
                  setSuccessMessage(null);
                  setNotice(null);
                  setShowForgotPassword(false);
                  setMfaRequired(false);
                  setMfaCode('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className={`inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  mode === nextMode
                    ? 'bg-[#C4A030] text-[#FFFFFF] shadow-sm dark:bg-[#D4AF37] dark:text-brand-ink'
                    : 'bg-[#F0EBE0] text-[#6B5E4E] hover:text-brand-ink dark:bg-transparent dark:text-white/45 dark:hover:text-white'
                }`}
              >
                {nextMode === 'signup' ? 'New User' : 'Returning User'}
              </button>
            ))}
          </div>

          <div className="mb-6 w-full">
            <h2 className="text-2xl font-bold text-brand-ink dark:text-white">
              {isSignup ? 'Create your profile' : 'Log in to continue'}
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-white/45">
              {isSignup
                ? 'Start with your email and a secure password.'
                : 'Use your registered email and password'}
            </p>
          </div>

          {error && typeof error === 'string' && (
            <div
              className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600 dark:text-red-300"
            >
              <span>{error}</span>
            </div>
          )}
          {noticeMessage && !errorMessage && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-brand-amber/15 bg-[#B48924]/[0.06] px-4 py-3 text-sm text-brand-amber dark:border-[#D4AF37]/20 dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]">
              <MailCheck className="h-4 w-4 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
          )}
          {showForgotPassword && errorMessage && !isSignup && (
            <div className="mb-5 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-sm text-zinc-600 dark:text-white/55">
              <span>Forgot Password? </span>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isSubmitting}
                className="font-bold text-brand-amber underline-offset-4 transition hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#D4AF37]"
              >
                Reset your password
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
            {isSignup && (
              <label className="flex w-full flex-col gap-2">
                <span className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-white/40">
                  Full Name
                </span>
                <span className="relative block">
                  <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/30" />
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    className="block h-12 w-full appearance-none rounded-xl border border-[#D4C9B8] bg-[#FDFAF5] py-3.5 pl-11 pr-4 text-sm font-medium text-[#1A1410] outline-none transition-all placeholder:text-[#A09080] focus:border-[#C4A030] focus:ring-2 focus:ring-[rgba(196,160,48,0.15)] dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/20 dark:focus:border-[#D4AF37]/50"
                    placeholder="Your name"
                  />
                </span>
              </label>
            )}

            <label className="flex w-full flex-col gap-2">
              <span className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-white/40">
                Email
              </span>
              <span className="relative block">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="block h-12 w-full appearance-none rounded-xl border border-[#D4C9B8] bg-[#FDFAF5] py-3.5 pl-11 pr-4 text-sm font-medium text-[#1A1410] outline-none transition-all placeholder:text-[#A09080] focus:border-[#C4A030] focus:ring-2 focus:ring-[rgba(196,160,48,0.15)] dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/20 dark:focus:border-[#D4AF37]/50"
                  placeholder="you@example.com"
                />
              </span>
            </label>

            <label className="flex w-full flex-col gap-2">
              <span className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-white/40">
                Password
              </span>
              <span className="relative block">
                <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errorMessage) {
                      setError(null);
                    }
                    setShowForgotPassword(false);
                  }}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  minLength={isSignup ? 12 : undefined}
                  className="block h-12 w-full appearance-none rounded-xl border border-[#D4C9B8] bg-[#FDFAF5] py-3.5 pl-11 pr-12 text-sm font-medium text-[#1A1410] outline-none transition-all placeholder:text-[#A09080] focus:border-[#C4A030] focus:ring-2 focus:ring-[rgba(196,160,48,0.15)] dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/20 dark:focus:border-[#D4AF37]/50"
                  placeholder={isSignup ? 'At least 12 characters' : 'Your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-brand-amber dark:text-white/35 dark:hover:text-[#D4AF37]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </span>
            </label>

            {isSignup && (
              <>
                <label className="flex w-full flex-col gap-2">
                  <span className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-white/40">
                    Confirm Password
                  </span>
                  <span className="relative block">
                    <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/30" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        if (errorMessage) {
                          setError(null);
                        }
                      }}
                      autoComplete="new-password"
                      required
                      minLength={12}
                      className={`block h-12 w-full appearance-none rounded-xl border bg-[#FDFAF5] py-3.5 pl-11 pr-12 text-sm font-medium text-[#1A1410] outline-none transition-all placeholder:text-[#A09080] focus:ring-2 focus:ring-[rgba(196,160,48,0.15)] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/20 ${
                        confirmPassword.length === 0
                          ? 'border-[#D4C9B8] focus:border-[#C4A030] dark:border-white/[0.08] dark:focus:border-[#D4AF37]/50'
                          : passwordsMatch
                            ? 'border-brand-emerald/40 focus:border-brand-emerald dark:border-[#9DC03A]/50'
                            : 'border-red-500/40 focus:border-red-500 dark:border-red-400/50'
                      }`}
                      placeholder="Retype password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-brand-amber dark:text-white/35 dark:hover:text-[#D4AF37]"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </span>
                  {confirmPassword.length > 0 && (
                    <p
                      className={`mt-2 text-xs font-medium ${
                        passwordsMatch
                          ? 'text-brand-emerald dark:text-[#9DC03A]'
                          : 'text-red-500 dark:text-red-300'
                      }`}
                    >
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match yet'}
                    </p>
                  )}
                </label>

                <div className="w-full rounded-xl border border-brand-border bg-zinc-50/70 p-3 dark:border-white/[0.08] dark:bg-white/[0.035]">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-white/35">
                      Password Strength
                    </p>
                    {hasPasswordInput && (
                      <p className={`text-[11px] font-bold ${strengthTextClass}`}>
                        {strengthLabel}
                      </p>
                    )}
                  </div>
                  <div className="mb-3 grid grid-cols-5 gap-1.5" aria-hidden="true">
                    {passwordRules.map((rule, index) => (
                      <div
                        key={rule.label}
                        className={`h-1.5 rounded-full transition-colors duration-150 ${
                          passwordScore > index
                            ? strengthFillClass
                            : 'bg-zinc-200 dark:bg-white/[0.08]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {passwordRules.map((rule) => (
                      <div
                        key={rule.label}
                        className={`flex items-center gap-2 text-[11px] font-medium transition-colors duration-150 ${
                          rule.met
                            ? 'text-[#D4AF37]'
                            : 'text-zinc-500 dark:text-white/35'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-150 ${
                            rule.met
                              ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                              : 'border-zinc-300 bg-brand-ghost dark:border-white/10 dark:bg-white/[0.03]'
                          }`}
                        >
                          {rule.met && <CheckCircle2 size={11} />}
                        </span>
                        {rule.label}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {successMessage && (
              <div className="rounded-xl border border-brand-emerald/20 bg-brand-mint px-4 py-3 text-sm font-semibold text-brand-emerald dark:border-[#9DC03A]/20 dark:bg-[#9DC03A]/10 dark:text-[#9DC03A]">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-bold text-brand-ink shadow-lg shadow-[#D4AF37]/10 transition-all hover:bg-[#F5D06B] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:opacity-60 disabled:shadow-none dark:disabled:bg-white/[0.08] dark:disabled:text-white/30"
            >
              {isSubmitting ? 'Please wait...' : isSignup ? 'Create Account' : 'Log In'}
              <ArrowRight size={16} />
            </button>
          </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
