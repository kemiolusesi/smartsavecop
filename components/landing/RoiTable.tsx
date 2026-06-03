'use client';

import { TrendingUp, ChevronRight } from 'lucide-react';

const MEMBERSHIP_FEE = 5000;

const TIERS = [
  { principal: 500_000, label: '₦500K', tier: 'Starter' },
  { principal: 1_000_000, label: '₦1M', tier: 'Silver' },
  { principal: 2_500_000, label: '₦2.5M', tier: 'Gold' },
  { principal: 5_000_000, label: '₦5M+', tier: 'Platinum' },
];

const PLANS = [
  { key: 'standard', label: 'Standard', months: 6, annualRate: 0.07, color: '#0093D8' },
  { key: 'growth', label: 'Growth', months: 12, annualRate: 0.15, color: '#9DC03A' },
];

function calcPayout(principal: number, annualRate: number, months: number) {
  const rate = annualRate * (months / 12);
  const interest = principal * rate;
  return { interest, payout: principal + interest };
}

function fmt(v: number) {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}K`;
  return `₦${v.toLocaleString()}`;
}

export default function RoiTable() {
  return (
    <section className="relative py-24 px-4">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 right-0 w-[600px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #9DC03A 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#9DC03A]/20 bg-[#9DC03A]/5 text-xs font-medium text-[#9DC03A] mb-5">
            <TrendingUp size={12} />
            Projected Earnings
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            See Your Money Grow
          </h2>
          <p className="text-white/40 text-base max-w-xl mx-auto">
            One-time investment projections across our savings tiers. All figures include your principal.
          </p>
        </div>

        <div className="hidden sm:block rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-widest w-[28%]">
                  Investment Tier
                </th>
                {PLANS.map((p) => (
                  <th key={p.key} colSpan={2} className="px-4 py-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: `${p.color}20`, color: p.color }}
                      >
                        {p.label} Plan — {p.months} Months
                      </span>
                      <span className="text-xs text-white/30">{p.annualRate * 100}% annual rate</span>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-right text-xs font-semibold text-white/40 uppercase tracking-widest">
                  Action
                </th>
              </tr>
              <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                <th className="px-6 py-2.5 text-left text-[11px] text-white/20">Principal + Fee</th>
                {PLANS.map((p) => (
                  <>
                    <th key={`${p.key}-i`} className="px-4 py-2.5 text-center text-[11px] text-white/20">
                      Interest
                    </th>
                    <th key={`${p.key}-p`} className="px-4 py-2.5 text-center text-[11px] text-white/20">
                      Total Payout
                    </th>
                  </>
                ))}
                <th className="px-6 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {TIERS.map((tier, idx) => {
                const isHighlighted = tier.label === '₦1M';
                return (
                  <tr
                    key={tier.label}
                    className={`border-b border-white/[0.05] transition-colors group hover:bg-white/[0.03] ${
                      isHighlighted ? 'bg-[#D4AF37]/[0.03]' : ''
                    }`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            background: isHighlighted ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                            color: isHighlighted ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{tier.label}</p>
                          <p className="text-white/30 text-xs">{tier.tier} Tier</p>
                        </div>
                        {isHighlighted && (
                          <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full font-semibold ml-1">
                            Popular
                          </span>
                        )}
                      </div>
                    </td>
                    {PLANS.map((p) => {
                      const { interest, payout } = calcPayout(tier.principal, p.annualRate, p.months);
                      return (
                        <>
                          <td key={`${tier.label}-${p.key}-i`} className="px-4 py-5 text-center">
                            <span className="text-sm font-medium" style={{ color: p.color }}>
                              +{fmt(interest)}
                            </span>
                          </td>
                          <td key={`${tier.label}-${p.key}-p`} className="px-4 py-5 text-center">
                            <span className="text-sm font-bold text-white">{fmt(payout)}</span>
                          </td>
                        </>
                      );
                    })}
                    <td className="px-6 py-5 text-right">
                      <button className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-[#D4AF37] transition-colors group-hover:text-[#D4AF37]/70">
                        Start <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-white/[0.02]">
                <td colSpan={7} className="px-6 py-3 text-xs text-white/20">
                  * All projections are pre-tax. A one-time membership fee of ₦5,000 applies. Returns are not guaranteed and subject to cooperative performance.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="sm:hidden space-y-4">
          {TIERS.map((tier) => (
            <div
              key={tier.label}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-bold text-lg">{tier.label}</p>
                  <p className="text-white/30 text-xs">{tier.tier} Tier</p>
                </div>
                <p className="text-white/30 text-xs">+₦{(5000).toLocaleString()} fee</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PLANS.map((p) => {
                  const { interest, payout } = calcPayout(tier.principal, p.annualRate, p.months);
                  return (
                    <div
                      key={p.key}
                      className="rounded-xl p-3 border"
                      style={{ borderColor: `${p.color}25`, background: `${p.color}08` }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: p.color }}>
                        {p.label} ({p.months}mo)
                      </p>
                      <p className="text-white font-bold text-base">{fmt(payout)}</p>
                      <p className="text-xs mt-0.5" style={{ color: `${p.color}99` }}>
                        +{fmt(interest)} interest
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
