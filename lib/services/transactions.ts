import { supabase } from '@/lib/supabase';
import { Transaction } from '@/lib/types/database';

function generateReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

export async function createTransaction(
  userId: string,
  amount: number,
  type: 'deposit' | 'withdrawal' | 'fee' | 'interest_accrual',
  status: 'success' | 'pending' | 'failed' = 'pending',
  savingsPlanId?: string,
  description?: string
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        user_id: userId,
        savings_plan_id: savingsPlanId || null,
        amount,
        type,
        status,
        reference: generateReference(),
        description: description || '',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getTransactionByReference(reference: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('reference', reference)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateTransactionStatus(
  transactionId: string,
  status: 'success' | 'pending' | 'failed'
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', userId)
    .eq('status', 'success');

  if (error) throw error;

  let balance = 0;
  data?.forEach((txn) => {
    if (txn.type === 'deposit' || txn.type === 'interest_accrual') {
      balance += txn.amount;
    } else if (txn.type === 'withdrawal' || txn.type === 'fee') {
      balance -= txn.amount;
    }
  });

  return balance;
}

export async function getPlanTransactions(planId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('savings_plan_id', planId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
