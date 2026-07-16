'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Loader2,
  LockKeyhole,
  Moon,
  Save,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';
import { toErrorMessage, toOptionalErrorMessage } from '@/lib/error-message';
import BankDetailsCard from '@/components/payments/BankDetailsCard';
import { submitPayment } from '@/lib/payments/submitPayment';

const TOTAL_STEPS = 5;
const REGISTRATION_FEE_NAIRA = 5000;
const KYC_BUCKET = 'kyc-documents';
const PAYMENT_PROOFS_BUCKET = 'payment-proofs';
const STEP_LABELS = ['Personal Information', 'Identity Verification', 'Next of Kin', 'Terms & Conditions', 'Registration Fee'];

const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
  'Federal Capital Territory',
];

const TERMS_TEXT = `SMART SAVE MULTIPURPOSE COOPERATIVE SOCIETY LTD
MEMBERSHIP TERMS & CONDITIONS

1. MEMBERSHIP
By joining Smart Save Cooperative, you agree to abide by the cooperative's Bye-Laws and all policies.
Registration fee of N5,000 is non-refundable.

2. SAVINGS
Members may save according to their financial capacity.
Members may withdraw once per quarter (every 3 months).
Maximum withdrawal: 60% of total contributions.

3. LOANS
Loans are subject to guarantor requirements and cooperative approval. Interest rates vary by loan type.
Default may attract penalties and legal action.

4. INVESTMENTS
Returns are subject to cooperative performance.
Investment terms are binding once accepted.

5. DATA PRIVACY
Your personal data is handled in accordance with Nigeria Data Protection Regulation (NDPR).
Data is never sold to third parties.

6. GENERAL
Membership is personal and non-transferable.
The cooperative reserves the right to amend terms with adequate notice to members.`;

type SessionUser = {
  id: string;
  email: string;
};

type OnboardingForm = {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  residentialAddress: string;
  stateOfResidence: string;
  occupation: string;
  employmentStatus: string;
  monthlyIncome: string;
  nin: string;
  kycDocumentType: string;
  kycDocumentUrl: string;
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
  nextOfKinAddress: string;
  nextOfKinEmail: string;
  termsAccepted: boolean;
};

const initialForm: OnboardingForm = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  residentialAddress: '',
  stateOfResidence: '',
  occupation: '',
  employmentStatus: '',
  monthlyIncome: '',
  nin: '',
  kycDocumentType: '',
  kycDocumentUrl: '',
  nextOfKinName: '',
  nextOfKinRelationship: '',
  nextOfKinPhone: '',
  nextOfKinAddress: '',
  nextOfKinEmail: '',
  termsAccepted: false,
};

function inputClass(hasValue = false) {
  return `h-12 rounded-lg border bg-white px-3 text-base font-semibold text-brand-ink outline-none transition placeholder:text-brand-secondary/45 focus:border-[#D4AF37] dark:bg-[#0A0A0A] dark:text-white dark:placeholder:text-white/20 dark:focus:border-[#D4AF37]/70 md:text-sm ${
    hasValue ? 'border-[#D4AF37]/55' : 'border-brand-input dark:border-white/10'
  }`;
}

function textareaClass(hasValue = false) {
  return `min-h-[92px] rounded-lg border bg-white px-3 py-3 text-base font-semibold text-brand-ink outline-none transition placeholder:text-brand-secondary/45 focus:border-[#D4AF37] dark:bg-[#0A0A0A] dark:text-white dark:placeholder:text-white/20 dark:focus:border-[#D4AF37]/70 md:text-sm ${
    hasValue ? 'border-[#D4AF37]/55' : 'border-brand-input dark:border-white/10'
  }`;
}

function toProfilePayload(form: OnboardingForm, user: SessionUser, step: number, extra: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  const hasKycDocument = Boolean(form.kycDocumentUrl);

  return {
    user_id: user.id,
    email: user.email,
    full_name: form.fullName.trim(),
    date_of_birth: form.dateOfBirth || null,
    phone_number: form.phone.trim(),
    gender: form.gender || null,
    address: form.residentialAddress.trim() || null,
    state_of_residence: form.stateOfResidence || null,
    occupation: form.occupation.trim() || null,
    employment_status: form.employmentStatus || null,
    monthly_income_range: form.monthlyIncome || null,
    id_type: form.kycDocumentType || null,
    id_number: form.nin.trim() || null,
    kyc_document_type: form.kycDocumentType || null,
    kyc_document_number: form.nin.trim() || null,
    kyc_document_url: form.kycDocumentUrl || null,
    ...(hasKycDocument
      ? {
          kyc_status: 'submitted',
          kyc_submitted_at: now,
        }
      : {}),
    id_expiry_date: null,
    bvn: null,
    next_of_kin_name: form.nextOfKinName.trim() || null,
    next_of_kin_relationship: form.nextOfKinRelationship || null,
    next_of_kin_phone: form.nextOfKinPhone.trim() || null,
    next_of_kin_email: form.nextOfKinEmail.trim() || null,
    terms_accepted: form.termsAccepted,
    terms_accepted_at: form.termsAccepted ? now : null,
    onboarding_step: step,
    updated_at: now,
    ...extra,
  };
}

function isValidNigerianPhone(value: string) {
  return /^(\+234|234|0)[789][01]\d{8}$/.test(value.replace(/\s+/g, ''));
}

function isValidNin(value: string) {
  return /^\d{11}$/.test(value.trim());
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-base font-black uppercase tracking-widest text-brand-secondary dark:text-white/40 md:text-xs">{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass(Boolean(value))}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

export default function OnboardingContent() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingForm>(initialForm);
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [themeMounted, setThemeMounted] = useState(false);

  const progress = (step / TOTAL_STEPS) * 100;
  const firstName = form.fullName.trim().split(/\s+/)[0] || user?.email.split('@')[0] || 'member';
  const isDarkTheme = resolvedTheme === 'dark';

  const identitySubmitted = useMemo(
    () => Boolean((form.nin && isValidNin(form.nin)) || form.kycDocumentUrl || kycFile),
    [form.nin, form.kycDocumentUrl, kycFile]
  );

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace('/signin?returnTo=/onboarding');
          return;
        }

        const activeUser = {
          id: session.user.id,
          email: session.user.email || '',
        };

        setUser(activeUser);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', activeUser.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const metadataName =
          typeof session.user.user_metadata?.full_name === 'string' ? session.user.user_metadata.full_name : '';

        if (profile?.is_admin === true) {
          router.replace('/admin');
          return;
        }

        if (profile?.onboarding_completed) {
          router.replace('/pending-activation');
          return;
        }

        setForm({
          fullName: profile?.full_name || metadataName || '',
          dateOfBirth: profile?.date_of_birth || '',
          gender: profile?.gender || '',
          phone: profile?.phone_number || '',
          residentialAddress: profile?.address || '',
          stateOfResidence: profile?.state_of_residence || '',
          occupation: profile?.occupation || '',
          employmentStatus: profile?.employment_status || '',
          monthlyIncome: profile?.monthly_income_range || '',
          nin: profile?.id_number || '',
          kycDocumentType: profile?.id_type || '',
          kycDocumentUrl: profile?.kyc_document_url || '',
          nextOfKinName: profile?.next_of_kin_name || '',
          nextOfKinRelationship: profile?.next_of_kin_relationship || '',
          nextOfKinPhone: profile?.next_of_kin_phone || '',
          nextOfKinAddress: '',
          nextOfKinEmail: profile?.next_of_kin_email || '',
          termsAccepted: Boolean(profile?.terms_accepted),
        });

        const savedStep = Number(profile?.onboarding_step || 1);
        setStep(Number.isInteger(savedStep) && savedStep >= 1 && savedStep <= TOTAL_STEPS ? savedStep : 1);
      } catch (err) {
        setError(toErrorMessage(err, 'Unable to load onboarding details.'));
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  function updateField<K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
    setNotice('');
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setError('');
    setNotice('');

    if (!file) {
      setKycFile(null);
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Upload a JPG, PNG, or PDF document.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ID document must be 5MB or smaller.');
      event.target.value = '';
      return;
    }

    setKycFile(file);
  }

  function handlePaymentProofChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setError('');
    setNotice('');

    if (!file) {
      setPaymentProofFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Upload a clear image of your payment proof.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Payment proof image must be 5MB or smaller.');
      event.target.value = '';
      return;
    }

    setPaymentProofFile(file);
  }

  function validateStep(currentStep: number) {
    if (currentStep === 1) {
      if (!form.fullName.trim()) return 'Full name is required.';
      if (!form.dateOfBirth) return 'Date of birth is required.';
      if (!form.gender) return 'Gender is required.';
      if (!isValidNigerianPhone(form.phone)) return 'Enter a valid Nigerian phone number.';
      if (!form.residentialAddress.trim()) return 'Residential address is required.';
      if (!form.stateOfResidence) return 'State of residence is required.';
      if (!form.occupation.trim()) return 'Occupation is required.';
      if (!form.employmentStatus) return 'Employment status is required.';
      if (!form.monthlyIncome) return 'Monthly income range is required.';
    }

    if (currentStep === 2) {
      const hasNin = form.nin.trim().length > 0;
      const hasDocument = Boolean(form.kycDocumentUrl || kycFile);
      if (!hasNin && !hasDocument) return 'Submit your NIN or upload a government ID.';
      if (hasNin && !isValidNin(form.nin)) return 'NIN must be exactly 11 digits.';
      if (hasDocument && !form.kycDocumentType) return 'Select the government ID type.';
    }

    if (currentStep === 3) {
      if (!form.nextOfKinName.trim()) return 'Next of kin full name is required.';
      if (!form.nextOfKinRelationship) return 'Next of kin relationship is required.';
      if (!isValidNigerianPhone(form.nextOfKinPhone)) return 'Enter a valid next of kin phone number.';
      if (!form.nextOfKinAddress.trim()) return 'Next of kin address is required.';
      if (form.nextOfKinEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.nextOfKinEmail)) {
        return 'Enter a valid next of kin email address.';
      }
    }

    if (currentStep === 4 && !form.termsAccepted) {
      return 'You must accept the terms and conditions to continue.';
    }

    return '';
  }

  async function uploadKycDocument() {
    if (!user || !kycFile) return form.kycDocumentUrl;

    const safeFileName = kycFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filePath = `${user.id}/${Date.now()}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage
      .from(KYC_BUCKET)
      .upload(filePath, kycFile, { upsert: true, contentType: kycFile.type });

    if (uploadError) throw uploadError;

    setKycFile(null);
    setForm((current) => ({ ...current, kycDocumentUrl: filePath }));
    return filePath;
  }

  async function uploadPaymentProof() {
    if (!user || !paymentProofFile) {
      throw new Error('Upload payment proof before submitting.');
    }

    const safeFileName = paymentProofFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filePath = `${user.id}/${Date.now()}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage
      .from(PAYMENT_PROOFS_BUCKET)
      .upload(filePath, paymentProofFile, { upsert: false, contentType: paymentProofFile.type });

    if (uploadError) throw uploadError;

    const { error: signedUrlError } = await supabase.storage
      .from(PAYMENT_PROOFS_BUCKET)
      .createSignedUrl(filePath, 3600);

    if (signedUrlError) throw signedUrlError;

    return filePath;
  }

  async function saveProgress(targetStep = step, extra: Record<string, unknown> = {}) {
    if (!user) throw new Error('Sign in is required to save onboarding.');

    const documentUrl = step >= 2 ? await uploadKycDocument() : form.kycDocumentUrl;
    const nextForm = { ...form, kycDocumentUrl: documentUrl };

    const { error: saveError } = await supabase
      .from('profiles')
      .upsert(toProfilePayload(nextForm, user, targetStep, extra), { onConflict: 'user_id' });

    if (saveError) throw saveError;
    setForm(nextForm);
  }

  async function handleContinue() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await saveProgress(Math.min(TOTAL_STEPS, step + 1));
      setStep((current) => Math.min(TOTAL_STEPS, current + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(toErrorMessage(err, 'Unable to save this step.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveLater() {
    try {
      setIsSaving(true);
      setError('');
      await saveProgress(step);
      setNotice('Progress saved. You can continue later from this step.');
    } catch (err) {
      setError(toErrorMessage(err, 'Unable to save progress.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePayment() {
    const validationError = [1, 2, 3, 4].map(validateStep).find(Boolean);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      setError('Sign in is required to continue.');
      return;
    }

    if (!paymentProofFile) {
      setError('Upload payment proof before submitting.');
      return;
    }

    try {
      setIsPaying(true);
      setError('');
      await saveProgress(5);
      const proofUrl = await uploadPaymentProof();
      const paymentResult = await submitPayment({
        userId: user.id,
        fullName: form.fullName.trim(),
        email: user.email,
        amount: REGISTRATION_FEE_NAIRA,
        paymentType: 'registration',
        transactionReference: transactionReference.trim() || 'Not provided',
        proofUrl,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error);
      }

      await saveProgress(5, {
        onboarding_completed: true,
        onboarding_step: 5,
        approval_status: 'pending',
      });

      setPaymentSubmitted(true);
      setPaymentProofFile(null);
      setNotice('Your registration payment has been submitted! Your account will be activated within 24 hours once confirmed.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(toErrorMessage(err, 'Unable to submit your registration payment.'));
      setIsPaying(false);
    } finally {
      setIsPaying(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-alabaster text-brand-secondary dark:bg-[#0A0A0A] dark:text-white/50">
        <Loader2 className="mr-3 animate-spin text-[#D4AF37]" size={18} />
        Loading onboarding...
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-brand-alabaster px-4 py-5 text-brand-ink transition-colors dark:bg-[#0A0A0A] dark:text-white md:py-10">
      {themeMounted && (
        <button
          type="button"
          onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
          aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
          className="fixed right-4 top-4 z-50 hidden h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition hover:border-brand-input dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none md:inline-flex"
        >
          {isDarkTheme ? <Sun size={17} className="text-[#D4AF37]" /> : <Moon size={17} />}
        </button>
      )}

      <div className="mx-auto mb-5 w-full max-w-5xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo.png" alt="Smart Save Cooperative" className="h-10 w-10 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">Smart Save</p>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">Cooperative</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                disabled={isSaving || isPaying}
                aria-label="Go to previous onboarding step"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition hover:border-brand-input disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none"
              >
                <ArrowLeft size={17} />
              </button>
            )}
            <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Step {step} of {TOTAL_STEPS}</p>
            {themeMounted && (
              <button
                type="button"
                onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
                aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition hover:border-brand-input dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none"
              >
                {isDarkTheme ? <Sun size={17} className="text-[#D4AF37]" /> : <Moon size={17} />}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 h-1 w-full rounded-full bg-[#F0ECE6] dark:bg-white/10">
          <div className="h-full rounded-full bg-[#D4AF37] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-4 text-center text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
          {STEP_LABELS[step - 1]}
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-5 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden h-fit min-w-0 rounded-lg border border-brand-border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none md:block">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Smart Save Cooperative" className="h-11 w-11 object-contain" />
            <div>
              <p className="text-sm font-black">Smart Save</p>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D4AF37]">Cooperative</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-black uppercase tracking-widest text-brand-secondary dark:text-white/40">Step {step} of {TOTAL_STEPS}</p>
            <div className="mt-3 h-2 rounded-full bg-[#F0ECE6] dark:bg-white/10">
              <div className="h-full rounded-full bg-[#D4AF37] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-6 grid gap-2 text-sm">
            {STEP_LABELS.map(
              (label, index) => {
                const itemStep = index + 1;
                const active = itemStep === step;
                const done = itemStep < step;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => itemStep < step && setStep(itemStep)}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                      active
                        ? 'border-[#D4AF37]/45 bg-[#D4AF37]/10 text-[#B48924] dark:text-[#D4AF37]'
                        : done
                          ? 'border-[#8BC34A]/30 bg-[#8BC34A]/10 text-[#4F7F1B] dark:text-[#8BC34A]'
                          : 'border-brand-border bg-brand-ghost text-brand-secondary dark:border-white/10 dark:bg-transparent dark:text-white/45'
                    }`}
                  >
                    {done ? <CheckCircle2 size={16} /> : <span className="font-black">{itemStep}</span>}
                    <span className="font-semibold">{label}</span>
                  </button>
                );
              }
            )}
          </div>

        </aside>

        <section className="min-w-0 rounded-lg border border-brand-border bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none md:p-7">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Welcome, {firstName}</p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Complete your membership application</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-secondary dark:text-white/50">
              Your details are saved as you progress, and your dashboard opens after admin approval.
            </p>
          </div>

          {(error || notice) && (
            <div
              className={`mb-5 rounded-lg border px-4 py-3 text-sm font-semibold ${
                error
                  ? 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-200'
                  : 'border-[#8BC34A]/30 bg-[#8BC34A]/10 text-[#4F7F1B] dark:text-[#8BC34A]'
              }`}
            >
              {error ? toOptionalErrorMessage(error) : toOptionalErrorMessage(notice)}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step-1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Full Name">
                    <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} className={inputClass(Boolean(form.fullName))} placeholder="Enter full name" />
                  </Field>
                  <Field label="Date of Birth">
                    <input type="date" value={form.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} className={inputClass(Boolean(form.dateOfBirth))} />
                  </Field>
                  <SelectField label="Gender" value={form.gender} onChange={(value) => updateField('gender', value)} options={['Male', 'Female', 'Prefer not to say']} />
                  <Field label="Phone Number">
                    <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} className={inputClass(Boolean(form.phone))} placeholder="+2348012345678" />
                  </Field>
                  <SelectField label="State of Residence" value={form.stateOfResidence} onChange={(value) => updateField('stateOfResidence', value)} options={NIGERIAN_STATES} />
                  <Field label="Occupation">
                    <input value={form.occupation} onChange={(event) => updateField('occupation', event.target.value)} className={inputClass(Boolean(form.occupation))} placeholder="Your occupation" />
                  </Field>
                  <SelectField label="Employment Status" value={form.employmentStatus} onChange={(value) => updateField('employmentStatus', value)} options={['Employed', 'Self-Employed', 'Business Owner', 'Student', 'Retired', 'Other']} />
                  <SelectField label="Monthly Income Range" value={form.monthlyIncome} onChange={(value) => updateField('monthlyIncome', value)} options={['Below N50K', 'N50K-N150K', 'N150K-N500K', 'Above N500K']} />
                </div>
                <Field label="Residential Address">
                  <textarea value={form.residentialAddress} onChange={(event) => updateField('residentialAddress', event.target.value)} className={textareaClass(Boolean(form.residentialAddress))} placeholder="House number, street, city" />
                </Field>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-5">
                <div className="rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4 text-sm leading-6 text-brand-secondary dark:text-white/70">
                  <ShieldCheck className="mb-3 text-[#D4AF37]" size={20} />
                  Your identity information is kept strictly confidential and used only for cooperative compliance.
                </div>
                <Field label="NIN (11 digits)">
                  <input inputMode="numeric" value={form.nin} onChange={(event) => updateField('nin', event.target.value.replace(/\D/g, '').slice(0, 11))} className={inputClass(Boolean(form.nin))} placeholder="12345678901" />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField label="Government ID Type" value={form.kycDocumentType} onChange={(value) => updateField('kycDocumentType', value)} options={['National ID', "Driver's License", 'International Passport', "Voter's Card"]} />
                  <Field label="Upload ID Document">
                    <span className="flex h-12 items-center gap-3 rounded-lg border border-brand-input bg-white px-3 text-base font-semibold text-brand-secondary dark:border-white/10 dark:bg-[#0A0A0A] dark:text-white/55 md:text-sm">
                      <FileUp size={17} className="text-[#D4AF37]" />
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="w-full text-xs text-brand-secondary file:mr-3 file:rounded-md file:border-0 file:bg-[#D4AF37] file:px-3 file:py-1.5 file:text-xs file:font-black file:text-[#0A0A0A] dark:text-white/55" />
                    </span>
                  </Field>
                </div>
                {(form.kycDocumentUrl || kycFile) && (
                  <p className="text-sm font-semibold text-[#4F7F1B] dark:text-[#8BC34A]">
                    ID document ready: {kycFile?.name || form.kycDocumentUrl.split('/').pop()}
                  </p>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Next of Kin Full Name">
                    <input value={form.nextOfKinName} onChange={(event) => updateField('nextOfKinName', event.target.value)} className={inputClass(Boolean(form.nextOfKinName))} placeholder="Full name" />
                  </Field>
                  <SelectField label="Relationship" value={form.nextOfKinRelationship} onChange={(value) => updateField('nextOfKinRelationship', value)} options={['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other']} />
                  <Field label="Next of Kin Phone Number">
                    <input value={form.nextOfKinPhone} onChange={(event) => updateField('nextOfKinPhone', event.target.value)} className={inputClass(Boolean(form.nextOfKinPhone))} placeholder="+2348012345678" />
                  </Field>
                  <Field label="Next of Kin Email (Optional)">
                    <input type="email" value={form.nextOfKinEmail} onChange={(event) => updateField('nextOfKinEmail', event.target.value)} className={inputClass(Boolean(form.nextOfKinEmail))} placeholder="name@example.com" />
                  </Field>
                </div>
                <Field label="Next of Kin Address">
                  <textarea value={form.nextOfKinAddress} onChange={(event) => updateField('nextOfKinAddress', event.target.value)} className={textareaClass(Boolean(form.nextOfKinAddress))} placeholder="Residential address" />
                </Field>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-5">
                <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-brand-border bg-brand-ghost p-4 text-sm leading-7 text-brand-secondary dark:border-white/10 dark:bg-[#0A0A0A] dark:text-white/70">
                  {TERMS_TEXT}
                </div>
                <label className="flex items-start gap-3 rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4">
                  <input type="checkbox" checked={form.termsAccepted} onChange={(event) => updateField('termsAccepted', event.target.checked)} className="mt-1 h-4 w-4 accent-[#D4AF37]" />
                  <span className="text-sm font-semibold leading-6 text-brand-ink dark:text-white/80">
                    I have read and agree to the Smart Save Cooperative Terms & Conditions
                  </span>
                </label>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-5">
                {paymentSubmitted ? (
                  <div className="rounded-lg border border-[#8BC34A]/30 bg-[#8BC34A]/10 p-5 text-center">
                    <CheckCircle2 className="mx-auto text-[#8BC34A]" size={34} />
                    <h2 className="mt-4 text-2xl font-black">Payment Submitted</h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-[#4F7F1B] dark:text-emerald-100/80">
                      Your registration payment has been submitted! Your account will be activated within 24 hours once confirmed.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-5">
                      <p className="text-sm font-black uppercase tracking-widest text-[#D4AF37]">Registration Fee Payment</p>
                      <h2 className="mt-2 text-3xl font-black">Registration Fee Payment — ₦5,000</h2>
                    </div>

                    <BankDetailsCard />

                    <div className="rounded-lg border border-brand-border bg-brand-ghost p-4 text-sm font-semibold leading-7 text-brand-secondary dark:border-white/10 dark:bg-[#0A0A0A] dark:text-white/65">
                      Transfer ₦5,000 to the account above. This is a one-time registration fee. After payment, upload your payment proof below. You may add a transaction reference if available, and your account will be activated once our admin team confirms your payment.
                    </div>

                    <div className="rounded-lg border border-brand-border bg-brand-ghost p-4 dark:border-white/10 dark:bg-[#0A0A0A]">
                      <p className="text-xs font-black uppercase tracking-widest text-brand-secondary dark:text-white/40">Application Summary</p>
                      <div className="mt-4 grid gap-3 text-base md:grid-cols-2 md:text-sm">
                        <Summary label="Name" value={form.fullName} />
                        <Summary label="Phone" value={form.phone} />
                        <Summary label="NIN/ID" value={identitySubmitted ? 'Submitted' : 'Not submitted'} />
                        <Summary label="Next of Kin" value={form.nextOfKinName} />
                        <Summary label="Terms" value={form.termsAccepted ? 'Accepted' : 'Not accepted'} />
                        <Summary label="Email" value={user?.email || ''} />
                      </div>
                    </div>

                    <Field label="Transaction Reference (optional)">
                      <input
                        value={transactionReference}
                        onChange={(event) => {
                          setTransactionReference(event.target.value);
                          setError('');
                          setNotice('');
                        }}
                        className={inputClass(Boolean(transactionReference))}
                        placeholder="Enter transfer reference if available"
                      />
                    </Field>

                    <Field label="Upload Payment proof (required)">
                      <span className="flex min-h-12 items-center gap-3 rounded-lg border border-brand-input bg-white px-3 py-3 text-base font-semibold text-brand-secondary dark:border-white/10 dark:bg-[#0A0A0A] dark:text-white/55 md:text-sm">
                        <FileUp size={17} className="shrink-0 text-[#D4AF37]" />
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={handlePaymentProofChange}
                          className="w-full text-xs text-brand-secondary file:mr-3 file:rounded-md file:border-0 file:bg-[#D4AF37] file:px-3 file:py-1.5 file:text-xs file:font-black file:text-[#0A0A0A] dark:text-white/55"
                        />
                      </span>
                    </Field>

                    {paymentProofFile && (
                      <p className="text-sm font-semibold text-[#4F7F1B] dark:text-[#8BC34A]">
                        Payment proof ready: {paymentProofFile.name}
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-col gap-3 border-t border-brand-border pt-5 dark:border-white/10 md:flex-row md:items-center">
            {step > 1 && (
              <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={isSaving || isPaying} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-ghost px-4 text-base font-black text-brand-ink transition hover:border-brand-input dark:border-white/10 dark:bg-transparent dark:text-white/70 dark:hover:border-white/20 dark:hover:text-white md:h-11 md:w-auto md:text-sm">
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            {!paymentSubmitted && (
              <button type="button" onClick={handleSaveLater} disabled={isSaving || isPaying} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-ghost px-4 text-base font-black text-brand-ink transition hover:border-brand-input dark:border-white/10 dark:bg-transparent dark:text-white/70 dark:hover:border-white/20 dark:hover:text-white md:ml-auto md:h-11 md:w-auto md:text-sm">
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save & Continue Later
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button type="button" onClick={handleContinue} disabled={isSaving || isPaying} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 text-base font-black text-[#0A0A0A] transition hover:bg-[#f0cb63] disabled:cursor-not-allowed disabled:opacity-60 md:h-11 md:w-auto md:text-sm">
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                Continue
              </button>
            ) : (
              <>
                <button type="button" onClick={handlePayment} disabled={isSaving || isPaying || paymentSubmitted} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 text-base font-black text-[#0A0A0A] transition hover:bg-[#f0cb63] disabled:cursor-not-allowed disabled:opacity-60 md:h-11 md:w-auto md:text-sm">
                  {isPaying ? <Loader2 className="animate-spin" size={16} /> : paymentSubmitted ? <CheckCircle2 size={16} /> : <LockKeyhole size={16} />}
                  {paymentSubmitted ? 'Payment Submitted' : 'Submit Payment for Approval'}
                </button>
                {paymentSubmitted && (
                  <button type="button" onClick={() => router.push('/')} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-5 text-base font-black text-[#B48924] transition hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/15 dark:text-[#D4AF37] md:h-11 md:w-auto md:text-sm">
                    Back to Home
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none">
      <p className="text-[11px] font-black uppercase tracking-widest text-brand-secondary dark:text-white/35">{label}</p>
      <p className="mt-1 break-words font-semibold text-brand-ink dark:text-white/80">{value || 'Not set'}</p>
    </div>
  );
}
