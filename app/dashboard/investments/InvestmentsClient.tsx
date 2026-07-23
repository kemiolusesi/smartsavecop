'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Copy, FileUp, Send } from 'lucide-react';
import { toOptionalErrorMessage } from '@/lib/error-message';
import { parseError } from '@/lib/parseError';
import { supabase } from '@/utils/supabase/client';

export interface ApplicationProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export type InvestmentApplicationRow = {
  id: string;
  investment_type: string | null;
  amount: number | string | null;
  status: string | null;
  start_date?: string | null;
  maturity_date?: string | null;
  agreed_return_rate?: number | string | null;
  total_return_amount?: number | string | null;
  tenure_months?: number | string | null;
  target_goal?: string | null;
  created_at?: string | null;
};

type InvestmentTab = 'Fixed Investment' | 'Monthly Savings';
type FixedTerm = 6 | 12;
const MAX_PAYMENT_PROOF_SIZE = 5 * 1024 * 1024;
const PAYMENT_PROOF_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export type InvestmentProductRow = {
  id: string;
  name: string;
  description: string | null;
  product_type: 'fixed' | 'savings' | string | null;
  min_amount: number | string | null;
  max_amount: number | string | null;
  monthly_rate: number | string | null;
  total_return_rate: number | string | null;
  tenure_months: number | string | null;
  payout_interval_months: number | string | null;
  is_active: boolean | null;
  sort_order: number | string | null;
};

function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('en-NG').format(Number(digits));
}

function formatCurrency(value: unknown) {
  return formatAmount(parseMoney(value));
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getAmountFontSize(amount: number): string {
  const len = Math.floor(Math.abs(amount)).toString().length;
  if (len >= 12) return 'text-lg font-bold';
  if (len >= 8) return 'text-xl font-bold';
  return 'text-2xl font-bold';
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPercent(rate: number) {
  return `${(rate * 100).toFixed(1).replace('.0', '')}%`;
}

function productHasRate(product: InvestmentProductRow) {
  const monthlyRate = product.monthly_rate !== null && product.monthly_rate !== undefined ? Number(product.monthly_rate) : 0;
  const totalReturnRate = product.total_return_rate !== null && product.total_return_rate !== undefined ? Number(product.total_return_rate) : 0;
  return monthlyRate > 0 || totalReturnRate > 0;
}

function productRateText(product: InvestmentProductRow) {
  if (product.monthly_rate !== null && product.monthly_rate !== undefined && Number(product.monthly_rate) > 0) {
    return `${formatPercent(Number(product.monthly_rate))} per month`;
  }

  if (product.total_return_rate !== null && product.total_return_rate !== undefined && Number(product.total_return_rate) > 0) {
    return `${formatPercent(Number(product.total_return_rate))} total return`;
  }

  return '';
}

function productTypeLabel(product: InvestmentProductRow) {
  return product.product_type === 'fixed' ? 'Fixed' : 'Savings';
}

function investmentStatusBadge(status?: string | null) {
  const value = String(status || 'pending').toLowerCase();
  const className =
    value === 'active' || value === 'approved'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-500 dark:text-emerald-300'
      : value === 'matured'
        ? 'border-[#D4AF37]/30 bg-[#D4AF37]/15 text-[#D4AF37]'
        : value === 'rejected'
          ? 'border-red-500/25 bg-red-500/10 text-red-500 dark:text-red-300'
          : 'border-amber-400/25 bg-amber-400/10 text-amber-500 dark:text-amber-300';

  const label = value === 'approved' || value === 'active' ? 'Approved - Active' : value === 'pending' ? 'Pending Review' : value || 'Pending Review';
  return <span className={`inline-flex max-w-[5.75rem] items-center justify-center rounded-full border px-2 py-1 text-center text-xs font-black capitalize leading-tight ${className}`}>{label}</span>;
}

function progressForInvestment(investment: InvestmentApplicationRow) {
  const product = String(investment.investment_type || '').toLowerCase();
  if (!product.includes('fixed deposit') && !product.includes('target savings')) return null;
  if (!investment.start_date || !investment.maturity_date) return null;

  const start = new Date(investment.start_date).getTime();
  const maturity = new Date(investment.maturity_date).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(maturity) || maturity <= start) return null;

  return Math.min(100, Math.max(0, ((now - start) / (maturity - start)) * 100));
}

export default function InvestmentsClient({
  profile,
  initialInvestmentApplications = [],
  activeInvestmentProducts = [],
}: {
  devBypassActive: boolean;
  profile: ApplicationProfile;
  initialInvestmentApplications?: InvestmentApplicationRow[];
  activeInvestmentProducts?: InvestmentProductRow[];
}) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<InvestmentTab>('Fixed Investment');
  const [fixedAmount, setFixedAmount] = useState('500,000');
  const [fixedTerm, setFixedTerm] = useState<FixedTerm>(12);
  const [monthlyContribution, setMonthlyContribution] = useState('50,000');
  const [selectedSavingsPlanId, setSelectedSavingsPlanId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<InvestmentProductRow | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [amountPaid, setAmountPaid] = useState('500000');
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState<File | null>(null);
  const [proofOfPaymentUrl, setProofOfPaymentUrl] = useState('');
  const [accountCopied, setAccountCopied] = useState(false);
  const [openPlanIds, setOpenPlanIds] = useState<string[]>([]);
  const [openHistoryIds, setOpenHistoryIds] = useState<string[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const catalogSectionRef = useRef<HTMLElement | null>(null);
  const applicationSectionRef = useRef<HTMLElement | null>(null);

  const applyableProducts = useMemo(
    () => activeInvestmentProducts.filter((product) => productHasRate(product)),
    [activeInvestmentProducts]
  );
  const infoOnlyProducts = useMemo(
    () => activeInvestmentProducts.filter((product) => !productHasRate(product)),
    [activeInvestmentProducts]
  );
  const fixedPlans = useMemo(
    () => applyableProducts.filter((product) => product.product_type === 'fixed'),
    [applyableProducts]
  );
  const savingsPlans = useMemo(
    () => applyableProducts.filter((product) => product.product_type === 'savings'),
    [applyableProducts]
  );
  const availableTabs = useMemo(
    () =>
      [
        fixedPlans.length > 0 ? 'Fixed Investment' : null,
        savingsPlans.length > 0 ? 'Monthly Savings' : null,
      ].filter(Boolean) as InvestmentTab[],
    [fixedPlans.length, savingsPlans.length]
  );
  const fixedPrincipal = parseMoney(fixedAmount);
  const monthlyAmount = parseMoney(monthlyContribution);
  const detectedFixedPlan =
    fixedPlans.find((plan) => {
      const min = parseMoney(plan.min_amount);
      const max = parseMoney(plan.max_amount);
      return fixedPrincipal >= min && (max <= 0 || fixedPrincipal <= max);
    }) || null;
  const selectedSavingsPlan = savingsPlans.find((plan) => plan.id === selectedSavingsPlanId) || savingsPlans[0] || null;
  const fixedMonthlyRate = detectedFixedPlan ? Number(detectedFixedPlan.monthly_rate || 0) : 0;
  const fixedPayoutIntervalMonths = detectedFixedPlan ? Number(detectedFixedPlan.payout_interval_months || 0) : 0;
  const fixedQuarterlyInterest = fixedPrincipal * fixedMonthlyRate * fixedPayoutIntervalMonths;
  const fixedTotalPayout = fixedPrincipal + fixedPrincipal * fixedMonthlyRate * fixedTerm;
  const savingsDurationMonths = selectedSavingsPlan ? Number(selectedSavingsPlan.tenure_months || 0) : 0;
  const savingsReturnRate = selectedSavingsPlan ? Number(selectedSavingsPlan.total_return_rate || 0) : 0;
  const savingsPayoutMonth = selectedSavingsPlan ? Number(selectedSavingsPlan.payout_interval_months || 0) : 0;
  const savingsTotalContributed = monthlyAmount * savingsDurationMonths;
  const savingsPayout = savingsTotalContributed * (1 + savingsReturnRate);

  useEffect(() => {
    const updateViewport = () => setIsDesktop(window.innerWidth >= 768);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    setOpenPlanIds((current) => current.filter((id) => activeInvestmentProducts.some((product) => product.id === id)));
  }, [activeInvestmentProducts, isDesktop]);

  useEffect(() => {
    if (availableTabs.length === 0) return;
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, availableTabs]);

  useEffect(() => {
    const nextAmount = activeTab === 'Fixed Investment' ? fixedPrincipal : monthlyAmount;
    setAmountPaid(nextAmount > 0 ? formatAmountInput(String(nextAmount)) : '');
  }, [activeTab, fixedPrincipal, monthlyAmount]);

  function selectCatalogPlan(plan: InvestmentProductRow) {
    setSelectedPlan(plan);
    if (plan.product_type === 'fixed') {
      setActiveTab('Fixed Investment');
      setFixedAmount(formatAmountInput(String(parseMoney(plan.min_amount))));
    } else {
      setActiveTab('Monthly Savings');
      setSelectedSavingsPlanId(plan.id);
    }

    setError('');
    window.setTimeout(() => {
      applicationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function changePlan() {
    setSelectedPlan(null);
    window.setTimeout(() => {
      catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function togglePlan(planId: string) {
    setOpenPlanIds((current) => {
      const open = current.includes(planId);
      if (isDesktop) return open ? current.filter((id) => id !== planId) : [...current, planId];
      return open ? [] : [planId];
    });
  }

  function toggleHistory(investmentId: string) {
    setOpenHistoryIds((current) => {
      const open = current.includes(investmentId);
      return open ? current.filter((id) => id !== investmentId) : [...current, investmentId];
    });
  }

  function handlePaymentProofChange(file: File | null) {
    setProofOfPaymentUrl('');
    if (!file) {
      setProofOfPaymentFile(null);
      return;
    }

    if (!PAYMENT_PROOF_TYPES.includes(file.type)) {
      setProofOfPaymentFile(null);
      setError('Please upload a JPG, PNG, or PDF receipt.');
      return;
    }

    if (file.size > MAX_PAYMENT_PROOF_SIZE) {
      setProofOfPaymentFile(null);
      setError('Please upload a receipt that is 5MB or smaller.');
      return;
    }

    setError('');
    setProofOfPaymentFile(file);
  }

  async function copyInvestmentAccountNumber() {
    await navigator.clipboard.writeText('0079404511');
    setAccountCopied(true);
    window.setTimeout(() => setAccountCopied(false), 1600);
  }

  async function uploadInvestmentProof() {
    if (proofOfPaymentUrl) return proofOfPaymentUrl;
    if (!proofOfPaymentFile) return '';

    const safeFileName = proofOfPaymentFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filePath = `${profile.user_id}/investment/${Date.now()}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, proofOfPaymentFile, { upsert: false, contentType: proofOfPaymentFile.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);
    setProofOfPaymentUrl(data.publicUrl);
    return data.publicUrl;
  }

  const applicationPayload = useMemo(() => {
    if (activeTab === 'Fixed Investment') {
      return {
        fullName: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        product: detectedFixedPlan?.name || 'Fixed Investment',
        productType: 'fixed',
        planName: detectedFixedPlan?.name || '',
        plan_name: selectedPlan?.name || detectedFixedPlan?.name || '',
        product_name: selectedPlan?.name || detectedFixedPlan?.name || '',
        investment_product_id: selectedPlan?.id || detectedFixedPlan?.id || '',
        source: 'Dashboard',
        lumpSumAmount: fixedAmount,
        preferredTenureMonths: String(fixedTerm),
      };
    }

    return {
      fullName: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      product: selectedSavingsPlan?.name || 'Monthly Savings',
      productType: 'savings',
      planName: selectedSavingsPlan?.name || '',
      plan_name: selectedPlan?.name || selectedSavingsPlan?.name || '',
      product_name: selectedPlan?.name || selectedSavingsPlan?.name || '',
      investment_product_id: selectedPlan?.id || selectedSavingsPlan?.id || '',
      source: 'Dashboard',
      monthlyContribution,
      preferredPlan: selectedSavingsPlan?.name || 'Monthly savings',
      preferredDurationMonths: String(savingsDurationMonths),
    };
  }, [activeTab, detectedFixedPlan?.id, detectedFixedPlan?.name, fixedAmount, fixedTerm, monthlyContribution, profile.email, profile.full_name, profile.phone, savingsDurationMonths, selectedPlan?.id, selectedPlan?.name, selectedSavingsPlan?.id, selectedSavingsPlan?.name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (activeTab === 'Fixed Investment' && !detectedFixedPlan) {
        throw new Error('This amount does not match any available investment plan.');
      }
      if (activeTab === 'Monthly Savings' && !selectedSavingsPlan) {
        throw new Error('No savings plans are currently available. Check back soon.');
      }
      if (!proofOfPaymentFile && !proofOfPaymentUrl || parseMoney(amountPaid) <= 0) {
        throw new Error('Please upload your transfer receipt and enter the amount paid before submitting.');
      }

      const uploadedProofUrl = await uploadInvestmentProof();
      if (!uploadedProofUrl || parseMoney(amountPaid) <= 0) {
        throw new Error('Please upload your transfer receipt and enter the amount paid before submitting.');
      }

      const response = await fetch('/api/applications/investment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...applicationPayload,
          proof_of_payment_url: uploadedProofUrl,
          payment_reference: paymentReference.trim(),
          amount_paid: amountPaid,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload?.error || 'Unable to submit investment application.');
      setSubmitted(true);
      setFixedAmount('500,000');
      setFixedTerm(12);
      setMonthlyContribution('50,000');
      setPaymentReference('');
      setAmountPaid('500000');
      setProofOfPaymentFile(null);
      setProofOfPaymentUrl('');
    } catch (err) {
      setError(parseError(err));
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-3xl font-black tracking-tight">Investment Plans</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-white/45">Choose a plan that works for your goals</p>
          </div>
        </header>

        <section className="rounded-3xl border border-[#E0D5C5] bg-[#FDFAF5] p-5 shadow-[0_4px_18px_rgba(139,109,56,0.10)] dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-xl dark:shadow-zinc-900/[0.03] md:p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">My Investment Applications</p>
          <h2 className="mt-1 text-2xl font-black">Application history</h2>
          {initialInvestmentApplications.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-[#E0D5C5] bg-[#FFF9EF] p-4 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/45">
              No investment applications yet. Start investing below.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {initialInvestmentApplications.map((investment) => {
                const progress = progressForInvestment(investment);
                const matured = String(investment.status || '').toLowerCase() === 'matured';
                const open = openHistoryIds.includes(investment.id);

                return (
                  <article key={investment.id} className="overflow-hidden rounded-2xl border border-[#E0D5C5] bg-[#FFF9EF] shadow-[0_3px_12px_rgba(139,109,56,0.08)] dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none">
                    <button type="button" onClick={() => toggleHistory(investment.id)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
                      <div className="min-w-0">
                        <h3 className={`text-base font-black text-[#D4AF37] ${open ? 'whitespace-normal' : 'overflow-hidden text-ellipsis'}`}>{investment.investment_type || 'Investment Plan'}</h3>
                        <p className={`mt-1 whitespace-nowrap leading-tight tracking-tight ${getAmountFontSize(parseMoney(investment.amount))}`}>{formatCurrency(investment.amount)}</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/40">Submitted {formatDate(investment.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-start gap-2">
                        {investmentStatusBadge(investment.status)}
                        <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-[#D4AF37] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    <div className={`overflow-hidden transition-[max-height] duration-200 ease-in-out ${open ? 'max-h-[520px]' : 'max-h-0'}`}>
                      <div className="border-t border-[#E0D5C5] px-4 pb-4 pt-4 dark:border-white/10">
                        <div className="grid gap-3 text-sm text-zinc-500 dark:text-white/50 sm:grid-cols-2">
                          <p><span className="font-black uppercase tracking-widest text-zinc-400 dark:text-white/35">Start</span><br />{formatDate(investment.start_date)}</p>
                          <p><span className="font-black uppercase tracking-widest text-zinc-400 dark:text-white/35">Maturity</span><br />{formatDate(investment.maturity_date)}</p>
                          {investment.agreed_return_rate !== null && investment.agreed_return_rate !== undefined && (
                            <p><span className="font-black uppercase tracking-widest text-zinc-400 dark:text-white/35">Return Rate</span><br />{parseMoney(investment.agreed_return_rate)}%</p>
                          )}
                          {investment.total_return_amount !== null && investment.total_return_amount !== undefined && (
                            <p className="min-w-0 overflow-hidden"><span className="font-black uppercase tracking-widest text-zinc-400 dark:text-white/35">Maturity Return</span><br /><span className={`block overflow-hidden text-ellipsis whitespace-nowrap ${getAmountFontSize(parseMoney(investment.total_return_amount))}`}>{formatCurrency(investment.total_return_amount)}</span></p>
                          )}
                        </div>
                        {progress !== null && (
                          <div className="mt-4">
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                              <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="mt-2 text-xs font-bold text-zinc-500 dark:text-white/40">{Math.round(progress)}% of tenure elapsed</p>
                          </div>
                        )}
                        {matured && (
                          <p className="mt-4 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-2 text-sm font-semibold text-[#D4AF37]">
                            This investment has matured. Contact admin for payout.
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section ref={catalogSectionRef} className="scroll-mt-6 rounded-3xl border border-brand-border bg-brand-ghost p-6 shadow-2xl shadow-zinc-900/[0.04] dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Available Investment Plans</p>
          <h2 className="mt-1 text-2xl font-black">Choose from active plans</h2>
          {activeInvestmentProducts.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-brand-border bg-zinc-50 px-4 py-5 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45">
              No investment plans are currently available. Check back soon.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {applyableProducts.map((product) => (
                <PlanAccordionCard
                  key={product.id}
                  product={product}
                  open={openPlanIds.includes(product.id)}
                  badge={productTypeLabel(product)}
                  summary={
                    <div className="grid gap-2 text-sm leading-6 text-zinc-600 dark:text-white/55">
                      <p><span className="font-bold text-brand-ink dark:text-white/75">Rate:</span> {productRateText(product)}</p>
                      <p><span className="font-bold text-brand-ink dark:text-white/75">Tenure:</span> {Number(product.tenure_months || 0)} months</p>
                      <p><span className="font-bold text-brand-ink dark:text-white/75">Payout:</span> Every {Number(product.payout_interval_months || 0)} months</p>
                    </div>
                  }
                  onToggle={() => togglePlan(product.id)}
                >
                  {product.description && <p className="text-sm leading-6 text-zinc-600 dark:text-white/55">{product.description}</p>}
                  <button
                    type="button"
                    onClick={() => selectCatalogPlan(product)}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B]"
                  >
                    Select Plan
                  </button>
                </PlanAccordionCard>
              ))}
              {infoOnlyProducts.map((product) => (
                <PlanAccordionCard
                  key={product.id}
                  product={product}
                  open={openPlanIds.includes(product.id)}
                  badge="Enquire"
                  enquire
                  onToggle={() => togglePlan(product.id)}
                >
                  {product.description && <p className="text-sm leading-6 text-zinc-600 dark:text-white/55">{product.description}</p>}
                  <a
                    href="mailto:smartsavecooperative@gmail.com"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-brand-border px-4 py-3 text-sm font-black text-brand-ink transition hover:border-[#D4AF37]/40 hover:text-[#B48924] dark:border-white/10 dark:text-white dark:hover:text-[#D4AF37]"
                  >
                    Contact Us
                  </a>
                </PlanAccordionCard>
              ))}
            </div>
          )}
        </section>

        <section ref={applicationSectionRef} className="scroll-mt-6 min-w-0 rounded-3xl border border-brand-border bg-brand-ghost p-4 shadow-2xl shadow-zinc-900/[0.04] dark:border-white/[0.08] dark:bg-white/[0.035] sm:p-6">
          {submitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#9DC03A]" />
              <h2 className="mt-5 text-2xl font-black">Application Received!</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500 dark:text-white/50">
                Your investment application has been submitted. Our admin team will confirm your plan and contact you within 24 hours.
              </p>
              <button type="button" onClick={() => setSubmitted(false)} className="mt-5 rounded-xl border border-[#D4AF37]/30 px-4 py-2 text-sm font-black text-[#D4AF37]">
                Submit another application
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Configure Investment</p>
              <h2 className="mt-1 text-2xl font-black">Apply for an Investment Plan</h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-white/45">Choose one plan and review the payout preview before submitting.</p>

              <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
                {selectedPlan ? (
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#D4AF37]/25 border-l-4 border-l-[#D4AF37] bg-[#D4AF37]/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                      <p className="min-w-0 text-zinc-600 dark:text-white/65">
                        Applying for: <span className="font-black text-brand-ink dark:text-white">{selectedPlan.name}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={changePlan}
                      className="self-start text-xs font-black text-[#B48924] transition hover:text-[#D4AF37] dark:text-[#D4AF37] sm:self-auto"
                    >
                      Change Plan ×
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-sm font-semibold text-zinc-500 dark:text-white/45">
                    Select a plan above to get started, or configure manually below.
                  </p>
                )}
                {availableTabs.length > 0 ? (
                  <div className={`grid gap-2 rounded-xl border border-brand-border bg-zinc-50 p-1 dark:border-white/10 dark:bg-white/[0.04] ${availableTabs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {availableTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setError('');
                      }}
                      className={`rounded-lg px-3 py-2.5 text-sm font-black transition ${
                        activeTab === tab
                          ? 'bg-[#D4AF37] text-brand-ink'
                          : `${selectedPlan ? 'opacity-60' : ''} text-zinc-500 dark:text-white/45`
                      }`}
                    >
                      {tab}
                    </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-brand-border bg-zinc-50 px-4 py-5 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45">
                    No investment application plans are currently available. Check back soon.
                  </div>
                )}

                {activeTab === 'Fixed Investment' ? (
                  fixedPlans.length === 0 ? (
                    <div className="rounded-2xl border border-brand-border bg-zinc-50 px-4 py-5 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45">
                      No fixed investment plans are currently available. Check back soon.
                    </div>
                  ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Lump Sum Amount" value={fixedAmount} placeholder="NGN 500,000" onChange={(value) => setFixedAmount(formatAmountInput(value))} />
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Fixed Investment Term</span>
                      <div className="grid grid-cols-2 gap-2">
                        {([6, 12] as FixedTerm[]).map((months) => (
                          <button
                            key={months}
                            type="button"
                            onClick={() => setFixedTerm(months)}
                            className={`h-12 min-w-0 rounded-xl border px-2 text-sm font-black transition sm:px-4 ${
                              fixedTerm === months
                                ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]'
                                : 'border-brand-border bg-brand-ghost text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45'
                            }`}
                          >
                            {months} months
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-2 md:col-span-2">
                      {fixedPlans.map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setFixedAmount(formatAmountInput(String(parseMoney(plan.min_amount))))}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                            detectedFixedPlan?.id === plan.id
                              ? 'border-[#D4AF37]/45 bg-[#D4AF37]/18 text-[#B48924] dark:text-[#D4AF37]'
                              : 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]'
                          }`}
                        >
                          {formatAmount(parseMoney(plan.min_amount)).replace('.00', '')}
                        </button>
                      ))}
                    </div>
                    {detectedFixedPlan ? (
                      <PreviewCard
                        className="md:col-span-2"
                        rows={[
                          ['Detected Tier', `${detectedFixedPlan.name} - ${formatPercent(fixedMonthlyRate)} monthly`],
                          ['Quarterly Interest', formatAmount(fixedQuarterlyInterest)],
                          [`Total Payout after ${fixedTerm} months`, formatAmount(fixedTotalPayout)],
                          ['Payout Interval', `Every ${fixedPayoutIntervalMonths} months`],
                        ]}
                      />
                    ) : (
                      <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-3 text-sm font-semibold text-[#B48924] dark:text-[#D4AF37] md:col-span-2">
                        This amount does not match any available investment plan.
                      </div>
                    )}
                  </div>
                  )
                ) : (
                  savingsPlans.length === 0 ? (
                    <div className="rounded-2xl border border-brand-border bg-zinc-50 px-4 py-5 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45">
                      No savings plans are currently available. Check back soon.
                    </div>
                  ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {savingsPlans.length > 1 && (
                      <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
                        {savingsPlans.map((plan) => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedSavingsPlanId(plan.id)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              selectedSavingsPlan?.id === plan.id
                                ? 'border-[#D4AF37]/45 bg-[#D4AF37]/12'
                                : 'border-brand-border bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04]'
                            }`}
                          >
                            <p className="text-sm font-black text-brand-ink dark:text-white">{plan.name}</p>
                            <p className="mt-2 text-xs font-bold text-[#B48924] dark:text-[#D4AF37]">{formatPercent(Number(plan.total_return_rate || 0))} total return</p>
                            <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">Payout at month {Number(plan.payout_interval_months || 0)}</p>
                            <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">Minimum: {formatAmount(parseMoney(plan.min_amount)).replace('.00', '')} per month</p>
                            {plan.description && <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-white/45">{plan.description}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedSavingsPlan && savingsPlans.length === 1 && (
                      <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4 text-sm leading-6 text-zinc-600 dark:text-white/55 md:col-span-2">
                        <p className="font-black text-[#B48924] dark:text-[#D4AF37]">{selectedSavingsPlan.name}</p>
                        <p>{formatPercent(Number(selectedSavingsPlan.total_return_rate || 0))} total return. Payout at month {Number(selectedSavingsPlan.payout_interval_months || 0)}. Minimum: {formatAmount(parseMoney(selectedSavingsPlan.min_amount)).replace('.00', '')} per month.</p>
                        {selectedSavingsPlan.description && <p className="mt-2">{selectedSavingsPlan.description}</p>}
                      </div>
                    )}
                    <Field label="Monthly Contribution Amount" value={monthlyContribution} placeholder="NGN 50,000" onChange={(value) => setMonthlyContribution(formatAmountInput(value))} />
                    <PreviewCard
                      rows={[
                        [`${savingsDurationMonths}-Month Total Contributed`, formatAmount(savingsTotalContributed)],
                        [`Payout at Month ${savingsPayoutMonth}`, formatAmount(savingsPayout)],
                      ]}
                    />
                  </div>
                  )
                )}

                {availableTabs.length > 0 && (
                  <div className="grid min-w-0 max-w-full gap-4 overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-2.5 md:col-span-2 sm:p-4">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest text-[#B48924] dark:text-[#D4AF37]">Payment Details</p>
                      <div className="mt-3 min-w-0 max-w-full break-words rounded-xl border border-[#D4AF37]/25 bg-[#FFF8E6]/80 p-3 text-[13px] font-semibold leading-6 text-zinc-700 dark:border-[#D4AF37]/25 dark:bg-[#D4AF37]/10 dark:text-white/85 sm:p-4 sm:text-sm sm:leading-7">
                        <p className="break-words dark:text-white/95">Transfer your investment amount to:</p>
                        <p className="break-words"><span className="font-black text-brand-ink dark:text-white">Bank:</span> <span className="dark:text-white/90">Stanbic IBTC</span></p>
                        <p className="break-words"><span className="font-black text-brand-ink dark:text-white">Account:</span> <span className="dark:text-white/90">Smart Save Cooperative Society</span></p>
                        <p className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
                          <span className="min-w-0 max-w-full break-words sm:flex-1">
                            <span className="font-black text-brand-ink dark:text-white">Number:</span> <span className="dark:text-white/90">0079404511</span>
                          </span>
                          <button
                            type="button"
                            onClick={copyInvestmentAccountNumber}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
                            aria-label="Copy account number"
                          >
                            {accountCopied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                          </button>
                        </p>
                        <p className="mt-2 break-words dark:text-white/95">Then upload your transfer receipt below.</p>
                      </div>
                    </div>
                    <div className="grid min-w-0 gap-4 md:grid-cols-2">
                      <Field
                        label="Payment Reference / Teller Number (Optional)"
                        value={paymentReference}
                        placeholder="Enter your bank teller or transfer reference"
                        onChange={setPaymentReference}
                      />
                      <label className="flex min-w-0 flex-col gap-2">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Amount Transferred (₦)</span>
                        <input
                          required
                          inputMode="numeric"
                          value={amountPaid}
                          placeholder="Enter the exact amount you transferred"
                          onChange={(event) => setAmountPaid(formatAmountInput(event.target.value))}
                          className="h-12 w-full min-w-0 rounded-xl border border-brand-border bg-brand-ghost px-3 text-sm font-semibold outline-none focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04] dark:text-white sm:px-4"
                        />
                      </label>
                    </div>
                    <label className="flex min-w-0 flex-col gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Upload Transfer Receipt (Required)</span>
                      <span className="flex min-h-12 min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-ghost px-3 py-3 text-sm font-semibold text-zinc-500 transition hover:border-[#D4AF37]/45 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45 sm:px-4">
                        <span className="min-w-0 truncate">{proofOfPaymentFile ? proofOfPaymentFile.name : 'JPG, PNG, or PDF. Max 5MB.'}</span>
                        <FileUp className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                      </span>
                      <input
                        required
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(event) => handlePaymentProofChange(event.target.files?.[0] || null)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                )}

                {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">{toOptionalErrorMessage(error)}</p>}
                <button type="submit" disabled={isSubmitting || availableTabs.length === 0} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-4 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B] disabled:opacity-60 sm:px-5">
                  {isSubmitting ? 'Submitting...' : 'Submit Investment Application'} <Send size={16} />
                </button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="break-words text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-12 w-full min-w-0 rounded-xl border border-brand-border bg-brand-ghost px-3 text-sm font-semibold outline-none focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04] dark:text-white sm:px-4" />
    </label>
  );
}

function PlanAccordionCard({
  product,
  open,
  badge,
  summary,
  enquire = false,
  onToggle,
  children,
}: {
  product: InvestmentProductRow;
  open: boolean;
  badge: string;
  summary?: React.ReactNode;
  enquire?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-brand-border bg-zinc-50 shadow-xl shadow-zinc-900/[0.03] dark:border-white/[0.08] dark:bg-white/[0.035]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left md:px-5"
      >
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-[#D4AF37]">{product.name}</h3>
          <span
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${
              enquire
                ? 'border-brand-border text-zinc-500 dark:border-white/10 dark:text-white/45'
                : 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#B48924] dark:text-[#D4AF37]'
            }`}
          >
            {badge}
          </span>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-[#D4AF37] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {summary && <div className="border-t border-brand-border px-4 pb-4 pt-4 dark:border-white/10 md:px-5">{summary}</div>}
      <div className={`overflow-hidden transition-[max-height] duration-200 ease-in-out ${open ? 'max-h-[760px]' : 'max-h-0'}`}>
        <div className={`${summary ? 'border-t-0 pt-0' : 'border-t pt-4'} border-brand-border px-4 pb-4 dark:border-white/10 md:px-5`}>
          {children}
        </div>
      </div>
    </article>
  );
}

function PreviewCard({ rows, className = '' }: { rows: Array<[string, string]>; className?: string }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-[#D4AF37]/35 bg-[rgba(212,175,55,0.18)] p-3 shadow-[0_4px_14px_rgba(139,109,56,0.08)] dark:border-[#D4AF37]/20 dark:bg-[#D4AF37]/10 dark:shadow-none sm:p-4 ${className}`}>
      <p className="text-xs font-black uppercase tracking-widest text-[#B48924] dark:text-[#D4AF37]">Preview</p>
      <div className="mt-3 grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="grid min-w-0 gap-1 rounded-xl border border-[#D4AF37]/22 bg-[#FFF8E6]/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
            <span className="min-w-0 break-words text-xs font-semibold text-zinc-500 dark:text-white/45">{label}</span>
            <strong className="min-w-0 break-words text-sm text-brand-ink dark:text-white sm:text-right">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
