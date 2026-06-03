import { supabase } from '@/lib/supabase';
import { Profile, SavingsPlan, Transaction } from '@/lib/types/database';

export interface UserDashboard {
  profile: Profile | null;
  activePlans: SavingsPlan[];
  totalBalance: number;
  monthlyReturn: number;
  recentTransactions: Transaction[];
}

export async function getUserDashboard(userId: string): Promise<UserDashboard> {
  const [profileRes, plansRes, transactionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase
      .from('savings_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('mature_date', { ascending: true }),
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const profile = (profileRes.data as Profile | null);
  const activePlans = (plansRes.data as SavingsPlan[]) || [];
  const recentTransactions = (transactionsRes.data as Transaction[]) || [];

  let totalBalance = 0;
  let monthlyReturn = 0;

  activePlans.forEach((plan) => {
    totalBalance += plan.principal_amount + plan.accrued_interest;
    const monthlyRate = plan.annual_rate / 12;
    monthlyReturn += plan.principal_amount * monthlyRate;
  });

  return {
    profile,
    activePlans,
    totalBalance,
    monthlyReturn,
    recentTransactions,
  };
}

export async function initializeUserAccount(userId: string, fullName: string): Promise<Profile> {
  const existing = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing.data) {
    return existing.data as Profile;
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        user_id: userId,
        full_name: fullName,
        phone: '',
        bvn: '',
        bvn_verified: false,
        kyc_status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function calculateProjectedReturn(
  principalAmount: number,
  annualRate: number,
  months: number
): Promise<{
  interest: number;
  total: number;
  monthlyReturn: number;
}> {
  const rate = annualRate * (months / 12);
  const interest = principalAmount * rate;
  const total = principalAmount + interest;
  const monthlyReturn = (interest / months);

  return {
    interest,
    total,
    monthlyReturn,
  };
}
