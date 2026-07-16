'use client';

import { useMemo, useState } from 'react';
import { Mail, Search } from 'lucide-react';
import FaqAccordion from '@/components/faq/FaqAccordion';
import { FAQ_CATEGORIES, FAQS } from '@/lib/faq';

export default function FaqPageClient() {
  const [query, setQuery] = useState('');

  const filteredFaqs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return FAQS;

    return FAQS.filter((item) => item.question.toLowerCase().includes(normalizedQuery));
  }, [query]);

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-14 pt-32 sm:pb-16 sm:pt-36">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute left-1/2 top-10 h-[420px] w-[640px] -translate-x-1/2 rounded-full opacity-[0.025] blur-3xl dark:opacity-[0.06]"
            style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, #0093D8 48%, transparent 72%)' }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#B48924]/15 bg-[#B48924]/[0.06] px-4 py-1.5 text-xs font-medium text-brand-amber dark:border-[#D4AF37]/20 dark:bg-[#D4AF37]/5 dark:text-[#D4AF37]">
            Help Center
          </div>
          <h1 className="mb-5 text-4xl font-black tracking-tight text-brand-ink dark:text-white sm:text-5xl">
            Everything You Need to Know
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-zinc-600 dark:text-white/50 sm:text-base">
            Find answers about membership, savings, loans, and how Smart Save Cooperative works.
          </p>

          <label className="relative mx-auto mt-10 block max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/30" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions..."
              className="h-13 w-full rounded-2xl border border-brand-border bg-brand-ghost py-4 pl-11 pr-4 text-sm font-medium text-brand-ink outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/15 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/25"
            />
          </label>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-3xl space-y-12">
          {FAQ_CATEGORIES.map((category) => {
            const items = filteredFaqs.filter((item) => item.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <div className="mb-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-amber dark:text-[#D4AF37]">
                    {category}
                  </p>
                  <div className="mt-2 h-px w-16 bg-[#D4AF37]" />
                </div>
                <FaqAccordion items={items} />
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="rounded-2xl border border-brand-border bg-brand-ghost p-8 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
              <p className="text-sm font-semibold text-brand-ink dark:text-white">No matching questions found.</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-white/45">
                Try a different keyword or contact our support team.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-8 text-center dark:bg-[#D4AF37]/[0.06]">
          <h2 className="text-2xl font-black text-brand-ink dark:text-white">Still have questions?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-white/50">
            Our team is here to help you get started.
          </p>
          <a
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#0A0A0A] shadow-lg shadow-[#D4AF37]/10 transition-all hover:bg-[#F5D06B] active:scale-[0.98]"
          >
            <Mail size={16} />
            Contact Us
          </a>
        </div>
      </section>
    </>
  );
}
