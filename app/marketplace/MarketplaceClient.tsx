'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Home, Shirt, ShoppingBag, Sparkles, Store, Sun, UtensilsCrossed } from 'lucide-react';

export type Advertisement = {
  id: string;
  advertiser_name: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  image_url: string | null;
  link_url: string | null;
  contact_email: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  expires_at: string | null;
  created_at: string | null;
};

const categories = [
  { value: 'all', label: 'All' },
  { value: 'products', label: 'Products' },
  { value: 'services', label: 'Services' },
  { value: 'solar', label: 'Solar' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'food', label: 'Food' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'other', label: 'Other' },
];

function normalizeCategory(value?: string | null) {
  return String(value || 'other').toLowerCase().replace(/\s+/g, '_');
}

function formatCategory(value?: string | null) {
  const normalized = normalizeCategory(value);
  return categories.find((category) => category.value === normalized)?.label || 'Other';
}

function categoryIcon(category?: string | null) {
  const normalized = normalizeCategory(category);
  if (normalized.includes('solar')) return Sun;
  if (normalized.includes('real')) return Home;
  if (normalized.includes('food')) return UtensilsCrossed;
  if (normalized.includes('fashion')) return Shirt;
  if (normalized.includes('service')) return Sparkles;
  if (normalized.includes('product')) return ShoppingBag;
  return Store;
}

function contactHref(ad: Advertisement) {
  if (ad.link_url?.trim()) return ad.link_url.trim();
  const email = ad.contact_email?.trim() || 'smartsavecooperative@gmail.com';
  const subject = encodeURIComponent(`Marketplace inquiry: ${ad.title || 'Advertisement'}`);
  return `mailto:${email}?subject=${subject}`;
}

export default function MarketplaceClient({ ads, error }: { ads: Advertisement[]; error?: string }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredAds = useMemo(() => {
    if (activeCategory === 'all') return ads;
    return ads.filter((ad) => normalizeCategory(ad.category) === activeCategory);
  }, [activeCategory, ads]);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D4AF37]">Smart Save Marketplace</p>
          <h1 className="mt-5 text-4xl font-black leading-tight text-[#1A1A1A] dark:text-white sm:text-6xl">Products & Services</h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-[#5C5C5C] dark:text-gray-400">
            Discover offerings from our cooperative community and trusted partners.
          </p>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((category) => {
            const active = activeCategory === category.value;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => setActiveCategory(category.value)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${
                  active
                    ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0A]'
                    : 'border-[#E2DDD5] bg-white text-[#5C5C5C] hover:border-[#D4AF37]/40 hover:text-[#1A1A1A] dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {error}
          </p>
        )}

        {filteredAds.length === 0 ? (
          <div className="mt-10 flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-[#E2DDD5] bg-white p-8 text-center dark:border-gray-700 dark:bg-[#1a1a1a]">
            <ShoppingBag className="h-12 w-12 text-[#D4AF37]" />
            <h2 className="mt-5 text-2xl font-black text-[#1A1A1A] dark:text-white">No listings yet.</h2>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {filteredAds.map((ad) => {
              const Icon = categoryIcon(ad.category);
              return (
                <article
                  key={ad.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-white shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-[#D4AF37]/35 dark:bg-[#1a1a1a] dark:shadow-black/20 ${
                    ad.is_featured ? 'border-[#D4AF37]' : 'border-[#E2DDD5] dark:border-gray-700'
                  }`}
                >
                  {ad.is_featured && (
                    <span className="absolute left-2 top-2 z-10 rounded-full border border-[#D4AF37]/35 bg-white/90 px-2 py-1 text-[10px] font-black text-[#D4AF37] backdrop-blur dark:bg-[#0A0A0A]/85">
                      ⭐ Featured
                    </span>
                  )}
                  {ad.image_url ? (
                    <img src={ad.image_url} alt={ad.title || 'Marketplace listing'} className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-[#F8F6F1] dark:bg-white/[0.04]">
                      <Icon className="h-9 w-9 text-[#D4AF37]" />
                    </div>
                  )}
                  <div className="flex min-h-[210px] flex-col p-3 sm:p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                      {ad.advertiser_name || 'Smart Save Partner'}
                    </p>
                    <h2 className="mt-2 line-clamp-2 text-sm font-black leading-snug text-[#1A1A1A] dark:text-white sm:text-base">{ad.title || 'Untitled listing'}</h2>
                    <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-[#5C5C5C] dark:text-gray-400">{ad.description || 'No description provided.'}</p>
                    <div className="mt-3">
                      <span className="inline-flex rounded-full border border-[#D4AF37]/30 px-2 py-1 text-[10px] font-black text-[#D4AF37]">
                        {formatCategory(ad.category)}
                      </span>
                    </div>
                    <a
                      href={contactHref(ad)}
                      target={ad.link_url ? '_blank' : undefined}
                      rel={ad.link_url ? 'noreferrer' : undefined}
                      className="mt-auto inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 text-xs font-black text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#0A0A0A]"
                    >
                      {ad.link_url ? 'View Details' : 'Contact Advertiser'}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#D4AF37]/25 bg-white p-6 shadow-2xl shadow-black/5 dark:bg-[#1a1a1a] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white">Advertise Your Business Here</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#5C5C5C] dark:text-gray-400">
                Reach hundreds of Smart Save Cooperative members with your product or service. Contact us to get your listing featured.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="mailto:smartsavecooperative@gmail.com?subject=I%20want%20to%20advertise%20on%20Smart%20Save%20Marketplace"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#D4AF37] px-5 text-sm font-black text-[#0A0A0A] transition hover:bg-[#F5D06B]"
              >
                Send Email
              </a>
              <Link
                href="https://wa.me/2348000000000"
                target="_blank"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E2DDD5] bg-[#F8F6F1] px-5 text-sm font-black text-[#1A1A1A] transition hover:border-[#D4AF37]/35 dark:border-gray-700 dark:bg-white/[0.04] dark:text-white"
              >
                WhatsApp Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
