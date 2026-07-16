import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CalculationRequest {
  principal: number;
  rate: number;
  months: number;
  type: 'simple' | 'compound';
  frequency?: 'monthly' | 'annually';
}

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

function calculateSimpleInterest(
  principal: number,
  annualRate: number,
  months: number
): GrowthResult {
  const monthlyRate = annualRate / 12;
  const totalInterest = principal * monthlyRate * months;
  const finalAmount = principal + totalInterest;
  const monthlyReturn = totalInterest / months;

  const breakdown: MonthlyBreakdown[] = [];
  let cumulativeInterest = 0;

  for (let month = 1; month <= months; month++) {
    const interestThisMonth = principal * monthlyRate;
    cumulativeInterest += interestThisMonth;
    breakdown.push({
      month,
      starting_balance: principal,
      interest_accrued: interestThisMonth,
      ending_balance: principal + cumulativeInterest,
      cumulative_interest: cumulativeInterest,
    });
  }

  return {
    principal,
    rate: annualRate,
    months,
    type: 'simple',
    total_interest: totalInterest,
    final_amount: finalAmount,
    monthly_return: monthlyReturn,
    effective_annual_rate: annualRate,
    breakdown,
  };
}

function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  months: number,
  frequency: 'monthly' | 'annually' = 'monthly'
): GrowthResult {
  const compoundingPeriodsPerYear = frequency === 'monthly' ? 12 : 1;
  const n = compoundingPeriodsPerYear;
  const t = months / 12;
  const r = annualRate;

  const finalAmount = principal * Math.pow(1 + r / n, n * t);
  const totalInterest = finalAmount - principal;
  const monthlyReturn = totalInterest / months;

  const effectiveAnnualRate = Math.pow(1 + r / n, n) - 1;

  const breakdown: MonthlyBreakdown[] = [];
  let cumulativeInterest = 0;
  let currentBalance = principal;

  for (let month = 1; month <= months; month++) {
    let interestThisMonth = 0;

    if (frequency === 'monthly') {
      const monthlyRate = annualRate / 12;
      interestThisMonth = currentBalance * monthlyRate;
      currentBalance += interestThisMonth;
    } else {
      if (month % 12 === 0) {
        interestThisMonth = currentBalance * annualRate;
        currentBalance += interestThisMonth;
      }
    }

    cumulativeInterest += interestThisMonth;

    breakdown.push({
      month,
      starting_balance: currentBalance - interestThisMonth,
      interest_accrued: interestThisMonth,
      ending_balance: currentBalance,
      cumulative_interest: cumulativeInterest,
    });
  }

  return {
    principal,
    rate: annualRate,
    months,
    type: 'compound',
    total_interest: totalInterest,
    final_amount: finalAmount,
    monthly_return: monthlyReturn,
    effective_annual_rate: effectiveAnnualRate,
    breakdown,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const method = req.method;

    if (method === 'POST') {
      const body: CalculationRequest = await req.json();
      const { principal, rate, months, type, frequency = 'monthly' } = body;

      if (!principal || !rate || !months || !type) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: principal, rate, months, type' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (principal <= 0 || rate <= 0 || months <= 0) {
        return new Response(
          JSON.stringify({ error: 'Values must be greater than 0' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const result: GrowthResult = type === 'simple'
        ? calculateSimpleInterest(principal, rate, months)
        : calculateCompoundInterest(principal, rate, months, frequency);

      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (method === 'GET') {
      const principal = parseFloat(url.searchParams.get('principal') || '0');
      const rate = parseFloat(url.searchParams.get('rate') || '0');
      const months = parseInt(url.searchParams.get('months') || '0');
      const type = (url.searchParams.get('type') || 'simple') as 'simple' | 'compound';
      const frequency = (url.searchParams.get('frequency') || 'monthly') as 'monthly' | 'annually';

      if (!principal || !rate || !months) {
        return new Response(
          JSON.stringify({ error: 'Missing query parameters: principal, rate, months' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const result: GrowthResult = type === 'simple'
        ? calculateSimpleInterest(principal, rate, months)
        : calculateCompoundInterest(principal, rate, months, frequency);

      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
