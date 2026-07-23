import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import InvestmentsClient, { type ApplicationProfile, type InvestmentProductRow } from './InvestmentsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function createInvestmentsServerClient() {
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

function createPreviewProfile(): ApplicationProfile {
  return {
    user_id: 'preview-user',
    email: 'smartsavecooperative@gmail.com',
    full_name: 'Preview Member',
    phone: '',
  };
}

export default async function InvestmentsPage() {
  const devBypassActive =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
  const supabase = createInvestmentsServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (devBypassActive) {
      return <InvestmentsClient devBypassActive profile={createPreviewProfile()} initialInvestmentApplications={[]} activeInvestmentProducts={[]} />;
    }

    redirect('/signin?returnTo=/dashboard/investments');
  }

  const [profileResult, investmentsResult, productsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name,email,phone_number')
      .eq('user_id', session.user.id)
      .maybeSingle(),
    supabase
      .from('investment_applications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('investment_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  const { data, error } = profileResult;

  if (error) throw error;
  if (investmentsResult.error) throw investmentsResult.error;
  if (productsResult.error) throw productsResult.error;

  return (
    <InvestmentsClient
      devBypassActive={devBypassActive}
      initialInvestmentApplications={investmentsResult.data || []}
      activeInvestmentProducts={(productsResult.data || []) as InvestmentProductRow[]}
      profile={{
        user_id: session.user.id,
        full_name: data?.full_name || 'Smart Save Member',
        email: data?.email || session.user.email || '',
        phone: data?.phone_number || '',
      }}
    />
  );
}
