import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const stats = [
  { value: '₦100M+', label: 'Assets Under Management' },
  { value: '100+', label: 'Active Members', color: '#8BC34A' },
  { value: '100%', label: 'Payout Record', color: '#1E90FF' },
];

export default function NotFound() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 py-10 font-sans text-white"
      style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute top-[-10%] left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.06]"
          style={{
            background: 'radial-gradient(ellipse, #D4AF37 0%, #1E90FF 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 h-[400px] w-[500px] rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(ellipse, #8BC34A 0%, transparent 70%)',
          }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 brand-grid" aria-hidden="true" />

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <Link href="/" className="inline-flex items-center justify-center gap-3" aria-label="Smart Save home">
          <img
            src="/logo.png"
            alt="Smart Save Cooperative Logo"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
          />
          <span className="inline-flex flex-col items-start">
            <span className="text-lg font-black leading-none text-white">Smart Save</span>
            <span className="mt-1 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">Cooperative</span>
          </span>
        </Link>

        <h1 className="mt-10 text-8xl font-black leading-none tracking-tight text-white sm:text-9xl">404</h1>
        <h2 className="mt-4 text-2xl font-black text-white">Wealth Not Found.</h2>

        <p className="mx-auto mt-5 max-w-xl text-sm font-semibold leading-7 text-white/50 sm:text-base">
          The financial opportunity you are looking for has been moved or doesn&apos;t exist. Let&apos;s get you back on track.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex min-h-[46px] animate-[return-home-pulse_2.4s_ease-in-out_infinite] items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-6 text-sm font-black text-[#0A0A0A] shadow-[0_0_24px_rgba(212,175,55,0.24)] transition hover:bg-[#F5D06B] hover:shadow-[0_0_34px_rgba(212,175,55,0.38)]"
        >
          <ArrowLeft size={16} />
          Return to Home
        </Link>

        <div className="mt-10 grid w-full grid-cols-3 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 backdrop-blur-sm sm:p-4">
              <p className="mb-0.5 text-base font-black sm:text-2xl" style={{ color: stat.color || '#D4AF37' }}>
                {stat.value}
              </p>
              <p className="text-[9px] font-medium leading-tight text-white/40 sm:text-xs">{stat.label}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
