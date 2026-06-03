'use client';

import { useState, useCallback } from 'react';

interface GrowthResult {
  principal: number;
  rate: number;
  months: number;
  type: 'simple' | 'compound';
  total_interest: number;
  final_amount: number;
  monthly_return: number;
  effective_annual_rate: number;
  breakdown: MonthlyBreakdown[];
}

interface MonthlyBreakdown {
  month: number;
  starting_balance: number;
  interest_accrued: number;
  ending_balance: number;
  cumulative_interest: number;
}

interface UseGrowthCalculatorReturn {
  result: GrowthResult | null;
  loading: boolean;
  error: string | null;
  calculate: (
    principal: number,
    rate: number,
    months: number,
    type: 'simple' | 'compound',
    frequency?: 'monthly' | 'annually'
  ) => Promise<void>;
}

export function useGrowthCalculator(): UseGrowthCalculatorReturn {
  const [result, setResult] = useState<GrowthResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(
    async (
      principal: number,
      rate: number,
      months: number,
      type: 'simple' | 'compound',
      frequency: 'monthly' | 'annually' = 'monthly'
    ) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/calculator/growth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            principal,
            rate,
            months,
            type,
            frequency,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to calculate growth');
        }

        const data = await response.json();
        setResult(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { result, loading, error, calculate };
}
