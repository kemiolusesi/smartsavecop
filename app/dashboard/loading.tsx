export default function DashboardLoading() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-alabaster px-4 text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
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
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#D4AF37]/25 border-t-[#D4AF37]" />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#D4AF37]">Smart Save</p>
          <p className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">Loading dashboard...</p>
        </div>
      </div>
    </main>
  );
}
