import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MarketplaceClient, { type Advertisement } from './MarketplaceClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function MarketplacePage() {
  let ads: Advertisement[] = [];
  let error = '';

  try {
    const { data, error: adsError } = await supabaseAnon
      .from('advertisements')
      .select('*')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString().slice(0, 10)}`)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (adsError) throw adsError;
    ads = (data || []) as Advertisement[];
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unable to load marketplace listings.';
  }

  return (
    <main className="min-h-screen bg-[#F8F6F1] font-sans text-[#1A1A1A] dark:bg-[#0A0A0A] dark:text-white">
      <div className="absolute inset-0 brand-grid opacity-40 dark:opacity-60" aria-hidden="true" />
      <Navbar />
      <div className="relative z-10">
        <MarketplaceClient ads={ads} error={error} />
        <Footer />
      </div>
    </main>
  );
}
