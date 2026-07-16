'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { getAuthErrorMessage } from '@/lib/utils/authError';

function getPasswordRules(password: string) {
  return [
    { label: '12 characters minimum', met: password.length >= 12 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRules = useMemo(() => getPasswordRules(newPassword), [newPassword]);
  const passwordScore = passwordRules.filter((rule) => rule.met).length;
  const isPasswordStrong = passwordRules.every((rule) => rule.met);
  const hasPasswordInput = newPassword.length > 0;
  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const strengthLabel = isPasswordStrong ? 'Strong password' : 'Keep strengthening';
  const strengthFillClass = isPasswordStrong ? 'bg-[#D4AF37]' : 'bg-red-500';
  const strengthTextClass = isPasswordStrong ? 'text-[#D4AF37]' : 'text-red-500 dark:text-red-300';
  const canSubmit = !isSubmitting && isPasswordStrong && passwordsMatch;
  const errorMessage = typeof error === 'string' ? error.trim() : '';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isPasswordStrong) {
      setError('Use a stronger password that satisfies every security requirement.');
      return;
    }

    if (!passwordsMatch) {
      setError('Confirm password must match your new password exactly.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        throw updateError;
      }

      setIsComplete(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-alabaster px-4 py-16 font-sans text-brand-ink dark:bg-[#0A0A0A] dark:text-white sm:py-20">
      <div className="absolute inset-0 brand-grid" aria-hidden="true" />
      <div
        className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.035] blur-3xl dark:opacity-[0.08]"
        style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, #0093D8 48%, transparent 72%)' }}
        aria-hidden="true"
      />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-xl flex-col items-center justify-center gap-10">
        <div className="flex w-full flex-col items-center text-center">
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

          <div className="mt-8 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-amber/15 bg-[#B48924]/[0.06] px-3.5 py-1.5 text-xs font-medium text-brand-amber dark:border-[#D4AF37]/20 dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]">
              <ShieldCheck size={13} />
              Secure password reset
            </div>
            <h1 className="mx-auto my-8 max-w-xl text-center text-4xl font-black leading-tight tracking-normal text-brand-ink dark:text-white sm:my-10 sm:text-5xl">
              Create a new password.
            </h1>
            <p className="mx-auto max-w-md text-center text-sm leading-7 text-zinc-600 dark:text-white/50">
              Choose a strong password to restore access to your Smart Save member profile.
            </p>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-brand-border bg-brand-ghost p-5 shadow-2xl shadow-zinc-900/[0.04] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/30 sm:p-7">
          {isComplete ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#9DC03A]/20 bg-[#9DC03A]/10 text-[#9DC03A]">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="text-2xl font-bold text-brand-ink dark:text-white">Password updated.</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500 dark:text-white/45">
                Your new password is active. Log in with your updated details to continue.
              </p>
              <Link
                href="/signin?mode=login"
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-brand-ink shadow-lg shadow-[#D4AF37]/10 transition-all hover:bg-[#F5D06B]"
              >
                Back to login →
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 w-full">
                <h2 className="text-2xl font-bold text-brand-ink dark:text-white">Reset your password</h2>
                <p className="mt-2 text-sm text-zinc-500 dark:text-white/45">
                  Enter and confirm your new secure password.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600 dark:text-red-300">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
                <label className="flex w-full flex-col gap-2">
                  <span className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-white/40">
                    New Password
                  </span>
                  <span className="relative block">
                    <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        if (errorMessage) setError(null);
                      }}
                      autoComplete="new-password"
                      required
                      minLength={12}
                      className="block h-12 w-full appearance-none rounded-xl border border-brand-border bg-brand-ghost py-3.5 pl-11 pr-12 text-sm font-medium text-brand-ink outline-none transition-all placeholder:text-brand-secondary/45 focus:border-brand-amber focus:ring-2 focus:ring-[#D4AF37]/15 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/20 dark:focus:border-[#D4AF37]/50"
                      placeholder="At least 12 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-brand-amber dark:text-white/35 dark:hover:text-[#D4AF37]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </span>
                </label>

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
                        if (errorMessage) setError(null);
                      }}
                      autoComplete="new-password"
                      required
                      minLength={12}
                      className={`block h-12 w-full appearance-none rounded-xl border bg-brand-ghost py-3.5 pl-11 pr-12 text-sm font-medium text-brand-ink outline-none transition-all placeholder:text-brand-secondary/45 focus:ring-2 focus:ring-[#D4AF37]/15 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/20 ${
                        confirmPassword.length === 0
                          ? 'border-brand-border focus:border-brand-amber dark:border-white/[0.08] dark:focus:border-[#D4AF37]/50'
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
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </span>
                  {confirmPassword.length > 0 && (
                    <p className={`mt-2 text-xs font-medium ${passwordsMatch ? 'text-brand-emerald dark:text-[#9DC03A]' : 'text-red-500 dark:text-red-300'}`}>
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match yet'}
                    </p>
                  )}
                </label>

                <div className="w-full rounded-xl border border-brand-border bg-zinc-50/70 p-3 dark:border-white/[0.08] dark:bg-white/[0.035]">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-white/35">
                      Password Strength
                    </p>
                    {hasPasswordInput && <p className={`text-[11px] font-bold ${strengthTextClass}`}>{strengthLabel}</p>}
                  </div>
                  <div className="mb-3 grid grid-cols-5 gap-1.5" aria-hidden="true">
                    {passwordRules.map((rule, index) => (
                      <div
                        key={rule.label}
                        className={`h-1.5 rounded-full transition-colors duration-150 ${
                          passwordScore > index ? strengthFillClass : 'bg-zinc-200 dark:bg-white/[0.08]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {passwordRules.map((rule) => (
                      <div
                        key={rule.label}
                        className={`flex items-center gap-2 text-[11px] font-medium transition-colors duration-150 ${
                          rule.met ? 'text-[#D4AF37]' : 'text-zinc-500 dark:text-white/35'
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

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-bold text-brand-ink shadow-lg shadow-[#D4AF37]/10 transition-all hover:bg-[#F5D06B] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:opacity-60 disabled:shadow-none dark:disabled:bg-white/[0.08] dark:disabled:text-white/30"
                >
                  {isSubmitting ? 'Please wait...' : 'Update Password'}
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
