'use client';

import { FormEvent, useState } from 'react';
import { Send } from 'lucide-react';
import SmartSelect from '@/components/ui/SmartSelect';
import { toOptionalErrorMessage } from '@/lib/error-message';

const subjects = ['General Inquiry', 'Membership', 'Savings', 'Loans', 'Investment', 'Technical Support', 'Other'];

export default function ContactForm() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    subject: subjects[0],
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice('');
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice('');
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to send message.');
      }

      setForm({ fullName: '', email: '', subject: subjects[0], message: '' });
      setNotice("Message sent! ✓ We'll get back to you within 24-48 hours.");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-brand-border bg-brand-ghost p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
      <label className="flex flex-col gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Full Name</span>
        <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} required className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-semibold outline-none focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Email Address</span>
        <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required className="h-12 rounded-xl border border-brand-border bg-brand-ghost px-4 text-sm font-semibold outline-none focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
      </label>
      <SmartSelect label="Subject" value={form.subject} options={subjects} onChange={(value) => updateField('subject', value)} />
      <label className="flex flex-col gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Message</span>
        <textarea value={form.message} onChange={(event) => updateField('message', event.target.value)} required rows={4} className="min-h-[120px] rounded-xl border border-brand-border bg-brand-ghost px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4AF37] dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
      </label>
      {notice && <p className="rounded-xl border border-[#9DC03A]/20 bg-[#9DC03A]/10 px-3 py-2 text-sm font-semibold text-[#9DC03A]">{notice}</p>}
      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400">{toOptionalErrorMessage(error)}</p>}
      <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-black text-[#0A0A0A] transition hover:bg-[#F5D06B] disabled:opacity-60">
        {isSubmitting ? 'Sending...' : 'Send Message'}
        <Send size={16} />
      </button>
    </form>
  );
}
