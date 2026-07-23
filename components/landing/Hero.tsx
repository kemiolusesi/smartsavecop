'use client';

import { ArrowRight, Sprout } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section id="top" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-16 bg-brand-alabaster text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
      {/* Background Lighting Rig */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(212, 175, 55, 0.16) 0%, rgba(245, 240, 232, 0) 72%)',
          }}
        />
        <div
          className="absolute top-[-12%] left-1/2 h-[620px] w-[920px] -translate-x-1/2 rounded-full opacity-[0.24] blur-3xl dark:hidden"
          style={{
            background: 'radial-gradient(ellipse, rgba(212,175,55,0.78) 0%, rgba(30,144,255,0.4) 48%, rgba(245,240,232,0) 76%)',
          }}
        />
        <div
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.025] dark:opacity-[0.06]"
          style={{
            background: 'radial-gradient(ellipse, #D4AF37 0%, #1E90FF 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full opacity-[0.02] dark:opacity-[0.03]"
          style={{
            background: 'radial-gradient(ellipse, #8BC34A 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Grid Pattern Mesh overlay */}
      <div
        className="absolute inset-0 pointer-events-none brand-grid"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center w-full">
        {/* Badge Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-border bg-brand-mint text-[11px] font-medium text-brand-emerald mb-8 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-[#8BC34A]">
          <Sprout size={12} />
          Formerly <b>Save & Earn</b>
        </div>

        {/* Small Brand Header Lockup */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="text-center">
            <p className="text-lg font-bold tracking-tight text-brand-ink leading-none dark:text-white">Smart Save</p>
            <p className="text-[10px] text-brand-amber font-bold tracking-[0.2em] uppercase mt-1 dark:text-[#D4AF37]/80">Cooperative</p>
          </div>
        </div>

        {/* Headline: Perfectly Balanced Line Breaks for Mobile */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-brand-ink leading-[1.1] mb-6 dark:text-white">
          <span className="block sm:inline whitespace-nowrap">Grow Wealth</span>{' '}
          <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5D06B] to-[#D4AF37] dark:from-[#D4AF37] dark:via-[#D4AF37] dark:to-[#D4AF37]">
            Together.
          </span>
        </h1>

        {/* Subheading Narrative */}
        <p className="text-sm sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed mb-10 font-medium px-2 dark:text-white/50">
          Earn structured returns through fixed investments and monthly savings with Nigeria's most transparent savings cooperative.
          <br />
          Join thousands building generational wealth.
        </p>

        {/* Side-by-Side Mobile Layout Controls */}
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 mb-14 w-full max-w-md sm:max-w-none mx-auto">
          <Link
            href="/signin"
            className="group flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-3.5 rounded-xl bg-[linear-gradient(135deg,#D4AF37_0%,#F5D06B_50%,#D4AF37_100%)] font-bold text-[11px] sm:text-sm text-brand-ink transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_34px_rgba(212,175,55,0.36)] whitespace-nowrap dark:bg-[linear-gradient(135deg,#D4AF37_0%,#D4AF37_50%,#D4AF37_100%)] dark:hover:shadow-[0_0_30px_rgba(212,175,55,0.18)]"
          >
            Start Saving Today
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1 hidden sm:inline-block" />
          </Link>
          
          <a href="#calculator" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-8 py-3.5 rounded-xl font-semibold text-[11px] sm:text-sm text-brand-ink border-[1.5px] border-[#C4A85A] bg-brand-ghost backdrop-blur-sm hover:border-[#C4A85A] hover:text-brand-ink transition-all duration-200 whitespace-nowrap dark:text-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:text-white">
            View ROI Calculator
          </a>
        </div>

        {/* Value Matrix Statistics Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto px-1">
          {[
            { value: '₦100M+', label: 'Assets Managed', color: '#D4AF37' },
            { value: '100+', label: 'Active Members', color: '#8BC34A' },
            { value: '100%', label: 'Payout Record', color: '#1E90FF' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-brand-border bg-brand-ghost p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-4 backdrop-blur-sm dark:border-white/[0.05] dark:bg-white/[0.02] dark:shadow-none"
            >
              <p
                className={`text-base sm:text-2xl font-black mb-0.5 ${
                  stat.color === '#D4AF37' ? 'text-[#B48924] dark:text-[#D4AF37]' : ''
                }`}
                style={stat.color === '#D4AF37' ? undefined : { color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="text-[9px] sm:text-xs text-zinc-500 leading-tight font-medium dark:text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
