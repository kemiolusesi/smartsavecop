import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import LoansClient, { type LoanApplicationProfile, type LoanApplicationRow } from './LoansClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function createLoansServerClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Middleware refreshes cookies for Server Components.
        }
      },
    },
  });
}

function createPreviewProfile(): LoanApplicationProfile {
  return {
    user_id: 'preview-user',
    email: 'smartsavecooperative@gmail.com',
    full_name: 'Preview Member',
    phone: '',
  };
}

export default async function LoansPage() {
  const devBypassActive =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
  const supabase = createLoansServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (devBypassActive) {
      return <LoansClient devBypassActive profile={createPreviewProfile()} />;
    }

    redirect('/signin?returnTo=/dashboard/loans');
  }

  const [profileResult, loanApplicationsResult] = await Promise.all([
    supabase
    .from('profiles')
    .select('full_name,email,phone_number')
    .eq('user_id', session.user.id)
      .maybeSingle(),
    supabase
      .from('loan_applications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (loanApplicationsResult.error) throw loanApplicationsResult.error;

  return (
    <LoansClient
      devBypassActive={devBypassActive}
      profile={{
        user_id: session.user.id,
        full_name: profileResult.data?.full_name || 'Smart Save Member',
        email: profileResult.data?.email || session.user.email || '',
        phone: profileResult.data?.phone_number || '',
      }}
      initialLoanApplications={(loanApplicationsResult.data || []) as LoanApplicationRow[]}
    />
  );
}
