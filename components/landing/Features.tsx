'use client';

import { Banknote, PiggyBank, ShieldCheck, TrendingUp, Users, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: PiggyBank,
    title: 'Flexible Savings Plans',
    description: 'Regular, Target, and Fixed savings options designed to match your financial goals and lifestyle.',
    color: '#1E90FF',
  },
  {
    icon: TrendingUp,
    title: 'High-Yield Investments',
    description: 'Deposit a lump sum and earn tiered monthly interest paid quarterly through our Fixed Investment plan.',
    color: '#8BC34A',
  },
  {
    icon: Banknote,
    title: 'Access Quick Loans',
    description: 'Get financial support when you need it most. Personal, business, festival, and electronics loans available to members.',
    color: '#D4AF37',
  },
  {
    icon: Zap,
    title: 'Solar & Electronics Financing',
    description: 'Turn your solar and electronics dreams into reality through our affordable instalment support plans.',
    color: '#1E90FF',
  },
  {
    icon: ShieldCheck,
    title: 'Bank-Grade Security',
    description: 'Multi-factor authentication protects your account. All transactions encrypted end-to-end and CBN compliant.',
    color: '#8BC34A',
  },
  {
    icon: Users,
    title: 'Member-First Benefits',
    description: 'Flexible solutions tailored to your financial goals. Vote on cooperative decisions and share in annual dividends.',
    color: '#D4AF37',
  },
];

export default function Features() {
  return (
    <section className="relative py-24 px-4 bg-brand-alabaster text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-0 w-[600px] h-[500px] rounded-full opacity-[0.018] dark:opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full opacity-[0.018] dark:opacity-[0.03]"
          style={{ background: 'radial-gradient(ellipse, #1E90FF 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight mb-4 dark:text-white">
            Built for Security & Impact
          </h2>
          <p className="text-zinc-600 text-base max-w-xl mx-auto dark:text-white/40">
            Enterprise-grade infrastructure meets social impact. Your savings power real change.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-brand-border bg-brand-ghost p-6 shadow-[0_2px_8px_rgba(139,109,56,0.08)] backdrop-blur-sm transition-all hover:border-brand-input hover:shadow-[0_2px_12px_rgba(139,109,56,0.12)] dark:border-white/[0.08] dark:bg-white/[0.02] dark:shadow-none dark:hover:border-white/[0.15] dark:hover:bg-white/[0.04]"
            >
              <div
                className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  background: feature.color === '#8BC34A' ? 'rgba(139,195,74,0.08)' : feature.color === '#1E90FF' ? 'rgba(30,144,255,0.08)' : 'rgba(212,175,55,0.08)',
                }}
              >
                <feature.icon size={22} style={{ color: feature.color }} strokeWidth={1.5} />
              </div>

              <h3 className="text-brand-ink font-semibold text-base mb-2 dark:text-white">{feature.title}</h3>
              <p className="text-zinc-600 text-sm leading-relaxed dark:text-white/40">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
