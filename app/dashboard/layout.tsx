import { redirect } from 'next/navigation';
import { createCookieSupabaseClient } from '@/lib/server-supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createCookieSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const isJwtAdmin = user.app_metadata?.is_admin === true;

  if (isJwtAdmin) {
    redirect('/admin');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_completed, approval_status, is_active, is_admin')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (profile?.is_admin === true) {
    redirect('/admin');
  }

  if (!profile?.onboarding_completed) {
    redirect('/onboarding');
  }

  if (profile.approval_status !== 'approved' || profile.is_active !== true) {
    redirect('/pending-activation');
  }

  return <>{children}</>;
}
