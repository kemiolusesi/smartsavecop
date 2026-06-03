'use client';

import { ArrowRight, ShieldCheck, TrendingUp, Sprout } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-20">
      {/* Background Lighting Rig */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full opacity-[0.07]"
          style={{
            background: 'radial-gradient(ellipse, #D4AF37 0%, #0093D8 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full opacity-[0.04]"
          style={{
            background: 'radial-gradient(ellipse, #9DC03A 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Grid Pattern Mesh overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center w-full">
        {/* Badge Indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-[#9DC03A] mb-8 backdrop-blur-sm">
          <Sprout size={12} />
          Formerly <b>Save & Earn</b> </div>

        {/* Brand Header Lockup */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="text-left">
            <p className="text-xl font-bold tracking-tight text-white leading-none">Smart Save</p>
            <p className="text-sm text-[#D4AF37]/80 font-medium tracking-widest uppercase">Cooperative</p>
          </div>
        </div>

        {/* Headline: "Grow Wealth" and "Together." separate clean on mobile, unified text flow on desktop */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6">
          <span className="inline-block sm:inline whitespace-nowrap">Grow Wealth</span>{' '}
          <span className="block sm:inline relative">
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(135deg, #D4AF37 0%, #F5D06B 50%, #D4AF37 100%)',
              }}
            >
              Together.
            </span>
          </span>
        </h1>

        {/* Description Text Area */}
        <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-12 font-light">
          Earn up to{' '}
          <span className="text-[#9DC03A] font-semibold">15% annual returns</span>{' '}
          through Nigeria's most transparent savings cooperative.
          Join thousands building generational wealth.
        </p>

        {/* Side-by-Side Mobile Layout Controls optimized with fluid paddings to eliminate horizontal screen overflow */}
        <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-4 mb-16 w-full max-w-sm sm:max-w-none mx-auto px-1">
          <button
            className="group relative flex-1 sm:flex-none inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-8 py-4 rounded-xl font-semibold text-[11px] sm:text-sm text-[#0A0A0A] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5D06B 50%, #D4AF37 100%)',
            }}
          >
            Start Saving Today
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1 hidden sm:inline-block" />
          </button>
          
          <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-8 py-4 rounded-xl font-semibold text-[11px] sm:text-sm text-white/70 border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 hover:text-white transition-all duration-200 whitespace-nowrap">
            View ROI Calculator
          </button>
        </div>

        {/* Value Matrix Statistics Row (Optimized padding rules dynamically for mobile bounds) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 max-w-2xl mx-auto w-full">
          {[
            { value: '₦2.4B+', label: 'Assets Under Management', color: '#D4AF37' },
            { value: '7,200+', label: 'Active Members', color: '#9DC03A' },
            { value: '100%', label: 'Payout Record', color: '#0093D8' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 sm:p-4 backdrop-blur-sm"
            >
              <p className="text-lg sm:text-3xl font-bold mb-1" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs text-white/40 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Regulatory Governance Badge Row */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-10 flex-wrap">
          {[
            { icon: ShieldCheck, text: 'CAC Registered', color: '#0093D8' },
            { icon: ShieldCheck, text: 'NDIC Insured', color: '#0093D8' },
            { icon: ShieldCheck, text: 'CBN Compliant', color: '#0093D8' },
          ].map((badge) => (
            <div key={badge.text} className="flex items-center gap-1.5 text-xs text-white/30">        
              <badge.icon size={13} style={{ color: badge.color }} />
              {badge.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}