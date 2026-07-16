export default function AdminLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 text-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#D4AF37]/25 border-t-[#D4AF37]" />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#D4AF37]">Smart Save</p>
          <p className="mt-1 text-xs font-semibold text-white/50">Loading admin workspace...</p>
        </div>
      </div>
    </main>
  );
}
