'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownToLine,
  Bell,
  Check,
  Download,
  FileText,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { toOptionalErrorMessage } from '@/lib/error-message';
import { supabase } from '@/lib/supabase';

type AdminView =
  | 'overview'
  | 'members'
  | 'loans'
  | 'withdrawals'
  | 'investments'
  | 'transactions'
  | 'kyc'
  | 'announcements'
  | 'settings';

type AdminData = {
  adminProfile: any;
  profiles: any[];
  transactions: any[];
  paymentSubmissions: any[];
  loanApplications: any[];
  loanProducts: any[];
  investmentApplications: any[];
  announcements: any[];
  settings: any[];
  adminNotes: any[];
  auditLog: any[];
  identityRequests: any[];
};

type RunAction = (
  action: string,
  body: Record<string, unknown>,
  message?: string | ((data: any) => string)
) => Promise<any>;

const viewTitles: Record<AdminView, { label: string; icon: any }> = {
  overview: { label: 'Overview', icon: ShieldCheck },
  members: { label: 'Members', icon: Users },
  loans: { label: 'Loan Applications', icon: FileText },
  withdrawals: { label: 'Withdrawal Requests', icon: ArrowDownToLine },
  investments: { label: 'Investment Applications', icon: TrendingUp },
  transactions: { label: 'Transaction Ledger', icon: Receipt },
  kyc: { label: 'KYC Approvals', icon: ShieldCheck },
  announcements: { label: 'Announcements', icon: Bell },
  settings: { label: 'Settings', icon: Settings },
};

function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoneyInput(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-NG');
}

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(parseMoney(value));
}

function formatDate(value?: string | null) {
  if (!value) return 'Pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pending';
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function timeAgo(value?: string | null) {
  if (!value) return 'Recently';
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff)) return 'Recently';
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function memberName(profile?: any) {
  return profile?.full_name || profile?.email || 'Unknown member';
}

function makeProfileMap(profiles: any[]) {
  return new Map(profiles.map((profile) => [profile.user_id, profile]));
}

function applicationAmount(application: any) {
  return application?.amount_approved ?? application?.amount_requested ?? application?.amount;
}

function applicationType(application: any, kind?: 'loan' | 'investment') {
  if (kind === 'loan') return application?.loan_type || 'Loan';
  if (kind === 'investment') return application?.investment_type || 'Investment';
  return application?.loan_type || application?.investment_type || 'Application';
}

function applicationDetailValue(application: any, key: string, value: unknown) {
  if (key === 'reviewed_at') return formatDateTime(String(value || application?.approved_at || ''));
  if (key === 'reviewed_by') return String(value || 'Admin');
  return String(value ?? 'Not set');
}

function parseWithdrawalReference(reference?: string | null) {
  const parts = String(reference || '')
    .split(' - ')
    .map((part) => part.trim());

  return {
    accountName: parts[0] || 'Not provided',
    accountNumber: parts[1] || 'Not provided',
    bankName: parts[2] || 'Not provided',
  };
}

function normalize(value: unknown) {
  return String(value || '').toLowerCase();
}

const TRANSACTION_TYPE_FILTERS = [
  'All',
  'deposit',
  'withdrawal',
  'registration_fee',
  'loan_repayment',
  'loan_disbursement',
  'interest',
  'interest_accrual',
  'fee',
  'manual_adjustment',
];

const TRANSACTION_STATUS_FILTERS = [
  'All',
  'pending',
  'success',
  'approved',
  'processing',
  'failed',
  'rejected',
  'transferred',
];

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function statusBadge(status?: string | null) {
  const value = normalize(status || 'pending');
  const className =
    value === 'approved' || value === 'active' || value === 'success' || value === 'completed' || value === 'transferred'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
      : value === 'pending' || value === 'processing'
        ? 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]'
        : 'border-red-500/25 bg-red-500/10 text-red-300';

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black capitalize ${className}`}>{status || 'pending'}</span>;
}

function Panel({
  title,
  icon: Icon,
  children,
  action,
  iconSize = 'default',
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
  action?: React.ReactNode;
  iconSize?: 'default' | 'large';
}) {
  const iconBoxClass =
    iconSize === 'large'
      ? 'h-12 w-12'
      : 'h-10 w-10';
  const iconPixelSize = iconSize === 'large' ? 22 : 18;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035]">
      <div className="flex flex-row items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className={`inline-flex ${iconBoxClass} items-center justify-center rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]`}>
              <Icon size={iconPixelSize} />
            </span>
          )}
          <h2 className="min-w-0 text-lg font-black">{title}</h2>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  tone = 'amber',
  subtitle,
  pulse = false,
}: {
  label: string;
  value: string;
  tone?: 'amber' | 'red' | 'green';
  subtitle?: string;
  pulse?: boolean;
}) {
  const color = tone === 'red' ? 'text-red-300' : tone === 'green' ? 'text-emerald-300' : 'text-[#D4AF37]';

  return (
    <div className={`min-w-0 rounded-lg border border-white/10 bg-white/[0.035] p-3 md:p-5 ${pulse ? 'admin-pending-card-pulse' : ''}`}>
      <p className="text-xs font-black uppercase tracking-widest text-white/40">{label}</p>
      <p className={`mt-3 min-w-0 break-words text-xl font-black leading-tight sm:text-2xl ${color}`}>{value}</p>
      {subtitle && <p className="mt-2 text-xs font-black uppercase tracking-widest text-white/35">{subtitle}</p>}
    </div>
  );
}

async function getTotalPendingCount() {
  const response = await fetch('/api/admin/counts', { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || !payload?.success) throw new Error(payload?.error || 'Unable to load pending action count.');
  return Number(payload.totalPendingActions || 0);
}

function ToolbarInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block min-w-0 flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-10 pr-3 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
      />
    </label>
  );
}

function SelectControl({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-11 rounded-lg border border-white/10 bg-[#111] px-3 text-sm font-black text-white outline-none focus:border-[#D4AF37]/50 ${className}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function ActionButton({
  children,
  onClick,
  tone = 'amber',
  disabled = false,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: 'amber' | 'red' | 'neutral' | 'green';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const className =
    tone === 'red'
      ? 'border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/15'
      : tone === 'green'
        ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15'
        : tone === 'neutral'
          ? 'border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.07]'
          : 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/15';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

function DataTable({ children, minWidth = 860 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="px-5 py-16 text-center text-sm font-semibold text-white/40">{label}</div>;
}

export default function AdminDashboardClient({ view }: { view: AdminView }) {
  const [data, setData] = useState<AdminData | null>(null);
  const [totalPendingActions, setTotalPendingActions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refreshPendingCount() {
    try {
      const total = await getTotalPendingCount();
      setTotalPendingActions(total);
    } catch {
      // Pending counts refresh on the next realtime event or page load.
    }
  }

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [response, pendingTotal] = await Promise.all([
        fetch('/api/admin/data', { cache: 'no-store' }),
        getTotalPendingCount(),
      ]);
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load admin data.');
      setData(payload);
      setTotalPendingActions(pendingTotal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  }

  async function runAction(
    action: string,
    body: Record<string, unknown>,
    successMessage: string | ((data: any) => string) = 'Action completed.'
  ) {
    setSaving(action);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || response.statusText || 'Unable to complete action.');
      }
      setNotice(typeof successMessage === 'function' ? successMessage(payload.data) : successMessage);
      await loadData();
      return payload.data;
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Unable to complete action.');
      return null;
    } finally {
      setSaving('');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (view !== 'overview') return;

    const channel = supabase
      .channel('pending-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_submissions' },
        () => refreshPendingCount()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loan_applications' },
        () => refreshPendingCount()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => refreshPendingCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [view]);

  const title = viewTitles[view];
  const ViewIcon = title.icon;

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white/50">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          <p className="text-sm font-black">Loading admin workspace...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-4 text-sm font-semibold text-red-300">{error || 'Unable to load admin data.'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#8BC34A]">Admin control center</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-[#8BC34A]/25 bg-[#8BC34A]/10 text-[#8BC34A]">
              <ViewIcon size={22} />
            </span>
            <h2 className="text-2xl font-black sm:text-3xl">{title.label}</h2>
          </div>
        </div>
        <div className="group relative shrink-0">
          <ActionButton onClick={loadData} tone="neutral" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            <span className="hidden sm:inline">Refresh</span>
          </ActionButton>
          <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 rounded-md border border-white/10 bg-[#111111] px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-within:opacity-100 sm:hidden">
            Refresh
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {toOptionalErrorMessage(error)}
        </div>
      )}
      {notice && <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300">{notice}</div>}

      {view === 'overview' && <Overview data={data} totalPendingActions={totalPendingActions} />}
      {view === 'members' && <Members data={data} runAction={runAction} saving={saving} />}
      {view === 'loans' && <Loans data={data} runAction={runAction} saving={saving} />}
      {view === 'withdrawals' && <Withdrawals data={data} runAction={runAction} saving={saving} />}
      {view === 'investments' && <Investments data={data} runAction={runAction} saving={saving} />}
      {view === 'transactions' && <Transactions data={data} runAction={runAction} saving={saving} />}
      {view === 'kyc' && <Kyc data={data} runAction={runAction} saving={saving} />}
      {view === 'announcements' && <Announcements data={data} runAction={runAction} saving={saving} />}
      {view === 'settings' && <SettingsView data={data} runAction={runAction} saving={saving} />}
    </div>
  );
}

function Overview({ data, totalPendingActions }: { data: AdminData; totalPendingActions: number }) {
  const [dismissedActivityIds, setDismissedActivityIds] = useState<string[]>([]);
  const profiles = data.profiles || [];
  const members = profiles.filter((profile) => !profile.is_admin);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const depositsThisMonth = data.transactions
    .filter((transaction) => transaction.type === 'deposit' && ['approved', 'success'].includes(transaction.status))
    .filter((transaction) => new Date(transaction.created_at) >= monthStart)
    .reduce((sum, transaction) => sum + parseMoney(transaction.amount), 0);
  const balance = members.reduce((sum, profile) => sum + parseMoney(profile.balance), 0);
  const profileMap = makeProfileMap(profiles);
  const activity: Array<{ id: string; member: string; action: string; amount?: unknown; created_at?: string | null }> = [
    ...profiles.map((profile) => ({
      id: `profile-${profile.user_id}`,
      member: memberName(profile),
      action: 'New member registration',
      created_at: profile.created_at,
    })),
    ...data.loanApplications.map((loan) => ({
      id: `loan-${loan.id}`,
      member: memberName(profileMap.get(loan.user_id)),
      action: `Loan application submitted: ${loan.loan_type || 'Loan'}`,
      amount: applicationAmount(loan),
      created_at: loan.created_at,
    })),
    ...data.transactions
      .filter((transaction) => ['withdrawal', 'deposit'].includes(transaction.type))
      .map((transaction) => ({
        id: `txn-${transaction.id}`,
        member: memberName(profileMap.get(transaction.user_id)),
        action: transaction.type === 'withdrawal' ? 'Withdrawal requested' : 'Deposit confirmed',
        amount: transaction.amount,
        created_at: transaction.created_at,
      })),
  ]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 10);
  const visibleActivity =
    dismissedActivityIds.length === 0
      ? activity
      : activity.filter((item) => !dismissedActivityIds.includes(item.id));
  const pendingTone = totalPendingActions === 0 ? 'green' : totalPendingActions >= 6 ? 'red' : 'amber';
  const pendingSubtitle =
    totalPendingActions === 0 ? 'All caught up!' : totalPendingActions >= 6 ? 'Action required' : 'Needs attention';

  useEffect(() => {
    const stored = window.localStorage.getItem('admin_dismissed_activities');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setDismissedActivityIds(parsed.filter((item): item is string => typeof item === 'string'));
      }
    } catch {
      window.localStorage.removeItem('admin_dismissed_activities');
    }
  }, []);

  function clearRecentActivity() {
    if (visibleActivity.length === 0) return;
    const nextDismissed = Array.from(new Set([...dismissedActivityIds, ...visibleActivity.map((item) => item.id)]));
    window.localStorage.setItem('admin_dismissed_activities', JSON.stringify(nextDismissed));
    setDismissedActivityIds(nextDismissed);
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @keyframes adminPendingCardPulse {
          0%, 100% {
            box-shadow: 0 0 0 rgba(239, 68, 68, 0);
          }
          50% {
            box-shadow: 0 0 18px rgba(239, 68, 68, 0.18);
          }
        }

        .admin-pending-card-pulse {
          animation: adminPendingCardPulse 2.4s ease-in-out infinite;
        }
      `}</style>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Total Members" value={String(members.length)} />
        <StatCard label="Active Members" value={String(members.filter((profile) => profile.onboarding_completed).length)} tone="green" />
        <StatCard label="Deposits This Month" value={formatCurrency(depositsThisMonth)} />
        <StatCard label="Pending Loans" value={String(data.loanApplications.filter((loan) => loan.status === 'pending').length)} tone="red" />
        <StatCard label="Pending Investments" value={String(data.investmentApplications.filter((investment) => investment.status === 'pending').length)} tone="red" />
        <StatCard label="Pending Withdrawals" value={String((data.paymentSubmissions || []).filter((payment) => payment.payment_type === 'withdrawal' && payment.status === 'pending').length)} tone="red" />
        <StatCard label="Cooperative Balance" value={formatCurrency(balance)} tone="green" />
        <StatCard
          label="Total Pending Actions"
          value={String(totalPendingActions)}
          tone={pendingTone}
          subtitle={pendingSubtitle}
          pulse={totalPendingActions >= 6}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel
          title="Recent Activity"
          icon={Receipt}
          action={
            visibleActivity.length > 0 && (
              <div className="flex flex-col items-end gap-1">
                <ActionButton onClick={clearRecentActivity} tone="neutral">
                  <X size={14} />
                  Clear
                </ActionButton>
                <p className="max-w-[180px] text-right text-[10px] font-semibold leading-4 text-white/35">
                  Cleared items are still saved in Activity Log
                </p>
              </div>
            )
          }
        >
          {visibleActivity.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-semibold text-white/40">No new activity. View full history in Activity Log.</p>
              <Link href="/admin/history" className="mt-4 inline-flex rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black text-[#D4AF37] transition hover:bg-[#D4AF37]/15">
                Open Activity Log
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {visibleActivity.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black">{item.member}</p>
                    <p className="mt-1 text-sm text-white/45">{item.action}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    {item.amount != null && <p className="font-black text-[#D4AF37]">{formatCurrency(item.amount)}</p>}
                    <p className="mt-1 text-xs font-bold text-white/35">{timeAgo(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Quick Actions" icon={ShieldCheck}>
          <div className="grid gap-3 p-4">
            <Link href="/admin/loans" className="rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-3 text-sm font-black text-[#D4AF37]">Review Pending Loans</Link>
            <Link href="/admin/investments" className="rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-3 text-sm font-black text-[#D4AF37]">Review Pending Investments</Link>
            <Link href="/admin/withdrawals" className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300">Process Withdrawals</Link>
            <Link href="/admin/kyc" className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300">Approve KYC</Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function MemberDetail({
  member,
  data,
  onClose,
  runAction,
  saving,
}: {
  member: any;
  data: AdminData;
  onClose: () => void;
  runAction: RunAction;
  saving: string;
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const transactions = data.transactions.filter((transaction) => transaction.user_id === member.user_id);
  const loans = data.loanApplications.filter((loan) => loan.user_id === member.user_id);
  const notes = data.adminNotes.filter((adminNote) => adminNote.user_id === member.user_id);
  const isPendingApproval = member.approval_status === 'pending';

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" aria-label="Close member panel" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#0A0A0A] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Member Detail</p>
            <h3 className="mt-1 text-2xl font-black">{memberName(member)}</h3>
            <p className="mt-1 text-sm text-white/45">{member.email || member.user_id}</p>
          </div>
          <ActionButton onClick={onClose} tone="neutral">
            <X size={14} />
          </ActionButton>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Object.entries(member).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-white/35">{key.replace(/_/g, ' ')}</p>
              <p className="mt-2 break-words text-sm font-semibold text-white/80">{String(value ?? 'Not set')}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          <Panel title="Application Review" icon={FileText}>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <ReviewItem label="Approval Status" value={member.approval_status || 'pending'} />
              <ReviewItem label="Submitted" value={formatDate(member.updated_at || member.created_at)} />
              <ReviewItem label="Full Name" value={member.full_name} />
              <ReviewItem label="Phone" value={member.phone_number} />
              <ReviewItem label="Date of Birth" value={member.date_of_birth} />
              <ReviewItem label="Gender" value={member.gender} />
              <ReviewItem label="Address" value={member.address} />
              <ReviewItem label="State" value={member.state_of_residence} />
              <ReviewItem label="Occupation" value={member.occupation} />
              <ReviewItem label="Employment" value={member.employment_status} />
              <ReviewItem label="Monthly Income" value={member.monthly_income_range} />
              <ReviewItem label="NIN" value={member.nin ? 'Submitted' : 'Not submitted'} />
              <ReviewItem label="ID Type" value={member.kyc_document_type} />
              <ReviewItem label="ID Document" value={member.kyc_document_url || 'Not uploaded'} />
              <ReviewItem label="Next of Kin" value={member.next_of_kin_name} />
              <ReviewItem label="Relationship" value={member.next_of_kin_relationship} />
              <ReviewItem label="Kin Phone" value={member.next_of_kin_phone} />
              <ReviewItem label="Kin Address" value={member.next_of_kin_address} />
              <ReviewItem label="Kin Email" value={member.next_of_kin_email} />
              <ReviewItem label="Terms Accepted" value={member.terms_accepted ? formatDate(member.terms_accepted_at) : 'No'} />
            </div>
            <div className="border-t border-white/10 p-4">
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Reason for rejection"
                className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-red-500/50"
              />
            </div>
            <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2">
              <ActionButton
                onClick={() => runAction('approveMember', { userId: member.user_id }, 'Member approved.')}
                disabled={saving !== '' || !isPendingApproval}
                tone="green"
              >
                Approve Member
              </ActionButton>
              <ActionButton
                onClick={() => runAction('rejectMember', { userId: member.user_id, reason }, 'Application rejected.')}
                disabled={saving !== '' || !reason || !isPendingApproval}
                tone="red"
              >
                Reject Application
              </ActionButton>
            </div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <ActionButton onClick={() => runAction('approveKyc', { userId: member.user_id }, 'KYC approved.')} disabled={saving !== ''} tone="green">
              Approve KYC
            </ActionButton>
            <ActionButton onClick={() => runAction('rejectKyc', { userId: member.user_id, reason }, 'KYC rejected.')} disabled={saving !== '' || !reason} tone="red">
              Reject KYC
            </ActionButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionButton
              onClick={() => window.confirm('Grant admin privileges to this member?') && runAction('grantAdmin', { userId: member.user_id }, 'Admin granted.')}
              disabled={saving !== ''}
            >
              Grant Admin
            </ActionButton>
            <ActionButton
              onClick={() => window.confirm('Suspend this member?') && runAction('suspendMember', { userId: member.user_id }, 'Member suspended.')}
              disabled={saving !== ''}
              tone="red"
            >
              Suspend Member
            </ActionButton>
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add admin note"
            className="min-h-[90px] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
          />
          <ActionButton onClick={() => runAction('addAdminNote', { userId: member.user_id, note }, 'Note saved.').then(() => setNote(''))} disabled={saving !== '' || !note}>
            Add Note
          </ActionButton>
        </div>

        <div className="mt-6 grid gap-6">
          <Panel title="Transaction History">
            {transactions.length === 0 ? <EmptyState label="No transactions for this member." /> : (
              <div className="divide-y divide-white/10">
                {transactions.slice(0, 8).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <p className="font-black capitalize">{transaction.type}</p>
                      <p className="text-white/35">{formatDate(transaction.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#D4AF37]">{formatCurrency(transaction.amount)}</p>
                      {statusBadge(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Loan History">
            {loans.length === 0 ? <EmptyState label="No loan applications for this member." /> : (
              <div className="divide-y divide-white/10">
                {loans.map((loan) => (
                  <div key={loan.id} className="px-4 py-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <p className="font-black">{loan.loan_type || 'Loan'}</p>
                      <p className="font-black text-[#D4AF37]">{formatCurrency(applicationAmount(loan))}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      {statusBadge(loan.status)}
                      <p className="text-white/35">{formatDate(loan.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="KYC Documents">
            <div className="p-4 text-sm leading-6 text-white/55">
              Documents submitted via: Email/WhatsApp. Current status: <span className="font-black text-white">{member.kyc_status || 'pending'}</span>
            </div>
          </Panel>

          <Panel title="Admin Notes">
            {notes.length === 0 ? <EmptyState label="No notes saved yet." /> : (
              <div className="divide-y divide-white/10">
                {notes.map((adminNote) => (
                  <div key={adminNote.id} className="px-4 py-3 text-sm">
                    <p className="font-semibold text-white/80">{adminNote.note}</p>
                    <p className="mt-2 text-xs font-bold text-white/35">{formatDate(adminNote.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </aside>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-white/35">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-white/80">{String(value || 'Not set')}</p>
    </div>
  );
}

function Members({
  data,
  runAction,
  saving,
}: {
  data: AdminData;
  runAction: RunAction;
  saving: string;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Join Date');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const pageSize = 20;

  const members = useMemo(() => {
    const filtered = data.profiles
      .filter((profile) => !profile.is_admin)
      .filter((profile) => {
        const haystack = normalize(`${profile.full_name} ${profile.email} ${profile.phone_number}`);
        return haystack.includes(normalize(search));
      })
      .filter((profile) => {
        if (filter === 'Pending Approval') return profile.approval_status === 'pending';
        if (filter === 'Approved Members') return profile.approval_status === 'approved';
        if (filter === 'Rejected Applications') return profile.approval_status === 'rejected';
        if (filter === 'KYC Pending') return profile.kyc_status === 'pending';
        if (filter === 'KYC Approved') return profile.kyc_status === 'approved';
        if (filter === 'Not Onboarded') return !profile.onboarding_completed;
        if (filter === 'Has Balance') return parseMoney(profile.balance) > 0;
        return true;
      });

    return filtered.sort((a, b) => {
      if (sort === 'Balance') return parseMoney(b.balance) - parseMoney(a.balance);
      if (sort === 'Name') return memberName(a).localeCompare(memberName(b));
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [data.profiles, filter, search, sort]);

  const visible = members.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(members.length / pageSize));

  function exportMembers() {
    downloadCsv('smart-save-members.csv', [
      ['Member ID', 'Full Name', 'Email', 'Phone', 'Join Date', 'Approval', 'KYC Status', 'Balance', 'Onboarded', 'Has Paid'],
      ...members.map((member) => [
        member.user_id,
        member.full_name,
        member.email,
        member.phone_number,
        member.created_at,
        member.approval_status,
        member.kyc_status,
        member.balance,
        member.onboarding_completed ? 'yes' : 'no',
        member.has_paid ? 'yes' : 'no',
      ]),
    ]);
  }

  return (
    <>
      <Panel
        title="All Members"
        icon={Users}
        action={
          <ActionButton onClick={exportMembers}>
            <Download size={14} />
            Export CSV
          </ActionButton>
        }
      >
        <div className="grid gap-3 border-b border-white/10 p-4 lg:grid-cols-[1fr_auto_auto]">
          <ToolbarInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search name, email, or phone" />
          <SelectControl value={filter} onChange={(value) => { setFilter(value); setPage(1); }} options={['All', 'Pending Approval', 'Approved Members', 'Rejected Applications', 'KYC Pending', 'KYC Approved', 'Not Onboarded', 'Has Balance']} />
          <SelectControl value={sort} onChange={setSort} options={['Join Date', 'Balance', 'Name']} />
        </div>

        {visible.length === 0 ? <EmptyState label="No matching members." /> : (
          <DataTable>
            <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/35">
              <tr>
                <th className="px-4 py-3">Member ID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Join Date</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3">KYC</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3">Onboarding</th>
                <th className="px-4 py-3">Has Paid</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {visible.map((member) => (
                <tr key={member.user_id} onClick={() => setSelected(member)} className="cursor-pointer transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-xs text-white/45">{String(member.user_id).slice(0, 8)}</td>
                  <td className="px-4 py-3 font-black">{memberName(member)}</td>
                  <td className="px-4 py-3 text-white/55">{member.email || 'Not set'}</td>
                  <td className="px-4 py-3 text-white/55">{member.phone_number || 'Not set'}</td>
                  <td className="px-4 py-3 text-white/55">{formatDate(member.created_at)}</td>
                  <td className="px-4 py-3">{statusBadge(member.approval_status)}</td>
                  <td className="px-4 py-3">{statusBadge(member.kyc_status)}</td>
                  <td className="px-4 py-3 text-right font-black text-[#D4AF37]">{formatCurrency(member.balance)}</td>
                  <td className="px-4 py-3 text-white/55">{member.onboarding_completed ? 'Complete' : 'Pending'}</td>
                  <td className="px-4 py-3 text-white/55">{member.has_paid ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <ActionButton onClick={() => setSelected(member)} tone={member.approval_status === 'pending' ? 'amber' : 'neutral'}>
                      {member.approval_status === 'pending' ? 'Review Application' : 'Open'}
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}

        <div className="flex items-center justify-between border-t border-white/10 p-4 text-sm text-white/45">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <ActionButton onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} tone="neutral">Prev</ActionButton>
            <ActionButton onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} tone="neutral">Next</ActionButton>
          </div>
        </div>
      </Panel>
      {selected && <MemberDetail member={selected} data={data} onClose={() => setSelected(null)} runAction={runAction} saving={saving} />}
    </>
  );
}

function ApplicationDetail({
  app,
  kind,
  data,
  runAction,
  saving,
  onClose,
}: {
  app: any;
  kind: 'loan' | 'investment';
  data: AdminData;
  runAction: RunAction;
  saving: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState('');
  const [investmentApproval, setInvestmentApproval] = useState({
    agreedReturnRate: app.agreed_return_rate ? String(app.agreed_return_rate) : '',
    startDate: app.start_date ? String(app.start_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    maturityDate: app.maturity_date ? String(app.maturity_date).slice(0, 10) : '',
    totalReturnAmount: app.total_return_amount ? String(app.total_return_amount) : '',
  });
  const member = makeProfileMap(data.profiles).get(app.user_id);
  const repayments = data.transactions.filter((transaction) => transaction.loan_id === app.id && transaction.type === 'loan_repayment');
  const repaid = repayments.reduce((sum, transaction) => sum + parseMoney(transaction.amount), 0);
  const principal = parseMoney(applicationAmount(app));
  const remaining = Math.max(0, principal - repaid);
  const investmentApproveDisabled =
    kind === 'investment' &&
    (!investmentApproval.startDate ||
      !investmentApproval.maturityDate ||
      parseMoney(investmentApproval.agreedReturnRate) <= 0 ||
      parseMoney(investmentApproval.totalReturnAmount) <= 0);

  function updateInvestmentApproval(field: keyof typeof investmentApproval, value: string) {
    setInvestmentApproval((current) => ({ ...current, [field]: value }));
  }

  function approveApplication() {
    const action = kind === 'loan' ? 'loanStatus' : 'investmentStatus';
    const body =
      kind === 'investment'
        ? { id: app.id, status: 'approved', ...investmentApproval }
        : { id: app.id, status: 'approved' };

    return runAction(action, body, 'Application approved.');
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" aria-label="Close application panel" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#0A0A0A] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">{kind === 'loan' ? 'Loan Application' : 'Investment Application'}</p>
            <h3 className="mt-1 text-2xl font-black">{applicationType(app, kind)}</h3>
            <p className="mt-1 text-sm text-white/45">{memberName(member)} - {formatCurrency(applicationAmount(app))}</p>
          </div>
          <ActionButton onClick={onClose} tone="neutral"><X size={14} /></ActionButton>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Object.entries(app).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-white/35">{key.replace(/_/g, ' ')}</p>
              <p className="mt-2 break-words text-sm font-semibold text-white/80">{applicationDetailValue(app, key, value)}</p>
            </div>
          ))}
        </div>

        <Panel title="Member Summary">
          <div className="grid grid-cols-2 gap-3 p-4">
            <StatCard label="Savings Balance" value={formatCurrency(member?.balance)} />
            <StatCard label="KYC Status" value={member?.kyc_status || 'pending'} />
            <StatCard label="Existing Loans" value={String(data.loanApplications.filter((loan) => loan.user_id === app.user_id).length)} />
            <StatCard label="Transactions" value={String(data.transactions.filter((transaction) => transaction.user_id === app.user_id).length)} />
          </div>
        </Panel>

        <div className="mt-6 grid gap-3">
          {kind === 'investment' && (
            <div className="grid gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Investment Approval Terms</p>
                <p className="mt-1 text-xs text-white/45">Set the agreed terms before approving this investment.</p>
              </div>
              <input
                value={investmentApproval.agreedReturnRate}
                onChange={(event) => updateInvestmentApproval('agreedReturnRate', event.target.value)}
                placeholder="Agreed return rate (%)"
                className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
              />
              <input
                value={investmentApproval.totalReturnAmount}
                onChange={(event) => updateInvestmentApproval('totalReturnAmount', formatMoneyInput(event.target.value))}
                placeholder="Total return amount"
                className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
              />
              <input
                type="date"
                value={investmentApproval.startDate}
                onChange={(event) => updateInvestmentApproval('startDate', event.target.value)}
                className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold outline-none focus:border-[#D4AF37]/50"
              />
              <input
                type="date"
                value={investmentApproval.maturityDate}
                onChange={(event) => updateInvestmentApproval('maturityDate', event.target.value)}
                className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold outline-none focus:border-[#D4AF37]/50"
              />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <ActionButton onClick={approveApplication} disabled={saving !== '' || investmentApproveDisabled} tone="green">
              Approve
            </ActionButton>
            <ActionButton onClick={() => runAction(kind === 'loan' ? 'loanStatus' : 'investmentStatus', { id: app.id, status: 'rejected', reason }, 'Application rejected.')} disabled={saving !== '' || !reason} tone="red">
              Reject
            </ActionButton>
            {kind === 'loan' && (
              <ActionButton onClick={() => runAction('loanStatus', { id: app.id, status: 'disbursed' }, 'Loan marked as disbursed.')} disabled={saving !== ''}>
                Mark Disbursed
              </ActionButton>
            )}
          </div>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Required rejection reason"
            className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-red-500/50"
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Admin note"
            className="min-h-[90px] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
          />
          <ActionButton onClick={() => runAction('addApplicationNote', { table: kind === 'loan' ? 'loan_applications' : 'investment_applications', id: app.id, note }, 'Note saved.')} disabled={saving !== '' || !note}>
            Add Admin Note
          </ActionButton>
        </div>

        {kind === 'loan' && (
          <Panel title="Loan Repayment Tracker">
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
              <StatCard label="Principal" value={formatCurrency(principal)} />
              <StatCard label="Repaid" value={formatCurrency(repaid)} tone="green" />
              <StatCard label="Remaining" value={formatCurrency(remaining)} tone={remaining > 0 ? 'red' : 'green'} />
            </div>
            <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-[1fr_auto]">
              <input
                value={payment}
                onChange={(event) => setPayment(event.target.value)}
                placeholder="Repayment amount"
                className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
              />
              <ActionButton onClick={() => runAction('recordLoanPayment', { loanId: app.id, userId: app.user_id, amount: payment }, 'Payment recorded.').then(() => setPayment(''))} disabled={saving !== '' || parseMoney(payment) <= 0}>
                Record Payment
              </ActionButton>
            </div>
          </Panel>
        )}
      </aside>
    </div>
  );
}

function ApplicationTable({
  data,
  kind,
  runAction,
  saving,
}: {
  data: AdminData;
  kind: 'loan' | 'investment';
  runAction: RunAction;
  saving: string;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Pending');
  const [selected, setSelected] = useState<any | null>(null);
  const [inlineReasons, setInlineReasons] = useState<Record<string, string>>({});
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', interestRate: '', maxTenureMonths: '3', description: '', isActive: true });
  const profileMap = makeProfileMap(data.profiles);
  const rows = kind === 'loan' ? data.loanApplications : data.investmentApplications;
  const filtered = rows.filter((row) => {
    const member = profileMap.get(row.user_id);
    const haystack = normalize(`${memberName(member)} ${applicationType(row, kind)}`);
    const normalizedStatus = normalize(row.status || 'pending');
    const normalizedFilter = normalize(status);
    const statusMatch =
      status === 'All' ||
      normalizedStatus === normalizedFilter ||
      (normalizedFilter === 'approved' && ['approved', 'active'].includes(normalizedStatus));
    return statusMatch && haystack.includes(normalize(search));
  });

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await runAction('createLoanProduct', productForm, 'Loan product created.');
    if (created) {
      setProductForm({ name: '', interestRate: '', maxTenureMonths: '3', description: '', isActive: true });
      setShowProductForm(false);
    }
  }

  return (
    <>
      <Panel
        title={kind === 'loan' ? 'Loan Applications' : 'Investment Applications'}
        icon={kind === 'loan' ? FileText : TrendingUp}
        action={kind === 'loan' && (
          <ActionButton onClick={() => setShowProductForm((current) => !current)}>
            <Plus size={14} />
            New Loan Plan
          </ActionButton>
        )}
      >
        {showProductForm && (
          <form onSubmit={createProduct} className="grid gap-3 border-b border-white/10 p-4 lg:grid-cols-5">
            <input required value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} placeholder="Product name" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25" />
            <input value={productForm.interestRate} onChange={(event) => setProductForm((current) => ({ ...current, interestRate: event.target.value }))} placeholder="Interest %/month" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25" />
            <input value={productForm.maxTenureMonths} onChange={(event) => setProductForm((current) => ({ ...current, maxTenureMonths: event.target.value }))} placeholder="Max tenure" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25" />
            <input value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25" />
            <ActionButton type="submit" disabled={saving !== ''}><Plus size={14} />Create</ActionButton>
          </form>
        )}
        <div className="grid gap-3 border-b border-white/10 p-4 lg:grid-cols-[1fr_auto]">
          <ToolbarInput value={search} onChange={setSearch} placeholder="Search applicant or application type" />
          <SelectControl value={status} onChange={setStatus} options={kind === 'loan' ? ['Pending', 'Approved', 'Rejected', 'All', 'Active', 'Disbursed'] : ['Pending', 'Approved', 'Rejected', 'All', 'Active', 'Matured']} />
        </div>
        {filtered.length === 0 ? <EmptyState label="No applications found." /> : (
          <DataTable>
            <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/35">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">{kind === 'loan' ? 'Loan Type' : 'Plan'}</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((row) => {
                const member = profileMap.get(row.user_id);
                return (
                  <tr key={row.id} onClick={() => setSelected(row)} className="cursor-pointer transition hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <p className="font-black">{memberName(member)}</p>
                      <p className="mt-1 text-xs text-white/35">{member?.email || row.user_id || 'Email unavailable'}</p>
                    </td>
                    <td className="px-4 py-3 text-white/60">{applicationType(row, kind)}</td>
                    <td className="px-4 py-3 text-right font-black text-[#D4AF37]">{formatCurrency(applicationAmount(row))}</td>
                    <td className="px-4 py-3">{statusBadge(row.status)}</td>
                    <td className="px-4 py-3 text-white/55">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <div onClick={(event) => event.stopPropagation()} className="flex min-w-[250px] flex-wrap gap-2">
                        {kind === 'loan' && normalize(row.status) === 'pending' ? (
                          <>
                            <ActionButton onClick={() => runAction('loanStatus', { id: row.id, status: 'approved' }, 'Loan application approved.')} disabled={saving !== ''} tone="green">Approve</ActionButton>
                            <ActionButton onClick={() => runAction('loanStatus', { id: row.id, status: 'rejected', reason: inlineReasons[row.id] }, 'Loan application rejected.')} disabled={saving !== '' || !inlineReasons[row.id]} tone="red">Reject</ActionButton>
                            <input value={inlineReasons[row.id] || ''} onChange={(event) => setInlineReasons((current) => ({ ...current, [row.id]: event.target.value }))} placeholder="Reject reason" className="h-9 min-w-[135px] rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold outline-none placeholder:text-white/25" />
                          </>
                        ) : (
                          <ActionButton onClick={() => setSelected(row)} tone="neutral">{kind === 'investment' && normalize(row.status) === 'pending' ? 'Review Terms' : 'Review'}</ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Panel>
      {selected && <ApplicationDetail app={selected} kind={kind} data={data} runAction={runAction} saving={saving} onClose={() => setSelected(null)} />}
    </>
  );
}

function Loans(props: { data: AdminData; runAction: RunAction; saving: string }) {
  return <ApplicationTable {...props} kind="loan" />;
}

function Investments(props: { data: AdminData; runAction: RunAction; saving: string }) {
  return <ApplicationTable {...props} kind="investment" />;
}

function Withdrawals({
  data,
  runAction,
  saving,
}: {
  data: AdminData;
  runAction: RunAction;
  saving: string;
}) {
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const profileMap = makeProfileMap(data.profiles);
  const settings = Object.fromEntries(data.settings.map((row) => [row.key, row.value]));
  const maxPercent = Number(settings.withdrawal_max_percent || 60);
  const pending = (data.paymentSubmissions || []).filter(
    (payment) => payment.payment_type === 'withdrawal' && ['pending', 'processing', 'approved'].includes(payment.status)
  );

  function isEligible(payment: any) {
    const member = profileMap.get(payment.user_id);
    const balance = parseMoney(member?.balance);
    const amountOk = balance > 0 && parseMoney(payment.amount) <= (balance * maxPercent) / 100;
    const quarterOk = true;
    return amountOk && quarterOk;
  }

  return (
    <Panel title="Withdrawal Requests" icon={ArrowDownToLine}>
      {pending.length === 0 ? <EmptyState label="No withdrawal requests awaiting action." /> : (
        <DataTable minWidth={980}>
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/35">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Compliance</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {pending.map((payment) => {
              const member = profileMap.get(payment.user_id);
              const eligible = isEligible(payment);
              const account = parseWithdrawalReference(payment.transaction_reference);
              return (
                <tr key={payment.id}>
                  <td className="px-4 py-3">
                    <p className="font-black">{payment.full_name || memberName(member)}</p>
                    <p className="text-xs text-white/35">{payment.email || member?.email || payment.user_id}</p>
                    <p className="text-xs text-white/35">Balance: {formatCurrency(member?.balance)}</p>
                    <p className="text-xs text-white/35">Last: Not tracked</p>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-[#D4AF37]">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3 text-white/55">{account.bankName}</td>
                  <td className="px-4 py-3 text-white/55">
                    <p className="font-semibold text-white/70">{account.accountNumber}</p>
                    <p className="text-xs text-white/35">{account.accountName}</p>
                  </td>
                  <td className="px-4 py-3 text-white/55">{formatDate(payment.created_at)}</td>
                  <td className="px-4 py-3">{statusBadge(payment.status)}</td>
                  <td className="px-4 py-3">{eligible ? statusBadge('Eligible') : statusBadge('Check eligibility')}</td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[260px] flex-wrap gap-2">
                      <ActionButton onClick={() => runAction('paymentSubmissionStatus', { id: payment.id, status: 'approved' }, 'Withdrawal approved.')} disabled={saving !== ''} tone="green">Approve</ActionButton>
                      <ActionButton onClick={() => runAction('paymentSubmissionStatus', { id: payment.id, status: 'rejected', reason: reasonById[payment.id] }, 'Withdrawal rejected.')} disabled={saving !== '' || !reasonById[payment.id]} tone="red">Reject</ActionButton>
                      <input value={reasonById[payment.id] || ''} onChange={(event) => setReasonById((current) => ({ ...current, [payment.id]: event.target.value }))} placeholder="Reject reason" className="h-9 min-w-[150px] rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold outline-none placeholder:text-white/25" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </Panel>
  );
}

function Transactions({
  data,
  runAction,
  saving,
}: {
  data: AdminData;
  runAction: RunAction;
  saving: string;
}) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: '', type: 'manual_adjustment', amount: '', description: '' });
  const profileMap = makeProfileMap(data.profiles);
  const complete = ['approved', 'success', 'transferred'];
  const filtered = data.transactions.filter((transaction) => {
    const member = profileMap.get(transaction.user_id);
    const typeMatch = type === 'All' || transaction.type === type;
    const statusMatch = status === 'All' || transaction.status === status;
    const searchMatch = normalize(`${memberName(member)} ${transaction.reference} ${transaction.description}`).includes(normalize(search));
    return typeMatch && statusMatch && searchMatch;
  });
  const deposits = filtered.filter((transaction) => transaction.type === 'deposit' && complete.includes(transaction.status)).reduce((sum, transaction) => sum + parseMoney(transaction.amount), 0);
  const withdrawals = filtered.filter((transaction) => transaction.type === 'withdrawal' && complete.includes(transaction.status)).reduce((sum, transaction) => sum + parseMoney(transaction.amount), 0);
  const fees = filtered.filter((transaction) => ['fee', 'registration_fee'].includes(transaction.type) && complete.includes(transaction.status)).reduce((sum, transaction) => sum + parseMoney(transaction.amount), 0);
  const uniqueTypes = Array.from(
    new Set([...TRANSACTION_TYPE_FILTERS, ...data.transactions.map((transaction) => transaction.type).filter(Boolean)])
  );
  const uniqueStatuses = Array.from(
    new Set([...TRANSACTION_STATUS_FILTERS, ...data.transactions.map((transaction) => transaction.status).filter(Boolean)])
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm('Record this manual transaction?')) return;
    const created = await runAction('manualTransaction', form, 'Manual transaction recorded.');
    if (created) {
      setForm({ userId: '', type: 'manual_adjustment', amount: '', description: '' });
      setShowForm(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Deposits" value={formatCurrency(deposits)} tone="green" />
        <StatCard label="Total Withdrawals" value={formatCurrency(withdrawals)} tone="red" />
        <StatCard label="Fees Collected" value={formatCurrency(fees)} />
        <StatCard label="Net Position" value={formatCurrency(deposits + fees - withdrawals)} />
      </div>
      <Panel
        title="Complete Ledger"
        icon={Receipt}
        iconSize="large"
        action={
          <div className="flex gap-2">
            <ActionButton onClick={() => downloadCsv('smart-save-ledger.csv', [['Date', 'Member', 'Type', 'Amount', 'Status', 'Reference'], ...filtered.map((txn) => [txn.created_at, memberName(profileMap.get(txn.user_id)), txn.type, txn.amount, txn.status, txn.reference])])}>
              <Download size={14} />Export CSV
            </ActionButton>
          </div>
        }
      >
        {showForm && (
          <form onSubmit={submit} className="grid gap-3 border-b border-white/10 p-4 lg:grid-cols-5">
            <SelectControl value={form.userId} onChange={(value) => setForm((current) => ({ ...current, userId: value }))} options={['', ...data.profiles.filter((profile) => !profile.is_admin).map((profile) => profile.user_id)]} />
            <SelectControl value={form.type} onChange={(value) => setForm((current) => ({ ...current, type: value }))} options={['manual_adjustment', 'deposit', 'withdrawal', 'registration_fee', 'loan_repayment', 'interest_credit']} />
            <input required value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25" />
            <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25" />
            <ActionButton type="submit" disabled={saving !== ''}><Plus size={14} />Save</ActionButton>
          </form>
        )}
        <div className="grid grid-cols-2 gap-3 border-b border-white/10 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,10rem)_minmax(8rem,10rem)]">
          <div className="col-span-2 sm:col-span-1">
            <ToolbarInput value={search} onChange={setSearch} placeholder="Search member, reference, description" />
          </div>
          <SelectControl value={type} onChange={setType} options={uniqueTypes} className="font-semibold" />
          <SelectControl value={status} onChange={setStatus} options={uniqueStatuses} className="font-semibold" />
        </div>
        {filtered.length === 0 ? <EmptyState label="No transactions found." /> : (
          <DataTable>
            <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/35">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3 text-white/55">{formatDate(transaction.created_at)}</td>
                  <td className="px-4 py-3 font-black">{memberName(profileMap.get(transaction.user_id))}</td>
                  <td className="px-4 py-3 capitalize text-white/55">{transaction.type}</td>
                  <td className="px-4 py-3 text-right font-black text-[#D4AF37]">{formatCurrency(transaction.amount)}</td>
                  <td className="px-4 py-3">{statusBadge(transaction.status)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/45">{transaction.reference || transaction.id}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Panel>
    </div>
  );
}

function Kyc({
  data,
  runAction,
  saving,
}: {
  data: AdminData;
  runAction: RunAction;
  saving: string;
}) {
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const profileMap = makeProfileMap(data.profiles);
  const pending = (data.identityRequests || []).filter((request) => request.status === 'pending');

  return (
    <Panel title="Identity Verification Requests" icon={ShieldCheck}>
      {pending.length === 0 ? <EmptyState label="No pending identity verification requests." /> : (
        <DataTable minWidth={920}>
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/35">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Member ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Submission</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {pending.map((request) => {
              const member = profileMap.get(request.user_id);
              return (
              <tr key={request.id}>
                <td className="px-4 py-3 font-black">{memberName(member)}</td>
                <td className="px-4 py-3 font-mono text-xs text-white/55">{request.user_id}</td>
                <td className="px-4 py-3 text-white/65">{request.verification_type === 'nin' ? 'NIN' : 'ID Card'}</td>
                <td className="px-4 py-3 text-white/55">{formatDate(request.submitted_at)}</td>
                <td className="px-4 py-3">
                  {request.verification_type === 'nin' ? (
                    <span className="font-mono text-sm font-black text-[#D4AF37]">{request.nin_number}</span>
                  ) : request.id_card_preview_url ? (
                    <a
                      href={request.id_card_preview_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-2 text-xs font-black text-[#D4AF37]"
                    >
                      View ID image
                    </a>
                  ) : (
                    <span className="text-xs text-white/35">Image unavailable</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-[260px] flex-wrap gap-2">
                    <ActionButton onClick={() => runAction('identityStatus', { userId: request.user_id, status: 'approved' }, 'Identity verification approved.')} disabled={saving !== ''} tone="green">Approve</ActionButton>
                    <ActionButton onClick={() => runAction('identityStatus', { userId: request.user_id, status: 'rejected', reason: reasonById[request.id] }, 'Identity verification rejected.')} disabled={saving !== '' || !reasonById[request.id]} tone="red">Reject</ActionButton>
                    <input value={reasonById[request.id] || ''} onChange={(event) => setReasonById((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Reject reason" className="h-9 min-w-[150px] rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold outline-none placeholder:text-white/25" />
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </DataTable>
      )}
    </Panel>
  );
}

function Announcements({
  data,
  runAction,
  saving,
}: {
  data: AdminData;
  runAction: RunAction;
  saving: string;
}) {
  const [form, setForm] = useState({ title: '', body: '', type: 'info', recipientType: 'all' });
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Record<string, boolean>>({});
  const [localError, setLocalError] = useState('');

  const activeMembers = useMemo(
    () => data.profiles.filter((profile) => !profile.is_admin && profile.is_active === true),
    [data.profiles]
  );
  const filteredMembers = useMemo(() => {
    const term = normalize(memberSearch);
    if (!term) return activeMembers;
    return activeMembers.filter((profile) => normalize(`${profile.full_name || ''} ${profile.email || ''}`).includes(term));
  }, [activeMembers, memberSearch]);
  const filteredUserIds = filteredMembers.map((profile) => String(profile.user_id));
  const allFilteredSelected =
    filteredUserIds.length > 0 && filteredUserIds.every((userId) => selectedUserIds.includes(userId));

  function pendingBadges(userId: string) {
    const badges: string[] = [];
    if (data.loanApplications.some((loan) => loan.user_id === userId && loan.status === 'pending')) badges.push('Pending Loan');
    if (data.investmentApplications.some((investment) => investment.user_id === userId && investment.status === 'pending')) {
      badges.push('Pending Investment');
    }
    if (data.paymentSubmissions.some((payment) => payment.user_id === userId && payment.status === 'pending')) badges.push('Pending Payment');
    return badges;
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedUserIds((current) => {
      const currentSet = new Set(current);
      if (checked) {
        filteredUserIds.forEach((userId) => currentSet.add(userId));
      } else {
        filteredUserIds.forEach((userId) => currentSet.delete(userId));
      }
      return Array.from(currentSet);
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError('');
    if (form.recipientType === 'specific' && selectedUserIds.length === 0) {
      setLocalError('Select at least one member for a specific announcement.');
      return;
    }

    const created = await runAction(
      'createAnnouncement',
      {
        title: form.title,
        body: form.body,
        type: form.type,
        recipientType: form.recipientType,
        recipientUserIds: form.recipientType === 'specific' ? selectedUserIds : [],
      },
      (announcement) => `Announcement sent to ${Number(announcement?.sent_count || 0)} member(s) successfully.`
    );
    if (created) {
      setForm({ title: '', body: '', type: 'info', recipientType: 'all' });
      setSelectedUserIds([]);
      setMemberSearch('');
    }
  }

  const announcements = [...data.announcements]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 10);

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Panel title="Create Announcement" icon={Bell}>
        <form onSubmit={submit} className="grid gap-3 p-4">
          <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25" />
          <textarea required value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Body text" className="min-h-[130px] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-semibold outline-none placeholder:text-white/25" />
          <SelectControl value={form.type} onChange={(value) => setForm((current) => ({ ...current, type: value }))} options={['info', 'warning', 'success', 'urgent']} />
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-black uppercase tracking-widest text-white/35">Send to</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ['all', 'All Members'],
                ['specific', 'Specific Members'],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border px-3 text-center text-xs font-black transition ${
                    form.recipientType === value
                      ? 'border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]'
                      : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07]'
                  }`}
                >
                  <input
                    type="radio"
                    name="recipientType"
                    value={value}
                    checked={form.recipientType === value}
                    onChange={() => setForm((current) => ({ ...current, recipientType: value }))}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {form.recipientType === 'specific' && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <ToolbarInput value={memberSearch} onChange={setMemberSearch} placeholder="Search active members" />
              <label className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-white/70">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                  className="h-4 w-4 accent-[#D4AF37]"
                />
                Select All
                <span className="ml-auto text-xs text-white/35">{selectedUserIds.length} selected</span>
              </label>
              <div className="mt-3 max-h-[200px] overflow-y-auto rounded-lg border border-white/10">
                {filteredMembers.length === 0 ? (
                  <div className="px-3 py-8 text-center text-xs font-semibold text-white/35">No active members found.</div>
                ) : (
                  filteredMembers.map((profile) => {
                    const userId = String(profile.user_id);
                    const badges = pendingBadges(userId);
                    return (
                      <label key={userId} className="flex cursor-pointer items-start gap-3 border-b border-white/10 px-3 py-3 last:border-b-0">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(userId)}
                          onChange={(event) =>
                            setSelectedUserIds((current) =>
                              event.target.checked ? Array.from(new Set([...current, userId])) : current.filter((id) => id !== userId)
                            )
                          }
                          className="mt-1 h-4 w-4 accent-[#D4AF37]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-white">{memberName(profile)}</span>
                          <span className="block truncate text-xs text-white/35">{profile.email || userId}</span>
                          {badges.length > 0 && (
                            <span className="mt-2 flex flex-wrap gap-1">
                              {badges.map((badge) => (
                                <span key={badge} className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-black text-[#D4AF37]">
                                  {badge}
                                </span>
                              ))}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
          {localError && <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">{localError}</p>}
          <ActionButton type="submit" disabled={saving !== ''}><Send size={14} />Send Notification</ActionButton>
        </form>
      </Panel>
      <Panel title="Past Announcements" icon={Receipt}>
        {announcements.length === 0 ? <EmptyState label="No announcements yet." /> : (
          <div className="divide-y divide-white/10">
            {announcements.map((announcement) => {
              const recipientIds = Array.isArray(announcement.recipient_user_ids) ? announcement.recipient_user_ids : [];
              const sentCount = Number(announcement.sent_count || recipientIds.length || 0);
              const body = String(announcement.body || '');
              const expanded = expandedAnnouncements[announcement.id];
              const shouldCollapse = body.length > 160;
              const recipientLabel =
                announcement.recipient_type === 'specific'
                  ? `${sentCount} specific member${sentCount === 1 ? '' : 's'}`
                  : 'All Members';

              return (
              <div key={announcement.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">{announcement.title}</p>
                    {statusBadge(announcement.type)}
                    <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-black text-[#D4AF37]">
                      {sentCount} sent
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/35">Sent to: {recipientLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    {shouldCollapse && !expanded ? `${body.slice(0, 160)}...` : body}
                  </p>
                  {shouldCollapse && (
                    <button
                      type="button"
                      onClick={() => setExpandedAnnouncements((current) => ({ ...current, [announcement.id]: !expanded }))}
                      className="mt-2 text-xs font-black text-[#D4AF37]"
                    >
                      {expanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                  <p className="mt-2 text-xs font-bold text-white/35">Sent {formatDate(announcement.sent_at || announcement.created_at)}</p>
                </div>
                <ActionButton onClick={() => runAction('deleteAnnouncement', { id: announcement.id }, 'Announcement deleted.')} disabled={saving !== ''} tone="red">Delete</ActionButton>
              </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

function SettingsView({
  data,
  runAction,
  saving,
}: {
  data: AdminData;
  runAction: RunAction;
  saving: string;
}) {
  const settingsObject = useMemo(() => Object.fromEntries(data.settings.map((row) => [row.key, row.value || ''])), [data.settings]);
  const [settings, setSettings] = useState<Record<string, string>>(settingsObject);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    setSettings(settingsObject);
  }, [settingsObject]);

  function update(key: string, value: string) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Panel title="Cooperative Settings" icon={Settings}>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {[
            ['cooperative_name', 'Cooperative name'],
            ['registration_fee', 'Registration fee'],
            ['withdrawal_quarters_per_year', 'Withdrawal quarters per year'],
            ['withdrawal_max_percent', 'Withdrawal max percent'],
            ['contact_email', 'Contact email'],
            ['contact_phones', 'Contact phones'],
            ['whatsapp_number', 'WhatsApp number'],
            ['social_handles', 'Social handles'],
          ].map(([key, label]) => (
            <label key={key} className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-white/35">{label}</span>
              <input value={settings[key] || ''} onChange={(event) => update(key, event.target.value)} className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none focus:border-[#D4AF37]/50" />
            </label>
          ))}
        </div>
        <div className="border-t border-white/10 p-4">
          <ActionButton onClick={() => runAction('saveSettings', { settings }, 'Settings saved.')} disabled={saving !== ''}>
            <Check size={14} />Save Settings
          </ActionButton>
        </div>
      </Panel>

      <Panel title="Admin Accounts" icon={UserPlus}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runAction('addAdmin', { email: adminEmail }, 'Admin added.').then((result) => result && setAdminEmail(''));
          }}
          className="grid gap-3 border-b border-white/10 p-4"
        >
          <input value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="Existing member email" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25" />
          <ActionButton type="submit" disabled={saving !== '' || !adminEmail}><UserPlus size={14} />Add Admin</ActionButton>
        </form>
        <div className="divide-y divide-white/10">
          {data.profiles.filter((profile) => profile.is_admin).map((admin) => (
            <div key={admin.user_id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-black">{memberName(admin)}</p>
                <p className="text-xs text-white/35">{admin.email || admin.user_id}</p>
              </div>
              <ActionButton onClick={() => runAction('removeAdmin', { userId: admin.user_id }, 'Admin removed.')} disabled={saving !== '' || admin.user_id === data.adminProfile.user_id} tone="red">Remove</ActionButton>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
