'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  Bell,
  Calculator,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  FileUp,
  Home,
  Loader2,
  LogOut,
  Moon,
  Sun,
  TrendingUp,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { useIncognito } from '@/components/providers/incognito-provider';
import FaqChatWidget from '@/components/shared/FaqChatWidget';
import { toOptionalErrorMessage } from '@/lib/error-message';
import { parseError } from '@/lib/parseError';
import { BANK_DETAILS } from '@/lib/constants/bankDetails';
import {
  FIXED_PAYOUT_INTERVAL_MONTHS,
  FIXED_TIER_1_MAX,
  FIXED_TIER_1_MIN,
  FIXED_TIER_1_MONTHLY_RATE,
  FIXED_TIER_2_MAX,
  FIXED_TIER_2_MIN,
  FIXED_TIER_2_MONTHLY_RATE,
  SAVINGS_DURATION_MONTHS,
  SAVINGS_PAYOUT_MONTH,
  SAVINGS_RETURN_RATE,
  calculateFixedQuarterlyInterest,
  calculateFixedTotalInterest,
  calculateFixedTotalPayout,
  calculateSavingsPayout,
  calculateSavingsTotalContributed,
  getFixedInvestmentTier,
} from '@/lib/investment-config';

type ModalType = 'deposit' | 'withdraw' | null;
type RoiProductType = 'Fixed Investment' | 'Monthly Savings';
type FixedDepositDuration = 6 | 12;
type TransactionType = 'deposit' | 'withdrawal' | 'fee' | 'interest' | 'interest_accrual';
type TransactionStatus = 'approved' | 'success' | 'pending' | 'processing' | 'failed';

type AnnouncementRow = {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  expires_at: string | null;
  created_at: string;
};

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean | null;
  read_at?: string | null;
  created_at: string;
};

interface ProfileRow {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  balance: number | string | null;
  created_at: string;
  updated_at: string;
}

interface TransactionRow {
  id: string;
  user_id: string;
  amount: number | string;
  type: TransactionType | string;
  status: TransactionStatus | string;
  reference: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

function parseMoney(value: number | string | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseAmountInput(value: string) {
  return parseMoney(value.replace(/[^\d.]/g, ''));
}

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('en-NG').format(Number(digits));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1000000) {
    const compact = value / 1000000;
    return `₦${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1)}M`;
  }

  if (value >= 1000) {
    const compact = value / 1000;
    return `₦${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1)}k`;
  }

  return formatCurrency(value).replace('.00', '');
}

function formatRatePercent(rate: number) {
  return `${(rate * 100).toFixed(1).replace('.0', '')}%`;
}

function getAmountFontSize(amount: number): string {
  const len = Math.floor(Math.abs(amount)).toString().length;
  if (len >= 12) return 'text-lg font-bold';
  if (len >= 8) return 'text-xl font-bold';
  return 'text-2xl font-bold';
}

function formatMemberSince(value: string | null | undefined) {
  if (!value) return 'Pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pending';
  return date.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
}

function formatStatementDate(value: Date | string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function firstDayOfCurrentMonth() {
  const now = new Date();
  return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
}

function todayDateInput() {
  return formatDateInput(new Date());
}

function formatTransactionType(type: string) {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function notificationTimeAgo(value?: string | null) {
  if (!value) return 'Recently';
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff)) return 'Recently';
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatNotificationTimestamp(value?: string | null) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const today = new Date();
  const time = date.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
  return `${date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}, ${time}`;
}

function generateReference(type: TransactionType) {
  const prefix = type === 'deposit' ? 'DEP' : type === 'withdrawal' ? 'WDR' : 'TXN';
  return `SS-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function createPreviewProfile(balance = 0): ProfileRow {
  const now = new Date().toISOString();

  return {
    id: 'preview-profile',
    user_id: 'preview-user',
    email: 'smartsavecooperative@gmail.com',
    full_name: 'Preview Member',
    balance,
    created_at: now,
    updated_at: now,
  };
}

function getErrorMessage(error: unknown) {
  return parseError(error);
}

function normalizeStatus(status: string): TransactionStatus {
  const normalized = status.toLowerCase();
  if (normalized === 'approved') return 'approved';
  if (normalized === 'completed') return 'success';
  if (normalized === 'processing') return 'processing';
  if (normalized === 'failed') return 'failed';
  if (normalized === 'pending') return 'pending';
  return 'success';
}

function isCompleted(status: string) {
  const normalized = normalizeStatus(status);
  return normalized === 'approved' || normalized === 'success';
}

function signedTransactionAmount(transaction: TransactionRow) {
  const amount = Math.abs(parseMoney(transaction.amount));
  if (transaction.type === 'withdrawal' || transaction.type === 'fee') {
    return -amount;
  }
  return amount;
}

function filterStatementTransactions(transactions: TransactionRow[], fromDate: string, toDate: string) {
  const start = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
  const end = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

  return transactions.filter((transaction) => {
    const createdAt = new Date(transaction.created_at);
    if (Number.isNaN(createdAt.getTime())) return false;
    if (start && createdAt < start) return false;
    if (end && createdAt > end) return false;
    return true;
  });
}

function RoiCalculatorModal({
  onClose,
  onDepositNow,
}: {
  onClose: () => void;
  onDepositNow: (amount: number) => void;
}) {
  const [productType, setProductType] = useState<RoiProductType>('Fixed Investment');
  const [duration, setDuration] = useState<FixedDepositDuration>(12);
  const [amount, setAmount] = useState('500000');
  const principal = parseAmountInput(amount);
  const fixedTier = getFixedInvestmentTier(principal);
  const savingsTotalContributed = calculateSavingsTotalContributed(principal);
  const savingsPayout = calculateSavingsPayout(principal);
  const interest = productType === 'Monthly Savings' ? savingsPayout - savingsTotalContributed : calculateFixedTotalInterest(principal, duration);
  const totalPayout = productType === 'Monthly Savings' ? savingsPayout : calculateFixedTotalPayout(principal, duration);
  const quarterlyInterest = calculateFixedQuarterlyInterest(principal);
  const quickAmounts = productType === 'Monthly Savings' ? [50000, 100000, 250000, 500000] : [500000, 1100000, 2500000, 5000000];
  const fixedDepositTier = fixedTier
    ? `${fixedTier.name}: ${formatCurrency(fixedTier.min).replace('.00', '')} - ${formatCurrency(fixedTier.max).replace('.00', '')} | ${(fixedTier.monthlyRate * 100).toFixed(1).replace('.0', '')}% monthly, paid quarterly`
    : `Minimum investment: ${formatCurrency(FIXED_TIER_1_MIN).replace('.00', '')}`;
  const savingsConditions = [
    `Contribute a fixed amount every month for ${SAVINGS_DURATION_MONTHS} consecutive months`,
    `Total payout at month ${SAVINGS_PAYOUT_MONTH} equals total contributed plus ${(SAVINGS_RETURN_RATE * 100).toFixed(0)}%`,
    'Single payout only - no mid-term payments',
    'Early withdrawal may affect eligible returns',
  ];
  const fixedDepositConditions = [
    `Invest a lump sum between ${formatCurrency(FIXED_TIER_1_MIN).replace('.00', '')} and ${formatCurrency(FIXED_TIER_2_MAX).replace('.00', '')}`,
    `Tier 1 (${formatCompactCurrency(FIXED_TIER_1_MIN)}-${formatCompactCurrency(FIXED_TIER_1_MAX)}): ${formatRatePercent(FIXED_TIER_1_MONTHLY_RATE)} monthly interest, paid quarterly`,
    `Tier 2 (${formatCompactCurrency(FIXED_TIER_2_MIN)}-${formatCompactCurrency(FIXED_TIER_2_MAX)}): ${formatRatePercent(FIXED_TIER_2_MONTHLY_RATE)} monthly interest, paid quarterly`,
    'Capital returned in full at end of agreed term',
    'No monthly interest payments - interest is accumulated and paid quarterly',
    'Available to members upon registration',
  ];

  function handleDepositNow() {
    if (principal < 5000) return;
    onDepositNow(principal);
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-zinc-950/75 px-4 backdrop-blur-xl">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-white/95 font-sans shadow-2xl shadow-black/30 dark:bg-[#101010]/95">
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-5 dark:border-white/10">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-brand-amber dark:text-[#D4AF37]">ROI Calculator</p>
            <h2 className="mt-1 text-lg font-medium text-brand-ink dark:text-white">Project your returns</h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-zinc-500 transition hover:text-brand-ink dark:border-white/10 dark:text-white/50 dark:hover:text-white"
            aria-label="Close calculator"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-brand-border bg-zinc-50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
              {(['Fixed Investment', 'Monthly Savings'] as RoiProductType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProductType(type)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-black transition ${
                    productType === type ? 'bg-[#D4AF37] text-brand-ink' : 'text-zinc-500 dark:text-white/45'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="text-xs font-medium leading-5 text-zinc-500 dark:text-white/45">
              Fixed Investment uses automatic tier detection. Monthly Savings uses a fixed {SAVINGS_DURATION_MONTHS}-month contribution period.
            </p>
          </div>

          {productType === 'Monthly Savings' ? (
            <p className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-xs font-semibold leading-5 text-zinc-600 dark:text-white/60">
              Enter your monthly contribution. Duration is fixed at {SAVINGS_DURATION_MONTHS} months, with payout at month {SAVINGS_PAYOUT_MONTH}.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-xs font-semibold leading-5 text-zinc-600 dark:text-white/60">
                {fixedDepositTier}
              </p>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-white/35">Fixed investment term</p>
                <div className="grid grid-cols-2 gap-3">
                  {([6, 12] as FixedDepositDuration[]).map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setDuration(months)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                        duration === months
                          ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'border-brand-border bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55'
                      }`}
                    >
                      {months} months
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <label className="flex flex-col gap-2.5">
            <span className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-white/40">
              {productType === 'Monthly Savings' ? 'Monthly Contribution' : 'Investment Amount'}
            </span>
            <div className="flex h-12 items-center rounded-xl border border-brand-border bg-brand-ghost px-4 focus-within:border-brand-amber focus-within:ring-2 focus-within:ring-[#D4AF37]/15 dark:border-white/10 dark:bg-white/[0.04]">
              <span className="text-sm font-black text-[#D4AF37]">₦</span>
              <input
                value={formatAmountInput(amount)}
                onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ''))}
                inputMode="decimal"
                className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-brand-ink outline-none dark:text-white"
              />
            </div>
          </label>

          <div className="grid grid-cols-4 gap-2.5">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(String(quickAmount))}
                className="rounded-xl border border-brand-border bg-zinc-50 px-3 py-2.5 text-xs font-medium text-zinc-600 transition hover:border-[#D4AF37]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
              >
                <span className="sm:hidden">{formatCompactCurrency(quickAmount)}</span>
                <span className="hidden sm:inline">{formatCurrency(quickAmount).replace('.00', '')}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(productType === 'Monthly Savings'
              ? [
                  ['Monthly Contribution', principal],
                  [`${SAVINGS_DURATION_MONTHS}-Month Total Contributed`, savingsTotalContributed],
                  [`Payout at Month ${SAVINGS_PAYOUT_MONTH}`, totalPayout],
                  ['Return Amount', interest],
                ]
              : [
                  ['Principal', principal],
                  ['Interest Earned', interest],
                  ['Total Payout', totalPayout],
                  ['Quarterly Interest', quarterlyInterest],
                ]
            ).map(([label, value]) => (
              <div key={String(label)} className="flex min-h-[124px] flex-col items-center justify-center rounded-xl border border-brand-border bg-zinc-50 p-4 text-center dark:border-white/10 dark:bg-white/[0.04]">
                <p className="max-w-full break-words text-center text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-white/35">{label}</p>
                <p className="mt-3 max-w-full whitespace-nowrap text-center text-[13px] font-black leading-tight text-[#D4AF37] sm:text-[clamp(0.9rem,4.1vw,1.125rem)]">{formatCurrency(Number(value))}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">
              {productType === 'Monthly Savings' ? 'Monthly Savings Conditions' : 'Fixed Investment Conditions'}
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-zinc-600 dark:text-white/55">
              {(productType === 'Monthly Savings' ? savingsConditions : fixedDepositConditions).map((condition) => (
                <li key={condition} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-3 text-xs font-semibold leading-5 text-zinc-600 dark:text-white/55">
            Projections are indicative. Returns subject to cooperative performance.
          </p>

          <button
            type="button"
            onClick={handleDepositNow}
            disabled={principal < 5000}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Deposit Now
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeStatus(status);

  if (normalized === 'approved' || normalized === 'success') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-black text-[#B48924] dark:text-[#D4AF37]">
        <CheckCircle2 size={12} />
        Completed
      </span>
    );
  }

  if (normalized === 'pending' || normalized === 'processing') {
    return (
      <span className="inline-flex animate-pulse items-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-black text-[#D4AF37]">
        {normalized === 'processing' ? 'Processing' : 'Pending'}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-red-400 line-through opacity-75">
      Failed
    </span>
  );
}

function DashboardModal({
  activeModal,
  balance,
  userId,
  userEmail,
  userFullName,
  isPreviewMode,
  initialDepositAmount,
  onClose,
  onTransactionComplete,
  onToast,
}: {
  activeModal: ModalType;
  balance: number;
  userId: string;
  userEmail: string;
  userFullName: string;
  isPreviewMode: boolean;
  initialDepositAmount: string;
  onClose: () => void;
  onTransactionComplete: (profile: ProfileRow | null, transaction: TransactionRow) => void;
  onToast: (message: string) => void;
}) {
  const [depositAmount, setDepositAmount] = useState('');
  const [depositStep, setDepositStep] = useState<1 | 2 | 3>(1);
  const [depositReference, setDepositReference] = useState('');
  const [depositProofFile, setDepositProofFile] = useState<File | null>(null);
  const [depositSubmittedReference, setDepositSubmittedReference] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { incognito, maskValue } = useIncognito();

  useEffect(() => {
    if (activeModal === 'deposit' && initialDepositAmount) {
      setDepositAmount(initialDepositAmount);
    }
  }, [activeModal, initialDepositAmount]);

  if (!activeModal) return null;

  const parsedDepositAmount = parseAmountInput(depositAmount);
  const parsedWithdrawAmount = parseAmountInput(withdrawAmount);
  const displayCurrency = (value: number) => (incognito ? maskValue : formatCurrency(value));

  function resetAndClose() {
    setDepositAmount('');
    setDepositStep(1);
    setDepositReference('');
    setDepositProofFile(null);
    setDepositSubmittedReference('');
    setCopiedAccount(false);
    setWithdrawAmount('');
    setAccountName('');
    setIsWriting(false);
    setError(null);
    setSuccess(null);
    onClose();
  }

  function previewProfile(nextBalance: number): ProfileRow {
    return {
      ...createPreviewProfile(nextBalance),
      user_id: userId,
      email: userEmail || 'smartsavecooperative@gmail.com',
    };
  }

  function previewTransaction(type: 'deposit' | 'withdrawal', amount: number, status: TransactionStatus): TransactionRow {
    const now = new Date().toISOString();
    return {
      id: generateReference(type),
      user_id: userId,
      amount,
      type,
      status,
      reference: generateReference(type),
      description: type === 'deposit' ? 'Deposit request submitted' : 'Withdrawal request submitted',
      created_at: now,
      updated_at: now,
    };
  }

  async function copyAccountNumber() {
    await navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
    setCopiedAccount(true);
    window.setTimeout(() => setCopiedAccount(false), 2000);
  }

  function handleDepositAmountContinue() {
    setError(null);
    setSuccess(null);

    if (parsedDepositAmount < 1000) {
      setError('Minimum: 1,000');
      return;
    }

    setDepositStep(2);
  }

  async function uploadDepositProof() {
    if (!depositProofFile) return null;

    const safeFileName = depositProofFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filePath = `${userId}/${Date.now()}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, depositProofFile, { upsert: false, contentType: depositProofFile.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (parsedDepositAmount < 1000) {
      setError('Minimum: 1,000');
      return;
    }

    if (!depositProofFile) {
      setError('Upload your payment proof image.');
      return;
    }

    try {
      setIsWriting(true);

      if (isPreviewMode) {
        const transaction = previewTransaction('deposit', parsedDepositAmount, 'pending');
        onTransactionComplete(previewProfile(balance), transaction);
        setDepositSubmittedReference(depositReference.trim() || 'Not provided');
        setDepositStep(3);
        return;
      }

      const proofUrl = await uploadDepositProof();
      const { error: submissionError } = await supabase.from('payment_submissions').insert({
        user_id: userId,
        full_name: userFullName,
        email: userEmail,
        amount: parsedDepositAmount,
        payment_type: 'deposit',
        transaction_reference: depositReference.trim() || 'Not provided',
        proof_url: proofUrl,
        status: 'pending',
      });

      if (submissionError) throw submissionError;

      const transaction = previewTransaction('deposit', parsedDepositAmount, 'pending');
      onTransactionComplete(null, transaction);
      setDepositSubmittedReference(depositReference.trim() || 'Not provided');
      setDepositStep(3);
      onToast('Deposit request submitted for admin approval.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsWriting(false);
    }
  }

  async function handleWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (parsedWithdrawAmount <= 0) {
      setError('Enter a valid withdrawal amount.');
      return;
    }

    if (parsedWithdrawAmount > balance) {
      setError('Withdrawal amount exceeds your current balance.');
      return;
    }

    if (!accountName.trim() || !bankName.trim() || !accountNumber.trim()) {
      setError('Enter the account name, bank name, and account number for this withdrawal.');
      return;
    }

    try {
      setIsWriting(true);

      if (isPreviewMode) {
        const transaction = previewTransaction('withdrawal', parsedWithdrawAmount, 'pending');
        onTransactionComplete(previewProfile(balance), transaction);
        setSuccess('Withdrawal request submitted. You will be notified once approved.');
        setWithdrawAmount('');
        setAccountName('');
        setBankName('');
        setAccountNumber('');
        return;
      }

      const { error: submissionError } = await supabase.from('payment_submissions').insert({
        user_id: userId,
        full_name: userFullName,
        email: userEmail,
        amount: parsedWithdrawAmount,
        payment_type: 'withdrawal',
        transaction_reference: `${accountName.trim()} - ${accountNumber.trim()} - ${bankName.trim()}`,
        status: 'pending',
      });

      if (submissionError) throw submissionError;
      const transaction = previewTransaction('withdrawal', parsedWithdrawAmount, 'pending');
      onTransactionComplete(null, transaction);
      setSuccess('Withdrawal request submitted. You will be notified once approved.');
      setWithdrawAmount('');
      setAccountName('');
      setBankName('');
      setAccountNumber('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsWriting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/75 px-4 py-4 backdrop-blur-xl">
      <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/95 font-sans shadow-2xl shadow-black/30 dark:bg-[#101010]/95">
        <div className="flex shrink-0 items-center justify-between border-b border-brand-border px-5 py-4 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            {activeModal === 'deposit' && depositStep === 2 && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setDepositStep(1);
                }}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-border text-zinc-500 transition hover:text-brand-ink dark:border-white/10 dark:text-white/50 dark:hover:text-white"
                aria-label="Back to deposit amount"
                disabled={isWriting}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-brand-amber dark:text-[#D4AF37]">
              {activeModal === 'deposit' ? 'Deposit Capital' : 'Withdraw Funds'}
            </p>
            <h2 className="mt-1 text-xl font-black text-brand-ink dark:text-white">
              {activeModal === 'deposit' ? 'Add Funds' : 'Request Withdrawal'}
            </h2>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-zinc-500 transition hover:text-brand-ink dark:border-white/10 dark:text-white/50 dark:hover:text-white"
            aria-label="Close modal"
            disabled={isWriting}
          >
            <X size={16} />
          </button>
        </div>

        {activeModal === 'deposit' ? (
          <form onSubmit={handleDeposit} className="scrollbar-none min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {depositStep === 1 && (
              <>
                <div className="rounded-xl border border-brand-border bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-xs text-zinc-500 dark:text-white/40">Current balance</p>
                  <p className="mt-1 text-2xl font-black text-brand-ink dark:text-white">{displayCurrency(balance)}</p>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Amount</span>
                  <input
                    value={depositAmount}
                    onChange={(event) => {
                      setDepositAmount(formatAmountInput(event.target.value));
                      setError(null);
                    }}
                    inputMode="decimal"
                    placeholder="Minimum: 1,000"
                    className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-[#D4AF37]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  />
                </label>
              </>
            )}

            {depositStep === 2 && (
              <>
                <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                  <div className="grid gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Account Name</p>
                      <p className="mt-1 text-sm font-bold text-brand-ink dark:text-white">{BANK_DETAILS.accountName}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Bank</p>
                        <p className="mt-1 text-sm font-bold text-brand-ink dark:text-white">{BANK_DETAILS.bankName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Account Type</p>
                        <p className="mt-1 text-sm font-bold text-brand-ink dark:text-white">{BANK_DETAILS.accountType}</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-[#B48924] dark:text-[#D4AF37]">Account Number</p>
                      <p className="mt-2 text-3xl font-black tracking-wide text-brand-ink dark:text-white">{BANK_DETAILS.accountNumber}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={copyAccountNumber}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37] px-4 py-3 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B]"
                  >
                    {copiedAccount ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    {copiedAccount ? 'Copied!' : 'Copy Account Number'}
                  </button>
                </div>

                <p className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-3 text-sm font-semibold leading-6 text-zinc-600 dark:text-white/65">
                  Transfer exactly {formatCurrency(parsedDepositAmount)} to the account above, then upload your payment proof below. Transaction reference is optional.
                </p>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Transaction Reference (Optional)</span>
                  <input
                    value={depositReference}
                    onChange={(event) => {
                      setDepositReference(event.target.value);
                      setError(null);
                    }}
                    placeholder="Enter bank transfer reference, if available"
                    className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-[#D4AF37]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Upload Payment Proof (Required)</span>
                  <span className="flex min-h-12 items-center gap-3 rounded-xl border border-brand-border bg-brand-ghost px-4 py-3 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
                    <FileUp size={17} className="shrink-0 text-[#D4AF37]" />
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(event) => {
                        setDepositProofFile(event.target.files?.[0] || null);
                        setError(null);
                      }}
                      className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[#D4AF37] file:px-3 file:py-1.5 file:text-xs file:font-black file:text-brand-ink"
                    />
                  </span>
                </label>
              </>
            )}

            {depositStep === 3 && (
              <div className="rounded-2xl border border-[#8BC34A]/30 bg-[#8BC34A]/10 p-5 text-center">
                <CheckCircle2 className="mx-auto text-[#8BC34A]" size={34} />
                <h3 className="mt-4 text-xl font-black text-brand-ink dark:text-white">Deposit request submitted</h3>
                <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-zinc-600 dark:text-white/65">
                  Your deposit request has been submitted. Our admin team will verify and credit your account within 24 hours.
                </p>
                <div className="mt-4 rounded-xl border border-brand-border bg-white px-3 py-3 text-left dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Transaction Reference</p>
                  <p className="mt-1 break-words text-sm font-bold text-brand-ink dark:text-white">{depositSubmittedReference}</p>
                </div>
              </div>
            )}

            {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">{toOptionalErrorMessage(error)}</p>}
            {depositStep === 1 && (
              <button
                type="button"
                onClick={handleDepositAmountContinue}
                disabled={isWriting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
              </button>
            )}
            {depositStep === 2 && (
              <button
                type="submit"
                disabled={isWriting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWriting && <Loader2 size={16} className="animate-spin" />}
                Submit for Approval
              </button>
            )}
            {depositStep === 3 && (
              <button
                type="button"
                onClick={resetAndClose}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B]"
              >
                Close
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleWithdrawal} className="scrollbar-none min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <div className="rounded-xl border border-brand-border bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs text-zinc-500 dark:text-white/40">Current balance</p>
              <p className="mt-1 text-2xl font-black text-brand-ink dark:text-white">{displayCurrency(balance)}</p>
            </div>
            <p className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-3 text-xs font-semibold leading-5 text-zinc-600 dark:text-white/55">
              You can withdraw up to 60% of your contributions once per quarter. Next eligible withdrawal: calculated based on your last withdrawal date.
            </p>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Withdrawal Amount</span>
              <input
                value={withdrawAmount}
                onChange={(event) => {
                  setWithdrawAmount(formatAmountInput(event.target.value));
                  setError(null);
                }}
                inputMode="decimal"
                placeholder="100,000"
                className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-[#D4AF37]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Account Name</span>
              <input
                required
                value={accountName}
                onChange={(event) => {
                  setAccountName(event.target.value);
                  setError(null);
                }}
                placeholder="Enter account holder name"
                className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-[#D4AF37]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Bank Name</span>
              <input
                value={bankName}
                onChange={(event) => {
                  setBankName(event.target.value);
                  setError(null);
                }}
                placeholder="Bank name"
                className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-[#D4AF37]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Account Number</span>
              <input
                value={accountNumber}
                onChange={(event) => {
                  setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 10));
                  setError(null);
                }}
                inputMode="numeric"
                placeholder="0123456789"
                className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-[#D4AF37]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
            <p className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-3 text-xs font-semibold leading-5 text-zinc-600 dark:text-white/55">
              Withdrawal requests are reviewed by admin within 2-3 business days.
            </p>
            {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">{toOptionalErrorMessage(error)}</p>}
            {success && <p className="rounded-xl border border-[#9DC03A]/20 bg-[#9DC03A]/10 px-3 py-2 text-sm font-semibold text-[#9DC03A]">{success}</p>}
            <button
              type="submit"
              disabled={isWriting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isWriting && <Loader2 size={16} className="animate-spin" />}
              Submit Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function NotificationPanel({
  notifications,
  unreadCount,
  onClose,
  onMarkAllRead,
  onMarkRead,
}: {
  notifications: NotificationRow[];
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (notification: NotificationRow) => void;
}) {
  function notificationIcon(notification: NotificationRow) {
    const type = (notification.type || '').toLowerCase();

    if (type.includes('approval') || type.includes('approved')) {
      return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#9DC03A]/25 bg-[#9DC03A]/10 text-[#9DC03A]">
          <CheckCircle2 size={17} />
        </span>
      );
    }

    if (type.includes('reject') || type.includes('declined')) {
      return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-500">
          <X size={17} />
        </span>
      );
    }

    if (type.includes('loan')) {
      return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
          <FileText size={17} />
        </span>
      );
    }

    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-500">
        <Bell size={17} />
      </span>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/75 px-4 py-4 backdrop-blur-xl">
      <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/95 font-sans shadow-2xl shadow-black/30 dark:bg-[#101010]/95">
        <div className="flex shrink-0 items-center justify-between border-b border-brand-border px-5 py-4 dark:border-white/10">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-brand-amber dark:text-[#D4AF37]">Notifications</p>
            <h2 className="mt-1 text-xl font-black text-brand-ink dark:text-white">Message Center</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-zinc-500 transition hover:text-brand-ink dark:border-white/10 dark:text-white/50 dark:hover:text-white"
            aria-label="Close notifications"
          >
            <X size={16} />
          </button>
        </div>

        <div className="scrollbar-none min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-zinc-500 dark:text-white/45">
              {unreadCount === 0 ? 'No unread notifications.' : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`}
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="shrink-0 rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-black text-[#B48924] transition hover:bg-[#D4AF37]/15 dark:text-[#D4AF37]"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-brand-border bg-brand-ghost px-4 py-8 text-center text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/40">
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => onMarkRead(notification)}
                  className={`block w-full rounded-2xl border px-4 py-3 text-left transition hover:border-[#D4AF37]/30 hover:bg-zinc-50 dark:hover:bg-white/[0.04] ${
                    notification.is_read
                      ? 'border-brand-border bg-white/70 dark:border-white/10 dark:bg-white/[0.03]'
                      : 'border-[#D4AF37]/25 border-l-4 bg-[#D4AF37]/10 dark:bg-[#D4AF37]/10'
                  }`}
                >
                  <div className="flex gap-3">
                    {notificationIcon(notification)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-black text-brand-ink dark:text-white">{notification.title}</p>
                        {!notification.is_read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#D4AF37]" />}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-white/45">{notification.message}</p>
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-white/30">
                        {formatNotificationTimestamp(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DashboardClientProps {
  devBypassActive?: boolean;
  initialProfile: ProfileRow | null;
  initialTransactions: TransactionRow[];
  initialTotalDeposited: number;
  initialInterestTotal: number;
  initialUserEmail: string;
  initialUserId: string;
}

export default function DashboardClient({
  initialProfile,
  initialTransactions,
  initialTotalDeposited,
  initialInterestTotal,
  initialUserEmail,
  initialUserId,
}: DashboardClientProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { incognito, maskValue } = useIncognito();
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showRoiCalculator, setShowRoiCalculator] = useState(false);
  const [depositPrefill, setDepositPrefill] = useState('');
  const [statementFromDate, setStatementFromDate] = useState(() => firstDayOfCurrentMonth());
  const [statementToDate, setStatementToDate] = useState(() => todayDateInput());
  const [profile, setProfile] = useState<ProfileRow | null>(initialProfile);
  const [transactions, setTransactions] = useState<TransactionRow[]>(initialTransactions);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [userId] = useState(initialUserId);
  const [userEmail] = useState(initialUserEmail);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const isPreviewMode = !userId;
  const activeProfile = profile || createPreviewProfile(0);
  const activeUserId = userId || activeProfile.user_id;
  const activeUserEmail = userEmail || activeProfile.email || '';
  const balance = parseMoney(activeProfile.balance);
  const displayCurrency = (value: number) => (incognito ? maskValue : formatCurrency(value));
  const computedTotalDeposited = transactions
    .filter((transaction) => transaction.type === 'deposit' && normalizeStatus(transaction.status) === 'success')
    .reduce((total, transaction) => total + Math.abs(parseMoney(transaction.amount)), 0);
  const totalDeposited = transactionsLoaded ? computedTotalDeposited : initialTotalDeposited;
  const totalInterest = initialInterestTotal;
  const interest = balance - totalDeposited;
  const netGrowth = totalDeposited > 0 ? (interest / totalDeposited) * 100 : 0;
  const statementGeneratedDate = formatStatementDate(new Date());
  const statementPeriod =
    statementFromDate && statementToDate
      ? `${formatStatementDate(`${statementFromDate}T00:00:00`)} to ${formatStatementDate(`${statementToDate}T00:00:00`)}`
      : 'Custom date range';
  const netGrowthToneClass =
    netGrowth > 0
      ? 'border-[#789E31]/25 bg-[#789E31]/10 text-[#789E31] dark:border-[#A8D63F]/35 dark:bg-[#A8D63F]/15 dark:text-[#B9F04A]'
      : netGrowth < 0
        ? 'border-red-500/20 bg-red-500/10 text-red-500 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300'
        : 'border-[#789E31]/25 bg-[#789E31]/10 text-[#789E31] dark:border-[#A8D63F]/40 dark:bg-[#A8D63F]/12 dark:text-[#C4FF52]';
  const statementTransactions = useMemo(
    () => filterStatementTransactions(transactions, statementFromDate, statementToDate),
    [statementFromDate, statementToDate, transactions]
  );
  const statementTotalDeposited = statementTransactions
    .filter((transaction) => transaction.type === 'deposit' && normalizeStatus(transaction.status) === 'success')
    .reduce((total, transaction) => total + Math.abs(parseMoney(transaction.amount)), 0);
  const statementTotalWithdrawn = statementTransactions
    .filter((transaction) => transaction.type === 'withdrawal' && normalizeStatus(transaction.status) === 'success')
    .reduce((total, transaction) => total + Math.abs(parseMoney(transaction.amount)), 0);
  const unreadNotificationCount = notifications.filter((notification) => !notification.is_read).length;

  useEffect(() => {
    setMounted(true);
    setTransactionsLoaded(true);
  }, []);

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('.dashboard-reveal'));
    if (revealItems.length === 0) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('dashboard-reveal-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('dashboard-reveal-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -4% 0px', threshold: 0.08 }
    );

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 8, 32)}ms`;
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, [loading, announcements.length, transactions.length]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    async function loadAnnouncements() {
      const now = new Date().toISOString();
      const { data, error: announcementError } = await supabase
        .from('announcements')
        .select('*')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(6);

      if (announcementError) {
        return;
      }

      const visibleAnnouncements = ((data || []) as AnnouncementRow[]).filter(
        (item) => window.localStorage.getItem(`smart-save-announcement-${item.id}`) !== 'dismissed'
      );
      setAnnouncements(visibleAnnouncements);
    }

    loadAnnouncements();
  }, []);

  function dismissAnnouncement(id: string) {
    window.localStorage.setItem(`smart-save-announcement-${id}`, 'dismissed');
    setAnnouncements((current) => current.filter((item) => item.id !== id));
  }

  function announcementCardClass(type?: string | null) {
    if (type === 'important') {
      return 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-200';
    }

    if (type === 'warning') {
      return 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-brand-ink dark:text-[#D4AF37]';
    }

    return 'border-sky-400/25 bg-sky-400/10 text-sky-700 dark:text-sky-200';
  }

  useEffect(() => {
    if (!userId) return;

    async function loadNotifications() {
      const { data, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (notificationError) {
        return;
      }

      setNotifications((data || []) as NotificationRow[]);
    }

    loadNotifications();

    const channel = supabase
      .channel(`dashboard-notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        loadNotifications
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function markNotificationAsRead(notification: NotificationRow) {
    if (!userId || notification.is_read) return;

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
      )
    );

    const { error: notificationError } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notification.id)
      .eq('user_id', userId);

    void notificationError;
  }

  async function markAllNotificationsRead() {
    if (!userId || unreadNotificationCount === 0) return;

    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true, read_at: readAt })));

    const { error: notificationError } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: readAt })
      .eq('user_id', userId)
      .eq('is_read', false);

    void notificationError;
  }

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`dashboard-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new) setProfile(payload.new as ProfileRow);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        async () => {
          setTransactionsLoaded(false);
          const { data, error: transactionError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!transactionError) setTransactions((data as TransactionRow[]) || []);
          setTransactionsLoaded(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function handleTransactionComplete(updatedProfile: ProfileRow | null, transaction: TransactionRow) {
    if (updatedProfile) setProfile(updatedProfile);
    setTransactions((current) => [transaction, ...current.filter((item) => item.id !== transaction.id)]);
  }

  function openDepositModal(amount?: number) {
    setNotificationOpen(false);
    setDepositPrefill(amount ? String(amount) : '');
    setActiveModal('deposit');
  }

  function handleCalculatorDeposit(amount: number) {
    setShowRoiCalculator(false);
    openDepositModal(amount);
  }

  async function handleLogout() {
    setActiveModal(null);
    setNotificationOpen(false);
    setShowRoiCalculator(false);
    await supabase.auth.signOut();
    router.push('/signin');
    router.refresh();
  }

  function downloadStatement() {
    try {
      const statement = document.getElementById('statement-print');
      if (!statement) {
        setToast('Unable to prepare statement. Please try again.');
        return;
      }

      setToast('Preparing statement...');
      window.print();
      setToast('Statement ready. Choose Save as PDF in the print dialog.');
    } catch {
      setToast('Unable to open statement. Please try again.');
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-alabaster font-sans text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
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
      <div className="absolute inset-0 brand-grid opacity-60 dark:opacity-100" aria-hidden="true" />
      <div
        className="absolute left-1/2 top-0 hidden h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.04] blur-3xl dark:block dark:opacity-[0.08]"
        style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, #0093D8 48%, transparent 72%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <nav className="dashboard-reveal mb-4 flex flex-col gap-2 md:mb-8 md:flex-row md:items-center md:justify-between md:gap-3 md:rounded-2xl md:border md:border-[var(--border-color)] md:bg-[var(--nav-bg)] md:p-4 md:shadow-[var(--nav-shadow)] md:backdrop-blur-xl md:dark:border-white/[0.08] md:dark:bg-white/[0.035] md:dark:shadow-none">
          <Link href="/" className="flex min-w-0 shrink items-center justify-center gap-3 px-3 py-2 md:justify-start md:p-0">
            <img
              src="/logo.png"
              alt="Smart Save Cooperative Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
              style={{ width: '40px', height: '40px', maxWidth: '40px', objectFit: 'contain' }}
            />
            <div>
              <p className="text-sm font-black leading-none">Smart Save</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-amber dark:text-[#D4AF37]">
                Cooperative
              </p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center justify-between gap-1.5 rounded-2xl border border-[var(--border-color)] bg-[var(--nav-bg)] p-2 shadow-[var(--nav-shadow)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-none md:justify-start md:gap-2 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none md:dark:bg-transparent">
            <div className="group relative">
              <button
                type="button"
                onClick={() => setShowRoiCalculator(true)}
                className="peer inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#0093D8]/28 bg-transparent text-[#5FB4E3] shadow-[0_5px_16px_rgba(139,109,56,0.16)] transition duration-200 ease-out hover:scale-105 hover:border-[#0093D8]/45 hover:shadow-[0_0_14px_rgba(0,147,216,0.22)] focus-visible:scale-105 focus-visible:border-[#0093D8]/45 focus-visible:outline-none focus-visible:shadow-[0_0_14px_rgba(0,147,216,0.22)] dark:border-[#0093D8]/30 dark:text-[#7BC8F2] dark:shadow-none md:h-10 md:w-10"
                aria-label="Open ROI calculator"
              >
                <Calculator size={16} strokeWidth={2} />
                <span className="sr-only">ROI Calculator</span>
              </button>
              <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 -translate-x-1/2 rounded-md border border-brand-border bg-white px-2 py-1 text-[10px] font-normal text-brand-ink opacity-0 shadow-xl shadow-zinc-900/10 transition group-hover:opacity-100 peer-focus-visible:opacity-100 dark:border-white/10 dark:bg-[#111] dark:text-white">
                ROI Calculator
              </span>
            </div>
            <div className="group relative md:hidden">
              <Link
                href="/dashboard/profile"
                className="peer inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-transparent text-[#C9A335] shadow-[0_5px_16px_rgba(139,109,56,0.16)] transition duration-200 ease-out hover:scale-105 hover:border-[#D4AF37]/48 hover:shadow-[0_0_14px_rgba(212,175,55,0.22)] focus-visible:scale-105 focus-visible:border-[#D4AF37]/48 focus-visible:outline-none focus-visible:shadow-[0_0_14px_rgba(212,175,55,0.22)] dark:border-[#D4AF37]/32 dark:bg-transparent dark:text-[#E8C762] dark:shadow-none md:h-10 md:w-10"
                aria-label="Open profile"
              >
                <UserRound size={16} strokeWidth={2} />
              </Link>
              <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 -translate-x-1/2 rounded-md border border-brand-border bg-white px-2 py-1 text-[10px] font-normal text-brand-ink opacity-0 shadow-xl shadow-zinc-900/10 transition group-hover:opacity-100 peer-focus-visible:opacity-100 dark:border-white/10 dark:bg-[#111] dark:text-white">
                Profile
              </span>
            </div>
            <div className="group relative">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setNotificationOpen((current) => !current);
                }}
                className="peer relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#A8D63F]/30 bg-transparent text-[#789E31] shadow-[0_5px_16px_rgba(139,109,56,0.16)] transition duration-200 ease-out hover:scale-105 hover:border-[#A8D63F]/44 hover:shadow-[0_0_12px_rgba(168,214,63,0.16)] focus-visible:scale-105 focus-visible:border-[#A8D63F]/44 focus-visible:outline-none focus-visible:shadow-[0_0_12px_rgba(168,214,63,0.16)] dark:border-[#A8D63F]/40 dark:text-[#9BC84D] dark:shadow-none md:h-10 md:w-10"
                aria-label="Open notifications"
              >
                <Bell size={16} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>
              <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 -translate-x-1/2 rounded-md border border-brand-border bg-white px-2 py-1 text-[10px] font-normal text-brand-ink opacity-0 shadow-xl shadow-zinc-900/10 transition group-hover:opacity-100 peer-focus-visible:opacity-100 dark:border-white/10 dark:bg-[#111] dark:text-white">
                Notification
              </span>
            </div>
            <div className="group relative">
              <Link
                href="/"
                className="peer inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#0093D8]/28 bg-transparent text-[#5FB4E3] shadow-[0_5px_16px_rgba(139,109,56,0.16)] transition duration-200 ease-out hover:scale-105 hover:border-[#0093D8]/45 hover:shadow-[0_0_14px_rgba(0,147,216,0.22)] focus-visible:scale-105 focus-visible:border-[#0093D8]/45 focus-visible:outline-none focus-visible:shadow-[0_0_14px_rgba(0,147,216,0.22)] dark:border-[#0093D8]/30 dark:text-[#7BC8F2] dark:shadow-none md:h-10 md:w-10"
                aria-label="Go to homepage"
              >
                <Home size={16} strokeWidth={2} />
                <span className="sr-only">Home</span>
              </Link>
              <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 -translate-x-1/2 rounded-md border border-brand-border bg-white px-2 py-1 text-[10px] font-normal text-brand-ink opacity-0 shadow-xl shadow-zinc-900/10 transition group-hover:opacity-100 peer-focus-visible:opacity-100 dark:border-white/10 dark:bg-[#111] dark:text-white">
                Home
              </span>
            </div>
            {mounted && (
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="peer inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-transparent text-[#C9A335] shadow-[0_5px_16px_rgba(139,109,56,0.16)] transition duration-200 ease-out hover:scale-105 hover:border-[#D4AF37]/48 hover:shadow-[0_0_14px_rgba(212,175,55,0.22)] focus-visible:scale-105 focus-visible:border-[#D4AF37]/48 focus-visible:outline-none focus-visible:shadow-[0_0_14px_rgba(212,175,55,0.22)] dark:border-[#D4AF37]/32 dark:text-[#E8C762] dark:shadow-none md:h-10 md:w-10"
                  aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                >
                  {isDark ? <Sun size={17} className="text-[#D4AF37]" /> : <Moon size={17} />}
                </button>
                <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 -translate-x-1/2 rounded-md border border-brand-border bg-white px-2 py-1 text-[10px] font-normal text-brand-ink opacity-0 shadow-xl shadow-zinc-900/10 transition group-hover:opacity-100 peer-focus-visible:opacity-100 dark:border-white/10 dark:bg-[#111] dark:text-white">
                  Theme
                </span>
              </div>
            )}
            <div className="group relative">
              <button
                type="button"
                onClick={handleLogout}
                className="peer inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/24 bg-red-500/8 text-red-400 shadow-[0_5px_16px_rgba(139,109,56,0.16)] transition duration-200 ease-out hover:scale-105 hover:border-red-500/42 hover:bg-red-500/90 hover:text-white hover:shadow-[0_0_14px_rgba(239,68,68,0.22)] focus-visible:scale-105 focus-visible:border-red-500/42 focus-visible:outline-none focus-visible:shadow-[0_0_14px_rgba(239,68,68,0.22)] dark:border-red-400/25 dark:bg-red-400/8 dark:text-red-300 dark:shadow-none dark:hover:bg-red-500 dark:hover:text-white md:h-10 md:w-10"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
              <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 -translate-x-1/2 rounded-md border border-brand-border bg-white px-2 py-1 text-[10px] font-normal text-brand-ink opacity-0 shadow-xl shadow-zinc-900/10 transition group-hover:opacity-100 peer-focus-visible:opacity-100 dark:border-white/10 dark:bg-[#111] dark:text-white">
                Logout
              </span>
            </div>
          </div>
        </nav>

        {loading ? (
          <section className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
              <p className="text-sm font-semibold text-zinc-500 dark:text-white/45">Loading live cooperative ledger...</p>
            </div>
          </section>
        ) : (
          <>
            {incognito && (
              <div className="dashboard-reveal mb-4 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-xs font-bold text-[#D4AF37] md:mb-6">
                Incognito mode on â€” balances hidden
              </div>
            )}

            {announcements.length > 0 && (
              <section className="dashboard-reveal mb-4 rounded-2xl border border-brand-border bg-brand-ghost p-4 shadow-xl shadow-zinc-900/[0.03] dark:border-white/[0.08] dark:bg-white/[0.035] md:mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#D4AF37]" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-brand-amber dark:text-[#D4AF37]">
                    Announcements
                  </h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {announcements.map((announcement) => (
                    <article
                      key={announcement.id}
                      className={`flex min-h-[116px] flex-col justify-between gap-4 rounded-2xl border px-4 py-4 text-sm ${announcementCardClass(announcement.type)}`}
                    >
                      <div className="flex gap-3">
                        <Bell className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                          <p className="font-black">{announcement.title}</p>
                          <p className="mt-1 text-xs leading-5 opacity-80">{announcement.body}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-black uppercase tracking-widest opacity-65">
                          {new Date(announcement.created_at).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <button
                          type="button"
                          onClick={() => dismissAnnouncement(announcement.id)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20"
                          aria-label="Dismiss announcement"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {error && (
              <div className="dashboard-reveal mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500 md:mb-6">
                {toOptionalErrorMessage(error)}
              </div>
            )}

            <section className="mx-auto grid max-w-6xl gap-3 md:gap-6 lg:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)] lg:items-stretch">
              <div className="dashboard-reveal relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[#FFFFFF] px-4 py-4 shadow-2xl shadow-zinc-900/[0.04] dark:border-white/[0.08] dark:bg-white/[0.035] md:p-6">
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border border-[#D4AF37]/34 bg-[radial-gradient(circle_at_35%_35%,rgba(212,175,55,0.28)_0%,rgba(212,175,55,0.14)_44%,rgba(212,175,55,0.02)_74%)] shadow-[0_0_46px_rgba(212,175,55,0.18)] dark:hidden"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute -right-12 -top-12 hidden h-44 w-44 rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] dark:block"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-l from-[#D4AF37]/25 to-transparent"
                  aria-hidden="true"
                />
                <div className="relative flex h-full min-h-[150px] flex-col justify-between gap-4 md:min-h-[250px] md:gap-8">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] dark:text-white/40">
                      Total Balance
                    </p>
                    <Link href="/dashboard/profile" className="hidden shrink-0 items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 transition hover:border-[#D4AF37]/40 dark:border-white/10 dark:bg-white/[0.04] md:inline-flex">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                        <UserRound size={18} strokeWidth={2.2} />
                      </div>
                      <p className="text-sm font-black text-brand-amber dark:text-[#D4AF37]">Profile</p>
                    </Link>
                  </div>

                  <div className="flex flex-1 flex-col justify-center">
                    <h1 className={`overflow-hidden text-ellipsis whitespace-nowrap font-black tracking-tight text-[var(--text-primary)] dark:text-white sm:text-5xl xl:text-6xl ${getAmountFontSize(balance)}`}>{displayCurrency(balance)}</h1>
                    <div className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black sm:w-fit sm:justify-start md:mt-4 md:gap-2 md:px-3 md:py-1.5 md:text-sm ${netGrowthToneClass}`}>
                      <TrendingUp className="h-3.5 w-3.5 md:h-[15px] md:w-[15px]" />
                      {netGrowth > 0 ? '+' : ''}
                      {netGrowth.toFixed(2)}% net ledger growth
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button
                  onClick={() => openDepositModal()}
                  className="dashboard-reveal group flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[#FFFFFF] p-3 text-center shadow-[var(--shadow-card)] [transition:all_0.2s_ease] hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:shadow-[var(--shadow-card-hover)] dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-xl dark:shadow-zinc-900/[0.03] md:min-h-[120px] md:items-start md:justify-between md:p-5 md:text-left"
                >
                  <ArrowDownToLine className="h-6 w-6 text-[var(--gold-accent)]" />
                  <div>
                    <p className="text-sm font-black md:text-lg">Deposit</p>
                    <p className="mt-1 hidden text-sm text-zinc-500 dark:text-white/40 md:block">Add funds to your cooperative account</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setNotificationOpen(false);
                    setActiveModal('withdraw');
                  }}
                  className="dashboard-reveal group flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[#FFFFFF] p-3 text-center shadow-[var(--shadow-card)] [transition:all_0.2s_ease] hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:shadow-[var(--shadow-card-hover)] dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-xl dark:shadow-zinc-900/[0.03] md:min-h-[120px] md:items-start md:justify-between md:p-5 md:text-left"
                >
                  <ArrowUpRight className="h-6 w-6 text-[var(--gold-accent)]" />
                  <p className="text-sm font-black md:hidden">Withdraw</p>
                  <div className="hidden md:block">
                    <p className="text-sm font-black md:text-lg">Withdraw</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-white/40">Request a withdrawal — admin approved</p>
                  </div>
                </button>
                <Link
                  href="/dashboard/investments"
                  className="dashboard-reveal group flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[#FFFFFF] p-3 text-center shadow-[var(--shadow-card)] [transition:all_0.2s_ease] hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:shadow-[var(--shadow-card-hover)] dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-xl dark:shadow-zinc-900/[0.03] md:min-h-[120px] md:items-start md:justify-between md:p-5 md:text-left"
                >
                  <TrendingUp className="h-6 w-6 text-[var(--gold-accent)]" />
                  <div>
                    <p className="text-sm font-black md:text-lg">Investments</p>
                    <p className="mt-1 hidden text-sm text-zinc-500 dark:text-white/40 md:block">Grow your capital with Smart Save</p>
                  </div>
                </Link>
                <Link
                  href="/dashboard/loans"
                  className="dashboard-reveal group flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[#FFFFFF] p-3 text-center shadow-[var(--shadow-card)] [transition:all_0.2s_ease] hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:shadow-[var(--shadow-card-hover)] dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-xl dark:shadow-zinc-900/[0.03] md:min-h-[120px] md:items-start md:justify-between md:p-5 md:text-left"
                >
                  <Banknote className="h-6 w-6 text-[var(--gold-accent)]" />
                  <div>
                    <p className="text-sm font-black md:text-lg">Loans</p>
                    <p className="mt-1 hidden text-sm text-zinc-500 dark:text-white/40 md:block">Access financing when you need it</p>
                  </div>
                </Link>
              </div>
            </section>

            <section className="dashboard-reveal mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-5 shadow-2xl shadow-zinc-900/[0.04] dark:border-white/[0.08] dark:bg-[#101010] md:mt-6">
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--gold-text)] dark:text-[#D4AF37]">
                  Account Overview
                </p>
                <h2 className="mt-1 text-2xl font-black text-[var(--text-primary)] dark:text-white">Contribution summary</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="dashboard-reveal overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[#FFFFFF] p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Total Deposited</p>
                  <p className={`mt-3 whitespace-nowrap text-xl font-bold text-brand-amber dark:text-[#D4AF37] sm:text-2xl ${getAmountFontSize(totalDeposited).includes('text-lg') ? 'text-lg' : getAmountFontSize(totalDeposited).includes('text-xl') ? 'text-xl' : ''}`}>
                    {displayCurrency(totalDeposited)}
                  </p>
                </div>
                <div className="dashboard-reveal overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[#FFFFFF] p-4 dark:border-[#9DC03A]/20 dark:bg-[#9DC03A]/10">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#9DC03A]">Interest / Dividends</p>
                  <p className={`mt-3 whitespace-nowrap text-xl font-bold text-[#9DC03A] sm:text-2xl ${getAmountFontSize(totalInterest).includes('text-lg') ? 'text-lg' : getAmountFontSize(totalInterest).includes('text-xl') ? 'text-xl' : ''}`}>
                    {displayCurrency(totalInterest)}
                  </p>
                </div>
                <div className="dashboard-reveal rounded-2xl border border-[var(--border-color)] bg-[#FFFFFF] p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Member Since</p>
                  <p className="mt-3 text-lg font-black text-brand-ink dark:text-white sm:text-xl">
                    {formatMemberSince(activeProfile.created_at)}
                  </p>
                </div>
                <div className="dashboard-reveal rounded-2xl border border-[var(--border-color)] bg-[#FFFFFF] p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">Next Contribution</p>
                  <Link href="/contact" className="mt-3 inline-flex text-lg font-black text-brand-amber transition hover:text-[#D4AF37] hover:underline dark:text-[#D4AF37] dark:hover:text-[#F5D06B] sm:text-xl">
                    Contact Admin
                  </Link>
                </div>
              </div>
            </section>
            <section className="dashboard-reveal mt-4 rounded-2xl border border-brand-border bg-brand-ghost shadow-2xl shadow-zinc-900/[0.04] dark:border-white/[0.08] dark:bg-white/[0.035] md:mt-6">
              <div className="flex flex-col gap-4 border-b border-brand-border p-5 dark:border-white/[0.08] lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-brand-amber dark:text-[#D4AF37]">
                    Account History
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Recent Transactions</h2>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-[9rem_9rem_minmax(13rem,16rem)]">
                  <label className="flex min-w-0 flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">From</span>
                    <input
                      type="date"
                      value={statementFromDate}
                      onChange={(event) => setStatementFromDate(event.target.value)}
                      className="h-10 rounded-xl border border-brand-border bg-brand-ghost px-3 text-xs font-bold text-brand-ink outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-[#D4AF37]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                    />
                  </label>
                  <label className="flex min-w-0 flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">To</span>
                    <input
                      type="date"
                      value={statementToDate}
                      onChange={(event) => setStatementToDate(event.target.value)}
                      className="h-10 rounded-xl border border-brand-border bg-brand-ghost px-3 text-xs font-bold text-brand-ink outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-[#D4AF37]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={downloadStatement}
                    disabled={statementTransactions.length === 0}
                    className="col-span-2 inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-3 text-sm font-black text-[#1A1410] shadow-[0_8px_18px_rgba(212,175,55,0.22)] transition hover:bg-[#C4A030] disabled:cursor-not-allowed disabled:opacity-100 dark:text-brand-ink dark:shadow-none dark:disabled:opacity-50 sm:col-span-1 sm:mt-5 sm:w-full sm:px-4"
                  >
                    <Download size={16} />
                    Download Statement (PDF)
                  </button>
                </div>
              </div>

              {statementTransactions.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
                  <Wallet className="h-9 w-9 text-[#D4AF37]" />
                  <h3 className="mt-4 text-xl font-black">No transactions yet</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500 dark:text-white/45">
                    No transactions were found for the selected statement period.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-b border-brand-border text-xs uppercase tracking-widest text-zinc-500 dark:border-white/[0.08] dark:text-white/35">
                        <th className="px-5 py-4 font-bold">Date</th>
                        <th className="px-5 py-4 font-bold">Description</th>
                        <th className="px-5 py-4 font-bold">Status</th>
                        <th className="px-5 py-4 text-right font-bold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementTransactions.map((transaction) => {
                        const signedAmount = signedTransactionAmount(transaction);
                        return (
                          <tr
                            key={transaction.id}
                            className="border-b border-zinc-100 transition hover:bg-zinc-50 dark:border-white/[0.05] dark:hover:bg-white/[0.03]"
                          >
                            <td className="px-5 py-4 text-sm font-semibold text-zinc-500 dark:text-white/45">
                              {new Date(transaction.created_at).toLocaleDateString('en-NG', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-bold">{transaction.description || transaction.type}</p>
                              <p className="mt-1 text-xs text-zinc-400">{transaction.reference || transaction.id}</p>
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={transaction.status} />
                            </td>
                            <td
                              className={`px-5 py-4 text-right text-sm font-black ${
                                normalizeStatus(transaction.status) === 'failed'
                                  ? 'text-red-400 line-through opacity-70'
                                  : signedAmount >= 0
                                    ? 'text-brand-emerald dark:text-[#9DC03A]'
                                    : 'text-brand-ink dark:text-white'
                              }`}
                            >
                              {signedAmount > 0 ? '+' : ''}
                              {displayCurrency(signedAmount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <div id="statement-print" aria-hidden="true">
        <div className="statement-page">
          <header className="statement-header">
            <div className="statement-brand">
              <p className="statement-brand-name">Smart Save</p>
              <p className="statement-brand-subtitle">COOPERATIVE</p>
            </div>
            <div className="statement-divider" />
            <h1>Member Account Statement</h1>
            <div className="statement-meta">
              <p>
                <strong>Generated:</strong> {statementGeneratedDate}
              </p>
              <p>
                <strong>Member:</strong> {activeProfile.full_name || 'Smart Save Member'}
              </p>
              <p>
                <strong>Email:</strong> {activeUserEmail || activeProfile.email || 'Not available'}
              </p>
              <p>
                <strong>Statement Period:</strong> {statementPeriod}
              </p>
            </div>
          </header>

          <table className="statement-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {statementTransactions.map((transaction) => (
                <tr key={`statement-${transaction.id}`}>
                  <td>{formatStatementDate(transaction.created_at)}</td>
                  <td>{transaction.description || transaction.reference || transaction.id}</td>
                  <td>{formatTransactionType(transaction.type)}</td>
                  <td>{formatCurrency(signedTransactionAmount(transaction))}</td>
                  <td>{formatTransactionType(normalizeStatus(transaction.status))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <section className="statement-summary">
            <div>
              <p>Total Deposited</p>
              <strong>{formatCurrency(statementTotalDeposited)}</strong>
            </div>
            <div>
              <p>Total Withdrawn</p>
              <strong>{formatCurrency(statementTotalWithdrawn)}</strong>
            </div>
            <div>
              <p>Current Balance</p>
              <strong>{formatCurrency(balance)}</strong>
            </div>
          </section>

          <footer className="statement-footer">
            <p>Smart Save Cooperative Society</p>
            <p>smartsavecooperative@gmail.com</p>
            <p>Account: {BANK_DETAILS.accountNumber} | {BANK_DETAILS.bankName}</p>
            <p>This statement was generated on {statementGeneratedDate} and is for informational purposes only.</p>
          </footer>
        </div>
      </div>

      <DashboardModal
        activeModal={activeModal}
        balance={balance}
        userId={activeUserId}
        userEmail={activeUserEmail}
        userFullName={activeProfile.full_name || 'Smart Save Member'}
        isPreviewMode={isPreviewMode}
        initialDepositAmount={depositPrefill}
        onClose={() => setActiveModal(null)}
        onTransactionComplete={handleTransactionComplete}
        onToast={setToast}
      />
      {notificationOpen && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadNotificationCount}
          onClose={() => setNotificationOpen(false)}
          onMarkAllRead={markAllNotificationsRead}
          onMarkRead={markNotificationAsRead}
        />
      )}
      {showRoiCalculator && (
        <RoiCalculatorModal
          onClose={() => setShowRoiCalculator(false)}
          onDepositNow={handleCalculatorDeposit}
        />
      )}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-full border border-[#D4AF37]/25 bg-[#111111] px-4 py-2 text-xs font-bold text-[#D4AF37] shadow-2xl">
          {toast}
        </div>
      )}
      {!activeModal && !notificationOpen && !showRoiCalculator && <FaqChatWidget />}
      <style jsx global>{`
        #statement-print {
          position: fixed;
          left: -9999px;
          top: 0;
          width: 210mm;
          background: #ffffff;
          color: #111111;
          pointer-events: none;
        }

        .statement-page {
          min-height: 297mm;
          border: 1.5px solid #d4af37;
          padding: 28px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .statement-header {
          text-align: center;
        }

        .statement-brand-name {
          margin: 0;
          color: #d4af37;
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
        }

        .statement-brand-subtitle {
          margin: 4px 0 0;
          color: #111111;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.22em;
        }

        .statement-divider {
          height: 2px;
          margin: 18px 0;
          background: #d4af37;
        }

        .statement-header h1 {
          margin: 0;
          color: #111111;
          font-size: 24px;
          font-weight: 800;
        }

        .statement-meta {
          margin-top: 14px;
          display: grid;
          gap: 4px;
          color: #333333;
          font-size: 12px;
          text-align: left;
        }

        .statement-meta p,
        .statement-summary p,
        .statement-footer p {
          margin: 0;
        }

        .statement-table {
          width: 100%;
          margin-top: 24px;
          border-collapse: collapse;
          font-size: 11px;
        }

        .statement-table th {
          border: 1px solid #d4af37;
          background: #d4af37;
          color: #111111;
          padding: 9px 8px;
          text-align: left;
          font-weight: 800;
        }

        .statement-table td {
          border: 1px solid #e5e5e5;
          padding: 8px;
          vertical-align: top;
        }

        .statement-table tbody tr:nth-child(even) {
          background: #f8f4e8;
        }

        .statement-summary {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .statement-summary div {
          border: 1px solid #d4af37;
          padding: 12px;
          background: #fffaf0;
        }

        .statement-summary p {
          color: #555555;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .statement-summary strong {
          display: block;
          margin-top: 6px;
          color: #111111;
          font-size: 15px;
        }

        .statement-footer {
          margin-top: 28px;
          border-top: 1px solid #d4af37;
          padding-top: 14px;
          color: #444444;
          font-size: 11px;
          line-height: 1.7;
          text-align: center;
        }

        .dashboard-reveal {
          opacity: 0;
          transform: translate3d(0, 6px, 0);
          transition:
            opacity 260ms ease-out,
            transform 260ms ease-out;
          will-change: opacity, transform;
        }

        .dashboard-reveal-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }

        @media print {
          body * {
            visibility: hidden;
          }

          #statement-print,
          #statement-print * {
            visibility: visible;
          }

          #statement-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            pointer-events: auto;
          }

          @page {
            margin: 12mm;
          }
        }
      `}</style>
    </main>
  );
}




