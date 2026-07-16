'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calculator, ArrowRight, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';

const MEMBERSHIP_FEE = 5000;

const PLANS = {
  standard: { label: 'Standard', months: 6, annualRate: 0.07, badge: '6 Mo' },
  growth: { label: 'Growth', months: 12, annualRate: 0.15, badge: '12 Mo' },
};

interface GrowthBreakdown {
  month: number;
  starting_balance: number;
  interest_accrued: number;
  ending_balance: number;
  cumulative_interest: number;
}

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

export default function RoiCalculator() {
  const [rawAmount, setRawAmount] = useState('500000');
  const [isMonthly, setIsMonthly] = useState(false);
  const [plan, setPlan] = useState<'standard' | 'growth'>('growth');
  const [serverResults, setServerResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = parseInput(rawAmount);
  const selectedPlan = PLANS[plan];

  const results = useMemo(() => {
    if (serverResults && amount > 0) {
      const totalInvested = isMonthly ? amount * selectedPlan.months : amount;
      const interestEarned = serverResults.total_interest;
      const totalPayout = serverResults.final_amount;
      const totalToStart = totalInvested + MEMBERSHIP_FEE;
      const effectiveReturn = totalInvested > 0 ? (interestEarned / totalInvested) * 100 : 0;

      return {
        totalInvested,
        interestEarned,
        totalPayout: isMonthly ? totalPayout : totalPayout,
        totalToStart,
        effectiveReturn,
        breakdown: serverResults.breakdown,
      };
    }

    if (amount <= 0) return null;

    const months = selectedPlan.months;
    const periodRate = selectedPlan.annualRate * (months / 12);

    let totalInvested: number;
    let interestEarned: number;

    if (isMonthly) {
      totalInvested = amount * months;
      const monthlyRate = selectedPlan.annualRate / 12;
      const fv =
        monthlyRate === 0
          ? amount * months
          : amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      interestEarned = fv - totalInvested;
    } else {
      totalInvested = amount;
      interestEarned = amount * periodRate;
    }

    const totalPayout = totalInvested + interestEarned;
    const totalToStart = (isMonthly ? amount : amount) + MEMBERSHIP_FEE;
    const effectiveReturn = totalInvested > 0 ? (interestEarned / totalInvested) * 100 : 0;

    return { totalInvested, interestEarned, totalPayout, totalToStart, effectiveReturn, breakdown: null };
  }, [serverResults, amount, isMonthly, selectedPlan]);

  useEffect(() => {
    if (amount > 0 && !isMonthly) {
      const calculateGrowth = async () => {
        setLoading(true);
        setError(null);

        try {
          const response = await fetch('/api/calculator/growth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              principal: amount,
              rate: selectedPlan.annualRate,
              months: selectedPlan.months,
              type: 'simple',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to calculate growth');
          }

          const data = await response.json();
          setServerResults(data);
        } catch {
          setError('Unable to calculate. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      const timeoutId = setTimeout(calculateGrowth, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setServerResults(null);
    }
  }, [amount, selectedPlan, isMonthly]);

  return (
    <section id="calculator" className="relative py-24 px-4 bg-brand-alabaster text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.018] dark:opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #1E90FF 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-sapphire/10 bg-brand-powder text-xs font-medium text-brand-sapphire mb-5 dark:border-[#1E90FF]/20 dark:bg-[#1E90FF]/5 dark:text-[#1E90FF]">
            <Calculator size={12} />
            Transparent ROI Calculator
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight mb-4 dark:text-white">
            Calculate Your Returns
          </h2>
          <p className="text-zinc-600 text-base max-w-xl mx-auto dark:text-white/40">
            No hidden fees. Every naira accounted for before you invest.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-brand-border bg-brand-ghost p-6 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-6 dark:text-white/60">
              Configure Investment
            </h3>

            <div className="mb-6">
              <label className="block text-xs text-zinc-500 mb-2 font-medium dark:text-white/40">
                Investment Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-amber font-bold text-lg dark:text-[#D4AF37]">
                  ₦
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatDisplay(amount)}
                  onChange={(e) => setRawAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="500,000"
                  className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-brand-ghost border border-brand-border text-brand-ink text-lg font-semibold placeholder:text-brand-secondary/45 focus:outline-none focus:border-brand-amber transition-colors dark:bg-white/[0.05] dark:border-white/[0.08] dark:text-white dark:placeholder:text-white/20 dark:focus:border-[#D4AF37]/50"
                />
              </div>
              <div className="flex gap-2 mt-2.5 flex-wrap">
                {[500000, 1000000, 2500000, 5000000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setRawAmount(String(preset))}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      amount === preset
                        ? 'border-brand-amber/40 bg-[#D4AF37]/10 text-brand-amber dark:border-[#D4AF37]/50 dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]'
                        : 'border-brand-border text-zinc-500 hover:border-brand-input hover:text-brand-ink dark:border-white/10 dark:text-white/40 dark:hover:border-white/20 dark:hover:text-white/60'
                    }`}
                  >
                    {preset >= 1000000 ? `₦${preset / 1000000}M` : `₦${preset / 1000}K`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs text-zinc-500 mb-3 font-medium dark:text-white/40">
                Investment Type
              </label>
              <div className="flex items-center gap-3 p-1 rounded-xl bg-zinc-50 border border-brand-border dark:bg-white/[0.04] dark:border-white/[0.06]">
                <button
                  onClick={() => setIsMonthly(false)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    !isMonthly
                      ? 'bg-[#D4AF37] text-brand-ink'
                      : 'text-zinc-500 hover:text-brand-ink dark:text-white/40 dark:hover:text-white/60'
                  }`}
                >
                  One-time
                </button>
                <button
                  onClick={() => setIsMonthly(true)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isMonthly
                      ? 'bg-[#D4AF37] text-brand-ink'
                      : 'text-zinc-500 hover:text-brand-ink dark:text-white/40 dark:hover:text-white/60'
                  }`}
                >
                  Monthly Savings
                </button>
              </div>
              {isMonthly && (
                <p className="text-xs text-zinc-500 mt-2 dark:text-white/30">
                  You save ₦{formatDisplay(amount)} every month for {selectedPlan.months} months.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-3 font-medium dark:text-white/40">
                Savings Plan
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(
                  ([key, p]) => (
                    <button
                      key={key}
                      onClick={() => setPlan(key)}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        plan === key
                          ? key === 'growth'
                            ? 'border-brand-emerald/30 bg-brand-mint dark:border-[#8BC34A]/50 dark:bg-[#8BC34A]/[0.08]'
                            : 'border-brand-sapphire/30 bg-brand-powder dark:border-[#1E90FF]/50 dark:bg-[#1E90FF]/[0.08]'
                          : 'border-brand-border bg-brand-ghost hover:border-brand-input dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:border-white/15'
                      }`}
                    >
                      <div
                        className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2 ${
                          key === 'growth'
                            ? 'bg-brand-mint text-brand-emerald dark:bg-[#8BC34A]/20 dark:text-[#8BC34A]'
                            : 'bg-brand-powder text-brand-sapphire dark:bg-[#1E90FF]/20 dark:text-[#1E90FF]'
                        }`}
                      >
                        {p.badge}
                      </div>
                      <p className="text-brand-ink font-semibold text-sm dark:text-white">{p.label}</p>
                      <p className="text-zinc-500 text-xs mt-0.5 dark:text-white/40">
                        {(p.annualRate * 100).toFixed(0)}% p.a.
                      </p>
                      {key === 'growth' && (
                        <span className="absolute top-3 right-3 text-[10px] bg-brand-mint text-brand-emerald px-1.5 py-0.5 rounded-full font-semibold dark:bg-[#8BC34A]/20 dark:text-[#8BC34A]">
                          Popular
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-ghost p-6 backdrop-blur-sm flex flex-col dark:border-white/[0.08] dark:bg-white/[0.03]">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2 dark:text-white/60">
              Projected Returns
              {serverResults && (
                <span className="text-[8px] bg-brand-mint text-brand-emerald px-2 py-0.5 rounded-full font-normal tracking-normal dark:bg-[#8BC34A]/10 dark:text-[#8BC34A]">
                  Verified by backend
                </span>
              )}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-brand-emerald animate-spin mx-auto mb-3 dark:text-[#8BC34A]" />
                  <p className="text-zinc-500 text-sm dark:text-white/40">Calculating securely...</p>
                </div>
              </div>
            ) : results && amount > 0 ? (
              <>
                <div className="space-y-1 mb-6">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-brand-border dark:bg-white/[0.04] dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-ghost flex items-center justify-center text-xs font-bold text-zinc-500 border border-brand-border dark:bg-white/[0.08] dark:text-white/60 dark:border-transparent">
                        1
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-white/40">
                          {isMonthly ? 'Total Deposited' : 'Amount Invested'}
                        </p>
                        <p className="text-sm text-brand-ink font-medium dark:text-white">Principal</p>
                      </div>
                    </div>
                    <p className="text-brand-ink font-semibold dark:text-white">{formatNGN(results.totalInvested)}</p>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-1">
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-white/[0.05]" />
                    <span className="text-brand-emerald text-sm font-bold dark:text-[#8BC34A]">+</span>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-white/[0.05]" />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand-mint border border-brand-emerald/10 dark:bg-[#8BC34A]/[0.05] dark:border-[#8BC34A]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-mint flex items-center justify-center text-xs font-bold text-brand-emerald dark:bg-[#8BC34A]/20 dark:text-[#8BC34A]">
                        2
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-white/40">
                          {selectedPlan.annualRate * 100}% p.a. over {selectedPlan.months} months
                        </p>
                        <p className="text-sm text-brand-emerald font-medium dark:text-[#8BC34A]">Interest Earned</p>
                      </div>
                    </div>
                    <p className="text-brand-emerald font-semibold dark:text-[#8BC34A]">{formatNGN(results.interestEarned)}</p>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-1">
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-white/[0.05]" />
                    <span className="text-red-400/60 text-sm font-bold">−</span>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-white/[0.05]" />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-brand-border dark:bg-white/[0.03] dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-ghost flex items-center justify-center text-xs font-bold text-zinc-400 border border-brand-border dark:bg-white/[0.08] dark:text-white/40 dark:border-transparent">
                        3
                      </div>
                      <div className="flex items-center gap-1">
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-white/40">One-time, paid on registration</p>
                          <p className="text-sm text-zinc-600 font-medium dark:text-white/50">Membership Fee</p>
                        </div>
                        <Info size={12} className="text-zinc-400 mt-0.5 dark:text-white/20" />
                      </div>
                    </div>
                    <p className="text-zinc-500 font-semibold dark:text-white/40">{formatNGN(MEMBERSHIP_FEE)}</p>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-1">
                    <div className="h-px flex-1 bg-[#D4AF37]/20 dark:bg-[#D4AF37]/20" />
                    <span className="text-brand-amber text-sm font-bold dark:text-[#D4AF37]">=</span>
                    <div className="h-px flex-1 bg-[#D4AF37]/20 dark:bg-[#D4AF37]/20" />
                  </div>

                  <div
                    className="flex items-center justify-between p-4 rounded-xl border"
                    style={{
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 100%)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#0A0A0A]"
                        style={{ background: 'linear-gradient(135deg, #D4AF37, #D4AF37)' }}
                      >
                        =
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-white/40">At end of term</p>
                        <p className="text-sm text-brand-amber font-semibold dark:text-[#D4AF37]">Total Payout</p>
                      </div>
                    </div>
                    <p className="text-brand-amber font-bold text-lg dark:text-[#D4AF37]">{formatNGN(results.totalPayout)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <div className="rounded-xl bg-brand-ghost border border-brand-border p-3 text-center dark:bg-white/[0.03] dark:border-white/[0.06]">
                    <p className="text-brand-emerald font-bold text-lg dark:text-[#8BC34A]">
                      {results.effectiveReturn.toFixed(1)}%
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5 dark:text-white/30">Net Return</p>
                  </div>
                  <div className="rounded-xl bg-brand-ghost border border-brand-border p-3 text-center dark:bg-white/[0.03] dark:border-white/[0.06]">
                    <p className="text-brand-ink font-bold text-lg dark:text-white">{formatNGN(results.totalToStart)}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 dark:text-white/30">Total to Start</p>
                  </div>
                </div>

                <Link
                  href="/signin"
                  className="mt-5 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm text-[#0A0A0A] transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.25)]"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 50%, #D4AF37 100%)',
                  }}
                >
                  Start with {formatNGN(results.totalToStart)}
                  <ArrowRight size={15} />
                </Link>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm dark:text-white/20">
                Enter an investment amount to see your projection.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
