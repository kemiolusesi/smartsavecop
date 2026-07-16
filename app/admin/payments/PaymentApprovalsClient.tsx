'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, Receipt, Search, XCircle } from 'lucide-react';

export type PaymentSubmissionRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  amount: number | string | null;
  payment_type: 'registration' | 'deposit' | 'loan_repayment' | 'investment' | 'withdrawal' | string | null;
  transaction_reference: string | null;
  proof_url: string | null;
  proof_signed_url?: string | null;
  status: 'pending' | 'approved' | 'rejected' | string | null;
  created_at: string | null;
  reviewed_at?: string | null;
};

function formatCurrency(value: PaymentSubmissionRow['amount']) {
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

function statusClass(status: string | null) {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized === 'approved') return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300';
  if (normalized === 'rejected') return 'border-red-500/25 bg-red-500/10 text-red-300';
  return 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]';
}

export default function PaymentApprovalsClient({ initialPayments }: { initialPayments: PaymentSubmissionRow[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payments;

    return payments.filter((payment) =>
      `${payment.full_name || ''} ${payment.email || ''} ${payment.payment_type || ''} ${payment.transaction_reference || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [payments, search]);

  async function updatePayment(payment: PaymentSubmissionRow, status: 'approved' | 'rejected') {
    const reason = reasons[payment.id] || '';
    if (status === 'rejected' && !reason) {
      setError('Enter a rejection reason before rejecting a payment.');
      return;
    }

    setSavingId(payment.id);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'paymentSubmissionStatus',
          id: payment.id,
          status,
          reason,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to update payment submission.');
      }

      setPayments((current) => current.map((row) => (row.id === payment.id ? { ...row, ...payload.data } : row)));
      setNotice(status === 'approved' ? 'Payment approved and member account updated.' : 'Payment rejected.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update payment submission.');
    } finally {
      setSavingId('');
    }
  }

  async function openProof(payment: PaymentSubmissionRow) {
    if (!payment.proof_url) return;

    setSavingId(payment.id);
    setError('');

    try {
      const response = await fetch('/api/admin/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: 'payment-proofs',
          path: payment.proof_url,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success || !payload.signedUrl) {
        throw new Error(payload.error || 'Unable to open payment proof.');
      }

      window.open(payload.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open payment proof.');
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Payment review</p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">Payment Approvals</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Review manual transfer submissions and activate registration payments after confirmation.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search payments"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-3 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
          />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300">{notice}</div>}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/35">
              <tr>
                <th className="px-4 py-4">Member</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4 text-right">Amount</th>
                <th className="px-4 py-4">Reference</th>
                <th className="px-4 py-4">Proof</th>
                <th className="px-4 py-4">Submitted</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm font-semibold text-white/40">
                    No payment submissions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const status = String(payment.status || 'pending').toLowerCase();
                  const pending = status === 'pending';
                  const loading = savingId === payment.id;

                  return (
                    <tr key={payment.id}>
                      <td className="px-4 py-4">
                        <p className="font-black text-white">{payment.full_name || payment.email || 'Unnamed member'}</p>
                        <p className="mt-1 text-xs text-white/35">{payment.email || payment.user_id}</p>
                      </td>
                      <td className="px-4 py-4 capitalize text-white/60">{payment.payment_type || 'payment'}</td>
                      <td className="px-4 py-4 text-right font-black text-[#D4AF37]">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-4 font-mono text-xs text-white/55">{payment.transaction_reference || 'Not provided'}</td>
                      <td className="px-4 py-4">
                        {payment.proof_url ? (
                          <button
                            type="button"
                            onClick={() => openProof(payment)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-2 text-xs font-black text-[#D4AF37]"
                          >
                            View Proof
                            <ExternalLink size={13} />
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-white/35">No proof</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-white/55">{formatDate(payment.created_at)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black capitalize ${statusClass(payment.status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {pending ? (
                          <div className="flex min-w-[340px] flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => updatePayment(payment, 'approved')}
                              disabled={loading}
                              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePayment(payment, 'rejected')}
                              disabled={loading}
                              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                              Reject
                            </button>
                            <input
                              value={reasons[payment.id] || ''}
                              onChange={(event) => setReasons((current) => ({ ...current, [payment.id]: event.target.value }))}
                              placeholder="Reject reason"
                              className="h-10 min-w-[150px] rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white outline-none placeholder:text-white/25 focus:border-red-500/50"
                            />
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/40">
                            <Receipt size={14} />
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
