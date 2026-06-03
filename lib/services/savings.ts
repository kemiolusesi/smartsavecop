import { supabase } from '@/lib/supabase';
import { SavingsPlan } from '@/lib/types/database';

const PLAN_RATES = {
  '6-month': 0.07,
  '12-month': 0.15,
};

const PLAN_MONTHS = {
  '6-month': 6,
  '12-month': 12,
};

export async function createSavingsPlan(
  userId: string,
  planType: '6-month' | '12-month',
  principalAmount: number
): Promise<SavingsPlan> {
  const annualRate = PLAN_RATES[planType];
  const months = PLAN_MONTHS[planType];
  const startDate = new Date();
  const matureDate = new Date(startDate);
  matureDate.setMonth(matureDate.getMonth() + months);

  const { data, error } = await supabase
    .from('savings_plans')
    .insert([
      {
        user_id: userId,
        plan_type: planType,
        principal_amount: principalAmount,
        annual_rate: annualRate,
        accrued_interest: 0,
        start_date: startDate.toISOString(),
        mature_date: matureDate.toISOString(),
        status: 'active',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserSavingsPlans(userId: string): Promise<SavingsPlan[]> {
  const { data, error } = await supabase
    .from('savings_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSavingsPlan(planId: string): Promise<SavingsPlan | null> {
  const { data, error } = await supabase
    .from('savings_plans')
    .select('*')
    .eq('id', planId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updatePlanStatus(
  planId: string,
  status: 'active' | 'matured' | 'withdrawn' | 'cancelled'
): Promise<SavingsPlan> {
  const { data, error } = await supabase
    .from('savings_plans')
    .update({ status })
    .eq('id', planId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function calculateInterest(plan: SavingsPlan): Promise<number> {
  const months = PLAN_MONTHS[plan.plan_type];
  const rate = plan.annual_rate * (months / 12);
  return plan.principal_amount * rate;
}

export async function getActivePlans(userId: string): Promise<SavingsPlan[]> {
  const { data, error } = await supabase
    .from('savings_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('mature_date', { ascending: true });

  if (error) throw error;
  return data || [];
}
