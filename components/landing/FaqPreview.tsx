import Link from 'next/link';
import { ArrowRight, HelpCircle } from 'lucide-react';
import FaqAccordion from '@/components/faq/FaqAccordion';
import { FAQS } from '@/lib/faq';

export default function FaqPreview() {
  const previewItems = FAQS.slice(0, 3);

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-brand-alabaster px-4 py-24 text-brand-ink dark:bg-[#0A0A0A] dark:text-white"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute left-1/2 top-1/3 h-[420px] w-[520px] -translate-x-1/2 rounded-full opacity-[0.02] blur-3xl dark:opacity-[0.05]"
          style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/[0.06] px-4 py-1.5 text-xs font-medium text-brand-amber dark:border-[#D4AF37]/20 dark:bg-[#D4AF37]/5 dark:text-[#D4AF37]">
            <HelpCircle size={12} />
            Got Questions?
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-brand-ink dark:text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-xl text-base text-zinc-600 dark:text-white/40">
            Quick answers to help you get started with confidence.
          </p>
        </div>

        <FaqAccordion items={previewItems} />

        <div className="mt-10 flex justify-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#0A0A0A] shadow-lg shadow-[#D4AF37]/10 transition-all hover:bg-[#D4AF37] active:scale-[0.98]"
          >
            View All FAQs
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

