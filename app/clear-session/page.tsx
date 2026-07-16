'use client';

import { useEffect, useState } from 'react';

function clearBrowserCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (!name) return;

    document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/`;
    document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/;domain=localhost`;
    document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/;domain=127.0.0.1`;
  });
}

export default function ClearSessionPage() {
  const [message, setMessage] = useState('Clearing local session...');

  useEffect(() => {
    async function clearSession() {
      try {
        await fetch('/api/auth/clear-session', { cache: 'no-store' });
      } catch {
        // Continue with local cleanup even if the server endpoint is unavailable.
      }

      try {
        clearBrowserCookies();
        window.localStorage.clear();
        window.sessionStorage.clear();
      } catch {
        // If browser storage is unavailable, still continue to redirect.
      }

      setMessage('Session cleared. Redirecting to signin...');
      window.setTimeout(() => {
        window.location.replace('/signin?cleared=1');
      }, 600);
    }

    clearSession();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-alabaster px-4 font-sans text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
      <section className="w-full max-w-sm rounded-2xl border border-brand-border bg-brand-ghost p-6 text-center shadow-2xl shadow-zinc-900/[0.06] dark:border-white/10 dark:bg-white/[0.04]">
        <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Smart Save Cooperative</p>
        <h1 className="mt-3 text-2xl font-black">Resetting Access</h1>
        <p className="mt-3 text-sm font-semibold text-zinc-500 dark:text-white/45">{message}</p>
      </section>
    </main>
  );
}
