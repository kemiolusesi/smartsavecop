'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Search, ShoppingBag, Star, Trash2, Upload, X } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { toErrorMessage } from '@/lib/error-message';

type Advertisement = {
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
  { value: 'general', label: 'General' },
  { value: 'products', label: 'Products' },
  { value: 'services', label: 'Services' },
  { value: 'solar', label: 'Solar' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'food', label: 'Food' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'other', label: 'Other' },
];
const maxDescriptionLength = 300;

function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
}

function formatCategory(value?: string | null) {
  const normalized = String(value || 'other').toLowerCase().replace(/\s+/g, '_');
  return categories.find((category) => category.value === normalized)?.label || 'Other';
}

function StatusBadge({ active }: { active?: boolean | null }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${
        active ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/[0.04] text-white/45'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  tone = 'amber',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: 'amber' | 'green' | 'red' | 'neutral';
  disabled?: boolean;
}) {
  const className =
    tone === 'green'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15'
      : tone === 'red'
        ? 'border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/15'
        : tone === 'neutral'
          ? 'border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.07]'
          : 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/15';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[36px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export default function MarketplaceAdminClient() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploadWarning, setUploadWarning] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    advertiserName: '',
    title: '',
    description: '',
    category: 'products',
    linkUrl: '',
    contactEmail: '',
    isFeatured: false,
    expiresAt: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const filteredAds = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ads;
    return ads.filter((ad) =>
      [ad.title, ad.advertiser_name, ad.category, ad.description].some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [ads, search]);

  async function loadListings() {
    try {
      setLoading(true);
      setError('');
      const { data, error: listingsError } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;
      setAds((data || []) as Advertisement[]);
    } catch (err) {
      setError(toErrorMessage(err, 'Unable to load marketplace listings.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, []);

  async function uploadImage(file: File) {
    const filePath = `${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from('advertisement-images')
      .upload(filePath, file, { upsert: false, contentType: file.type });

    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('advertisement-images').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function publishListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving('publish');
    setError('');
    setNotice('');
    setUploadWarning('');

    try {
      let imageUrl = '';

      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile);
        } catch {
          setUploadWarning('Image upload failed — listing saved without image.');
        }
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      const { error: insertError } = await supabase.from('advertisements').insert({
        advertiser_name: form.advertiserName.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        image_url: imageUrl || null,
        link_url: form.linkUrl.trim() || null,
        contact_email: form.contactEmail.trim() || null,
        is_featured: form.isFeatured,
        is_active: true,
        expires_at: form.expiresAt || null,
        created_by: user?.id || null,
      });

      if (insertError) throw insertError;

      setNotice('Listing published successfully!');
      setForm({
        advertiserName: '',
        title: '',
        description: '',
        category: 'products',
        linkUrl: '',
        contactEmail: '',
        isFeatured: false,
        expiresAt: '',
      });
      setImageFile(null);
      await loadListings();
    } catch (err) {
      setError(toErrorMessage(err, 'Unable to publish listing.'));
    } finally {
      setSaving('');
    }
  }

  async function updateListing(id: string, values: Partial<Advertisement>, successMessage: string) {
    try {
      setSaving(id);
      setError('');
      setNotice('');
      const { error: updateError } = await supabase.from('advertisements').update(values).eq('id', id);
      if (updateError) throw updateError;
      setNotice(successMessage);
      await loadListings();
    } catch (err) {
      setError(toErrorMessage(err, 'Unable to update listing.'));
    } finally {
      setSaving('');
    }
  }

  async function deleteListing(ad: Advertisement) {
    if (!window.confirm(`Delete "${ad.title || 'this listing'}"? This cannot be undone.`)) return;

    try {
      setSaving(ad.id);
      setError('');
      setNotice('');
      const { error: deleteError } = await supabase.from('advertisements').delete().eq('id', ad.id);
      if (deleteError) throw deleteError;
      setNotice('Listing deleted.');
      await loadListings();
    } catch (err) {
      setError(toErrorMessage(err, 'Unable to delete listing.'));
    } finally {
      setSaving('');
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Admin Control Center</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
              <ShoppingBag size={20} />
            </span>
            <h1 className="min-w-0 text-3xl font-black leading-tight">Marketplace Management</h1>
          </div>
          <div>
            <p className="mt-2 text-sm font-semibold text-white/45">Add and manage advertisements shown on the public marketplace page.</p>
          </div>
        </div>
      </section>

      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</p>}
      {notice && <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300">{notice}</p>}
      {uploadWarning && <p className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-sm font-semibold text-[#D4AF37]">{uploadWarning}</p>}

      <section className="rounded-lg border border-white/10 bg-white/[0.035]">
        <div className="border-b border-white/10 px-4 py-4">
          <h2 className="text-xl font-black">Create New Listing</h2>
        </div>
        <form onSubmit={publishListing} className="grid gap-4 p-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white/35">Advertiser Name</span>
            <input
              required
              value={form.advertiserName}
              onChange={(event) => setForm((current) => ({ ...current, advertiserName: event.target.value }))}
              className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white/35">Ad Title</span>
            <input
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
            />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-white/35">
              Description
              <span>{form.description.length}/{maxDescriptionLength}</span>
            </span>
            <textarea
              required
              maxLength={maxDescriptionLength}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="min-h-28 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white/35">Category</span>
            <select
              required
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="h-11 rounded-lg border border-white/10 bg-[#111] px-3 text-sm font-black outline-none focus:border-[#D4AF37]/50"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white/35">Image Upload</span>
            <span className="flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/55">
              <Upload size={16} className="text-[#D4AF37]" />
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                className="min-w-0 flex-1 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[#D4AF37] file:px-3 file:py-1.5 file:text-xs file:font-black file:text-[#0A0A0A]"
              />
            </span>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white/35">External Link URL</span>
            <input
              value={form.linkUrl}
              onChange={(event) => setForm((current) => ({ ...current, linkUrl: event.target.value }))}
              placeholder="https://yourwebsite.com"
              className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white/35">Contact Email</span>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
              className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white/35">Expiry Date</span>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
              className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold outline-none focus:border-[#D4AF37]/50"
            />
          </label>
          <div className="grid gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3">
            <label className="flex min-h-[24px] items-center gap-3">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))}
                className="h-4 w-4 accent-[#D4AF37]"
              />
              <span className="text-sm font-black text-white">Pin to Top?</span>
            </label>
            <p className="pl-7 text-xs font-semibold leading-5 text-white/40">
              Pinned listings appear first in the marketplace with a gold highlight border.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving === 'publish'}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 text-sm font-black text-[#0A0A0A] transition hover:bg-[#F5D06B] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
          >
            {saving === 'publish' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Publish Listing
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.035]">
        <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-black">Existing Listings</h2>
          <label className="relative block w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search listings"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-10 pr-3 text-sm font-semibold outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#D4AF37]" />
          </div>
        ) : filteredAds.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm font-semibold text-white/40">No listings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/35">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Advertiser</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pinned</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredAds.map((ad) => (
                  <tr key={ad.id}>
                    <td className="px-4 py-3 font-black text-white">{ad.title || 'Untitled'}</td>
                    <td className="px-4 py-3 text-white/60">{ad.advertiser_name || 'Not set'}</td>
                    <td className="px-4 py-3 text-white/60">{formatCategory(ad.category)}</td>
                    <td className="px-4 py-3"><StatusBadge active={ad.is_active} /></td>
                    <td className="px-4 py-3">
                      {ad.is_featured ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-black text-[#D4AF37]"><Star size={13} fill="currentColor" /> Pinned</span>
                      ) : (
                        <span className="text-xs font-semibold text-white/35">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/45">{formatDate(ad.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton
                          disabled={saving === ad.id}
                          tone={ad.is_active ? 'neutral' : 'green'}
                          onClick={() => updateListing(ad.id, { is_active: !ad.is_active }, ad.is_active ? 'Listing deactivated.' : 'Listing activated.')}
                        >
                          {ad.is_active ? <X size={13} /> : <Check size={13} />}
                          {ad.is_active ? 'Deactivate' : 'Activate'}
                        </ActionButton>
                        <ActionButton
                          disabled={saving === ad.id}
                          onClick={() => updateListing(ad.id, { is_featured: !ad.is_featured }, ad.is_featured ? 'Listing unmarked as featured.' : 'Listing marked as featured.')}
                        >
                          <Star size={13} />
                          {ad.is_featured ? 'Unpin' : 'Pin to Top'}
                        </ActionButton>
                        <ActionButton disabled={saving === ad.id} tone="red" onClick={() => deleteListing(ad)}>
                          <Trash2 size={13} />
                          Delete
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
