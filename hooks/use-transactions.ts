'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Transaction } from '@/lib/types/database';

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  createTransaction: (
    amount: number,
    type: 'deposit' | 'withdrawal' | 'fee' | 'interest_accrual',
    description?: string,
    savingsPlanId?: string
  ) => Promise<Transaction | null>;
  refetch: () => Promise<void>;
}

export function useTransactions(
  limit: number = 50,
  type?: 'deposit' | 'withdrawal' | 'fee' | 'interest_accrual'
): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const token = session.access_token;
      const url = new URL('/api/user/transactions', window.location.origin);
      url.searchParams.set('limit', limit.toString());
      if (type) {
        url.searchParams.set('type', type);
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [limit, type]);

  const createTransaction = useCallback(
    async (
      amount: number,
      txnType: 'deposit' | 'withdrawal' | 'fee' | 'interest_accrual',
      description?: string,
      savingsPlanId?: string
    ): Promise<Transaction | null> => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Not authenticated');
          return null;
        }

        const token = session.access_token;
        const response = await fetch('/api/user/transactions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            type: txnType,
            description: description || '',
            savings_plan_id: savingsPlanId || null,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create transaction');
        }

        const data = await response.json();
        setTransactions((prev) => [data, ...prev]);
        setError(null);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, createTransaction, refetch: fetchTransactions };
}
