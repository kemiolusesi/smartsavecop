import Link from 'next/link';
import { ArrowRight, Shield, TrendingUp, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const values = [
  { icon: Shield, title: 'Trust', text: 'Founded on transparency and integrity' },
  { icon: Users, title: 'Community', text: 'Member-owned, member-driven decisions' },
  { icon: TrendingUp, title: 'Growth', text: 'Sustainable wealth for every member' },
];

const stats = [
  { value: '₦2.4B+', label: 'Assets', color: '#D4AF37' },
  { value: '7,200+', label: 'Members', color: '#8BC34A' },
  { value: '100%', label: 'Payout Record', color: '#1E90FF' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-alabaster text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
      <Navbar />
      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:pt-36">
          <div className="absolute inset-0 brand-grid opacity-60" aria-hidden="true" />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">Our Story</p>
            <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              Built on Trust. Driven by Community.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-white/50 sm:text-base">
              Smart Save Cooperative Society - helping individuals, families, and businesses achieve financial
              stability through disciplined savings, accessible loans, and investment opportunities.
            </p>
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
            {values.map((value) => (
              <article key={value.title} className="rounded-2xl border border-brand-border bg-brand-ghost p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                  <value.icon size={22} />
                </div>
                <h2 className="mt-5 text-xl font-black">{value.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/50">{value.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="mx-auto max-w-4xl space-y-6 text-base leading-8 text-zinc-600 dark:text-white/60">
            <p>
              Smart Save Cooperative Society is a trusted financial and empowerment organization committed to helping
              individuals, families, and businesses achieve financial stability and sustainable growth through
              disciplined savings, accessible loans, and investment opportunities.
            </p>
            <p>
              Founded on the principles of trust, transparency, and financial inclusion, we provide our members with
              secure and flexible savings plans tailored to meet different financial goals. From daily and monthly
              savings to targeted investment plans, we are dedicated to helping our members build wealth and achieve
              their personal and business aspirations.
            </p>
            <p>
              At Smart Save Cooperative Society, we understand the importance of access to financial support. That is
              why we offer affordable loan facilities designed to support businesses, education, personal development,
              and emergency needs with convenient repayment structures.
            </p>
            <p>
              Beyond savings and loans, we are passionate about improving lives by creating opportunities for economic
              empowerment, entrepreneurship, and financial discipline. We also support members in achieving their dreams
              through cooperative-based financing solutions, including solar and electronics financing opportunities.
            </p>
            <p>
              Our commitment is to provide reliable financial solutions with professionalism, integrity, and excellent
              customer service while building a strong community of financially empowered members.
            </p>
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="mx-auto grid max-w-4xl grid-cols-3 gap-3 rounded-2xl border border-brand-border bg-brand-ghost p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-black sm:text-3xl" style={{ color: stat.color }}>{stat.value}</p>
                <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 pb-24 text-center">
          <h2 className="text-3xl font-black">Ready to Start Saving?</h2>
          <Link href="/signin" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-4 text-sm font-black text-[#0A0A0A] transition hover:bg-[#F5D06B]">
            Join Smart Save Today
            <ArrowRight size={16} />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
