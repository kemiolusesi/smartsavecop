'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SavingsPlan } from '@/lib/types/database';

interface UseSavingsPlansReturn {
  plans: SavingsPlan[];
  loading: boolean;
  error: string | null;
  createPlan: (planType: '6-month' | '12-month', amount: number) => Promise<SavingsPlan | null>;
  refetch: () => Promise<void>;
}

export function useSavingsPlans(status?: 'active' | 'matured' | 'withdrawn' | 'cancelled'): UseSavingsPlansReturn {
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
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
      const url = new URL('/api/user/savings-plans', window.location.origin);
      if (status) {
        url.searchParams.set('status', status);
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch savings plans');
      }

      const data = await response.json();
      setPlans(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [status]);

  const createPlan = useCallback(
    async (planType: '6-month' | '12-month', amount: number): Promise<SavingsPlan | null> => {
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
        const response = await fetch('/api/user/savings-plans', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_type: planType,
            principal_amount: amount,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create savings plan');
        }

        const data = await response.json();
        setPlans((prev) => [data, ...prev]);
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
    fetchPlans();
  }, [fetchPlans]);

  return { plans, loading, error, createPlan, refetch: fetchPlans };
}
