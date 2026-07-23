'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Calculator } from 'lucide-react';
import Link from 'next/link';
import {
  FIXED_PAYOUT_INTERVAL_MONTHS,
  SAVINGS_DURATION_MONTHS,
  SAVINGS_PAYOUT_MONTH,
  calculateFixedQuarterlyInterest,
  calculateFixedTotalInterest,
  calculateFixedTotalPayout,
  calculateSavingsPayout,
  calculateSavingsTotalContributed,
  getFixedInvestmentTier,
} from '@/lib/investment-config';

const MEMBERSHIP_FEE = 5000;
type CalculatorPlan = 'Fixed Investment' | 'Monthly Savings';
type FixedTerm = 6 | 12;

function formatNGN(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

function parseInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9]/g, '');
  return cleaned === '' ? 0 : parseInt(cleaned, 10);
}

function formatDisplay(value: number): string {
  if (value === 0) return '';
  return value.toLocaleString('en-NG');
}

function formatPercent(rate: number) {
  return `${(rate * 100).toFixed(1).replace('.0', '')}%`;
}

export default function RoiCalculator() {
  const [plan, setPlan] = useState<CalculatorPlan>('Fixed Investment');
  const [fixedAmount, setFixedAmount] = useState('500000');
  const [monthlyContribution, setMonthlyContribution] = useState('50000');
  const [fixedTerm, setFixedTerm] = useState<FixedTerm>(12);

  const amount = parseInput(plan === 'Fixed Investment' ? fixedAmount : monthlyContribution);
  const fixedTier = getFixedInvestmentTier(parseInput(fixedAmount));

  const results = useMemo(() => {
    if (plan === 'Fixed Investment') {
      const principal = parseInput(fixedAmount);
      const tier = getFixedInvestmentTier(principal);
      const totalInterest = calculateFixedTotalInterest(principal, fixedTerm);
      return {
        principal,
        tier,
        totalInvested: principal,
        rateLabel: tier ? `${formatPercent(tier.monthlyRate)} monthly` : 'Enter a supported amount',
        interestLabel: 'Quarterly Interest Payout',
        interestEarned: totalInterest,
        periodicInterest: calculateFixedQuarterlyInterest(principal),
        totalPayout: calculateFixedTotalPayout(principal, fixedTerm),
        totalToStart: principal + MEMBERSHIP_FEE,
      };
    }

    const contribution = parseInput(monthlyContribution);
    const totalContributed = calculateSavingsTotalContributed(contribution);
    const payout = calculateSavingsPayout(contribution);
    return {
      principal: contribution,
      tier: null,
      totalInvested: totalContributed,
      rateLabel: `15% total return at month ${SAVINGS_PAYOUT_MONTH}`,
      interestLabel: 'Return Amount',
      interestEarned: payout - totalContributed,
      periodicInterest: payout - totalContributed,
      totalPayout: payout,
      totalToStart: contribution + MEMBERSHIP_FEE,
    };
  }, [fixedAmount, fixedTerm, monthlyContribution, plan]);

  return (
    <section id="calculator" className="relative bg-brand-alabaster px-4 py-24 text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.018] dark:opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #1E90FF 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-sapphire/10 bg-brand-powder px-4 py-1.5 text-xs font-medium text-brand-sapphire dark:border-[#1E90FF]/20 dark:bg-[#1E90FF]/5 dark:text-[#1E90FF]">
            <Calculator size={12} />
            Transparent ROI Calculator
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-brand-ink dark:text-white sm:text-4xl">
            Calculate Your Returns
          </h2>
          <p className="mx-auto max-w-xl text-base text-zinc-600 dark:text-white/40">
            Choose a plan and preview payouts before you invest.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-border bg-brand-ghost p-6 shadow-[0_2px_8px_rgba(139,109,56,0.08)] backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-none">
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-white/60">
              Configure Investment
            </h3>

            <div className="mb-6">
              <label className="mb-3 block text-xs font-medium text-zinc-500 dark:text-white/40">
                Plan Type
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-ghost p-1 dark:border-white/[0.06] dark:bg-white/[0.04]">
                {(['Fixed Investment', 'Monthly Savings'] as CalculatorPlan[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPlan(option)}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                      plan === option ? 'bg-[#D4AF37] text-brand-ink' : 'text-zinc-500 hover:text-brand-ink dark:text-white/40 dark:hover:text-white/60'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {plan === 'Fixed Investment' ? (
              <>
                <AmountField label="Investment Amount" value={fixedAmount} onChange={setFixedAmount} placeholder="500,000" />
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[500000, 1100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFixedAmount(String(preset))}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                        parseInput(fixedAmount) === preset
                          ? 'border-brand-amber/40 bg-[#D4AF37]/10 text-brand-amber dark:border-[#D4AF37]/50 dark:text-[#D4AF37]'
                          : 'border-brand-border text-zinc-500 hover:border-brand-input hover:text-brand-ink dark:border-white/10 dark:text-white/40 dark:hover:border-white/20'
                      }`}
                    >
                      {formatNGN(preset)}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <label className="mb-3 block text-xs font-medium text-zinc-500 dark:text-white/40">Fixed Investment Term</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([6, 12] as FixedTerm[]).map((months) => (
                      <button
                        key={months}
                        type="button"
                        onClick={() => setFixedTerm(months)}
                        className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                          fixedTerm === months
                            ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]'
                            : 'border-brand-border bg-brand-ghost text-zinc-600 shadow-[0_2px_8px_rgba(139,109,56,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55 dark:shadow-none'
                        }`}
                      >
                        {months} months
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mt-5 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-xs font-semibold leading-5 text-zinc-600 dark:text-white/60">
                  {fixedTier
                    ? `${fixedTier.name}: ${formatPercent(fixedTier.monthlyRate)} monthly interest, paid every ${FIXED_PAYOUT_INTERVAL_MONTHS} months.`
                    : 'Enter an amount from NGN 500,000 to NGN 1,000,000 or from NGN 1,100,000 to NGN 5,000,000.'}
                </p>
              </>
            ) : (
              <>
                <AmountField label="Monthly Contribution" value={monthlyContribution} onChange={setMonthlyContribution} placeholder="50,000" />
                <p className="mt-3 text-xs font-semibold text-zinc-500 dark:text-white/40">
                  You contribute every month for {SAVINGS_DURATION_MONTHS} months. Payout happens once at month {SAVINGS_PAYOUT_MONTH}.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col rounded-2xl border border-brand-border bg-brand-ghost p-6 shadow-[0_2px_8px_rgba(139,109,56,0.08)] backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-none">
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-white/60">
              Projected Returns
            </h3>

            {amount > 0 ? (
              <>
                <div className="mb-6 space-y-3">
                  <SummaryRow label={plan === 'Fixed Investment' ? 'Amount Invested' : '12-Month Total Contributed'} value={results.totalInvested} />
                  <SummaryRow label={plan === 'Fixed Investment' ? 'Monthly Rate' : 'Savings Return'} value={results.rateLabel} />
                  <SummaryRow label={results.interestLabel} value={results.periodicInterest} highlight />
                  <SummaryRow label="Total Payout" value={results.totalPayout} gold />
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-brand-border bg-brand-ghost p-3 text-center shadow-[0_2px_8px_rgba(139,109,56,0.08)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-none">
                    <p className="text-lg font-bold text-brand-emerald dark:text-[#8BC34A]">{formatNGN(results.interestEarned)}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-white/30">Total Return</p>
                  </div>
                  <div className="rounded-xl border border-brand-border bg-brand-ghost p-3 text-center shadow-[0_2px_8px_rgba(139,109,56,0.08)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-none">
                    <p className="text-lg font-bold text-brand-ink dark:text-white">{formatNGN(results.totalToStart)}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-white/30">Total to Start</p>
                  </div>
                </div>

                <Link
                  href="/signin"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold text-[#0A0A0A] transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.25)]"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 50%, #D4AF37 100%)' }}
                >
                  Start with {formatNGN(results.totalToStart)}
                  <ArrowRight size={15} />
                </Link>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-zinc-400 dark:text-white/20">
                Enter an amount to see your projection.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AmountField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const amount = parseInput(value);

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-white/40">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-brand-amber dark:text-[#D4AF37]">
          NGN
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={formatDisplay(amount)}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, ''))}
          placeholder={placeholder}
          className="w-full rounded-xl border border-brand-border bg-brand-ghost py-3.5 pl-16 pr-4 text-lg font-semibold text-brand-ink outline-none transition-colors placeholder:text-brand-secondary/45 focus:border-brand-amber dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/20 dark:focus:border-[#D4AF37]/50"
        />
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight = false, gold = false }: { label: string; value: number | string; highlight?: boolean; gold?: boolean }) {
  const renderedValue = typeof value === 'number' ? formatNGN(value) : value;

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border p-3.5 ${
        gold
          ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10'
          : highlight
            ? 'border-brand-emerald/10 bg-brand-mint dark:border-[#8BC34A]/20 dark:bg-[#8BC34A]/[0.05]'
            : 'border-brand-border bg-brand-ghost shadow-[0_2px_8px_rgba(139,109,56,0.08)] dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-none'
      }`}
    >
      <p className="text-xs font-semibold text-zinc-500 dark:text-white/40">{label}</p>
      <p className={`text-right text-sm font-bold ${gold ? 'text-[#D4AF37]' : highlight ? 'text-brand-emerald dark:text-[#8BC34A]' : 'text-brand-ink dark:text-white'}`}>
        {renderedValue}
      </p>
    </div>
  );
}
