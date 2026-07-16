import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function createDashboardServerClient() {
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
          // Server Components cannot always write cookies; middleware refreshes them.
        }
      },
    },
  });
}

export default async function DashboardPage() {
  const devBypassActive =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
  const supabase = createDashboardServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (devBypassActive) {
      return (
        <DashboardClient
          devBypassActive
          initialProfile={null}
          initialTransactions={[]}
          initialTotalDeposited={0}
          initialInterestTotal={0}
          initialUserEmail=""
          initialUserId=""
        />
      );
    }

    redirect('/signin?returnTo=/dashboard');
  }

  const [profileResult, transactionsResult, successfulDepositsResult, interestLedgerResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle(),
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', session.user.id)
      .eq('type', 'deposit')
      .eq('status', 'success'),
    supabase
      .from('interest_ledger')
      .select('amount')
      .eq('user_id', session.user.id),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (transactionsResult.error) throw transactionsResult.error;
  if (successfulDepositsResult.error) throw successfulDepositsResult.error;

  const totalDeposited = (successfulDepositsResult.data || []).reduce(
    (total, payment) => total + Math.abs(parseMoney(payment.amount)),
    0
  );
  const interestTotal = interestLedgerResult.error
    ? 0
    : (interestLedgerResult.data || []).reduce((total, row) => total + Math.abs(parseMoney(row.amount)), 0);

  return (
    <DashboardClient
      devBypassActive={devBypassActive}
      initialProfile={profileResult.data}
      initialTransactions={transactionsResult.data || []}
      initialTotalDeposited={totalDeposited}
      initialInterestTotal={interestTotal}
      initialUserEmail={session.user.email || ''}
      initialUserId={session.user.id}
    />
  );
}
