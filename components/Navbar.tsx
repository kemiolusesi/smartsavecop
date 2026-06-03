'use client';

import { useState } from 'react';
import { Menu, X, LogOut, Home } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { authService } from '@/lib/services/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.push('/');
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/[0.08] bg-[#0A0A0A]/80">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand Core Node Identity */}
        <Link href="/" className="flex items-center gap-3" aria-label="Smart Save Home">
          <img
            src="/logo.png"
            alt="Smart Save Cooperative Logo"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">Smart Save</p>
            <p className="text-[10px] text-[#D4AF37]/80 font-medium tracking-widest uppercase">Cooperative</p>
          </div>
        </Link>

        {/* Desktop Anchor Routing Tree */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5 font-normal">
            {/* <Home size={14} className="text-[#D4AF37]/80" /> */}
            Home
          </Link>
          <a href="#calculator" className="text-sm text-white/60 hover:text-white transition-colors font-normal">
            Calculator
          </a>
          <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors font-normal">
            Features
          </a>
          <a href="#faq" className="text-sm text-white/60 hover:text-white transition-colors font-normal">
            FAQ
          </a>
        </div>

        {/* CTA Matrix + Accessibility Interactive Layer */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Main Core Dashboard Navigation Anchor */}
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex px-5 py-2 rounded-lg text-sm font-semibold text-[#0A0A0A] bg-[#D4AF37] hover:bg-[#F5D06B] active:scale-[0.98] transition-all duration-200 shadow-md shadow-[#D4AF37]/5"
              >
                Dashboard
              </Link>

              {/* Secure Session Termination Trigger with Accessible Hover Tooltip Subtitle */}
              <button
                onClick={handleLogout}
                aria-label="Logout from secure session"
                className="hidden sm:inline-flex px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all group relative items-center justify-center"
              >
                <LogOut size={18} />
                
                {/* Hardware-Accelerated Accessibility Subtitle Tooltip */}
                <span className="absolute top-12 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 bg-[#111111] border border-white/10 text-white text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                  Logout
                </span>
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="hidden sm:inline-flex px-5 py-2 rounded-lg text-sm font-semibold text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all font-normal"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Layout Controller Link */}
          <button
            className="md:hidden text-white/60 hover:text-white transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle structural layout navigation menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Component Stack Workspace Viewport */}
      {isOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#0A0A0A]/95">
          <div className="px-4 py-4 space-y-3">
            <Link href="/" onClick={() => setIsOpen(false)} className="block text-sm text-white/60 hover:text-white transition-colors py-2 font-normal">
              Home
            </Link>
            <a href="#calculator" onClick={() => setIsOpen(false)} className="block text-sm text-white/60 hover:text-white transition-colors py-2 font-normal">
              Calculator
            </a>
            <a href="#features" onClick={() => setIsOpen(false)} className="block text-sm text-white/60 hover:text-white transition-colors py-2 font-normal">
              Features
            </a>
            <a href="#faq" onClick={() => setIsOpen(false)} className="block text-sm text-white/60 hover:text-white transition-colors py-2 font-normal">
              FAQ
            </a>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block text-sm text-[#D4AF37] font-semibold py-2">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full mt-3 px-5 py-2.5 rounded-lg text-sm font-semibold text-white/70 border border-white/10 hover:border-red-500/20 hover:text-red-400 transition-all flex items-center justify-center gap-2 font-mono uppercase tracking-wide text-[11px]"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setIsOpen(false)}
                className="w-full mt-3 px-5 py-2.5 rounded-lg text-sm font-semibold text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all block text-center font-normal"
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