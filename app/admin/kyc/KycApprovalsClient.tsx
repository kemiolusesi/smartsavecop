'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, Search, ShieldCheck, XCircle } from 'lucide-react';

export type KycProfileRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  kyc_status: string | null;
  kyc_document_type: string | null;
  kyc_document_number: string | null;
  kyc_document_url: string | null;
  kyc_document_signed_url?: string | null;
  kyc_submitted_at: string | null;
  created_at: string | null;
};

function memberName(profile: KycProfileRow) {
  return profile.full_name || profile.email || 'Unnamed member';
}

function formatDate(value: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function KycApprovalsClient({ initialProfiles }: { initialProfiles: KycProfileRow[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return profiles;

    return profiles.filter((profile) =>
      `${profile.full_name || ''} ${profile.email || ''} ${profile.kyc_document_type || ''} ${profile.kyc_document_number || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [profiles, search]);

  async function updateKyc(profile: KycProfileRow, action: 'approveKyc' | 'rejectKyc') {
    const rejecting = action === 'rejectKyc';
    const reason = reasons[profile.user_id] || '';

    if (rejecting && !reason.trim()) {
      setError('Enter a rejection reason before rejecting this KYC submission.');
      return;
    }

    setSavingId(profile.user_id);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: profile.user_id,
          reason,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to update KYC submission.');
      }

      setProfiles((current) => current.filter((row) => row.user_id !== profile.user_id));
      setNotice(rejecting ? 'KYC submission rejected.' : 'KYC submission approved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update KYC submission.');
    } finally {
      setSavingId('');
    }
  }

  async function openDocument(profile: KycProfileRow) {
    if (!profile.kyc_document_url) return;

    setSavingId(profile.user_id);
    setError('');

    try {
      const response = await fetch('/api/admin/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: 'kyc-documents',
          path: profile.kyc_document_url,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success || !payload.signedUrl) {
        throw new Error(payload.error || 'Unable to open document.');
      }

      window.open(payload.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open document.');
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Identity review</p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">KYC Approvals</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Review submitted identity documents from onboarding and approve or reject member KYC status.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search KYC submissions"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-3 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
          />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300">{notice}</div>}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/35">
              <tr>
                <th className="px-4 py-4">Member</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Document Type</th>
                <th className="px-4 py-4">Document Number</th>
                <th className="px-4 py-4">Document</th>
                <th className="px-4 py-4">Submitted</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm font-semibold text-white/40">
                    No submitted KYC documents found.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((profile) => {
                  const loading = savingId === profile.user_id;

                  return (
                    <tr key={profile.user_id}>
                      <td className="px-4 py-4">
                        <p className="font-black text-white">{memberName(profile)}</p>
                        <p className="mt-1 font-mono text-xs text-white/35">{profile.user_id}</p>
                      </td>
                      <td className="px-4 py-4 text-white/55">{profile.email || 'Not set'}</td>
                      <td className="px-4 py-4 text-white/65">{profile.kyc_document_type || 'Not set'}</td>
                      <td className="px-4 py-4 font-mono text-xs text-white/55">{profile.kyc_document_number || 'Not set'}</td>
                      <td className="px-4 py-4">
                        {profile.kyc_document_url ? (
                          <button
                            type="button"
                            onClick={() => openDocument(profile)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-2 text-xs font-black text-[#D4AF37]"
                          >
                            View Document
                            <ExternalLink size={13} />
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-white/35">Document unavailable</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-white/55">{formatDate(profile.kyc_submitted_at || profile.created_at)}</td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[340px] flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => updateKyc(profile, 'approveKyc')}
                            disabled={loading}
                            className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateKyc(profile, 'rejectKyc')}
                            disabled={loading}
                            className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Reject
                          </button>
                          <input
                            value={reasons[profile.user_id] || ''}
                            onChange={(event) => setReasons((current) => ({ ...current, [profile.user_id]: event.target.value }))}
                            placeholder="Reject reason"
                            className="h-10 min-w-[150px] rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white outline-none placeholder:text-white/25 focus:border-red-500/50"
                          />
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
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Document links are signed for one hour because KYC files live in the private kyc-documents bucket.</p>
        </div>
      </div>
    </div>
  );
}
