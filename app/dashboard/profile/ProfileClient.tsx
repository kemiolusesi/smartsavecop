'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  EyeOff,
  FileText,
  Hash,
  HelpCircle,
  IdCard,
  Info,
  Key,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Moon,
  Phone,
  Plus,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Star,
  Sun,
  Upload,
  User,
  X,
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { generateBackupCodes, hashBackupCode } from '@/utils/mfa';
import { getAuthErrorMessage } from '@/lib/utils/authError';
import { useIncognito } from '@/components/providers/incognito-provider';
import SmartSelect from '@/components/ui/SmartSelect';

export interface ProfileRecord {
  id?: string | null;
  user_id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  balance?: number | string | null;
  kyc_status?: 'pending' | 'approved' | 'rejected' | string | null;
  has_paid?: boolean | null;
  onboarding_completed?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

type EditableField = 'full_name' | 'phone';
type ExpandedPanel = 'bank' | 'accounts' | 'limits' | 'support' | null;
type ModalType = 'pin' | 'password' | '2fa' | 'terms' | null;
type IdentityVerificationType = 'id_card' | 'nin';
type SecurityStep = 1 | 2 | 3 | 4;
type MfaFactor = { id: string; status?: string; factor_type?: string; friendly_name?: string | null };

type IdentityVerificationRequest = {
  id: string;
  user_id: string;
  verification_type: IdentityVerificationType;
  nin_number: string | null;
  id_card_image_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason?: string | null;
};

const NIGERIAN_BANKS = [
  'GTBank',
  'Access',
  'Zenith',
  'First Bank',
  'UBA',
  'Opay',
  'Kuda',
  'Moniepoint',
  'Sterling',
  'Wema',
  'FCMB',
  'Fidelity',
];

const PASSWORD_RULES = [
  { label: '12 characters minimum', test: (value: string) => value.length >= 12 },
  { label: 'Uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Number', test: (value: string) => /[0-9]/.test(value) },
  { label: 'Special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SS';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'Member';
}

function truncateId(value: string) {
  if (!value) return 'preview';
  return value.length <= 8 ? value : value.slice(0, 8);
}

function formatMonthYear(value?: string | null) {
  if (!value) return 'Pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pending';
  return date.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
}

function formatCurrency(value: number | string | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number(String(value || 0).replace(/,/g, ''));
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

function badgeClass(tone: 'amber' | 'green' | 'red') {
  if (tone === 'green') return 'border-[#9DC03A]/25 bg-[#9DC03A]/10 text-[#9DC03A]';
  if (tone === 'red') return 'border-red-500/25 bg-red-500/10 text-red-400';
  return 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]';
}

function getPasswordStrength(password: string) {
  return PASSWORD_RULES.filter((rule) => rule.test(password)).length;
}

function OtpBoxes({
  value,
  onChange,
  obscured = false,
}: {
  value: string;
  onChange: (value: string) => void;
  obscured?: boolean;
}) {
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || '');

  return (
    <div className="grid grid-cols-6 gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          value={digit}
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, '').slice(-1);
            const updated = digits.slice();
            updated[index] = next;
            onChange(updated.join('').slice(0, 6));
          }}
          type={obscured ? 'password' : 'text'}
          inputMode="numeric"
          maxLength={1}
          className="h-12 rounded-xl border border-brand-border bg-brand-ghost text-center text-lg font-black text-brand-ink outline-none transition focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        />
      ))}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full border transition ${
        checked ? 'border-[#D4AF37]/30 bg-[#D4AF37]' : 'border-brand-border bg-zinc-200 dark:border-white/10 dark:bg-white/10'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-brand-ghost shadow transition dark:bg-white ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

function Category({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-amber dark:text-[#D4AF37]">{title}</p>
        <div className="mt-2 h-px w-16 bg-[#D4AF37]" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-ghost shadow-2xl shadow-zinc-900/[0.03] dark:border-white/[0.08] dark:bg-white/[0.035]">
        {children}
      </div>
    </section>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
      {children}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  onClick,
  right,
  noChevron = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  onClick?: () => void;
  right?: React.ReactNode;
  noChevron?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="flex min-h-[58px] w-full items-center gap-3 border-b border-brand-border px-4 py-3 text-left last:border-b-0 dark:border-white/[0.08]"
    >
      <IconBox>{icon}</IconBox>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-brand-ink dark:text-white">{label}</p>
        {value && <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-white/45">{value}</div>}
      </div>
      {right || (!noChevron && <ChevronRight size={18} className="text-zinc-400 dark:text-white/30" />)}
    </Tag>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-[#D4AF37]/25 bg-[#111111] px-4 py-2 text-xs font-bold text-[#D4AF37] shadow-2xl">
      {message}
    </div>
  );
}

export default function ProfileClient({
  initialProfile,
  authEmail,
  devBypassActive = false,
}: {
  initialProfile: ProfileRecord;
  authEmail: string;
  devBypassActive?: boolean;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { incognito, setIncognito, maskValue } = useIncognito();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savedField, setSavedField] = useState<EditableField | null>(null);
  const [expanded, setExpanded] = useState<ExpandedPanel>(null);
  const [toast, setToast] = useState('');
  const [bankName, setBankName] = useState(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [linkedAccounts, setLinkedAccounts] = useState<Array<{ bank: string; number: string; name: string }>>([]);
  const [modal, setModal] = useState<ModalType>(null);
  const [securityStep, setSecurityStep] = useState<SecurityStep>(1);
  const [otpTarget, setOtpTarget] = useState<'phone' | 'email'>('email');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [identityRequest, setIdentityRequest] = useState<IdentityVerificationRequest | null>(null);
  const [identityType, setIdentityType] = useState<IdentityVerificationType>('id_card');
  const [ninNumber, setNinNumber] = useState('');
  const [idCardImage, setIdCardImage] = useState<File | null>(null);
  const [identitySubmitting, setIdentitySubmitting] = useState(false);
  const [identityError, setIdentityError] = useState('');

  const fullName = profile.full_name || 'Smart Save Member';
  const email = authEmail || profile.email || 'No email on file';
  const memberId = profile.user_id || profile.id || 'preview-member';
  const kycStatus = (profile.kyc_status || 'pending').toLowerCase();
  const identityStatus = (identityRequest?.status || profile.kyc_status || 'pending').toLowerCase();
  const identityBadgeTone = identityStatus === 'approved' ? 'green' : identityStatus === 'rejected' ? 'red' : 'amber';
  const identityBadgeText = identityStatus === 'approved' ? 'Verified' : identityStatus === 'rejected' ? 'Rejected' : 'Pending';
  const identityLocked = identityStatus === 'pending' && Boolean(identityRequest);
  const balanceText = incognito ? maskValue : formatCurrency(profile.balance || 0);
  const passwordScore = getPasswordStrength(newPassword);
  const passwordReady = passwordScore === PASSWORD_RULES.length && newPassword === confirmPassword && newPassword.length > 0;
  const themeIsDark = mounted ? resolvedTheme === 'dark' : true;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = resolvedTheme || 'dark';
  }, [mounted, resolvedTheme]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (devBypassActive) return;

    let isMounted = true;

    const loadMfaFactor = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error || !isMounted) return;

      const factor = data.totp.find((item: MfaFactor) => item.status === 'verified');
      setTwoFactorEnabled(Boolean(factor));
      setMfaFactorId(factor?.id || '');
    };

    loadMfaFactor();

    return () => {
      isMounted = false;
    };
  }, [devBypassActive]);

  useEffect(() => {
    if (devBypassActive) return;

    let isMounted = true;

    const loadIdentityStatus = async () => {
      try {
        const response = await fetch('/api/kyc/identity/status', { cache: 'no-store' });
        const payload = await response.json();
        if (!isMounted || !response.ok || !payload.success) return;
        setIdentityRequest(payload.data || null);
      } catch {
        // Keep the profile page usable if status lookup is unavailable.
      }
    };

    loadIdentityStatus();

    return () => {
      isMounted = false;
    };
  }, [devBypassActive]);

  const showToast = (message: string) => setToast(message);

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
    showToast('Copied to clipboard');
  };

  const beginEdit = (field: EditableField) => {
    setEditingField(field);
    setEditValue(String(field === 'phone' ? profile.phone || profile.phone_number || '' : profile[field] || ''));
  };

  const saveField = async () => {
    if (!editingField) return;
    const value = editValue.trim();

    if (!devBypassActive && profile.user_id) {
      const profileColumn = editingField === 'phone' ? 'phone_number' : editingField;
      const { error } = await supabase.from('profiles').update({ [profileColumn]: value }).eq('user_id', profile.user_id);
      if (error) {
        showToast(error.message || 'Unable to save profile');
        return;
      }
    }

    setProfile((current) => ({ ...current, [editingField]: value, updated_at: new Date().toISOString() }));
    setSavedField(editingField);
    setEditingField(null);
    showToast('Saved');
    window.setTimeout(() => setSavedField(null), 1800);
  };

  const saveBankAccount = async () => {
    if (!/^\d{10}$/.test(accountNumber)) {
      showToast('Enter a valid 10-digit account number');
      return;
    }

    const account = { bank: bankName, number: accountNumber, name: 'Pending verification' };

    if (!devBypassActive && profile.user_id) {
      await supabase.from('bank_accounts').insert({
        user_id: profile.user_id,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: account.name,
      });
    }

    setLinkedAccounts((current) => [account, ...current]);
    setAccountNumber('');
    setExpanded('accounts');
    showToast('Bank account saved for review');
  };

  const submitIdentityVerification = async () => {
    setIdentityError('');

    if (identityType === 'nin' && !/^\d{11}$/.test(ninNumber)) {
      setIdentityError('Enter a valid 11-digit NIN.');
      return;
    }

    if (identityType === 'id_card' && !idCardImage) {
      setIdentityError('Upload a photo of your valid ID card.');
      return;
    }

    if (devBypassActive) {
      const now = new Date().toISOString();
      setIdentityRequest({
        id: `preview-identity-${Date.now()}`,
        user_id: profile.user_id,
        verification_type: identityType,
        nin_number: identityType === 'nin' ? ninNumber : null,
        id_card_image_url: identityType === 'id_card' ? 'preview-upload' : null,
        status: 'pending',
        submitted_at: now,
        reviewed_at: null,
        reviewed_by: null,
      });
      setProfile((current) => ({ ...current, kyc_status: 'pending' }));
      setIdentityModalOpen(false);
      showToast('Identity verification submitted for review');
      return;
    }

    const formData = new FormData();
    formData.set('verificationType', identityType);
    if (identityType === 'nin') {
      formData.set('ninNumber', ninNumber);
    } else if (idCardImage) {
      formData.set('idCardImage', idCardImage);
    }

    try {
      setIdentitySubmitting(true);
      const response = await fetch('/api/kyc/identity', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to submit identity verification.');
      }

      setIdentityRequest(payload.data);
      setProfile((current) => ({ ...current, kyc_status: 'pending' }));
      setIdentityModalOpen(false);
      setNinNumber('');
      setIdCardImage(null);
      showToast('Identity verification submitted for review');
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : 'Unable to submit identity verification.');
    } finally {
      setIdentitySubmitting(false);
    }
  };

  const resetSecurity = () => {
    setSecurityStep(1);
    setOtp('');
    setPin('');
    setConfirmPin('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityError('');
    setMfaVerifyCode('');
  };

  const resetMfaEnrollment = () => {
    setMfaQrCode('');
    setMfaSecret('');
    setMfaBackupCodes([]);
    setMfaLoading(false);
  };

  const openSecurityModal = (type: ModalType) => {
    resetSecurity();
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    resetSecurity();
    if (modal === '2fa' && !twoFactorEnabled) {
      setMfaFactorId('');
    }
    resetMfaEnrollment();
  };

  const startMfaEnrollment = async () => {
    if (devBypassActive) {
      showToast('MFA is unavailable for this session');
      return;
    }

    resetSecurity();
    resetMfaEnrollment();
    setModal('2fa');
    setMfaLoading(true);

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Smart Save Authenticator',
    });

    setMfaLoading(false);

    if (error) {
      setSecurityError(getAuthErrorMessage(error));
      return;
    }

    setMfaFactorId(data.id);
    setMfaQrCode(data.totp.qr_code);
    setMfaSecret(data.totp.secret);
  };

  const verifyMfaEnrollment = async () => {
    if (mfaVerifyCode.length !== 6 || !mfaFactorId) {
      setSecurityError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setMfaLoading(true);
    setSecurityError('');

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: mfaFactorId,
    });

    if (challengeError) {
      setMfaLoading(false);
      setSecurityError(getAuthErrorMessage(challengeError));
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challengeData.id,
      code: mfaVerifyCode,
    });

    if (verifyError) {
      setMfaLoading(false);
      setSecurityError('Invalid code. Please try again.');
      return;
    }

    const codes = generateBackupCodes();
    const rows = await Promise.all(
      codes.map(async (code) => ({
        user_id: profile.user_id,
        code_hash: await hashBackupCode(profile.user_id, code),
      }))
    );

    const { error: deleteError } = await supabase.from('mfa_backup_codes').delete().eq('user_id', profile.user_id);
    const { error: insertError } = deleteError
      ? { error: deleteError }
      : await supabase.from('mfa_backup_codes').insert(rows);

    setMfaLoading(false);

    if (insertError) {
      setSecurityError(insertError.message || 'MFA was enabled, but backup codes could not be saved.');
      return;
    }

    setTwoFactorEnabled(true);
    setMfaBackupCodes(codes);
    setSecurityStep(4);
  };

  const disableMfa = async () => {
    if (!window.confirm('Disabling 2FA reduces your account security. Are you sure?')) {
      return;
    }

    const factorId = mfaFactorId;
    if (!factorId) {
      setTwoFactorEnabled(false);
      return;
    }

    setMfaLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (!error) {
      await supabase.from('mfa_backup_codes').delete().eq('user_id', profile.user_id);
    }
    setMfaLoading(false);

    if (error) {
      showToast(getAuthErrorMessage(error));
      return;
    }

    setMfaFactorId('');
    setTwoFactorEnabled(false);
    showToast('Two-factor authentication disabled');
  };

  const updatePassword = async () => {
    if (!passwordReady) {
      setSecurityError('Use a stronger password and make sure both fields match.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setSecurityError(getAuthErrorMessage(error));
      return;
    }

    setSecurityStep(4);
    window.setTimeout(async () => {
      await supabase.auth.signOut();
      router.replace('/signin?mode=login');
    }, 1400);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/signin?mode=login');
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-alabaster px-4 py-6 font-sans text-brand-ink dark:bg-[#0A0A0A] dark:text-white sm:py-8">
      <div className="absolute inset-0 brand-grid opacity-60" aria-hidden="true" />
      <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" aria-hidden="true" />

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-brand-ghost text-brand-ink transition hover:border-[#D4AF37]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={22} />
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <Image src="/logo.png" alt="Smart Save" width={46} height={46} className="h-11 w-auto shrink-0" priority />
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">Profile & Settings</h1>
          </div>
        </header>

        {incognito && (
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-xs font-bold text-[#D4AF37]">
            Incognito mode on — balances hidden
          </div>
        )}

        <section className="rounded-3xl border border-brand-border bg-brand-ghost p-6 shadow-2xl shadow-zinc-900/[0.04] dark:border-white/[0.08] dark:bg-white/[0.035]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37] text-2xl font-black text-[#0A0A0A] shadow-xl shadow-[#D4AF37]/10">
              <User size={36} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-4xl font-black tracking-tight">Hello, {getFirstName(fullName)}!</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-white/45">
                <span>Member ID: {truncateId(memberId)}</span>
                <button type="button" onClick={() => copyText(memberId)} className="text-[#D4AF37]">
                  <Copy size={14} />
                </button>
                <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-1 text-[#D4AF37]">
                  Balance: {balanceText}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => showToast('Referral system coming soon')}
            className="hidden"
          >
            <Plus size={18} />
            Invite friends · Earn referral bonus
          </button>
        </section>

        <Category title="Personal Data">
          <Row icon={<User size={20} />} label="Full Name" value={profile.full_name || 'Not set'} onClick={() => beginEdit('full_name')} />
          {editingField === 'full_name' && (
            <InlineEditor value={editValue} onChange={setEditValue} onCancel={() => setEditingField(null)} onSave={saveField} saved={savedField === 'full_name'} />
          )}
          <Row icon={<Phone size={20} />} label="Phone Number" value={profile.phone || profile.phone_number || 'Not set'} onClick={() => beginEdit('phone')} />
          {editingField === 'phone' && (
            <InlineEditor value={editValue} onChange={setEditValue} onCancel={() => setEditingField(null)} onSave={saveField} saved={savedField === 'phone'} />
          )}
          <Row icon={<Mail size={20} />} label="Email Address" value={email} noChevron />
          <Row
            icon={<Shield size={20} />}
            label="KYC Status"
            right={
              <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${badgeClass(kycStatus === 'approved' ? 'green' : kycStatus === 'rejected' ? 'red' : 'amber')}`}>
                {kycStatus}
              </span>
            }
            noChevron
          />
          <Row
            icon={<IdCard size={20} />}
            label="Identity Verification"
            value={
              identityLocked
                ? 'Your details are under admin review'
                : identityStatus === 'approved'
                  ? 'Identity approved by admin'
                  : 'Upload ID card or submit your 11-digit NIN'
            }
            right={
              <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${badgeClass(identityBadgeTone)}`}>
                {identityBadgeText}
              </span>
            }
            onClick={identityLocked || identityStatus === 'approved' ? undefined : () => setIdentityModalOpen(true)}
            noChevron={identityLocked || identityStatus === 'approved'}
          />
          <Row icon={<Calendar size={20} />} label="Member Since" value={formatMonthYear(profile.created_at)} noChevron />
          <Row
            icon={<Hash size={20} />}
            label="Member ID"
            value={truncateId(memberId)}
            right={
              <button type="button" onClick={() => copyText(memberId)} className="text-[#D4AF37]">
                <Copy size={17} />
              </button>
            }
            noChevron
          />
        </Category>

        <Category title="Account Management">
          <Row icon={<Building2 size={20} />} label="Link Bank Account" value="Add a payout or funding account" onClick={() => setExpanded(expanded === 'bank' ? null : 'bank')} />
          {expanded === 'bank' && (
            <div className="space-y-4 border-b border-brand-border px-4 py-4 dark:border-white/[0.08]">
              <SmartSelect value={bankName} options={NIGERIAN_BANKS} onChange={setBankName} />
              <input
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit account number"
                inputMode="numeric"
                className="h-12 w-full rounded-xl border border-brand-border bg-brand-ghost px-3 text-sm font-bold outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
              <input value="Pending verification" readOnly className="h-12 w-full rounded-xl border border-brand-border bg-zinc-50 px-3 text-sm font-bold text-zinc-500 outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white/40" />
              <p className="text-xs text-zinc-500 dark:text-white/45">Bank verification powered by your cooperative admin</p>
              <button type="button" onClick={saveBankAccount} className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#0A0A0A]">
                Save Account
              </button>
            </div>
          )}
          <Row icon={<Layers size={20} />} label="Manage Linked Accounts" value="View saved bank accounts" onClick={() => setExpanded(expanded === 'accounts' ? null : 'accounts')} />
          {expanded === 'accounts' && (
            <div className="border-b border-brand-border px-4 py-4 text-sm dark:border-white/[0.08]">
              {linkedAccounts.length === 0 ? (
                <div className="flex items-center justify-between rounded-xl border border-dashed border-brand-border p-4 text-zinc-500 dark:border-white/10 dark:text-white/45">
                  <span>No accounts linked yet</span>
                  <span className="rounded-full bg-[#D4AF37]/10 px-2 py-1 text-xs font-black text-[#D4AF37]">+ Add Account</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedAccounts.map((account) => (
                    <div key={`${account.bank}-${account.number}`} className="rounded-xl border border-brand-border p-3 dark:border-white/10">
                      <p className="font-black">{account.bank}</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-white/45">{account.number} · {account.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Category>

        <Category title="Settings">
          <Row icon={<SlidersHorizontal size={20} />} label="Transaction Limits" value="Daily thresholds" onClick={() => setExpanded(expanded === 'limits' ? null : 'limits')} />
          {expanded === 'limits' && (
            <div className="border-b border-brand-border px-4 py-4 text-sm leading-7 text-zinc-600 dark:border-white/[0.08] dark:text-white/55">
              <p className="font-black text-brand-ink dark:text-white">Withdrawal Rules:</p>
              <p>Full registered members may withdraw once per quarter (every 3 months)</p>
              <p>Maximum withdrawal: 60% of total contributions</p>
              <p>Investment account holders are subject to the terms of their specific investment plan</p>
              <p>Withdrawal requests are reviewed by admin within 2-3 business days</p>
              <p>Contact admin to discuss special circumstances: smartsavecooperative@gmail.com</p>
            </div>
          )}
          <Row
            icon={themeIsDark ? <Moon size={20} /> : <Sun size={20} />}
            label="Theme"
            value={themeIsDark ? 'Dark mode' : 'Light mode'}
            right={<Switch checked={themeIsDark} onChange={(checked) => setTheme(checked ? 'dark' : 'light')} />}
            noChevron
          />
          <Row
            icon={<EyeOff size={20} />}
            label="Incognito Mode"
            value="Hide balance amounts"
            right={<Switch checked={incognito} onChange={setIncognito} />}
            noChevron
          />
        </Category>

        <Category title="Security">
          <Row icon={<Lock size={20} />} label="Change Transaction PIN" value="6-digit payout authorization" onClick={() => openSecurityModal('pin')} />
          <Row icon={<Key size={20} />} label="Change Password" value="Update login credentials" onClick={() => openSecurityModal('password')} />
          <Row
            icon={<Smartphone size={20} />}
            label="Two-Factor Authentication"
            value={twoFactorEnabled ? 'On' : 'Off'}
            right={<Switch checked={twoFactorEnabled} onChange={(checked) => { if (checked) startMfaEnrollment(); else disableMfa(); }} />}
            noChevron
          />
        </Category>

        <Category title="About">
          <Row icon={<HelpCircle size={20} />} label="Support & Contact" value="Email, WhatsApp, social handles" onClick={() => setExpanded(expanded === 'support' ? null : 'support')} />
          {expanded === 'support' && (
            <div className="space-y-2 border-b border-brand-border px-4 py-4 text-sm text-zinc-600 dark:border-white/[0.08] dark:text-white/55">
              <p>Email: smartsavecooperative@gmail.com</p>
              <p>Phone: +234 903 421 4726 | +234 903 543 1380</p>
              <p>WhatsApp: +234 901 019 8072</p>
              <div className="flex gap-2 pt-2">
                <a href="https://instagram.com/smartsavecoop" target="_blank" rel="noreferrer" className="rounded-full border border-brand-border px-3 py-1 text-xs font-black dark:border-white/10">Instagram</a>
                <a href="https://wa.me/2349010198072" target="_blank" rel="noreferrer" className="rounded-full border border-brand-border px-3 py-1 text-xs font-black dark:border-white/10">WhatsApp</a>
              </div>
            </div>
          )}
          <Row icon={<Star size={20} />} label="Rate Smart Save" value="Share feedback" onClick={() => showToast('Thank you! Rating feature coming soon.')} />
          <Row icon={<FileText size={20} />} label="Terms & Privacy Policy" value="Legal documents" onClick={() => setModal('terms')} />
          <Row icon={<Info size={20} />} label="App Version" value="Smart Save Cooperative v1.0.0" noChevron />
        </Category>

        <section className="pb-10 pt-2">
          {!confirmLogout ? (
            <button type="button" onClick={() => setConfirmLogout(true)} className="flex w-full items-center gap-3 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-4 text-left text-sm font-black text-[#D4AF37]">
              <LogOut size={20} />
              Log Out
            </button>
          ) : (
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
              <p className="text-sm font-black text-[#D4AF37]">Are you sure?</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={logout} className="flex-1 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-black text-[#0A0A0A]">Yes</button>
                <button type="button" onClick={() => setConfirmLogout(false)} className="flex-1 rounded-xl border border-brand-border px-4 py-2 text-sm font-bold dark:border-white/10">Cancel</button>
              </div>
            </div>
          )}
        </section>
      </section>

      {identityModalOpen && (
        <IdentityVerificationModal
          type={identityType}
          setType={(nextType) => {
            setIdentityType(nextType);
            setIdentityError('');
            setNinNumber('');
            setIdCardImage(null);
          }}
          ninNumber={ninNumber}
          setNinNumber={setNinNumber}
          idCardImage={idCardImage}
          setIdCardImage={setIdCardImage}
          error={identityError}
          submitting={identitySubmitting}
          onSubmit={submitIdentityVerification}
          onClose={() => {
            if (identitySubmitting) return;
            setIdentityModalOpen(false);
            setIdentityError('');
          }}
        />
      )}

      {modal && (
        <SecurityModal
          modal={modal}
          closeModal={closeModal}
          otpTarget={otpTarget}
          setOtpTarget={setOtpTarget}
          otp={otp}
          setOtp={setOtp}
          securityStep={securityStep}
          setSecurityStep={setSecurityStep}
          pin={pin}
          setPin={setPin}
          confirmPin={confirmPin}
          setConfirmPin={setConfirmPin}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          securityError={securityError}
          setSecurityError={setSecurityError}
          passwordReady={passwordReady}
          passwordScore={passwordScore}
          showToast={showToast}
          updatePassword={updatePassword}
          mfaQrCode={mfaQrCode}
          mfaSecret={mfaSecret}
          mfaVerifyCode={mfaVerifyCode}
          setMfaVerifyCode={setMfaVerifyCode}
          mfaBackupCodes={mfaBackupCodes}
          mfaLoading={mfaLoading}
          verifyMfaEnrollment={verifyMfaEnrollment}
          email={email}
          phone={profile.phone || profile.phone_number || ''}
        />
      )}

      {toast && <Toast message={toast} />}
    </main>
  );
}

function InlineEditor({
  value,
  onChange,
  onSave,
  onCancel,
  saved,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saved: boolean;
}) {
  return (
    <div className="flex gap-2 border-b border-brand-border px-4 pb-4 dark:border-white/[0.08]">
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-brand-border bg-brand-ghost px-3 text-sm font-bold outline-none focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
      <button type="button" onClick={onSave} className="rounded-xl bg-[#D4AF37] px-3 text-xs font-black text-[#0A0A0A]">{saved ? 'Saved' : 'Save'}</button>
      <button type="button" onClick={onCancel} className="rounded-xl border border-brand-border px-3 text-xs font-bold dark:border-white/10">Cancel</button>
    </div>
  );
}

function IdentityVerificationModal({
  type,
  setType,
  ninNumber,
  setNinNumber,
  idCardImage,
  setIdCardImage,
  error,
  submitting,
  onSubmit,
  onClose,
}: {
  type: IdentityVerificationType;
  setType: (type: IdentityVerificationType) => void;
  ninNumber: string;
  setNinNumber: (value: string) => void;
  idCardImage: File | null;
  setIdCardImage: (file: File | null) => void;
  error: string;
  submitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/75 px-4 backdrop-blur-xl">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-brand-border bg-brand-ghost shadow-2xl shadow-black/30 dark:border-white/[0.08] dark:bg-[#101010]">
        <div className="flex items-start justify-between gap-4 border-b border-brand-border px-5 py-5 dark:border-white/[0.08]">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-brand-amber dark:text-[#D4AF37]">
              Identity Verification
            </p>
            <h2 className="mt-1 text-2xl font-black text-brand-ink dark:text-white">Verify your identity</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-white/45">
              Choose one verification method. Your identity details will be reviewed by an admin within 24-48 hours.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-border text-zinc-500 transition hover:text-brand-ink disabled:opacity-50 dark:border-white/10 dark:text-white/45 dark:hover:text-white"
            aria-label="Close identity verification"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setType('id_card')}
              className={`rounded-2xl border p-4 text-left transition ${
                type === 'id_card'
                  ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10'
                  : 'border-brand-border bg-zinc-50 dark:border-white/10 dark:bg-white/[0.035]'
              }`}
            >
              <div className="flex items-center gap-3">
                <IconBox>
                  <Upload size={18} />
                </IconBox>
                <div>
                  <p className="text-sm font-black text-brand-ink dark:text-white">Upload ID card</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-white/40">
                    NIN slip, voter&apos;s card, driver&apos;s licence, or passport.
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType('nin')}
              className={`rounded-2xl border p-4 text-left transition ${
                type === 'nin'
                  ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10'
                  : 'border-brand-border bg-zinc-50 dark:border-white/10 dark:bg-white/[0.035]'
              }`}
            >
              <div className="flex items-center gap-3">
                <IconBox>
                  <IdCard size={18} />
                </IconBox>
                <div>
                  <p className="text-sm font-black text-brand-ink dark:text-white">Enter NIN</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-white/40">
                    Submit your 11-digit National Identification Number.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {type === 'id_card' ? (
            <label className="block cursor-pointer rounded-2xl border border-dashed border-[#D4AF37]/35 bg-[#D4AF37]/[0.04] p-5 text-center">
              <Upload className="mx-auto h-7 w-7 text-[#D4AF37]" />
              <p className="mt-3 text-sm font-black text-brand-ink dark:text-white">
                {idCardImage ? idCardImage.name : 'Upload a clear ID card photo'}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-white/40">PNG, JPG, or WebP image</p>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => setIdCardImage(event.target.files?.[0] || null)}
              />
            </label>
          ) : (
            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">
                National Identification Number
              </span>
              <input
                value={ninNumber}
                onChange={(event) => setNinNumber(event.target.value.replace(/\D/g, '').slice(0, 11))}
                inputMode="numeric"
                placeholder="11-digit NIN"
                className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-black outline-none transition focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
          )}

          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4 text-sm leading-6 text-zinc-600 dark:text-white/55">
            <p className="font-black text-[#D4AF37]">Review note</p>
            <p className="mt-1">Your identity details will be reviewed by an admin within 24-48 hours.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
              {typeof error === 'string' ? error : getAuthErrorMessage(error)}
            </div>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#0A0A0A] transition hover:bg-[#F5D06B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Submit for review
          </button>
        </div>
      </div>
    </div>
  );
}

function SecurityModal(props: {
  modal: ModalType;
  closeModal: () => void;
  otpTarget: 'phone' | 'email';
  setOtpTarget: (value: 'phone' | 'email') => void;
  otp: string;
  setOtp: (value: string) => void;
  securityStep: SecurityStep;
  setSecurityStep: (value: SecurityStep) => void;
  pin: string;
  setPin: (value: string) => void;
  confirmPin: string;
  setConfirmPin: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  securityError: string;
  setSecurityError: (value: string) => void;
  passwordReady: boolean;
  passwordScore: number;
  showToast: (message: string) => void;
  updatePassword: () => void;
  mfaQrCode: string;
  mfaSecret: string;
  mfaVerifyCode: string;
  setMfaVerifyCode: (value: string) => void;
  mfaBackupCodes: string[];
  mfaLoading: boolean;
  verifyMfaEnrollment: () => void;
  email: string;
  phone: string;
}) {
  const {
    modal,
    closeModal,
    otpTarget,
    setOtpTarget,
    otp,
    setOtp,
    securityStep,
    setSecurityStep,
    pin,
    setPin,
    confirmPin,
    setConfirmPin,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    securityError,
    setSecurityError,
    passwordReady,
    passwordScore,
    showToast,
    updatePassword,
    mfaQrCode,
    mfaSecret,
    mfaVerifyCode,
    setMfaVerifyCode,
    mfaBackupCodes,
    mfaLoading,
    verifyMfaEnrollment,
    email,
    phone,
  } = props;

  const title =
    modal === 'pin' ? 'Change Transaction PIN' : modal === 'password' ? 'Change Password' : modal === '2fa' ? 'Two-Factor Authentication' : 'Terms & Privacy Policy';

  const proceedFromOtp = () => {
    if (otp.length !== 6) {
      setSecurityError('Enter the 6-digit verification code.');
      return;
    }
    setSecurityError('');
    setSecurityStep(2);
  };

  const finishPin = () => {
    if (pin.length !== 6 || confirmPin.length !== 6) {
      setSecurityError('Enter a complete 6-digit PIN.');
      return;
    }
    if (pin !== confirmPin) {
      setSecurityError('PINs do not match');
      return;
    }
    setSecurityError('');
    setSecurityStep(4);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/75 px-4 backdrop-blur-xl">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-brand-border bg-brand-ghost shadow-2xl dark:border-white/10 dark:bg-[#111111]">
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4 dark:border-white/10">
          <h3 className="text-lg font-black">{title}</h3>
          <button type="button" onClick={closeModal} className="text-zinc-500 dark:text-white/50">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {modal === '2fa' && securityStep === 1 && (
            <>
              <p className="text-sm leading-6 text-zinc-600 dark:text-white/55">
                Scan this QR code with Google Authenticator, Authy, or any TOTP app
              </p>
              <div className="flex justify-center rounded-2xl border border-brand-border bg-brand-ghost p-4 dark:border-white/10 dark:bg-white">
                {mfaLoading ? (
                  <div className="flex h-56 w-56 items-center justify-center text-sm font-bold text-zinc-500">
                    Preparing QR code...
                  </div>
                ) : mfaQrCode ? (
                  <img src={mfaQrCode} alt="Authenticator app QR code" className="h-56 w-56" />
                ) : (
                  <div className="flex h-56 w-56 items-center justify-center text-center text-sm font-bold text-red-400">
                    Unable to load QR code
                  </div>
                )}
              </div>
              {mfaSecret && (
                <div className="rounded-xl border border-brand-border bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">
                    Manual entry secret
                  </p>
                  <p className="mt-2 break-all font-mono text-sm font-black text-brand-ink dark:text-white">{mfaSecret}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setSecurityError('');
                  setSecurityStep(2);
                }}
                disabled={!mfaQrCode || mfaLoading}
                className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {modal === '2fa' && securityStep === 2 && (
            <>
              <p className="text-sm leading-6 text-zinc-600 dark:text-white/55">
                Enter the 6-digit code from your authenticator app.
              </p>
              <OtpBoxes value={mfaVerifyCode} onChange={setMfaVerifyCode} />
              <button
                type="button"
                onClick={verifyMfaEnrollment}
                disabled={mfaLoading || mfaVerifyCode.length !== 6}
                className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </>
          )}

          {modal === '2fa' && securityStep === 4 && (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#9DC03A]/35 bg-[#9DC03A]/10 text-[#9DC03A]">
                <Check size={34} />
              </div>
              <p className="mt-4 text-lg font-black">Two-Factor Authentication Enabled</p>
              <button
                type="button"
                onClick={() => setSecurityStep(3)}
                className="mt-6 w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#0A0A0A]"
              >
                View Backup Codes
              </button>
            </div>
          )}

          {modal === '2fa' && securityStep === 3 && (
            <>
              <p className="text-sm leading-6 text-zinc-600 dark:text-white/55">
                Save these codes somewhere safe. Each can be used once if you lose access to your authenticator app.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {mfaBackupCodes.map((code) => (
                  <div
                    key={code}
                    className="rounded-xl border border-brand-border bg-zinc-50 px-3 py-2 text-center font-mono text-sm font-black tracking-widest dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(mfaBackupCodes.join('\n'));
                  showToast('Backup codes copied');
                }}
                className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm font-bold dark:border-white/10"
              >
                Copy Codes
              </button>
              <button type="button" onClick={closeModal} className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#0A0A0A]">
                I&apos;ve Saved My Codes
              </button>
            </>
          )}
          {modal === 'terms' && <p className="text-sm leading-6 text-zinc-600 dark:text-white/55">Full terms and privacy policy document will be available here.</p>}

          {(modal === 'pin' || modal === 'password') && securityStep === 1 && (
            <>
              <p className="text-sm text-zinc-600 dark:text-white/55">We&apos;ll send a verification code to:</p>
              <div className="grid grid-cols-2 gap-2">
                {(['phone', 'email'] as const).map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => setOtpTarget(target)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black ${
                      otpTarget === target ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-brand-border dark:border-white/10'
                    }`}
                  >
                    {target === 'phone' ? 'Phone Number' : 'Email Address'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 dark:text-white/40">{otpTarget === 'phone' ? phone || 'No phone number set' : email}</p>
              <OtpBoxes value={otp} onChange={setOtp} />
              <button type="button" onClick={() => showToast('Code sent')} className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm font-bold dark:border-white/10">
                Send Code
              </button>
              <button type="button" onClick={proceedFromOtp} className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#0A0A0A]">
                Proceed
              </button>
            </>
          )}

          {modal === 'pin' && securityStep === 2 && (
            <>
              <p className="text-sm font-bold">Enter your new 6-digit transaction PIN</p>
              <OtpBoxes value={pin} onChange={setPin} obscured />
              <button type="button" onClick={() => setSecurityStep(3)} className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#0A0A0A]">
                Continue
              </button>
            </>
          )}

          {modal === 'pin' && securityStep === 3 && (
            <>
              <p className="text-sm font-bold">Confirm your new PIN</p>
              <OtpBoxes value={confirmPin} onChange={setConfirmPin} obscured />
              <button type="button" onClick={finishPin} className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#0A0A0A]">
                Update PIN
              </button>
            </>
          )}

          {modal === 'password' && securityStep === 2 && (
            <>
              <input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
                placeholder="New password"
                className="h-12 w-full rounded-xl border border-brand-border bg-brand-ghost px-3 text-sm font-bold outline-none focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
                placeholder="Confirm password"
                className="h-12 w-full rounded-xl border border-brand-border bg-brand-ghost px-3 text-sm font-bold outline-none focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
              <div className="rounded-xl border border-brand-border p-3 dark:border-white/10">
                <div className="mb-3 grid grid-cols-5 gap-1">
                  {PASSWORD_RULES.map((rule, index) => (
                    <div key={rule.label} className={`h-1 rounded-full ${index < props.passwordScore ? 'bg-[#D4AF37]' : 'bg-zinc-200 dark:bg-white/10'}`} />
                  ))}
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(newPassword);
                    return (
                      <span key={rule.label} className={met ? 'text-[#D4AF37]' : 'text-zinc-500 dark:text-white/35'}>
                        {met ? '✓' : '○'} {rule.label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button type="button" onClick={updatePassword} disabled={!passwordReady} className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50">
                Update Password
              </button>
            </>
          )}

          {modal !== '2fa' && securityStep === 4 && (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full border border-[#9DC03A]/35 bg-[#9DC03A]/10 text-[#9DC03A]">
                <Check size={34} />
              </div>
              <p className="mt-4 text-lg font-black">
                {modal === 'password' ? 'Password updated. Please log in again.' : 'PIN updated successfully'}
              </p>
            </div>
          )}

          {securityError && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400">{securityError}</p>}
        </div>
      </div>
    </div>
  );
}
