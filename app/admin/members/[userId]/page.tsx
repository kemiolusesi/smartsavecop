import Link from 'next/link';
import type { ReactNode } from 'react';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink, Receipt } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { createPrivateBucketSignedUrl } from '@/lib/storage/privateBuckets';
import LoanRepaymentTracker from './LoanRepaymentTracker';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatCurrency(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(String(value || 0).replace(/[^\d.-]/g, ''));

  return formatAmount(Number.isFinite(amount) ? amount : 0);
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

function AmountText({ value, className = '' }: { value: unknown; className?: string }) {
  const amount = parseMoney(value);
  return (
    <span className={`block overflow-hidden text-ellipsis whitespace-nowrap ${getAmountFontSize(amount)} ${className}`}>
      {formatAmount(amount)}
    </span>
  );
}

function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' });
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-[11px] font-black uppercase tracking-widest text-white/35">{label}</p>
      <div className="mt-2 break-words text-sm font-semibold text-white/80">{value}</div>
    </div>
  );
}

function daysRemaining(value?: string | null) {
  if (!value) return 'Not available';
  const end = new Date(value).getTime();
  if (Number.isNaN(end)) return 'Not available';
  const days = Math.ceil((end - Date.now()) / 86400000);
  return `${Math.max(0, days)} days`;
}

export default async function AdminMemberDetailPage({ params }: { params: { userId: string } }) {
  const context = await requireAdmin();

  if (context instanceof Response) {
    redirect('/signin?returnTo=/admin/members');
  }

  const [memberResult, paymentResult, transactionsResult, interestResult, loansResult, investmentsResult] = await Promise.all([
    context.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', params.userId)
      .maybeSingle(),
    context.supabase
      .from('payment_submissions')
      .select('*')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    context.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false }),
    context.supabase
      .from('interest_ledger')
      .select('*')
      .eq('user_id', params.userId),
    context.supabase
      .from('loan_applications')
      .select('*')
      .eq('user_id', params.userId)
      .in('status', ['active', 'approved'])
      .order('created_at', { ascending: false }),
    context.supabase
      .from('investment_applications')
      .select('*')
      .eq('user_id', params.userId)
      .in('status', ['active', 'approved'])
      .order('created_at', { ascending: false }),
  ]);

  if (memberResult.error) {
    throw new Error(memberResult.error.message);
  }

  const member = memberResult.data;

  if (!member) {
    notFound();
  }

  if (paymentResult.error) {
    throw new Error(paymentResult.error.message);
  }
  if (transactionsResult.error) {
    throw new Error(transactionsResult.error.message);
  }
  if (loansResult.error) {
    throw new Error(loansResult.error.message);
  }
  if (investmentsResult.error) {
    throw new Error(investmentsResult.error.message);
  }

  const latestPaymentSubmission = paymentResult.data;
  const transactions = transactionsResult.data || [];
  const interestRows = interestResult.error ? [] : interestResult.data || [];
  const activeLoans = loansResult.data || [];
  const activeInvestments = investmentsResult.data || [];
  const currentBalance = parseMoney(member.balance);
  const totalDeposited = transactions
    .filter((transaction: any) => transaction.type === 'deposit' && transaction.status === 'success')
    .reduce((total: number, transaction: any) => total + Math.abs(parseMoney(transaction.amount)), 0);
  const totalWithdrawn = transactions
    .filter((transaction: any) => transaction.type === 'withdrawal' && transaction.status === 'success')
    .reduce((total: number, transaction: any) => total + Math.abs(parseMoney(transaction.amount)), 0);
  const interestEarned = interestRows.reduce((total: number, row: any) => total + Math.abs(parseMoney(row.amount)), 0);
  const netGrowth = totalDeposited > 0 ? ((currentBalance - totalDeposited) / totalDeposited) * 100 : 0;
  const recentTransactions = transactions.slice(0, 10);

  const paymentProofSignedUrl = await createPrivateBucketSignedUrl(
    context.supabase,
    'payment-proofs',
    latestPaymentSubmission?.proof_url
  );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/members"
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/70 transition hover:bg-white/[0.07]"
      >
        <ArrowLeft size={16} />
        Back to Members
      </Link>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Member profile</p>
            <h2 className="mt-2 text-3xl font-black">{member.full_name || member.email || 'Unnamed member'}</h2>
            <p className="mt-2 text-sm text-white/45">{member.email || member.user_id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${member.is_active ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-red-500/25 bg-red-500/10 text-red-300'}`}>
              {member.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-black capitalize text-[#D4AF37]">
              KYC: {member.kyc_status || 'pending'}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Full Name" value={member.full_name || 'Not set'} />
        <DetailItem label="Email" value={member.email || 'Not set'} />
        <DetailItem label="Phone" value={member.phone_number || 'Not set'} />
        <DetailItem label="Balance" value={<AmountText value={member.balance} className="text-[#D4AF37]" />} />
        <DetailItem label="Registered" value={formatDate(member.created_at)} />
        <DetailItem label="Registration Paid" value={member.has_paid ? 'Yes' : 'No'} />
        <DetailItem label="Onboarding" value={member.onboarding_completed ? 'Complete' : 'Pending'} />
        <DetailItem label="Approval Status" value={member.approval_status || 'pending'} />
        <DetailItem label="User ID" value={<span className="font-mono text-xs">{member.user_id}</span>} />
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Member financial overview</p>
          <h3 className="mt-2 text-2xl font-black">Financial Position</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <DetailItem label="Current Balance" value={<AmountText value={currentBalance} className="text-[#D4AF37]" />} />
          <DetailItem label="Total Deposited" value={<AmountText value={totalDeposited} className="text-emerald-300" />} />
          <DetailItem label="Total Withdrawn" value={<AmountText value={totalWithdrawn} className="text-red-300" />} />
          <DetailItem label="Interest Earned" value={<AmountText value={interestEarned} className="text-[#9DC03A]" />} />
          <DetailItem label="Net Growth" value={<span className="font-black text-white">{netGrowth.toFixed(2)}%</span>} />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Active loans</p>
          <h3 className="mt-2 text-2xl font-black">Loan Exposure</h3>
        </div>
        <LoanRepaymentTracker userId={member.user_id} loans={activeLoans} transactions={transactions} />
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Active investments</p>
          <h3 className="mt-2 text-2xl font-black">Investment Position</h3>
        </div>
        {activeInvestments.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm font-semibold text-white/45">No active investments.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeInvestments.map((investment: any) => (
              <div key={investment.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-lg font-black">{investment.investment_type || 'Investment'}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DetailItem label="Amount" value={<AmountText value={investment.amount} className="text-[#D4AF37]" />} />
                  <DetailItem label="Maturity Date" value={formatDate(investment.maturity_date)} />
                  <DetailItem label="Return Rate" value={investment.agreed_return_rate ? `${investment.agreed_return_rate}%` : 'Not set'} />
                  <DetailItem label="Expected Return" value={<AmountText value={investment.total_return_amount} className="text-[#D4AF37]" />} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Transaction history</p>
          <h3 className="mt-2 text-2xl font-black">Last 10 Transactions</h3>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm font-semibold text-white/45">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/35">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentTransactions.map((transaction: any) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-3 text-white/55">{formatDate(transaction.created_at)}</td>
                    <td className="px-4 py-3 font-black capitalize text-white">{transaction.type || 'transaction'}</td>
                    <td className="px-4 py-3 text-right font-black text-[#D4AF37]">{formatCurrency(transaction.amount)}</td>
                    <td className="px-4 py-3 capitalize text-white/60">{transaction.status || 'pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Payment proof</p>
            <h3 className="mt-2 flex items-center gap-2 text-2xl font-black">
              <Receipt size={22} className="text-[#D4AF37]" />
              Latest Payment Submission
            </h3>
            <p className="mt-2 text-sm text-white/45">
              Status: <span className="font-black capitalize text-white">{latestPaymentSubmission?.status || 'not submitted'}</span>
            </p>
          </div>

          {paymentProofSignedUrl ? (
            <a
              href={paymentProofSignedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-sm font-black text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
            >
              View Payment Proof
              <ExternalLink size={15} />
            </a>
          ) : (
            <span className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/45">
              No payment proof available
            </span>
          )}
        </div>

        {latestPaymentSubmission && (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailItem label="Amount" value={<AmountText value={latestPaymentSubmission.amount} className="text-[#D4AF37]" />} />
            <DetailItem label="Type" value={<span className="capitalize">{latestPaymentSubmission.payment_type || 'payment'}</span>} />
            <DetailItem label="Reference" value={<span className="font-mono text-xs">{latestPaymentSubmission.transaction_reference || 'Not provided'}</span>} />
            <DetailItem label="Submitted" value={formatDate(latestPaymentSubmission.created_at || latestPaymentSubmission.submitted_at)} />
          </div>
        )}
      </section>
    </div>
  );
}
