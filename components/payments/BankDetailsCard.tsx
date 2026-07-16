'use client';

import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';
import { BANK_DETAILS } from '@/lib/constants/bankDetails';

export default function BankDetailsCard() {
  const [copied, setCopied] = useState(false);

  async function copyAccountNumber() {
    await navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-white/40">
            Account Name
          </p>
          <p className="mt-1 text-base font-bold text-brand-ink dark:text-white">
            {BANK_DETAILS.accountName}
          </p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-white/40">
            Bank Name
          </p>
          <p className="mt-1 text-base font-bold text-brand-ink dark:text-white">
            {BANK_DETAILS.bankName}
          </p>
        </div>

        <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">
            Account Number
          </p>
          <p className="mt-2 text-3xl font-black tracking-wide text-brand-ink dark:text-white">
            {BANK_DETAILS.accountNumber}
          </p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-white/40">
            Account Type
          </p>
          <p className="mt-1 text-base font-bold text-brand-ink dark:text-white">
            {BANK_DETAILS.accountType}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={copyAccountNumber}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B]"
      >
        {copied ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Account Number
          </>
        )}
      </button>
    </div>
  );
}
