'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Chrome as Home, ArrowLeft } from 'lucide-react';

function CountUpAnimation({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}</span>;
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#0f0f0f] to-[#1a1a1a] text-white flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(ellipse, #D4AF37 0%, #0093D8 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[500px] rounded-full opacity-[0.02]"
          style={{
            background: 'radial-gradient(ellipse, #9DC03A 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
        aria-hidden="true"
      />

      <motion.div
        className="relative z-10 max-w-3xl mx-auto px-4 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="mb-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="text-left">
              <p className="text-xl font-bold tracking-tight text-white leading-none">Smart Save</p>
              <p className="text-sm text-[#D4AF37]/80 font-medium tracking-widest uppercase">Cooperative</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-10"
        >
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-2">
            <span className="text-white/20">₦</span>
            <span className="text-white">404</span>
          </h1>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white/80">
            Wealth Not Found.
          </h2>
        </motion.div>

        <motion.p
          className="text-base sm:text-lg text-white/50 max-w-xl mx-auto leading-relaxed mb-12 font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          The financial opportunity you are looking for has been moved or doesn't exist.
          Let's get you back on track.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Link href="/">
            <motion.button
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-sm text-[#0A0A0A] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(212,175,55,0.3)]"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5D06B 50%, #D4AF37 100%)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
              <span>Return to Growth in </span>
              <CountUpAnimation target={100} />
              <span>%</span>
            </motion.button>
          </Link>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          {[
            { value: '₦2.4B+', label: 'Assets Under Management', color: '#D4AF37' },
            { value: '12,000+', label: 'Active Members', color: '#9DC03A' },
            { value: '100%', label: 'Payout Record', color: '#0093D8' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 + idx * 0.1 }}
            >
              <p className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs text-white/40 leading-tight">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
