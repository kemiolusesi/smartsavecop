'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronDown, Send, TrendingUp } from 'lucide-react';
import SmartSelect from '@/components/ui/SmartSelect';
import { toOptionalErrorMessage } from '@/lib/error-message';
import { INVESTMENT_PRODUCTS, findInvestmentProduct } from '@/lib/investments/investmentProducts';

export interface ApplicationProfile {
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

const products = INVESTMENT_PRODUCTS;

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
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
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
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black capitalize ${className}`}>{label}</span>;
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

export default function InvestmentsClient({ profile, initialInvestmentApplications = [] }: { devBypassActive: boolean; profile: ApplicationProfile; initialInvestmentApplications?: InvestmentApplicationRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    product: products[0].name,
    source: 'Referral',
    monthlyContribution: '',
    preferredPlan: 'Monthly contribution',
    goalDescription: '',
    targetAmount: '',
    preferredDurationMonths: '12',
    lumpSumAmount: '',
    preferredTenureMonths: '6',
    numberOfShares: '',
    amountToInvest: '',
  });
  const selectedProduct = findInvestmentProduct(form.product);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/applications/investment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload?.error || 'Unable to submit investment application.');
      setSubmitted(true);
      setForm((current) => ({
        ...current,
        source: 'Referral',
        monthlyContribution: '',
        preferredPlan: 'Monthly contribution',
        goalDescription: '',
        targetAmount: '',
        preferredDurationMonths: '12',
        lumpSumAmount: '',
        preferredTenureMonths: '6',
        numberOfShares: '',
        amountToInvest: '',
      }));
    } catch (err) {
      const error = err as { message?: string } | null;
      setError(error?.message || 'Unable to submit investment application.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-alabaster px-4 py-6 font-sans text-brand-ink dark:bg-[#0A0A0A] dark:text-white sm:py-8">
      <div className="absolute inset-0 brand-grid opacity-60" aria-hidden="true" />
      <div className="absolute left-1/2 top-0 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" aria-hidden="true" />

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

        <section className="rounded-3xl border border-brand-border bg-brand-ghost p-5 shadow-xl shadow-zinc-900/[0.03] dark:border-white/[0.08] dark:bg-white/[0.035] md:p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">My Investment Applications</p>
          <h2 className="mt-1 text-2xl font-black">Application history</h2>
          {initialInvestmentApplications.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-brand-border bg-white/40 p-4 text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/45">
              No investment applications yet. Start investing below.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {initialInvestmentApplications.map((investment) => {
                const progress = progressForInvestment(investment);
                const matured = String(investment.status || '').toLowerCase() === 'matured';

                return (
                  <article key={investment.id} className="overflow-hidden rounded-2xl border border-brand-border bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-[#D4AF37]">{investment.investment_type || 'Investment Plan'}</h3>
                        <p className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap ${getAmountFontSize(parseMoney(investment.amount))}`}>{formatCurrency(investment.amount)}</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/40">Submitted {formatDate(investment.created_at)}</p>
                      </div>
                      {investmentStatusBadge(investment.status)}
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-zinc-500 dark:text-white/50 sm:grid-cols-2">
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
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <article key={product.name} className="rounded-2xl border border-brand-border bg-brand-ghost p-4 shadow-xl shadow-zinc-900/[0.03] dark:border-white/[0.08] dark:bg-white/[0.035] md:p-5">
              <TrendingUp className="h-5 w-5 text-[#D4AF37] md:h-6 md:w-6" />
              <h2 className="mt-3 text-lg font-black text-[#D4AF37] md:mt-4 md:text-xl">{product.name}</h2>
              <p className="mt-1.5 text-sm leading-5 text-zinc-600 dark:text-white/55 md:mt-2 md:leading-6">{product.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 md:mt-4 md:gap-2">
                {product.benefits.map((benefit) => (
                  <span key={benefit} className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-bold text-[#D4AF37] md:px-2.5 md:py-1">{benefit}</span>
                ))}
              </div>
              <button type="button" onClick={() => setExpanded(expanded === product.name ? null : product.name)} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-white md:mt-5">
                Learn More <ChevronDown size={16} className={expanded === product.name ? 'rotate-180 transition' : 'transition'} />
              </button>
              {expanded === product.name && <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-white/45">{product.full}</p>}
            </article>
          ))}
        </div>

        <section className="rounded-3xl border border-brand-border bg-brand-ghost p-6 shadow-2xl shadow-zinc-900/[0.04] dark:border-white/[0.08] dark:bg-white/[0.035]">
          {submitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#9DC03A]" />
              <h2 className="mt-5 text-2xl font-black">Application Received!</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500 dark:text-white/50">
                Your investment application has been submitted. Our admin team will confirm your plan and contact you within 24 hours.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Application Form</p>
              <h2 className="mt-1 text-2xl font-black">Apply for an Investment Plan</h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-white/45">Complete the form below. Our team will review your application within 2 business days.</p>
              <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Full Name" value={form.fullName} onChange={(value) => updateField('fullName', value)} />
                <Field label="Email Address" value={form.email} disabled onChange={(value) => updateField('email', value)} />
                <Field label="Phone Number" value={form.phone} onChange={(value) => updateField('phone', value)} />
                <SelectField label="Select Investment Plan" value={form.product} options={products.map((product) => product.name)} onChange={(value) => updateField('product', value)} />
                {selectedProduct.name === 'Normal Savings Account' && (
                  <>
                    <Field label="Monthly Contribution Amount" value={form.monthlyContribution} placeholder="NGN 50,000" onChange={(value) => updateField('monthlyContribution', formatAmountInput(value))} />
                    <SelectField label="Preferred Plan" value={form.preferredPlan} options={['Monthly contribution', 'Quarterly contribution', 'Dividend-focused savings']} onChange={(value) => updateField('preferredPlan', value)} />
                  </>
                )}
                {selectedProduct.name === 'Target Savings Plan' && (
                  <>
                    <TextareaField label="Goal Description" value={form.goalDescription} placeholder="What are you saving towards?" onChange={(value) => updateField('goalDescription', value)} />
                    <Field label="Target Amount" value={form.targetAmount} placeholder="NGN 500,000" onChange={(value) => updateField('targetAmount', formatAmountInput(value))} />
                    <Field label="Preferred Duration in Months" value={form.preferredDurationMonths} placeholder="12" onChange={(value) => updateField('preferredDurationMonths', value)} />
                  </>
                )}
                {selectedProduct.name === 'Fixed Deposit Investment' && (
                  <>
                    <Field label="Lump Sum Amount" value={form.lumpSumAmount} placeholder="NGN 1,000,000" onChange={(value) => updateField('lumpSumAmount', formatAmountInput(value))} />
                    <Field label="Preferred Tenure in Months" value={form.preferredTenureMonths} placeholder="6" onChange={(value) => updateField('preferredTenureMonths', value)} />
                  </>
                )}
                {selectedProduct.name === 'Share Capital Investment' && (
                  <>
                    <Field label="Number of Shares" value={form.numberOfShares} placeholder="100" onChange={(value) => updateField('numberOfShares', value)} />
                    <Field label="Amount to Invest" value={form.amountToInvest} placeholder="NGN 250,000" onChange={(value) => updateField('amountToInvest', formatAmountInput(value))} />
                  </>
                )}
                <SelectField label="How did you hear about this plan?" value={form.source} options={['Referral', 'Social Media', 'WhatsApp', 'Walk-in', 'Other']} onChange={(value) => updateField('source', value)} />
                {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500 md:col-span-2">{toOptionalErrorMessage(error)}</p>}
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-black text-brand-ink transition hover:bg-[#F5D06B] disabled:opacity-60 md:col-span-2">
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

function Field({ label, value, onChange, placeholder = '', disabled = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">{label}</span>
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

