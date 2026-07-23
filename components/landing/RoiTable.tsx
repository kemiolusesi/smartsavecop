'use client';

import { TrendingUp } from 'lucide-react';
import {
  FIXED_INVESTMENT_TIERS,
  FIXED_PAYOUT_INTERVAL_MONTHS,
  SAVINGS_DURATION_MONTHS,
  SAVINGS_PAYOUT_MONTH,
  calculateFixedQuarterlyInterest,
  calculateSavingsPayout,
  calculateSavingsTotalContributed,
} from '@/lib/investment-config';

const FIXED_EXAMPLES = [500000, 1100000];
const SAVINGS_EXAMPLE_MONTHLY = 50000;

function formatNGN(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(rate: number) {
  return `${(rate * 100).toFixed(1).replace('.0', '')}%`;
}

export default function RoiTable() {
  const savingsTotal = calculateSavingsTotalContributed(SAVINGS_EXAMPLE_MONTHLY);
  const savingsPayout = calculateSavingsPayout(SAVINGS_EXAMPLE_MONTHLY);

  return (
    <section id="projected-earnings" className="relative bg-brand-alabaster px-4 py-24 text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute right-0 top-0 h-[500px] w-[600px] rounded-full opacity-[0.018] dark:opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #8BC34A 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-emerald/10 bg-brand-mint px-4 py-1.5 text-xs font-medium text-brand-emerald dark:border-[#8BC34A]/20 dark:bg-[#8BC34A]/5 dark:text-[#8BC34A]">
            <TrendingUp size={12} />
            Projected Earnings
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-brand-ink dark:text-white sm:text-4xl">
            See Your Money Grow
          </h2>
          <p className="mx-auto max-w-xl text-base text-zinc-600 dark:text-white/40">
            Compare one-time fixed investments with monthly savings payouts using the current Smart Save plan structure.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-brand-border bg-brand-ghost p-5 shadow-[0_2px_8px_rgba(139,109,56,0.08)] dark:border-white/[0.08] dark:bg-white/[0.02] dark:shadow-none">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Plan A</p>
              <h3 className="mt-1 text-2xl font-black">Fixed Investment</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/45">
                One-time capital placement. Interest accumulates and is paid every {FIXED_PAYOUT_INTERVAL_MONTHS} months.
              </p>
            </div>

            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-brand-border text-xs uppercase tracking-widest text-zinc-500 dark:border-white/[0.08] dark:text-white/35">
                  <tr>
                    <th className="px-3 py-3">Tier</th>
                    <th className="px-3 py-3">Amount Range</th>
                    <th className="px-3 py-3">Monthly Rate</th>
                    <th className="px-3 py-3">Quarterly Interest</th>
                    <th className="px-3 py-3">Payout Interval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border dark:divide-white/[0.07]">
                  {FIXED_INVESTMENT_TIERS.map((tier, index) => {
                    const exampleAmount = FIXED_EXAMPLES[index];
                    return (
                      <tr key={tier.name}>
                        <td className="px-3 py-4 font-black text-brand-ink dark:text-white">{tier.name}</td>
                        <td className="px-3 py-4 text-zinc-600 dark:text-white/50">
                          {formatNGN(tier.min)} - {formatNGN(tier.max)}
                        </td>
                        <td className="px-3 py-4 font-bold text-[#8BC34A]">{formatPercent(tier.monthlyRate)} per month</td>
                        <td className="px-3 py-4 font-bold text-[#D4AF37]">
                          {formatNGN(calculateFixedQuarterlyInterest(exampleAmount))}
                          <span className="block text-xs font-medium text-zinc-500 dark:text-white/35">Example: {formatNGN(exampleAmount)}</span>
                        </td>
                        <td className="px-3 py-4 text-zinc-600 dark:text-white/50">Quarterly</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {FIXED_INVESTMENT_TIERS.map((tier, index) => {
                const exampleAmount = FIXED_EXAMPLES[index];
                return (
                  <div key={tier.name} className="rounded-xl border border-brand-border bg-brand-ghost p-4 shadow-[0_2px_8px_rgba(139,109,56,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-brand-ink dark:text-white">{tier.name}</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/40">
                          {formatNGN(tier.min)} - {formatNGN(tier.max)}
                        </p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-black text-[#8BC34A]">{formatPercent(tier.monthlyRate)}</p>
                    </div>
                    <div className="mt-4 grid gap-2 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500 dark:text-white/40">Quarterly Interest</span>
                        <strong className="text-right text-[#D4AF37]">{formatNGN(calculateFixedQuarterlyInterest(exampleAmount))}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500 dark:text-white/40">Example Amount</span>
                        <strong className="text-right text-brand-ink dark:text-white">{formatNGN(exampleAmount)}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500 dark:text-white/40">Payout Interval</span>
                        <strong className="text-right text-brand-ink dark:text-white">Quarterly</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-xs font-semibold leading-5 text-zinc-600 dark:text-white/55">
              Capital is returned in full at the end of the agreed term. There are no monthly interest payments.
            </p>
          </article>

          <article className="rounded-2xl border border-brand-border bg-brand-ghost p-5 shadow-[0_2px_8px_rgba(139,109,56,0.08)] dark:border-white/[0.08] dark:bg-white/[0.02] dark:shadow-none">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Plan B</p>
              <h3 className="mt-1 text-2xl font-black">Monthly Savings</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/45">
                Contribute a fixed amount every month for {SAVINGS_DURATION_MONTHS} consecutive months and receive one payout at month {SAVINGS_PAYOUT_MONTH}.
              </p>
            </div>

            <div className="rounded-2xl border border-brand-border bg-brand-ghost p-5 shadow-[0_2px_8px_rgba(139,109,56,0.08)] dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-none">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Example</p>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-ghost p-4 shadow-[0_2px_8px_rgba(139,109,56,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                  <span className="text-sm font-semibold text-zinc-600 dark:text-white/50">Monthly contribution</span>
                  <strong className="text-brand-ink dark:text-white">{formatNGN(SAVINGS_EXAMPLE_MONTHLY)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-ghost p-4 shadow-[0_2px_8px_rgba(139,109,56,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                  <span className="text-sm font-semibold text-zinc-600 dark:text-white/50">Total after {SAVINGS_DURATION_MONTHS} months</span>
                  <strong className="text-brand-ink dark:text-white">{formatNGN(savingsTotal)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4">
                  <span className="text-sm font-semibold text-zinc-600 dark:text-white/60">Payout at month {SAVINGS_PAYOUT_MONTH}</span>
                  <strong className="text-lg text-[#D4AF37]">{formatNGN(savingsPayout)}</strong>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
