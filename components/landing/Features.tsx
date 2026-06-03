'use client';

import { Shield, Leaf, FileCheck, Lock, TrendingUp, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'Multi-factor authentication (MFA) protects your account. All transactions encrypted end-to-end.',
    color: '#0093D8',
  },
  {
    icon: Leaf,
    title: 'Agricultural Payouts',
    description: 'Your returns fund real agricultural projects. Direct impact on rural communities and food security.',
    color: '#9DC03A',
  },
  {
    icon: FileCheck,
    title: 'Digital KYC',
    description: 'Complete Know-Your-Customer verification online. Fast, secure, and fully compliant with CBN regulations.',
    color: '#D4AF37',
  },
  {
    icon: Lock,
    title: 'Funds Protection',
    description: 'NDIC insurance coverage. Your principal is protected even in unforeseen circumstances.',
    color: '#0093D8',
  },
  {
    icon: TrendingUp,
    title: 'Transparent Ledger',
    description: 'Real-time dashboard showing your investments, returns, and project impact metrics.',
    color: '#9DC03A',
  },
  {
    icon: Users,
    title: 'Community Governance',
    description: 'Members vote on cooperative decisions. Your voice matters in how funds are deployed.',
    color: '#D4AF37',
  },
];

export default function Features() {
  return (
    <section className="relative py-24 px-4">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-0 w-[600px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(ellipse, #0093D8 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Built for Security & Impact
          </h2>
          <p className="text-white/40 text-base max-w-xl mx-auto">
            Enterprise-grade infrastructure meets social impact. Your savings power real change.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:border-white/[0.15] hover:bg-white/[0.04]"
            >
              <div
                className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  background: `${feature.color}15`,
                }}
              >
                <feature.icon size={22} style={{ color: feature.color }} strokeWidth={1.5} />
              </div>

              <h3 className="text-white font-semibold text-base mb-2">{feature.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
