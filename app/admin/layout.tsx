import { redirect } from 'next/navigation';
import AdminNav, { AdminLogoutButton } from './AdminNav';
import { createCookieSupabaseClient } from '@/lib/server-supabase';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createCookieSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin?returnTo=/admin');
  }

  const isJwtAdmin = user.app_metadata?.is_admin === true;
  let isProfileAdmin = false;

  if (!isJwtAdmin) {
    const adminSupabase = createSupabaseAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('is_admin, is_active')
      .eq('user_id', user.id)
      .maybeSingle();
    isProfileAdmin = profile?.is_admin === true && profile?.is_active !== false;
  }

  if (!isJwtAdmin && !isProfileAdmin) {
    redirect('/dashboard');
  }

  const adminName =
    typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : user.email || 'Admin';

  return (
    <main className="admin-shell relative min-h-screen overflow-hidden bg-[var(--admin-bg-page)] font-sans text-[var(--admin-text-header)] dark:bg-[#0A0A0A] dark:text-white">
      <div className="absolute inset-0 brand-grid opacity-60 dark:opacity-100" aria-hidden="true" />
      <div
        className="absolute top-[-12%] left-1/2 h-[620px] w-[920px] -translate-x-1/2 rounded-full opacity-[0.18] blur-3xl dark:hidden"
        style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.62) 0%, rgba(30,144,255,0.26) 48%, rgba(245,240,232,0) 76%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 top-0 hidden h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.04] blur-3xl dark:block dark:opacity-[0.08]"
        style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, #0093D8 48%, transparent 72%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <AdminNav />
        <section className="min-h-screen lg:pl-72">
        <header className="admin-header sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="ml-14 flex min-h-[44px] items-center justify-between gap-4 lg:ml-0">
            <div>
              <p className="admin-brand-label text-xs font-black uppercase tracking-widest text-[#D4AF37]">Smart Save Cooperative</p>
              <h1 className="admin-title mt-1 text-xl font-black sm:text-2xl">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="admin-title text-sm font-black">{adminName}</p>
                <p className="admin-muted mt-1 text-xs text-white/40">Current administrator</p>
              </div>
              <span className="admin-badge inline-flex rounded-full border border-[#8BC34A]/30 bg-[#8BC34A]/10 px-3 py-1 text-xs font-black text-[#8BC34A]">
                ADMIN
              </span>
              <AdminLogoutButton compact />
            </div>
          </div>
        </header>
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
