import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import ProfileClient, { type ProfileRecord } from './ProfileClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function createProfileServerClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Middleware refreshes auth cookies for Server Components.
        }
      },
    },
  });
}

function createPreviewProfile(): ProfileRecord {
  const now = new Date().toISOString();

  return {
    id: 'preview-profile',
    user_id: 'dev-preview-member-0001',
    email: 'smartsavecooperative@gmail.com',
    full_name: 'Preview Member',
    phone: '',
    phone_number: '',
    balance: 0,
    kyc_status: 'pending',
    has_paid: false,
    onboarding_completed: false,
    created_at: now,
    updated_at: now,
  };
}

export default async function ProfilePage() {
  const devBypassActive =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
  const supabase = createProfileServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (devBypassActive) {
      return <ProfileClient devBypassActive initialProfile={createPreviewProfile()} authEmail="smartsavecooperative@gmail.com" />;
    }

    redirect('/signin?returnTo=/dashboard/profile');
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle();

  if (error) throw error;

  const profile = (data as ProfileRecord | null) || {
    ...createPreviewProfile(),
    id: session.user.id,
    user_id: session.user.id,
    email: session.user.email || null,
    full_name:
      typeof session.user.user_metadata?.full_name === 'string' ? session.user.user_metadata.full_name : 'Smart Save Member',
  };

  return <ProfileClient devBypassActive={devBypassActive} initialProfile={profile} authEmail={session.user.email || ''} />;
}
