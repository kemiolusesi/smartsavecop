import { Suspense } from 'react';
import SignInForm from '@/components/auth/SignInForm';

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-brand-alabaster font-sans text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
          <div className="text-sm text-zinc-500 dark:text-white/40">Loading secure access...</div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
