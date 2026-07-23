'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Banknote, Check, CheckCircle2, ChevronDown, Copy, FileUp, Send, ShieldCheck, X } from 'lucide-react';
import SmartSelect from '@/components/ui/SmartSelect';
import { BANK_DETAILS } from '@/lib/constants/bankDetails';
import { toOptionalErrorMessage } from '@/lib/error-message';
import { parseError } from '@/lib/parseError';
import { addMonths, calculateLoanRepayment, normalizeRepaymentOption, repaymentOptionLabel, REPAYMENT_OPTIONS } from '@/lib/loans/loanTerms';
import { supabase } from '@/utils/supabase/client';

export interface LoanApplicationProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export type LoanProductOption = {
  id: string;
  name: string;
  description: string | null;
  min_amount: number | string | null;
  max_amount: number | string | null;
  monthly_interest_rate: number | string | null;
  tenure_months: number | string | null;
  requirements?: string | null;
  is_active?: boolean | null;
  sort_order?: number | string | null;
};

export type LoanApplicationRow = {
  id: string;
  loan_type: string | null;
  amount_requested: number | string | null;
  amount_approved?: number | string | null;
  repayment_option: string | null;
  status: string | null;
  interest_rate?: number | string | null;
  tenure_months?: number | string | null;
  monthly_payment?: number | string | null;
  total_repayable?: number | string | null;
  start_date?: string | null;
  end_date?: string | null;
  approved_at?: string | null;
  created_at?: string | null;
};

export type LoanRepaymentScheduleRow = {
  id: string;
  loan_application_id: string | null;
  user_id: string | null;
  installment_number: number | string | null;
  due_date: string | null;
  principal_portion?: number | string | null;
  interest_amount?: number | string | null;
  total_due: number | string | null;
  status: string | null;
};

function parseAmount(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('en-NG').format(Number(digits));
}

function formatCurrency(value: unknown) {
  return formatAmount(parseAmount(value));
}

function formatPercent(rate: unknown) {
  const parsed = Number(rate);
  if (!Number.isFinite(parsed)) return '0%';
  return `${Number((parsed * 100).toFixed(2))}%`;
}

function formatAmountRange(product: LoanProductOption) {
  const min = parseAmount(product.min_amount);
  const max = parseAmount(product.max_amount);
  if (min > 0 && max > 0) return `${formatAmount(min).replace('.00', '')} - ${formatAmount(max).replace('.00', '')}`;
  if (min > 0) return `From ${formatAmount(min).replace('.00', '')}`;
  if (max > 0) return `Up to ${formatAmount(max).replace('.00', '')}`;
  return 'Amount by review';
}

function calculateDynamicLoanRepayment(amount: number, product: LoanProductOption | null, repaymentOption: string) {
  const principal = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const monthlyRate = product ? Number(product.monthly_interest_rate || 0) : 0;
  const months = product ? Number(product.tenure_months || 0) : 0;
  const safeMonths = Number.isFinite(months) && months > 0 ? months : 1;
  const safeRate = Number.isFinite(monthlyRate) ? Math.max(0, monthlyRate) : 0;
  const totalInterest = principal * safeRate * safeMonths;
  const totalRepayable = principal + totalInterest;
  const interestOnly = normalizeRepaymentOption(repaymentOption) === 'interest_only';
  const monthlyPayment = interestOnly ? principal * safeRate : totalRepayable / safeMonths;
  const finalPayment = interestOnly ? principal + monthlyPayment : monthlyPayment;

  return {
    monthlyPayment,
    finalPayment,
    totalRepayable,
  };
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

function formatDate(value?: string | null) {
  if (!value) return 'Pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pending';
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function applicationStatusLabel(status?: string | null) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'active' || value === 'approved') return 'Approved - Active';
  if (value === 'rejected') return 'Rejected';
  if (value === 'completed') return 'Completed';
  return 'Pending Review';
}

function applicationStatusClass(status?: string | null) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'active' || value === 'approved') return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-500 dark:text-emerald-300';
  if (value === 'rejected') return 'border-red-500/25 bg-red-500/10 text-red-500 dark:text-red-300';
  if (value === 'completed') return 'border-zinc-400/25 bg-zinc-400/10 text-zinc-500 dark:text-white/45';
  return 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]';
}

function repaymentStatusLabel(status?: string | null) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'paid') return 'Paid';
  if (value === 'overdue') return 'Overdue';
  return 'Due';
}

function repaymentStatusClass(status?: string | null) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'paid') return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-500 dark:text-emerald-300';
  if (value === 'overdue') return 'border-red-500/25 bg-red-500/10 text-red-500 dark:text-red-300';
  return 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]';
}

function isApprovedLoan(loan: LoanApplicationRow) {
  const status = String(loan.status || '').toLowerCase();
  return status === 'active' || status === 'approved';
}

function activeLoanProgress(loan: LoanApplicationRow) {
  const repayment = calculateLoanRepayment(parseAmount(loan.amount_approved || loan.amount_requested), loan.loan_type, loan.repayment_option);
  const months = Number(loan.tenure_months || repayment.term.months);
  const start = loan.start_date ? new Date(loan.start_date) : null;
  const end = loan.end_date ? new Date(loan.end_date) : start ? addMonths(start, months) : null;
  const elapsed = start ? Math.min(months, Math.max(0, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)))) : 0;
  const nextDue = start ? addMonths(start, Math.min(months, elapsed + 1)) : null;
  const daysRemaining = nextDue ? Math.max(0, Math.ceil((nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return {
    months,
    elapsed,
    end,
    nextDue,
    daysRemaining,
    percent: months > 0 ? Math.min(100, (elapsed / months) * 100) : 0,
  };
}

export default function LoansClient({
  profile,
  initialLoanApplications = [],
  activeLoanProducts = [],
  initialRepaymentSchedule = [],
}: {
  devBypassActive: boolean;
  profile: LoanApplicationProfile;
  initialLoanApplications?: LoanApplicationRow[];
  activeLoanProducts?: LoanProductOption[];
  initialRepaymentSchedule?: LoanRepaymentScheduleRow[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [repaymentLoan, setRepaymentLoan] = useState<LoanApplicationRow | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentReference, setRepaymentReference] = useState('');
  const [repaymentProofFile, setRepaymentProofFile] = useState<File | null>(null);
  const [repaymentSubmitting, setRepaymentSubmitting] = useState(false);
  const [repaymentError, setRepaymentError] = useState('');
  const [repaymentSuccess, setRepaymentSuccess] = useState('');
  const [form, setForm] = useState({
    fullName: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    loanProductId: activeLoanProducts[0]?.id || '',
    loanType: activeLoanProducts[0]?.name || '',
    amount: '',
    duration: activeLoanProducts[0]?.tenure_months ? `${activeLoanProducts[0].tenure_months} months` : '',
    repaymentOption: REPAYMENT_OPTIONS[0],
    purpose: '',
    employmentStatus: 'Employed',
    incomeRange: 'Below NGN50K',
    existingSavings: 'Yes',
    existingSavingsAmount: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorRelationship: 'Spouse',
    disbursementAccountNumber: '',
    disbursementBankName: '',
    collateral: 'No',
    collateralDescription: '',
    urgency: 'Within a month',
    additionalInfo: '',
  });
  const selectedLoan = activeLoanProducts.find((product) => product.id === form.loanProductId) || activeLoanProducts[0] || null;
  const repaymentPreview = calculateDynamicLoanRepayment(parseAmount(form.amount), selectedLoan, form.repaymentOption);
  const interestOnly = form.repaymentOption === 'Monthly interest payment only';

  function updateField(field: keyof typeof form, value: string) {
    const nextProduct = field === 'loanProductId' ? activeLoanProducts.find((product) => product.id === value) || null : null;
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'loanProductId' && nextProduct
        ? { loanType: nextProduct.name, duration: `${nextProduct.tenure_months || 0} months` }
        : {}),
    }));
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!selectedLoan) throw new Error('No loan plans are currently available. Check back soon.');
      if (parseAmount(form.amount) <= 0) throw new Error('Enter a valid loan amount.');
      const requestedAmount = parseAmount(form.amount);
      const minAmount = parseAmount(selectedLoan.min_amount);
      const maxAmount = parseAmount(selectedLoan.max_amount);
      if (minAmount > 0 && requestedAmount < minAmount) throw new Error(`Minimum amount for ${selectedLoan.name} is ${formatAmount(minAmount).replace('.00', '')}.`);
      if (maxAmount > 0 && requestedAmount > maxAmount) throw new Error(`Maximum amount for ${selectedLoan.name} is ${formatAmount(maxAmount).replace('.00', '')}.`);
      if (!form.guarantorName.trim()) throw new Error('Guarantor name is required.');
      if (!form.guarantorPhone.trim()) throw new Error('Guarantor phone is required.');
      if (!form.purpose.trim()) throw new Error('Loan purpose is required.');
      if (!form.disbursementAccountNumber.trim()) throw new Error('Account number for loan disbursement is required.');
      if (!/^\d{10}$/.test(form.disbursementAccountNumber.trim())) throw new Error('Incomplete account number. Enter exactly 10 numeric digits.');
      if (!form.disbursementBankName.trim()) throw new Error('Bank name is required.');

      const response = await fetch('/api/applications/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Unable to submit loan application.');
      }
      setSubmitted(true);
      setForm((current) => ({
        ...current,
        amount: '',
        purpose: '',
        existingSavingsAmount: '',
        guarantorName: '',
        guarantorPhone: '',
        disbursementAccountNumber: '',
        disbursementBankName: '',
        collateralDescription: '',
        additionalInfo: '',
      }));
    } catch (error) {
      setError(parseError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function uploadRepaymentProof() {
    if (!repaymentProofFile) return null;

    const safeFileName = repaymentProofFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filePath = `${profile.user_id}/loan-repayment-${Date.now()}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, repaymentProofFile, { upsert: false, contentType: repaymentProofFile.type });

    if (uploadError) throw uploadError;
    return filePath;
  }

  async function handleRepaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!repaymentLoan) return;

    setRepaymentError('');
    setRepaymentSuccess('');

    if (!repaymentProofFile) {
      setRepaymentError('Upload your payment proof image.');
      return;
    }

    try {
      setRepaymentSubmitting(true);
      const repayment = calculateLoanRepayment(
        parseAmount(repaymentLoan.amount_approved || repaymentLoan.amount_requested),
        repaymentLoan.loan_type,
        repaymentLoan.repayment_option
      );
      const monthlyPayment = parseAmount(repaymentLoan.monthly_payment) || repayment.monthlyPayment;
      const enteredAmount = parseAmount(repaymentAmount);
      if (enteredAmount < 100) {
        setRepaymentError('Enter a repayment amount of at least ₦100.');
        return;
      }
      const proofUrl = await uploadRepaymentProof();
      const { error: submissionError } = await supabase.from('payment_submissions').insert({
        user_id: profile.user_id,
        full_name: profile.full_name || 'Smart Save Member',
        email: profile.email || '',
        amount: enteredAmount,
        payment_type: 'loan_repayment',
        transaction_reference: repaymentReference.trim() || 'Not provided',
        proof_url: proofUrl,
        status: 'pending',
        notes: `Loan repayment for loan ID: ${repaymentLoan.id}. Monthly payment due: ${formatCurrency(monthlyPayment)}. Amount submitted: ${formatCurrency(enteredAmount)}`,
      });

      if (submissionError) throw submissionError;

      setRepaymentSuccess(`Your repayment of ${formatCurrency(enteredAmount)} has been submitted successfully. The admin will confirm and update your loan balance.`);
      setRepaymentAmount('');
      setRepaymentReference('');
      setRepaymentProofFile(null);
    } catch (error) {
      setRepaymentError(parseError(error));
    } finally {
      setRepaymentSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-alabaster px-4 py-6 font-sans text-brand-ink dark:bg-[#0A0A0A] dark:text-white sm:py-8">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(212, 175, 55, 0.16) 0%, rgba(245, 240, 232, 0) 72%)',
          }}
        />
        <div
          className="absolute top-[-12%] left-1/2 h-[620px] w-[920px] -translate-x-1/2 rounded-full opacity-[0.24] blur-3xl dark:hidden"
          style={{
            background: 'radial-gradient(ellipse, rgba(212,175,55,0.78) 0%, rgba(30,144,255,0.4) 48%, rgba(245,240,232,0) 76%)',
          }}
        />
      </div>
      <div className="absolute inset-0 brand-grid opacity-60" aria-hidden="true" />
      <div className="absolute left-1/2 top-0 hidden h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl dark:block" aria-hidden="true" />

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex items-center gap-4">
          <Link href="/dashboard" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-brand-ghost text-brand-ink transition hover:border-[#D4AF37]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Smart Save Cooperative</p>
            <h1 className="text-3xl font-black tracking-tight">Loan Plans</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-white/45">Flexible financing solutions for members</p>
          </div>
        </header>

        <section className="rounded-3xl border border-brand-border bg-brand-ghost p-5 shadow-2xl shadow-zinc-900/[0.04] dark:border-white/[0.08] dark:bg-white/[0.035]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">My Loan Applications</p>
              <h2 className="mt-1 text-2xl font-black">Application history</h2>
            </div>
            <Banknote className="hidden text-[#D4AF37] sm:block" />
          </div>

          {initialLoanApplications.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-5 text-sm font-semibold text-zinc-500 dark:text-white/45">
              No loan applications yet. Apply for a loan below.
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {initialLoanApplications.map((loan) => {
                const repayment = calculateLoanRepayment(parseAmount(loan.amount_approved || loan.amount_requested), loan.loan_type, loan.repayment_option);
                const progress = activeLoanProgress(loan);
                const monthlyPayment = parseAmount(loan.monthly_payment) || repayment.monthlyPayment;
                const totalRepayable = parseAmount(loan.total_repayable) || repayment.totalRepayable;
                const approved = isApprovedLoan(loan);

                return (
                  <article key={loan.id} className="overflow-hidden rounded-2xl border border-brand-border bg-zinc-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-[#D4AF37]">{loan.loan_type || repayment.term.name}</h3>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${applicationStatusClass(loan.status)}`}>
                            {applicationStatusLabel(loan.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/45">
                          {formatCurrency(loan.amount_approved || loan.amount_requested)} requested | Submitted {formatDate(loan.created_at)}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-white/45">{repaymentOptionLabel(loan.repayment_option)}</p>
                      </div>
                      {approved && (
                        <div className="text-left sm:text-right">
                          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Monthly payment</p>
                          <p className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[#D4AF37] ${getAmountFontSize(monthlyPayment)}`}>{formatCurrency(monthlyPayment)}</p>
                        </div>
                      )}
                    </div>

                    {approved && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="col-span-2 overflow-hidden rounded-xl border border-brand-border bg-white p-3 dark:border-white/10 dark:bg-white/[0.04] sm:col-span-1">
                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Total repayable</p>
                        <p className={`mt-2 overflow-hidden text-ellipsis whitespace-nowrap ${getAmountFontSize(totalRepayable)}`}>{formatCurrency(totalRepayable)}</p>
                      </div>
                      <div className="rounded-xl border border-brand-border bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">End date</p>
                        <p className="mt-2 font-black">{formatDate(progress.end?.toISOString() || loan.end_date)}</p>
                      </div>
                      <div className="rounded-xl border border-brand-border bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Tenure</p>
                        <p className="mt-2 font-black">{loan.tenure_months || progress.months} months</p>
                      </div>
                    </div>}

                    {approved && <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">
                        <span>Progress</span>
                        <span>{progress.elapsed} / {progress.months} months</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                        <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${progress.percent}%` }} />
                      </div>
                    </div>}
                    {approved && (
                      <button
                        type="button"
                        onClick={() => {
                          setRepaymentLoan(loan);
                          setRepaymentError('');
                          setRepaymentSuccess('');
                          setRepaymentAmount('');
                          setRepaymentReference('');
                          setRepaymentProofFile(null);
                        }}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B]"
                      >
                        Make Repayment
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {initialRepaymentSchedule.length > 0 && (
          <section className="rounded-3xl border border-brand-border bg-brand-ghost p-5 shadow-2xl shadow-zinc-900/[0.04] dark:border-white/[0.08] dark:bg-white/[0.035]">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">My Loan Repayments</p>
              <h2 className="mt-1 text-2xl font-black">Repayment schedule</h2>
            </div>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-brand-border bg-white dark:border-white/10 dark:bg-white/[0.035]">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-brand-border text-xs uppercase tracking-widest text-zinc-500 dark:border-white/10 dark:text-white/35">
                  <tr>
                    <th className="px-4 py-3 font-black">Installment</th>
                    <th className="px-4 py-3 font-black">Due Date</th>
                    <th className="px-4 py-3 text-right font-black">Amount Due</th>
                    <th className="px-4 py-3 font-black">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border dark:divide-white/10">
                  {initialRepaymentSchedule.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-black">#{row.installment_number || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-500 dark:text-white/50">{formatDate(row.due_date)}</td>
                      <td className="px-4 py-3 text-right font-black text-[#D4AF37]">{formatCurrency(row.total_due)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${repaymentStatusClass(row.status)}`}>
                          {repaymentStatusLabel(row.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4 md:p-5">
          <div className="flex items-start gap-2.5 md:gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#D4AF37] md:h-6 md:w-6" />
            <div>
              <h2 className="text-base font-black text-[#D4AF37] md:text-lg">General Loan Conditions</h2>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-600 dark:text-white/60">
                {[
                  'All loan applications require at least one guarantor.',
                  'Repayment options: Monthly interest only, or monthly principal + interest.',
                  'Non-members may access select loan plans subject to registration and collateral requirements.',
                  'Approval subject to Cooperative assessment.',
                ].map((condition) => (
                  <li key={condition} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] md:mt-1">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {activeLoanProducts.length === 0 ? (
          <div className="rounded-2xl border border-brand-border bg-brand-ghost px-4 py-5 text-sm font-semibold text-zinc-500 shadow-xl shadow-zinc-900/[0.03] dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-white/45">
            No loan plans are currently available. Check back soon.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeLoanProducts.map((product) => (
              <article
                key={product.id}
                className={`rounded-2xl border p-4 shadow-xl shadow-zinc-900/[0.03] transition dark:bg-white/[0.035] md:p-5 ${
                  selectedLoan?.id === product.id
                    ? 'border-[#D4AF37]/45 bg-[#D4AF37]/10 dark:border-[#D4AF37]/35'
                    : 'border-brand-border bg-brand-ghost dark:border-white/[0.08]'
                }`}
              >
                <Banknote className="h-5 w-5 text-[#D4AF37] md:h-6 md:w-6" strokeWidth={1.8} />
                <h2 className="mt-3 text-lg font-black text-[#D4AF37] md:mt-4 md:text-xl">{product.name}</h2>
                <div className="mt-3 grid gap-2.5 text-sm leading-5 text-zinc-600 dark:text-white/55 md:mt-4 md:gap-3.5 md:leading-6">
                  <p><span className="font-medium text-zinc-800 dark:text-white/75">Interest:</span> {formatPercent(product.monthly_interest_rate)} monthly interest</p>
                  <p><span className="font-medium text-zinc-800 dark:text-white/75">Tenure:</span> {Number(product.tenure_months || 0)} months</p>
                  <p><span className="font-medium text-zinc-800 dark:text-white/75">Amount:</span> {formatAmountRange(product)}</p>
                  {product.description && <p><span className="font-medium text-zinc-800 dark:text-white/75">Details:</span> {product.description}</p>}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-5">
                  <button
                    type="button"
                    onClick={() => updateField('loanProductId', product.id)}
                    className="inline-flex rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B]"
                  >
                    {selectedLoan?.id === product.id ? 'Selected' : 'Select Plan'}
                  </button>
                  <button type="button" onClick={() => setExpanded(expanded === product.id ? null : product.id)} className="inline-flex items-center gap-2 text-sm font-black text-[#D4AF37]">
                    View Full Terms <ChevronDown size={16} className={expanded === product.id ? 'rotate-180 transition' : 'transition'} />
                  </button>
                </div>
                {expanded === product.id && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-5 text-zinc-500 dark:text-white/45 md:p-4 md:leading-6">
                    {product.requirements && <p>{product.requirements}</p>}
                    <p className={product.requirements ? 'mt-2' : ''}>Guarantor requirements: at least one reachable guarantor with a verifiable relationship to the applicant.</p>
                    <p className="mt-2 font-semibold text-[#D4AF37]">Final approval remains subject to cooperative review.</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <section className="rounded-3xl border border-brand-border bg-brand-ghost p-6 shadow-2xl shadow-zinc-900/[0.04] dark:border-white/[0.08] dark:bg-white/[0.035]">
          {submitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#9DC03A]" />
              <h2 className="mt-5 text-2xl font-black">Application Submitted!</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500 dark:text-white/50">
                Your loan application has been submitted successfully. Our team will review and respond within 24-48 hours. You will be notified once a decision is made.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Loan Application</p>
              <h2 className="mt-1 text-2xl font-black">Apply for a Loan</h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-white/45">Fill in your details below. Applications are reviewed within 3-5 business days.</p>
              <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Full Name" value={form.fullName} onChange={(value) => updateField('fullName', value)} />
                <Field label="Email" value={form.email} disabled onChange={(value) => updateField('email', value)} />
                <Field label="Phone Number" value={form.phone} onChange={(value) => updateField('phone', value)} />
                <Field label="Selected Loan Plan" value={selectedLoan?.name || 'No loan plan available'} disabled onChange={() => null} />
                <Field label="Interest Rate" value={selectedLoan ? `${formatPercent(selectedLoan.monthly_interest_rate)} per month` : 'Not available'} disabled onChange={() => null} />
                <Field label="Default Tenure" value={selectedLoan ? `${Number(selectedLoan.tenure_months || 0)} months` : 'Not available'} disabled onChange={() => null} />
                <Field label="Loan Amount Requested" value={form.amount} placeholder="NGN 250,000" onChange={(value) => updateField('amount', formatAmountInput(value))} />
                <SelectField label="Employment/Business Status" value={form.employmentStatus} options={['Employed', 'Self-Employed', 'Business Owner', 'Student', 'Other']} onChange={(value) => updateField('employmentStatus', value)} />
                <SelectField label="Monthly Income Range" value={form.incomeRange} options={['Below NGN50K', 'NGN50K-NGN150K', 'NGN150K-NGN500K', 'Above NGN500K']} onChange={(value) => updateField('incomeRange', value)} />
                <SelectField label="Guarantor Relationship" value={form.guarantorRelationship} options={['Spouse', 'Sibling', 'Parent', 'Colleague', 'Business Partner', 'Other']} onChange={(value) => updateField('guarantorRelationship', value)} />
                <Field label="Guarantor Full Name" value={form.guarantorName} onChange={(value) => updateField('guarantorName', value)} />
                <Field label="Guarantor Phone Number" value={form.guarantorPhone} onChange={(value) => updateField('guarantorPhone', value)} />
                <Field label="Account Number for Loan Disbursement" sublabel="Enter the bank account number where approved loan funds should be deposited" value={form.disbursementAccountNumber} onChange={(value) => updateField('disbursementAccountNumber', value)} />
                <Field label="Bank Name" value={form.disbursementBankName} onChange={(value) => updateField('disbursementBankName', value)} />
                <SelectField label="How urgent is this loan?" value={form.urgency} options={['Within a week', 'Within a month', 'No specific urgency']} onChange={(value) => updateField('urgency', value)} />
                <RadioField label="Preferred Repayment Option" value={form.repaymentOption} options={REPAYMENT_OPTIONS} onChange={(value) => updateField('repaymentOption', value)} />
                <RadioField label="Existing savings with Smart Save?" value={form.existingSavings} options={['Yes', 'No']} onChange={(value) => updateField('existingSavings', value)} />
                {form.existingSavings === 'Yes' && <Field label="Existing Savings Amount" value={form.existingSavingsAmount} placeholder="Optional" onChange={(value) => updateField('existingSavingsAmount', value)} />}
                <RadioField label="Do you have collateral to offer?" value={form.collateral} options={['Yes', 'No']} onChange={(value) => updateField('collateral', value)} />
                {form.collateral === 'Yes' && <TextareaField label="Collateral Description" value={form.collateralDescription} onChange={(value) => updateField('collateralDescription', value)} />}
                <TextareaField label="Loan Purpose" value={form.purpose} placeholder="Describe what you need the loan for" onChange={(value) => updateField('purpose', value)} />
                <TextareaField label="Additional Information" value={form.additionalInfo} placeholder="Optional" onChange={(value) => updateField('additionalInfo', value)} />
                <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4 md:col-span-2 md:p-5">
                  <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Repayment preview</p>
                  <div className={`mt-3 grid gap-3 md:mt-4 ${interestOnly ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Monthly payment</p>
                      <p className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[#D4AF37] ${getAmountFontSize(repaymentPreview.monthlyPayment)}`}>{formatCurrency(repaymentPreview.monthlyPayment)}</p>
                    </div>
                    {interestOnly && (
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Final payment</p>
                        <p className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap ${getAmountFontSize(repaymentPreview.finalPayment)}`}>{formatCurrency(repaymentPreview.finalPayment)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Total payments</p>
                      <p className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap ${getAmountFontSize(repaymentPreview.totalRepayable)}`}>{formatCurrency(repaymentPreview.totalRepayable)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-5 text-zinc-600 dark:text-white/55">
                    {interestOnly
                      ? `How this works: Each month you pay only the interest (${formatCurrency(repaymentPreview.monthlyPayment)}). In your final month, you pay the interest PLUS your full loan amount back. That final month payment is ${formatCurrency(repaymentPreview.finalPayment)}.`
                      : `You pay ${formatCurrency(repaymentPreview.monthlyPayment)} every month for ${Number(selectedLoan?.tenure_months || 0)} months until your loan is fully repaid.`}
                  </p>
                </div>
                {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500 md:col-span-2">{toOptionalErrorMessage(error)}</p>}
                <button type="submit" disabled={isSubmitting || !selectedLoan} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B] disabled:opacity-60 md:col-span-2">
                  {isSubmitting ? 'Submitting...' : 'Submit Loan Application'} <Send size={16} />
                </button>
              </form>
            </>
          )}
        </section>
      </section>
      {repaymentLoan && (
        <LoanRepaymentModal
          loan={repaymentLoan}
          amount={repaymentAmount}
          reference={repaymentReference}
          proofFile={repaymentProofFile}
          submitting={repaymentSubmitting}
          error={repaymentError}
          success={repaymentSuccess}
          onAmountChange={setRepaymentAmount}
          onReferenceChange={setRepaymentReference}
          onProofChange={setRepaymentProofFile}
          onClose={() => setRepaymentLoan(null)}
          onSubmit={handleRepaymentSubmit}
        />
      )}
    </main>
  );
}

function LoanRepaymentModal({
  loan,
  amount,
  reference,
  proofFile,
  submitting,
  error,
  success,
  onAmountChange,
  onReferenceChange,
  onProofChange,
  onClose,
  onSubmit,
}: {
  loan: LoanApplicationRow;
  amount: string;
  reference: string;
  proofFile: File | null;
  submitting: boolean;
  error: string;
  success: string;
  onAmountChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
  onProofChange: (file: File | null) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);
  const repayment = calculateLoanRepayment(parseAmount(loan.amount_approved || loan.amount_requested), loan.loan_type, loan.repayment_option);
  const monthlyPayment = parseAmount(loan.monthly_payment) || repayment.monthlyPayment;
  const loanReference = `LOAN-${loan.id.slice(0, 8)}`;
  const accountNumber = BANK_DETAILS.accountNumber;

  async function copyAccountNumber() {
    await navigator.clipboard.writeText(accountNumber);
    setCopiedAccountNumber(true);
    window.setTimeout(() => setCopiedAccountNumber(false), 1800);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/75 px-4 backdrop-blur-xl">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-brand-border bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#101010]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Loan Repayment</p>
            <h2 className="mt-1 text-2xl font-black">{loan.loan_type || repayment.term.name}</h2>
            <p className={`mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-[#D4AF37] ${getAmountFontSize(monthlyPayment)}`}>
              {formatCurrency(monthlyPayment)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border dark:border-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4 text-sm font-semibold leading-6 text-zinc-700 dark:text-white/70">
          <p>Transfer your monthly payment of <span className="font-black text-[#D4AF37]">{formatCurrency(monthlyPayment)}</span> to:</p>
          <p className="mt-3">Account Name: {BANK_DETAILS.accountName}</p>
          <p>Bank: {BANK_DETAILS.bankName}</p>
          <button
            type="button"
            onClick={copyAccountNumber}
            className="mt-1 flex w-full min-w-0 items-center gap-2 text-left font-black text-[#D4AF37] transition hover:text-[#F5D06B]"
            aria-label="Copy Smart Save account number"
          >
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">Account Number: {accountNumber}</span>
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10">
              {copiedAccountNumber ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
            </span>
          </button>
          <p>Reference: {loanReference}</p>
        </div>

        <label className="mt-5 flex flex-col gap-2">
          <span>
            <span className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Repayment Amount</span>
            <span className="mt-1 block text-xs font-semibold leading-5 text-zinc-500 dark:text-white/45">
              You can pay any amount — does not have to be the full monthly payment
            </span>
          </span>
          <input
            required
            inputMode="numeric"
            value={amount}
            placeholder="Enter amount (₦)"
            onChange={(event) => onAmountChange(formatAmountInput(event.target.value))}
            className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-semibold outline-none focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04]"
          />
          <span className="text-xs font-black text-[#D4AF37]">Monthly payment due: {formatCurrency(monthlyPayment)}</span>
        </label>

        <label className="mt-5 flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Transaction Reference / Teller Number (Optional)</span>
          <input
            value={reference}
            onChange={(event) => onReferenceChange(event.target.value)}
            className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-semibold outline-none focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04]"
          />
        </label>

        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-brand-border bg-brand-ghost px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-white/[0.04]">
          <FileUp size={18} className="text-[#D4AF37]" />
          <span className="min-w-0 flex-1 truncate">{proofFile?.name || 'Upload payment proof (required)'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(event) => onProofChange(event.target.files?.[0] || null)} />
        </label>

        {error && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">{toOptionalErrorMessage(error)}</p>}
        {success && <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-500">{success}</p>}

        <button type="submit" disabled={submitting} className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B] disabled:opacity-60">
          {submitting ? 'Submitting...' : 'Submit Repayment'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder = '', disabled = false, sublabel }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; disabled?: boolean; sublabel?: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span>
        <span className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">{label}</span>
        {sublabel && <span className="mt-1 block text-xs font-semibold leading-5 text-zinc-500 dark:text-white/45">{sublabel}</span>}
      </span>
      <input value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-semibold outline-none focus:border-[#D4AF37] disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <SmartSelect label={label} value={value} options={options} onChange={onChange} />
  );
}

function TextareaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-2 md:col-span-2">
      <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">{label}</span>
      <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="min-h-[120px] rounded-xl border border-brand-border bg-brand-ghost px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
    </label>
  );
}

function RadioField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-xl border px-3 py-3 text-sm font-black ${value === option ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-brand-border bg-brand-ghost text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45'}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
