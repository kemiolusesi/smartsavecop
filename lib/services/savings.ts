import { supabase } from '@/lib/supabase';
import { SavingsPlan } from '@/lib/types/database';
import {
  SAVINGS_DURATION_MONTHS,
  SAVINGS_RETURN_RATE,
  calculateFixedTotalInterest,
  getFixedInvestmentTier,
} from '@/lib/investment-config';

const PLAN_MONTHS = {
  '6-month': 6,
  '12-month': SAVINGS_DURATION_MONTHS,
};

export async function createSavingsPlan(
  userId: string,
  planType: '6-month' | '12-month',
  principalAmount: number
): Promise<SavingsPlan> {
  const tier = getFixedInvestmentTier(principalAmount);
  const configuredRate = tier?.monthlyRate || SAVINGS_RETURN_RATE;
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
        annual_rate: configuredRate,
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
  return calculateFixedTotalInterest(plan.principal_amount, months);
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
