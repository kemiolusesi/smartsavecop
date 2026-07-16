import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function ConfirmedPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0A] px-4 py-16 font-sans text-white sm:py-20">
      <div className="absolute inset-0 brand-grid" aria-hidden="true" />
      <div
        className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.08] blur-3xl"
        style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, #0093D8 48%, transparent 72%)' }}
        aria-hidden="true"
      />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-xl flex-col items-center justify-center text-center">
        <Link href="/" className="inline-flex items-center justify-center gap-3" aria-label="Back to Smart Save home">
          <img
            src="/logo.png"
            alt="Smart Save Cooperative Logo"
            width={46}
            height={46}
            className="h-[46px] w-auto"
            style={{ width: '46px', height: '46px', maxWidth: '46px', objectFit: 'contain' }}
          />
          <div>
            <p className="text-[15px] font-bold leading-none text-white">Smart Save</p>
            <p className="mt-1 text-[10.5px] font-medium uppercase tracking-widest text-[#D4AF37]/80">
              Cooperative
            </p>
          </div>
        </Link>

        <div className="mt-12 flex flex-col items-center">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-28 w-28" viewBox="0 0 104 104" aria-hidden="true">
              <circle className="email-confirm-circle" cx="52" cy="52" r="43" fill="none" stroke="#9DC03A" strokeWidth="5" />
              <path
                className="email-confirm-check"
                d="M32 54 45 67 74 36"
                fill="none"
                stroke="#9DC03A"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="6"
              />
            </svg>
            <svg
              className="email-confirm-sparkle absolute -right-1 top-7 h-4 w-4"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ animationDelay: '1.25s' }}
            >
              <path fill="#9DC03A" d="M12 1.5 14.3 9.2 22 12l-7.7 2.8L12 22.5l-2.3-7.7L2 12l7.7-2.8L12 1.5Z" />
            </svg>
            <svg
              className="email-confirm-sparkle absolute right-2 -top-1 h-3 w-3"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ animationDelay: '1.45s' }}
            >
              <path fill="#9DC03A" d="M12 1.5 14.3 9.2 22 12l-7.7 2.8L12 22.5l-2.3-7.7L2 12l7.7-2.8L12 1.5Z" />
            </svg>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#9DC03A]/20 bg-[#9DC03A]/10 px-3.5 py-1.5 text-xs font-bold text-[#9DC03A]">
            <CheckCircle2 size={13} />
            Email Verified
          </div>

          <h1 className="mx-auto mt-8 max-w-xl text-center text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl">
            Your Email Has Been Confirmed
          </h1>
          <div className="mx-auto mt-6 max-w-md text-center text-sm text-white/50">
            <p className="font-semibold text-white/65">Welcome to Smart Save Cooperative!</p>
            <div className="mt-2 space-y-1 leading-6">
              <p>Your account is ready</p>
              <p>Please log in with your details to access your member dashboard.</p>
            </div>
          </div>

          <Link
            href="/signin?mode=login"
            className="mt-9 inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-6 py-4 text-sm font-black text-brand-ink shadow-lg shadow-[#D4AF37]/10 transition-all hover:bg-[#F5D06B]"
          >
            Proceed to login →
          </Link>
        </div>
      </section>
    </main>
  );
}
