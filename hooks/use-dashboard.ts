'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, SavingsPlan, Transaction } from '@/lib/types/database';

interface DashboardData {
  profile: Profile | null;
  activePlans: SavingsPlan[];
  recentTransactions: Transaction[];
  totalBalance: number;
  monthlyReturn: number;
  loading: boolean;
  error: string | null;
}

const CACHE_DURATION = 60 * 1000; // Updated to 1 minute for more accurate interest

let dashboardCache: DashboardData | null = null;
let cacheTime: number = 0;

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    profile: null,
    activePlans: [],
    recentTransactions: [],
    totalBalance: 0,
    monthlyReturn: 0,
    loading: true,
    error: null,
  });

  const fetchDashboard = useCallback(async () => {
    try {
      const now = Date.now();
      if (dashboardCache && now - cacheTime < CACHE_DURATION) {
        setData(dashboardCache);
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setData((prev) => ({ ...prev, error: 'Not authenticated', loading: false }));
        return;
      }

      const token = session.access_token;

      // Update interest for all active plans
      if (dashboardCache) {
        const planUpdatePromises = dashboardCache.activePlans.map(async (plan) => {
          try {
            await fetch('/api/user/plans/accrue-interest', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ plan_id: plan.id }),
            });
          } catch {
            // Interest updates are retried on future dashboard loads.
          }
        });

        await Promise.all(planUpdatePromises);
      }

      const response = await fetch('/api/user/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const dashboardData = await response.json();
      const newData: DashboardData = {
        ...dashboardData,
        loading: false,
        error: null,
      };

      dashboardCache = newData;
      cacheTime = now;
      setData(newData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setData((prev) => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { ...data, refetch: fetchDashboard };
}
