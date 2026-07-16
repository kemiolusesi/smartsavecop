'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock3, Loader2, Mail, RefreshCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toErrorMessage, toOptionalErrorMessage } from '@/lib/error-message';

function formatDate(value?: string | null) {
  if (!value) return 'Pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pending';
  return date.toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function PendingApprovalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadStatus(redirectApproved = false) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.replace('/signin?returnTo=/onboarding/pending');
      return;
    }

    setEmail(session.user.email || '');

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!data?.onboarding_completed || !data?.has_paid) {
      router.replace('/onboarding');
      return;
    }

    setProfile(data);

    if (data.approval_status === 'approved' && redirectApproved) {
      router.replace('/dashboard');
      return;
    }

    setMessage(
      data.approval_status === 'approved'
        ? 'Your account is approved. Redirecting to dashboard is now available.'
        : `Current status: ${data.approval_status || 'pending'}`
    );
  }

  useEffect(() => {
    loadStatus()
      .catch((err) => setError(toErrorMessage(err, 'Unable to load your application status.')))
      .finally(() => setIsLoading(false));
  }, []);

  async function checkStatus() {
    try {
      setIsChecking(true);
      setError('');
      await loadStatus(true);
    } catch (err) {
      setError(toErrorMessage(err, 'Unable to refresh your application status.'));
    } finally {
      setIsChecking(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-white/50">
        <Loader2 className="mr-3 animate-spin text-[#D4AF37]" size={18} />
        Loading application status...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-4 py-10 text-white">
      <section className="mx-auto w-full max-w-3xl rounded-lg border border-white/10 bg-white/[0.035] p-6 text-center sm:p-8">
        <div className="mx-auto flex w-fit items-center gap-3">
          <img src="/logo.png" alt="Smart Save Cooperative" className="h-12 w-12 object-contain" />
          <div className="text-left">
            <p className="text-sm font-black">Smart Save</p>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D4AF37]">Cooperative</p>
          </div>
        </div>

        <div className="mx-auto mt-10 flex h-20 w-20 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
          {profile?.approval_status === 'approved' ? <CheckCircle2 size={38} /> : <Clock3 size={38} />}
        </div>

        <h1 className="mt-6 text-3xl font-black">Application Submitted!</h1>
        <p className="mt-3 text-lg font-semibold text-white/80">Thank you for completing your registration.</p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/55">
          Your application is currently being reviewed by the Smart Save Cooperative team. This process typically takes
          1-2 business days. You will receive an email notification once your account has been approved.
        </p>

        {(error || message) && (
          <div
            className={`mt-6 rounded-lg border px-4 py-3 text-sm font-semibold ${
              error
                ? 'border-red-500/25 bg-red-500/10 text-red-200'
                : 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]'
            }`}
          >
            {error ? toOptionalErrorMessage(error) : toOptionalErrorMessage(message)}
          </div>
        )}

        <div className="mt-8 grid gap-4 rounded-lg border border-white/10 bg-[#0A0A0A] p-4 text-left sm:grid-cols-3">
          <Summary label="Name" value={profile?.full_name || 'Not set'} />
          <Summary label="Email" value={email || profile?.email || 'Not set'} />
          <Summary label="Submission Date" value={formatDate(profile?.updated_at || profile?.created_at)} />
        </div>

        <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.025] p-5 text-left">
          <h2 className="text-lg font-black">What happens next?</h2>
          <div className="mt-4 grid gap-3">
            {['Admin reviews your application', 'You receive an approval email', 'Log in to access your member dashboard'].map(
              (item, index) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-white/70">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-black text-[#0A0A0A]">
                    {index + 1}
                  </span>
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-[#0A0A0A] p-4 text-sm text-white/60">
          <Mail size={18} className="text-[#D4AF37]" />
          <p>Questions? Email us at smartsavecooperative@gmail.com or WhatsApp +234 901 019 8072</p>
        </div>

        <button
          type="button"
          onClick={checkStatus}
          disabled={isChecking}
          className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 text-sm font-black text-[#0A0A0A] transition hover:bg-[#f0cb63] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChecking ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
          Check Status
        </button>
      </section>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-widest text-white/35">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-white/80">{value}</p>
    </div>
  );
}
