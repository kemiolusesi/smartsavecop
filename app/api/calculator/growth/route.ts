import { NextRequest, NextResponse } from 'next/server';

function parseNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function localGrowthCalculation({
  principal,
  rate,
  months,
  type = 'simple',
  frequency = 'monthly',
}: {
  principal: unknown;
  rate: unknown;
  months: unknown;
  type?: unknown;
  frequency?: unknown;
}) {
  const principalAmount = parseNumber(principal);
  const annualRate = parseNumber(rate);
  const termMonths = parseNumber(months);
  const calculationType = typeof type === 'string' ? type : 'simple';
  const payoutFrequency = typeof frequency === 'string' ? frequency : 'monthly';

  if (principalAmount <= 0 || annualRate <= 0 || termMonths <= 0) {
    throw new Error('Principal, rate, and months must be greater than zero.');
  }

  let runningBalance = principalAmount;
  let cumulativeInterest = 0;
  const monthlyRate = annualRate / 12;

  const breakdown = Array.from({ length: termMonths }, (_, index) => {
    const month = index + 1;
    const startingBalance = runningBalance;
    const interestAccrued =
      calculationType === 'compound' || payoutFrequency === 'monthly'
        ? startingBalance * monthlyRate
        : principalAmount * monthlyRate;

    if (calculationType === 'compound') {
      runningBalance += interestAccrued;
    }

    cumulativeInterest += interestAccrued;

    return {
      month,
      starting_balance: startingBalance,
      interest_accrued: interestAccrued,
      ending_balance: calculationType === 'compound' ? runningBalance : principalAmount + cumulativeInterest,
      cumulative_interest: cumulativeInterest,
    };
  });

  const totalInterest =
    calculationType === 'compound'
      ? runningBalance - principalAmount
      : principalAmount * annualRate * (termMonths / 12);

  return {
    principal: principalAmount,
    rate: annualRate,
    months: termMonths,
    type: calculationType,
    frequency: payoutFrequency,
    total_interest: totalInterest,
    final_amount: principalAmount + totalInterest,
    breakdown,
    source: 'local',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { principal, rate, months, type, frequency } = body;

    if (!principal || !rate || !months || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: principal, rate, months, type' },
        { status: 400 }
      );
    }

    const fallback = localGrowthCalculation({ principal, rate, months, type, frequency: frequency || 'monthly' });
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return NextResponse.json(fallback);

    const response = await fetch(`${supabaseUrl}/functions/v1/growth-calculator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        principal,
        rate,
        months,
        type,
        frequency: frequency || 'monthly',
      }),
    }).catch(() => null);

    if (!response?.ok) {
      return NextResponse.json(fallback);
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to calculate growth' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const principal = searchParams.get('principal');
    const rate = searchParams.get('rate');
    const months = searchParams.get('months');
    const type = searchParams.get('type') || 'simple';
    const frequency = searchParams.get('frequency') || 'monthly';

    if (!principal || !rate || !months) {
      return NextResponse.json(
        { error: 'Missing query parameters: principal, rate, months' },
        { status: 400 }
      );
    }

    const fallback = localGrowthCalculation({ principal, rate, months, type, frequency });
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return NextResponse.json(fallback);

    const response = await fetch(`${supabaseUrl}/functions/v1/growth-calculator?principal=${principal}&rate=${rate}&months=${months}&type=${type}&frequency=${frequency}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(() => null);

    if (!response?.ok) {
      return NextResponse.json(fallback);
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to calculate growth' }, { status: 400 });
  }
}
