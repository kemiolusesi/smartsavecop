'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Eye, Loader2, Search, ShieldAlert, UserCheck, UserX } from 'lucide-react';

export type MemberRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean | null;
  approval_status?: string | null;
  kyc_status: string | null;
  balance: number | string | null;
  created_at: string | null;
  has_paid?: boolean | null;
  activated_at?: string | null;
  deactivated_at?: string | null;
};

function memberName(member: MemberRow) {
  return member.full_name || member.email || 'Unnamed member';
}

function formatCurrency(value: MemberRow['balance']) {
  const amount = typeof value === 'number' ? value : Number(String(value || 0).replace(/[^\d.-]/g, ''));

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${
        active
          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
          : 'border-red-500/25 bg-red-500/10 text-red-300'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function KycBadge({ status }: { status: string | null }) {
  const normalized = String(status || 'pending').toLowerCase();
  const className =
    normalized === 'approved'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
      : normalized === 'rejected'
        ? 'border-red-500/25 bg-red-500/10 text-red-300'
        : 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]';

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black capitalize ${className}`}>{normalized}</span>;
}

export default function MembersManagementClient({ initialMembers }: { initialMembers: MemberRow[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState('');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;

    return members.filter((member) =>
      `${member.full_name || ''} ${member.email || ''} ${member.user_id}`.toLowerCase().includes(term)
    );
  }, [members, search]);

  async function runMemberAction(member: MemberRow, action: 'activateMember' | 'deactivateMember') {
    const activating = action === 'activateMember';

    if (!activating) {
      const confirmed = window.confirm(
        `Are you sure you want to deactivate ${memberName(member)}? They will be logged out and unable to access their account.`
      );
      if (!confirmed) return;
    }

    const previousMembers = members;
    setSavingId(member.user_id);
    setError('');
    setMessages((current) => ({ ...current, [member.user_id]: activating ? 'Account activated.' : 'Account deactivated.' }));
    setMembers((current) =>
      current.map((row) =>
        row.user_id === member.user_id
          ? {
              ...row,
              is_active: activating,
              approval_status: activating ? 'approved' : 'pending',
              has_paid: activating ? true : row.has_paid,
              activated_at: activating ? new Date().toISOString() : row.activated_at,
              deactivated_at: activating ? row.deactivated_at : new Date().toISOString(),
            }
          : row
      )
    );

    try {
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: member.user_id }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to update member account.');
      }

      if (payload.data) {
        setMembers((current) => current.map((row) => (row.user_id === member.user_id ? { ...row, ...payload.data } : row)));
      }
    } catch (err) {
      setMembers(previousMembers);
      setMessages((current) => {
        const next = { ...current };
        delete next[member.user_id];
        return next;
      });
      setError(err instanceof Error ? err.message : 'Unable to update member account.');
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Administrative controls</p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">Member Management</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Activate paid registrations, pause member access, and review account status from one secure workspace.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search members"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-3 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/35">
              <tr>
                <th className="px-4 py-4">Full Name</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">KYC</th>
                <th className="px-4 py-4 text-right">Balance</th>
                <th className="px-4 py-4">Registered</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm font-semibold text-white/40">
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const active = member.is_active === true;
                  const loading = savingId === member.user_id;

                  return (
                    <tr key={member.user_id}>
                      <td className="px-4 py-4">
                        <p className="font-black text-white">{memberName(member)}</p>
                        {messages[member.user_id] && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs font-black text-emerald-300">
                            <CheckCircle2 size={13} />
                            {messages[member.user_id]}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-white/55">{member.email || 'Not set'}</td>
                      <td className="px-4 py-4"><StatusBadge active={active} /></td>
                      <td className="px-4 py-4"><KycBadge status={member.kyc_status} /></td>
                      <td className="px-4 py-4 text-right font-black text-[#D4AF37]">{formatCurrency(member.balance)}</td>
                      <td className="px-4 py-4 text-white/55">{formatDate(member.created_at)}</td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[310px] flex-wrap gap-2">
                          {active ? (
                            <button
                              type="button"
                              onClick={() => runMemberAction(member, 'deactivateMember')}
                              disabled={loading}
                              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {loading ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                              Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => runMemberAction(member, 'activateMember')}
                              disabled={loading}
                              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {loading ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                              Activate Account
                            </button>
                          )}
                          <Link
                            href={`/admin/members/${member.user_id}`}
                            className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/70 transition hover:bg-white/[0.07]"
                          >
                            <Eye size={14} />
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4 text-sm leading-6 text-[#D4AF37]">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Activating an account confirms the member&apos;s registration payment and unlocks their dashboard access.
            Deactivated members are redirected to the pending activation page.
          </p>
        </div>
      </div>
    </div>
  );
}
