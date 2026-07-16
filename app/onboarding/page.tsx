import { Suspense } from 'react';
import OnboardingContent from './OnboardingContent';

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-brand-alabaster dark:bg-[#0A0A0A]">
        <div className="text-brand-secondary dark:text-white/40">Loading...</div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
