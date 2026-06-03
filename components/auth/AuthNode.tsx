'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

type AuthState = 'input' | 'loading' | 'success' | 'error';

export default function AuthNode() {
  const [authState, setAuthState] = useState<AuthState>('input');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (authState !== 'success') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          setAuthState('input');
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [authState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setAuthState('loading');

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      setAuthState('success');
      setTimeRemaining(data.expiresIn || 600);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setAuthState('error');
    }
  };

  const handleReset = () => {
    setAuthState('input');
    setEmail('');
    setError('');
    setTimeRemaining(600);
  };

  if (!isClient) {
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
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="rounded-2xl border-[1px] border-white/5 bg-[#111111]/60 backdrop-blur-xl p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-bold text-white">Smart Save</h1>
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                Cooperative Node
              </span>
            </div>
            <p className="text-sm text-white/50">Passwordless Sign-In Portal</p>
          </div>

          <AnimatePresence mode="wait">
            {authState === 'input' || authState === 'error' || authState === 'loading' ? (
              <motion.form
                key="input"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-3 rounded-lg border-[1px] bg-red-500/5 p-3 items-start"
                    style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  >
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{error}</p>
                  </motion.div>
                )}

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={14}
                      className="absolute left-3.5 top-2.5 text-white/30 pointer-events-none"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="your@email.com"
                      className="w-full py-2.5 pl-9 pr-4 rounded-lg bg-[#0A0A0A] border-[1px] text-sm text-white placeholder-white/20 focus:outline-none transition-all duration-300"
                      style={{
                        borderColor:
                          email && authState === 'input'
                            ? 'rgba(212, 175, 55, 0.5)'
                            : 'rgba(255, 255, 255, 0.05)',
                      }}
                      disabled={false}
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-white/40 mt-2 font-mono">
                    A secure sign-in link will be sent to this email
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!email}
                  className="w-full py-3 rounded-lg font-semibold text-sm text-[#0A0A0A] relative overflow-hidden group transition-all duration-300 mt-6"
                  style={{
                    background:
                      !email
                        ? 'linear-gradient(135deg, #D4AF37 0%, #F5D06B 50%, #9DC03A 100%)'
                        : 'linear-gradient(135deg, #D4AF37 0%, #F5D06B 50%, #9DC03A 100%)',
                    opacity: !email ? 0.4 : 1,
                  }}
                >
                  {authState === 'loading' ? (
                    <motion.div
                      className="flex items-center justify-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 size={16} />
                      </motion.div>
                      <span>Sending...</span>
                    </motion.div>
                  ) : (
                    'Send Secure Sign-In Link'
                  )}
                </button>
              </motion.form>
            ) : authState === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center text-center space-y-4 py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  >
                    <CheckCircle2 size={48} className="text-[#9DC03A]" />
                  </motion.div>

                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-white">Secure Link Dispatched</h2>
                    <p className="text-sm text-white/50">
                      Check your inbox at <span className="text-white/70 font-mono">{email}</span>
                    </p>
                  </div>

                  <motion.div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Clock size={14} className="text-[#D4AF37]" />
                    <span className="text-sm font-mono text-white/60">
                      Link expires in <span className="text-[#D4AF37] font-semibold">{formatTime(timeRemaining)}</span>
                    </span>
                  </motion.div>

                  <p className="text-xs text-white/40 leading-relaxed max-w-xs">
                    The link will only work once and expires after 10 minutes. If you don't see the email, check your spam folder.
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-lg font-medium text-sm text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all"
                >
                  Try Different Email
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <p className="text-center text-[11px] text-white/40 mt-8">
            We'll never send you unsolicited emails. Unsubscribe anytime.
          </p>
        </div>

        <p className="text-center text-[11px] text-white/30 mt-6 uppercase tracking-wider">
          SEC Regulated | NDIC Insured | Bank-Grade Encryption
        </p>
      </motion.div>
    </div>
  );
}
