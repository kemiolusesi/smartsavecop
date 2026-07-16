'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

export default function PendingActivationPage() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace('/signin');
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0A] font-sans text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(139,195,74,0.08),transparent_30%)]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <img src="/logo.png" alt="Smart Save Cooperative Logo" className="h-16 w-16 object-contain" />
        <div className="mt-8 rounded-3xl border border-[#D4AF37]/25 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">Membership review</p>
          <h1 className="mt-4 text-3xl font-black sm:text-5xl">Account Pending Activation</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
            Your application is being reviewed by our team. You will receive access to your dashboard within 24 hours
            of payment confirmation.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#111]/80 p-5 text-left">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/35">Application Status</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1.5 text-sm font-black text-[#D4AF37]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                Under Review
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left">
            <p className="text-sm font-black text-white">Questions? Contact us</p>
            <a
              href="mailto:smartsavecooperative@gmail.com"
              className="mt-2 inline-flex break-all text-sm font-bold text-[#D4AF37] transition hover:text-[#f0cb63]"
            >
              smartsavecooperative@gmail.com
            </a>
            <p className="mt-3 text-xs leading-5 text-white/45">
              Please have your transaction reference ready when contacting us
            </p>
          </div>

          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-sm font-black text-[#0A0A0A] transition hover:bg-[#f0cb63] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            Sign Out
          </button>
        </div>
      </section>
    </main>
  );
}
