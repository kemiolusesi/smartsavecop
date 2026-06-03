'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calculator, ArrowRight, Info, Loader2 } from 'lucide-react';

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
        } catch (err) {
          console.error('Error calculating growth:', err);
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
    <section id="calculator" className="relative py-24 px-4">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #0093D8 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#0093D8]/20 bg-[#0093D8]/5 text-xs font-medium text-[#0093D8] mb-5">
            <Calculator size={12} />
            Transparent ROI Calculator
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Calculate Your Returns
          </h2>
          <p className="text-white/40 text-base max-w-xl mx-auto">
            No hidden fees. Every naira accounted for before you invest.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-6">
              Configure Investment
            </h3>

            <div className="mb-6">
              <label className="block text-xs text-white/40 mb-2 font-medium">
                Investment Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37] font-bold text-lg">
                  ₦
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatDisplay(amount)}
                  onChange={(e) => setRawAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="500,000"
                  className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-lg font-semibold placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                />
              </div>
              <div className="flex gap-2 mt-2.5 flex-wrap">
                {[500000, 1000000, 2500000, 5000000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setRawAmount(String(preset))}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      amount === preset
                        ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]'
                        : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                    }`}
                  >
                    {preset >= 1000000 ? `₦${preset / 1000000}M` : `₦${preset / 1000}K`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs text-white/40 mb-3 font-medium">
                Investment Type
              </label>
              <div className="flex items-center gap-3 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <button
                  onClick={() => setIsMonthly(false)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    !isMonthly
                      ? 'bg-[#D4AF37] text-[#0A0A0A]'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  One-time
                </button>
                <button
                  onClick={() => setIsMonthly(true)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isMonthly
                      ? 'bg-[#D4AF37] text-[#0A0A0A]'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Monthly Savings
                </button>
              </div>
              {isMonthly && (
                <p className="text-xs text-white/30 mt-2">
                  You save ₦{formatDisplay(amount)} every month for {selectedPlan.months} months.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-3 font-medium">
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
                            ? 'border-[#9DC03A]/50 bg-[#9DC03A]/[0.08]'
                            : 'border-[#0093D8]/50 bg-[#0093D8]/[0.08]'
                          : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15'
                      }`}
                    >
                      <div
                        className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2 ${
                          key === 'growth'
                            ? 'bg-[#9DC03A]/20 text-[#9DC03A]'
                            : 'bg-[#0093D8]/20 text-[#0093D8]'
                        }`}
                      >
                        {p.badge}
                      </div>
                      <p className="text-white font-semibold text-sm">{p.label}</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {(p.annualRate * 100).toFixed(0)}% p.a.
                      </p>
                      {key === 'growth' && (
                        <span className="absolute top-3 right-3 text-[10px] bg-[#9DC03A]/20 text-[#9DC03A] px-1.5 py-0.5 rounded-full font-semibold">
                          Popular
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm flex flex-col">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
              Projected Returns
              {serverResults && (
                <span className="text-[8px] bg-[#9DC03A]/10 text-[#9DC03A] px-2 py-0.5 rounded-full font-normal tracking-normal">
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
                  <Loader2 className="w-8 h-8 text-[#9DC03A] animate-spin mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Calculating securely...</p>
                </div>
              </div>
            ) : results && amount > 0 ? (
              <>
                <div className="space-y-1 mb-6">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-bold text-white/60">
                        1
                      </div>
                      <div>
                        <p className="text-xs text-white/40">
                          {isMonthly ? 'Total Deposited' : 'Amount Invested'}
                        </p>
                        <p className="text-sm text-white font-medium">Principal</p>
                      </div>
                    </div>
                    <p className="text-white font-semibold">{formatNGN(results.totalInvested)}</p>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-1">
                    <div className="h-px flex-1 bg-white/[0.05]" />
                    <span className="text-[#9DC03A] text-sm font-bold">+</span>
                    <div className="h-px flex-1 bg-white/[0.05]" />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#9DC03A]/[0.05] border border-[#9DC03A]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#9DC03A]/20 flex items-center justify-center text-xs font-bold text-[#9DC03A]">
                        2
                      </div>
                      <div>
                        <p className="text-xs text-white/40">
                          {selectedPlan.annualRate * 100}% p.a. over {selectedPlan.months} months
                        </p>
                        <p className="text-sm text-[#9DC03A] font-medium">Interest Earned</p>
                      </div>
                    </div>
                    <p className="text-[#9DC03A] font-semibold">{formatNGN(results.interestEarned)}</p>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-1">
                    <div className="h-px flex-1 bg-white/[0.05]" />
                    <span className="text-red-400/60 text-sm font-bold">−</span>
                    <div className="h-px flex-1 bg-white/[0.05]" />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-bold text-white/40">
                        3
                      </div>
                      <div className="flex items-center gap-1">
                        <div>
                          <p className="text-xs text-white/40">One-time, paid on registration</p>
                          <p className="text-sm text-white/50 font-medium">Membership Fee</p>
                        </div>
                        <Info size={12} className="text-white/20 mt-0.5" />
                      </div>
                    </div>
                    <p className="text-white/40 font-semibold">{formatNGN(MEMBERSHIP_FEE)}</p>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-1">
                    <div className="h-px flex-1 bg-[#D4AF37]/20" />
                    <span className="text-[#D4AF37] text-sm font-bold">=</span>
                    <div className="h-px flex-1 bg-[#D4AF37]/20" />
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
                        style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D06B)' }}
                      >
                        =
                      </div>
                      <div>
                        <p className="text-xs text-white/40">At end of term</p>
                        <p className="text-sm text-[#D4AF37] font-semibold">Total Payout</p>
                      </div>
                    </div>
                    <p className="text-[#D4AF37] font-bold text-lg">{formatNGN(results.totalPayout)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                    <p className="text-[#9DC03A] font-bold text-lg">
                      {results.effectiveReturn.toFixed(1)}%
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">Net Return</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                    <p className="text-white font-bold text-lg">{formatNGN(results.totalToStart)}</p>
                    <p className="text-xs text-white/30 mt-0.5">Total to Start</p>
                  </div>
                </div>

                <button
                  className="mt-5 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm text-[#0A0A0A] transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.25)]"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F5D06B 50%, #D4AF37 100%)',
                  }}
                >
                  Start with {formatNGN(results.totalToStart)}
                  <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
                Enter an investment amount to see your projection.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
