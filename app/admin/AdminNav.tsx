'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  ArrowDownToLine,
  Bell,
  BarChart3,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sun,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/loans', label: 'Loan Applications', icon: FileText },
  { href: '/admin/withdrawals', label: 'Withdrawal Requests', icon: ArrowDownToLine },
  { href: '/admin/investments', label: 'Investment Applications', icon: TrendingUp },
  { href: '/admin/transactions', label: 'Transaction Ledger', icon: Receipt },
  { href: '/admin/financials', label: 'Financials', icon: BarChart3 },
  { href: '/admin/kyc', label: 'KYC Approvals', icon: ShieldCheck },
  { href: '/admin/announcements', label: 'Announcements', icon: Bell },
  { href: '/admin/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/admin/history', label: 'Activity Log', icon: History },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function formatBadgeCount(count: number) {
  return count > 99 ? '99+' : String(count);
}

export function AdminLogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  async function logout() {
    document.cookie = 'ss_admin_dev_bypass=; path=/; max-age=0; SameSite=Lax';
    await supabase.auth.signOut();
    router.replace('/signin');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={`admin-logout-button inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 font-black text-red-300 transition hover:bg-red-500/15 ${
        compact ? 'h-10 w-10' : 'px-4 py-2 text-sm'
      }`}
      aria-label="Log out"
    >
      <LogOut size={16} />
      {!compact && <span>Logout</span>}
    </button>
  );
}

export function AdminThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'row' }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted && variant === 'row') {
    return (
      <button
        type="button"
        className="admin-nav-item flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-white/55"
        aria-label="Theme toggle loading"
        disabled
      >
        <Sun size={18} />
        <span className="min-w-0 flex-1">Theme</span>
        <span className="admin-menu-button inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#D4AF37]">
          <Sun size={15} />
        </span>
      </button>
    );
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className="admin-menu-button inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55"
        aria-label="Theme toggle loading"
        disabled
      >
        <Sun size={16} />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="admin-nav-item flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-white/55 transition hover:bg-white/[0.05] hover:text-white"
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
        <span className="min-w-0 flex-1">{isDark ? 'Light Theme' : 'Dark Theme'}</span>
        <span className="admin-menu-button inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#D4AF37] transition">
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="admin-menu-button inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#D4AF37] transition hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [pendingCounts, setPendingCounts] = useState({
    members: 0,
    payments: 0,
    withdrawals: 0,
    loans: 0,
    investments: 0,
  });

  useEffect(() => {
    let mounted = true;

    async function loadPendingCounts() {
      try {
        const response = await fetch('/api/admin/counts', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload?.success || !mounted) return;

        setPendingCounts({
          members: Number(payload.members || 0),
          payments: Number(payload.payments || 0),
          withdrawals: Number(payload.withdrawals || 0),
          loans: Number(payload.loans || 0),
          investments: Number(payload.investments || 0),
        });
      } catch {
        // Badges are helpful, but navigation should never fail because counts could not load.
      }
    }

    loadPendingCounts();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="admin-sidebar relative flex h-full flex-col overflow-hidden bg-[#0A0A0A] text-white">
      <div className="absolute inset-0 brand-grid" aria-hidden="true" />
      <div
        className="absolute left-1/2 top-0 h-[520px] w-[420px] -translate-x-1/2 rounded-full opacity-[0.08] blur-3xl"
        style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, #0093D8 48%, transparent 72%)' }}
        aria-hidden="true"
      />

      <div className="admin-sidebar-header relative z-10 border-b border-white/10 px-5 py-5">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
          <img src="/logo.png" alt="Smart Save Cooperative Logo" className="h-11 w-11 object-contain" />
          <div>
            <p className="text-sm font-black leading-none">Smart Save</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">Admin Panel</p>
          </div>
        </Link>
        <div className="admin-sidebar-label mt-4 inline-flex rounded-full border border-[#8BC34A]/25 bg-[#8BC34A]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8BC34A]">
          Administrative controls
        </div>
      </div>

      <nav className="relative z-10 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <AdminThemeToggle variant="row" />
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          const badgeCount =
            item.href === '/admin/members'
              ? pendingCounts.members
              : item.href === '/admin/payments'
                ? pendingCounts.payments
                : item.href === '/admin/withdrawals'
                  ? pendingCounts.withdrawals
                  : item.href === '/admin/loans'
                    ? pendingCounts.loans
                    : item.href === '/admin/investments'
                      ? pendingCounts.investments
                      : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`admin-nav-item flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                active
                  ? 'admin-nav-item-active border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'admin-nav-item-inactive text-white/55 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="relative min-w-0 flex-1 pr-5">
                {item.label}
                {badgeCount > 0 && (
                  <span className="admin-notification-badge absolute right-0 top-1/2 inline-flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black leading-none text-white">
                    {formatBadgeCount(badgeCount)}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="relative z-10 border-t border-white/10 p-4">
        <AdminLogoutButton />
      </div>
    </div>
  );
}

export default function AdminNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-menu-button fixed left-4 top-4 z-[70] inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#111] text-white shadow-2xl lg:hidden"
        aria-label="Open admin navigation"
      >
        <Menu size={20} />
      </button>

      <aside className="admin-sidebar-frame fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-white/10 lg:block">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close admin navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="admin-sidebar-frame relative h-full w-[min(86vw,20rem)] border-r border-white/10 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white"
              aria-label="Close admin navigation"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
