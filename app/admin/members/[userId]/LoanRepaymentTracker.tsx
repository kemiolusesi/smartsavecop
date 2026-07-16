'use client';

import { FormEvent, useMemo, useState } from 'react';
import { toOptionalErrorMessage } from '@/lib/error-message';

function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getAmountFontSize(amount: number): string {
  const len = Math.floor(Math.abs(amount)).toString().length;
  if (len >= 12) return 'text-lg font-bold';
  if (len >= 8) return 'text-xl font-bold';
  return 'text-2xl font-bold';
}

function AmountText({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <span className={`block overflow-hidden text-ellipsis whitespace-nowrap ${getAmountFontSize(amount)} ${className}`}>
      {formatAmount(amount)}
    </span>
  );
}

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('en-NG').format(Number(digits));
}

type LoanRow = {
  id: string;
  loan_type?: string | null;
  amount_approved?: number | string | null;
  amount_requested?: number | string | null;
  monthly_payment?: number | string | null;
  end_date?: string | null;
};

type TransactionRow = {
  id: string;
  loan_id?: string | null;
  type?: string | null;
  status?: string | null;
  amount?: number | string | null;
};

export default function LoanRepaymentTracker({
  userId,
  loans,
  transactions,
}: {
  userId: string;
  loans: LoanRow[];
  transactions: TransactionRow[];
}) {
  const [repayments, setRepayments] = useState(transactions);
  const [amountByLoan, setAmountByLoan] = useState<Record<string, string>>({});
  const [savingLoanId, setSavingLoanId] = useState('');
  const [errorByLoan, setErrorByLoan] = useState<Record<string, string>>({});

  const repaymentTotals = useMemo(() => {
    return repayments.reduce<Record<string, number>>((totals, transaction) => {
      if (transaction.type !== 'loan_repayment' || transaction.status !== 'success' || !transaction.loan_id) return totals;
      totals[transaction.loan_id] = (totals[transaction.loan_id] || 0) + parseMoney(transaction.amount);
      return totals;
    }, {});
  }, [repayments]);

  async function recordPayment(event: FormEvent<HTMLFormElement>, loan: LoanRow) {
    event.preventDefault();
    const amount = parseMoney(amountByLoan[loan.id]);
    if (amount <= 0) {
      setErrorByLoan((current) => ({ ...current, [loan.id]: 'Enter a repayment amount.' }));
      return;
    }

    try {
      setSavingLoanId(loan.id);
      setErrorByLoan((current) => ({ ...current, [loan.id]: '' }));
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recordLoanPayment',
          loanId: loan.id,
          userId,
          amount,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Unable to record loan repayment.');
      }

      setRepayments((current) => [payload.data, ...current]);
      setAmountByLoan((current) => ({ ...current, [loan.id]: '' }));
    } catch (error) {
      setErrorByLoan((current) => ({
        ...current,
        [loan.id]: error instanceof Error ? error.message : 'Unable to record loan repayment.',
      }));
    } finally {
      setSavingLoanId('');
    }
  }

  if (loans.length === 0) {
    return <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm font-semibold text-white/45">No active loans.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {loans.map((loan) => {
        const principal = parseMoney(loan.amount_approved || loan.amount_requested);
        const repaid = repaymentTotals[loan.id] || 0;
        const remaining = Math.max(0, principal - repaid);

        return (
          <div key={loan.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-lg font-black">{loan.loan_type || 'Loan'}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/35">Principal</p>
                <AmountText amount={principal} className="mt-2 text-[#D4AF37]" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/35">Repaid</p>
                <AmountText amount={repaid} className="mt-2 text-emerald-300" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/35">Remaining</p>
                <AmountText amount={remaining} className="mt-2 text-red-300" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/35">Monthly Payment</p>
                <AmountText amount={parseMoney(loan.monthly_payment)} className="mt-2 text-[#D4AF37]" />
              </div>
            </div>

            <form onSubmit={(event) => recordPayment(event, loan)} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={amountByLoan[loan.id] || ''}
                onChange={(event) => setAmountByLoan((current) => ({ ...current, [loan.id]: formatAmountInput(event.target.value) }))}
                placeholder="Repayment amount"
                className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
              />
              <button
                type="submit"
                disabled={savingLoanId === loan.id}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 text-sm font-black text-[#D4AF37] transition hover:bg-[#D4AF37]/15 disabled:opacity-60"
              >
                {savingLoanId === loan.id ? 'Recording...' : 'Record Payment'}
              </button>
            </form>
            {errorByLoan[loan.id] && (
              <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
                {toOptionalErrorMessage(errorByLoan[loan.id])}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
