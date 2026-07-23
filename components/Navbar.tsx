'use client';

import { useEffect, useState } from 'react';
import { Menu, X, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { authService } from '@/lib/services/auth';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.push('/');
      setIsOpen(false);
    } catch {
      setIsOpen(false);
    }
  };

  const isDark = resolvedTheme === 'dark';
  const homeAnchor = (hash: string) => (pathname === '/' ? hash : `/${hash}`);
  const faqHref = pathname === '/' ? '#faq' : '/faq';

  const themeToggle = mounted ? (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-ghost text-zinc-600 transition-all hover:border-brand-input hover:text-brand-ink dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-white/20 dark:hover:text-white"
    >
      {isDark ? <Sun size={16} className="text-[#D4AF37]" /> : <Moon size={16} className="text-brand-ink" />}
    </button>
  ) : (
    <span className="inline-flex h-9 w-9" aria-hidden="true" />
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border/60 bg-brand-surface/60 shadow-[0_8px_28px_rgba(139,109,56,0.10)] backdrop-blur-xl backdrop-saturate-150 transition-colors dark:border-white/[0.08] dark:bg-[#0A0A0A]/60 dark:shadow-none">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand Core Node Identity */}
        <Link href="/" className="flex items-center gap-3" aria-label="Smart Save Home">
          <img
            src="/logo.png"
            alt="Smart Save Cooperative Logo"
            width={40}
            height={40}
            className="h-10 w-auto"
            style={{ width: '40px', height: '40px', maxWidth: '40px', objectFit: 'contain' }}
          />
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-brand-ink leading-none dark:text-white">Smart Save</p>
            <p className="text-[10px] text-brand-amber font-medium tracking-widest uppercase dark:text-[#D4AF37]/80">Cooperative</p>
          </div>
        </Link>

        {/* Desktop Anchor Routing Tree */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm text-zinc-600 hover:text-brand-ink transition-colors flex items-center gap-1.5 font-normal dark:text-white/60 dark:hover:text-white">
            {/* <Home size={14} className="text-[#D4AF37]/80" /> */}
            Home
          </Link>
          <a href={homeAnchor('#calculator')} className="text-sm text-zinc-600 hover:text-brand-ink transition-colors font-normal dark:text-white/60 dark:hover:text-white">
            Calculator
          </a>
          <a href={homeAnchor('#features')} className="text-sm text-zinc-600 hover:text-brand-ink transition-colors font-normal dark:text-white/60 dark:hover:text-white">
            Services
          </a>
          <a href={faqHref} className="text-sm text-zinc-600 hover:text-brand-ink transition-colors font-normal dark:text-white/60 dark:hover:text-white">
            FAQ
          </a>
          <Link href="/marketplace" className="text-sm text-zinc-600 hover:text-brand-ink transition-colors font-normal dark:text-white/60 dark:hover:text-white">
            Marketplace
          </Link>
        </div>

        {/* CTA Matrix + Accessibility Interactive Layer */}
        <div className="flex items-center gap-3">
          {themeToggle}

          {isAuthenticated ? (
            <>
              {/* Main Core Dashboard Navigation Anchor */}
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex px-5 py-2 rounded-lg text-sm font-semibold text-brand-ink bg-brand-gold hover:bg-[#F5D06B] active:scale-[0.98] transition-all duration-200 shadow-md shadow-[#D4AF37]/10"
              >
                Dashboard
              </Link>

              {/* Secure Session Termination Trigger with Accessible Hover Tooltip Subtitle */}
              <button
                onClick={handleLogout}
                aria-label="Logout from secure session"
                className="hidden sm:inline-flex px-3 py-2 rounded-lg text-zinc-500 hover:text-brand-ink hover:bg-brand-ghost transition-all group relative items-center justify-center dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5"
              >
                <LogOut size={18} />
                
                {/* Hardware-Accelerated Accessibility Subtitle Tooltip */}
                <span className="absolute top-12 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 bg-brand-surface border border-brand-border text-brand-ink text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 dark:bg-[#111111] dark:border-white/10 dark:text-white">
                  Logout
                </span>
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="hidden sm:inline-flex px-5 py-2 rounded-lg text-sm font-semibold text-zinc-700 border border-brand-border bg-brand-ghost hover:border-brand-input hover:text-brand-ink transition-all font-normal dark:text-white/70 dark:border-white/10 dark:bg-transparent dark:hover:border-white/20 dark:hover:text-white"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Layout Controller Link */}
          <button
            className="md:hidden text-zinc-600 hover:text-brand-ink transition-colors dark:text-white/60 dark:hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle structural layout navigation menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Component Stack Workspace Viewport */}
      {isOpen && (
        <div className="relative overflow-hidden border-t border-brand-border/60 bg-brand-alabaster shadow-[0_8px_24px_rgba(139,109,56,0.10)] md:hidden dark:border-white/[0.08] dark:bg-[#0A0A0A]/80 dark:shadow-none">
          <div className="absolute inset-0 brand-grid dark:hidden" aria-hidden="true" />
          <div
            className="absolute inset-0 dark:hidden"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(212, 175, 55, 0.16) 0%, rgba(245, 240, 232, 0) 72%)',
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 px-4 py-4 space-y-3">
            <Link href="/" onClick={() => setIsOpen(false)} className="block text-sm text-zinc-600 hover:text-brand-ink transition-colors py-2 font-normal dark:text-white/60 dark:hover:text-white">
              Home
            </Link>
            <a href={homeAnchor('#calculator')} onClick={() => setIsOpen(false)} className="block text-sm text-zinc-600 hover:text-brand-ink transition-colors py-2 font-normal dark:text-white/60 dark:hover:text-white">
              Calculator
            </a>
            <a href={homeAnchor('#features')} onClick={() => setIsOpen(false)} className="block text-sm text-zinc-600 hover:text-brand-ink transition-colors py-2 font-normal dark:text-white/60 dark:hover:text-white">
              Services
            </a>
            <a href={faqHref} onClick={() => setIsOpen(false)} className="block text-sm text-zinc-600 hover:text-brand-ink transition-colors py-2 font-normal dark:text-white/60 dark:hover:text-white">
              FAQ
            </a>
            <Link href="/marketplace" onClick={() => setIsOpen(false)} className="block text-sm text-zinc-600 hover:text-brand-ink transition-colors py-2 font-normal dark:text-white/60 dark:hover:text-white">
              Marketplace
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block text-sm text-brand-amber font-semibold py-2 dark:text-[#D4AF37]">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full mt-3 px-5 py-2.5 rounded-lg text-sm font-semibold text-zinc-700 border border-brand-border hover:border-red-500/20 hover:text-red-500 transition-all flex items-center justify-center gap-2 font-mono uppercase tracking-wide text-[11px] dark:text-white/70 dark:border-white/10 dark:hover:text-red-400"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                onClick={() => setIsOpen(false)}
                className="w-full mt-3 px-5 py-2.5 rounded-lg text-sm font-semibold text-zinc-700 border border-brand-border bg-brand-ghost hover:border-brand-input hover:text-brand-ink transition-all block text-center font-normal dark:text-white/70 dark:border-white/10 dark:bg-transparent dark:hover:border-white/20 dark:hover:text-white"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
