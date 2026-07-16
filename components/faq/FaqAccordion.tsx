'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '@/lib/faq';

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(items[0]?.question || null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openQuestion === item.question;

        return (
          <article
            key={item.question}
            className="overflow-hidden rounded-2xl border border-brand-border bg-brand-ghost backdrop-blur-sm transition-all hover:border-brand-input hover:shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-white/[0.15] dark:hover:bg-white/[0.04]"
          >
            <button
              type="button"
              onClick={() => setOpenQuestion(isOpen ? null : item.question)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold leading-6 text-brand-ink dark:text-white sm:text-base">
                {item.question}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-zinc-100 px-5 pb-5 pt-4 dark:border-white/[0.06] sm:px-6">
                  <p className="text-sm leading-7 text-zinc-600 dark:text-white/50">
                    {item.answer}
                  </p>
                  {item.bankDetails && (
                    <div className="mt-4 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4 dark:bg-[#D4AF37]/[0.06]">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Account Name</p>
                          <p className="mt-1 text-sm font-bold text-brand-ink dark:text-white">{item.bankDetails.accountName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Bank</p>
                          <p className="mt-1 text-sm font-bold text-brand-ink dark:text-white">{item.bankDetails.bankName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Account Type</p>
                          <p className="mt-1 text-sm font-bold text-brand-ink dark:text-white">{item.bankDetails.accountType}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Account Number</p>
                          <p className="mt-1 rounded-lg bg-[#D4AF37] px-3 py-2 font-mono text-xl font-black tracking-wider text-[#0A0A0A]">
                            {item.bankDetails.accountNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
