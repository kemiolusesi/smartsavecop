'use client';

import Link from 'next/link';
import { ArrowUp, Instagram, Mail } from 'lucide-react';

const CONTACT_EMAIL = 'smartsavecooperative@gmail.com';
const WHATSAPP_URL = 'https://wa.me/2349010198072';
const INSTAGRAM_URL = 'https://instagram.com/smartsavecoop';

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.72 19.3 5.8 15.4a7.55 7.55 0 1 1 2.84 2.75L4.72 19.3Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.18 8.55c.16-.37.33-.38.5-.38h.42c.14 0 .36.05.55.27.2.23.74.73.74 1.77 0 1.04-.76 2.04-.87 2.18-.1.14-.18.27-.04.49.14.21.63 1.03 1.42 1.67.98.8 1.8 1.05 2.06 1.17.26.13.42.11.57-.06.16-.18.66-.76.84-1.03.18-.27.36-.22.61-.13.25.09 1.58.74 1.85.87.27.14.45.2.52.32.07.12.07.69-.16 1.35-.23.66-1.32 1.26-1.84 1.34-.47.07-1.06.1-1.7-.11-.39-.12-.9-.29-1.54-.57-2.7-1.16-4.46-3.86-4.6-4.04-.13-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25Z"
        fill="currentColor"
        transform="translate(1.35 1.15) scale(0.84)"
      />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-brand-border bg-brand-alabaster px-4 py-16 text-brand-ink dark:border-white/[0.08] dark:bg-[#0A0A0A] dark:text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-2 text-sm font-bold text-brand-ink dark:text-white">Smart Save Cooperative</p>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-white/40">
              Building generational wealth through transparent savings, accessible loans, and member-focused investments.
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-white/60">Product</p>
            <ul className="space-y-2">
              <li>
                <Link href="/#projected-earnings" className="text-sm text-zinc-500 transition-colors hover:text-brand-ink dark:text-white/40 dark:hover:text-white">
                  Savings Plans
                </Link>
              </li>
              <li>
                <Link href="/#calculator" className="text-sm text-zinc-500 transition-colors hover:text-brand-ink dark:text-white/40 dark:hover:text-white">
                  ROI Calculator
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-sm text-zinc-500 transition-colors hover:text-brand-ink dark:text-white/40 dark:hover:text-white">
                  Services
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-white/60">Company</p>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-zinc-500 transition-colors hover:text-brand-ink dark:text-white/40 dark:hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-zinc-500 transition-colors hover:text-brand-ink dark:text-white/40 dark:hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-zinc-500 transition-colors hover:text-brand-ink dark:text-white/40 dark:hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-white/60">Legal</p>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-zinc-500 transition-colors hover:text-brand-ink dark:text-white/40 dark:hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-zinc-500 transition-colors hover:text-brand-ink dark:text-white/40 dark:hover:text-white">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="text-sm text-zinc-500 transition-colors hover:text-brand-ink dark:text-white/40 dark:hover:text-white">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-6 border-t border-brand-border pt-8 dark:border-white/[0.08] sm:flex-row sm:items-center">
          <p className="text-xs text-brand-secondary dark:text-white/30">
            © {currentYear} Smart Save Cooperative. All rights reserved. Built with impact.
          </p>

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="#top"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-ghost text-brand-amber shadow-[0_2px_8px_rgba(139,109,56,0.08)] transition-all hover:border-brand-input hover:text-brand-ink dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-[#D4AF37] dark:shadow-none dark:hover:border-white/20 dark:hover:text-white"
              aria-label="Back to top of page"
            >
              <ArrowUp size={13} />
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-ghost text-brand-secondary shadow-[0_2px_8px_rgba(139,109,56,0.08)] transition-all hover:border-brand-input hover:text-brand-ink dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-white/40 dark:shadow-none dark:hover:border-white/20 dark:hover:text-white"
              aria-label="Email Smart Save Cooperative"
            >
              <Mail size={14} />
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-ghost text-brand-secondary shadow-[0_2px_8px_rgba(139,109,56,0.08)] transition-all hover:border-brand-input hover:text-brand-ink dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-white/40 dark:shadow-none dark:hover:border-white/20 dark:hover:text-white"
              aria-label="Chat with Smart Save Cooperative on WhatsApp"
            >
              <WhatsAppIcon size={15} />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-ghost text-brand-secondary shadow-[0_2px_8px_rgba(139,109,56,0.08)] transition-all hover:border-brand-input hover:text-brand-ink dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-white/40 dark:shadow-none dark:hover:border-white/20 dark:hover:text-white"
              aria-label="Open Smart Save Cooperative Instagram"
            >
              <Instagram size={14} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
