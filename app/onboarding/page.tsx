'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader as Loader2, CircleCheck as CheckCircle2, DollarSign } from 'lucide-react';

const FINANCIAL_ARCHETYPES = [
  { id: 'personal-savings', label: 'Personal Savings', description: 'Building personal wealth and independence' },
  { id: 'business-capital', label: 'Business Capital Production', description: 'Growing business operations and revenue' },
  { id: 'emergency-fund', label: 'Emergency Fund Allocation', description: 'Creating financial security cushion' },
  { id: 'education', label: 'Education & Development', description: 'Investing in learning and skills' },
  { id: 'real-estate', label: 'Real Estate Investment', description: 'Property and asset acquisition' },
  { id: 'family-welfare', label: 'Family & Welfare', description: 'Supporting family responsibilities' },
];

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
];

export default function OnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    preferredCurrency: 'NGN',
    financialFocus: 'personal-savings',
    monthlyTarget: '',
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [authLoading, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleArchetypeSelect = (archetypeId: string) => {
    setFormData((prev) => ({ ...prev, financialFocus: archetypeId }));
    setError('');
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        setError('Full name is required');
        return false;
      }
      if (!formData.phone.trim()) {
        setError('Phone number is required');
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (!formData.financialFocus) {
        setError('Please select a financial focus');
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      if (!formData.monthlyTarget || parseFloat(formData.monthlyTarget) <= 0) {
        setError('Please enter a valid monthly target');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setError('');
    setIsSubmitting(true);

    try {
      if (!user?.email) {
        throw new Error('User email not found');
      }

      // Convert monthly target to smallest currency unit (cents for most, base for others)
      const monthlyTargetAmount = parseFloat(formData.monthlyTarget) * 100;

      // Update user profile with all onboarding data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
            full_name: formData.fullName,
            phone: formData.phone,
            preferred_currency: formData.preferredCurrency,
            financial_focus: formData.financialFocus,
            monthly_target: monthlyTargetAmount,
            account_type: 'personal',
            onboarding_completed: true,
            onboarding_step: 3,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        throw profileError;
      }

      // Redirect to dashboard
      await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay for UX
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
      setIsSubmitting(false);
    }
  };

  if (!isClient || authLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" aria-hidden="true">
        <div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(ellipse, #D4AF37 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(ellipse, #9DC03A 0%, transparent 70%)',
          }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="rounded-2xl border-[1px] border-white/5 bg-[#111111]/60 backdrop-blur-xl p-8 space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white">Welcome to Smart Save</h1>
            <p className="text-sm text-white/50">
              Let's set up your profile. Step {step} of 3
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                className="h-1.5 rounded-full"
                animate={{
                  flex: step >= s ? 1 : 0.3,
                  backgroundColor: step >= s ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)',
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-3 rounded-lg border-[1px] bg-red-500/5 p-3 items-start"
              style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              <div className="text-red-400 flex-shrink-0 mt-0.5 font-bold">!</div>
              <p className="text-xs text-red-300">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Identity Parameters */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full py-2.5 px-4 rounded-lg bg-[#0A0A0A] border-[1px] text-sm text-white placeholder-white/20 focus:outline-none transition-all duration-300"
                      style={{
                        borderColor: formData.fullName
                          ? 'rgba(212, 175, 55, 0.5)'
                          : 'rgba(255, 255, 255, 0.05)',
                      }}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234 (example)"
                      className="w-full py-2.5 px-4 rounded-lg bg-[#0A0A0A] border-[1px] text-sm text-white placeholder-white/20 focus:outline-none transition-all duration-300"
                      style={{
                        borderColor: formData.phone
                          ? 'rgba(212, 175, 55, 0.5)'
                          : 'rgba(255, 255, 255, 0.05)',
                      }}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2 block">
                      Preferred Currency
                    </label>
                    <select
                      name="preferredCurrency"
                      value={formData.preferredCurrency}
                      onChange={handleInputChange}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#0A0A0A] border-[1px] text-sm text-white focus:outline-none transition-all duration-300"
                      style={{
                        borderColor: 'rgba(212, 175, 55, 0.5)',
                      }}
                      disabled={isSubmitting}
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Financial Focus */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-4 block">
                      What's Your Primary Financial Goal?
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {FINANCIAL_ARCHETYPES.map((archetype) => (
                        <motion.button
                          key={archetype.id}
                          type="button"
                          onClick={() => handleArchetypeSelect(archetype.id)}
                          className="p-4 rounded-lg border-[1px] transition-all duration-300 text-left"
                          style={{
                            borderColor:
                              formData.financialFocus === archetype.id
                                ? 'rgba(212, 175, 55, 0.8)'
                                : 'rgba(255, 255, 255, 0.1)',
                            backgroundColor:
                              formData.financialFocus === archetype.id
                                ? 'rgba(212, 175, 55, 0.08)'
                                : 'transparent',
                          }}
                          disabled={isSubmitting}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-4 h-4 rounded-full border-[2px] mt-1 flex-shrink-0"
                              style={{
                                borderColor:
                                  formData.financialFocus === archetype.id
                                    ? '#D4AF37'
                                    : 'rgba(255, 255, 255, 0.3)',
                                backgroundColor:
                                  formData.financialFocus === archetype.id ? '#D4AF37' : 'transparent',
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-white text-sm">{archetype.label}</div>
                              <div className="text-xs text-white/50 mt-1">{archetype.description}</div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Monthly Target */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2 block">
                      Monthly Savings Target
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-lg text-white/40">
                        {CURRENCIES.find((c) => c.code === formData.preferredCurrency)?.symbol}
                      </span>
                      <input
                        type="number"
                        name="monthlyTarget"
                        value={formData.monthlyTarget}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full py-3 pl-10 pr-4 rounded-lg bg-[#0A0A0A] border-[1px] text-sm text-white placeholder-white/20 focus:outline-none transition-all duration-300"
                        style={{
                          borderColor: formData.monthlyTarget
                            ? 'rgba(212, 175, 55, 0.5)'
                            : 'rgba(255, 255, 255, 0.05)',
                        }}
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-white/40 mt-3 leading-relaxed">
                      This helps us personalize your Smart Save experience. You can adjust this anytime in your settings.
                    </p>
                  </div>

                  <div className="rounded-lg border-[1px] bg-white/[0.02] p-4" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
                    <div className="flex gap-3">
                      <DollarSign size={16} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-white/60 leading-relaxed">
                        <strong className="text-white">Pro tip:</strong> Starting with a realistic target helps build discipline. You can increase it as you progress.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-lg font-medium text-sm text-white/60 border border-white/10 hover:border-white/20 hover:text-white transition-all"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-[#0A0A0A] flex items-center justify-center gap-2 transition-all duration-300"
                  style={{
                    background: isSubmitting
                      ? 'rgba(212, 175, 55, 0.4)'
                      : 'linear-gradient(135deg, #D4AF37 0%, #F5D06B 50%, #9DC03A 100%)',
                  }}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-[#0A0A0A] flex items-center justify-center gap-2 transition-all duration-300"
                  style={{
                    background: isSubmitting
                      ? 'rgba(212, 175, 55, 0.4)'
                      : 'linear-gradient(135deg, #D4AF37 0%, #F5D06B 50%, #9DC03A 100%)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 size={16} />
                      </motion.div>
                      <span>Completing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Complete Setup</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-xs text-white/40 pt-4">
            Your information is encrypted and secure. You can update this anytime in profile settings.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
