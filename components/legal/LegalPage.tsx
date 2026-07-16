import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export type LegalSection = {
  title: string;
  body: string;
};

export default function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated?: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-brand-alabaster text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
      <Navbar />
      <main className="px-4 pb-24 pt-32">
        <section className="mx-auto max-w-3xl">
          <p className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">Smart Save Cooperative</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
          {updated && <p className="mt-4 text-sm font-semibold text-zinc-500 dark:text-white/40">Last updated: {updated}</p>}
        </section>

        <section className="mx-auto mt-12 max-w-3xl space-y-8">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-brand-border bg-brand-ghost p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <h2 className="text-lg font-black text-[#D4AF37]">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/55">{section.body}</p>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}

