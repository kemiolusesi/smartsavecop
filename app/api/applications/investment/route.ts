import { NextResponse } from 'next/server';
import { createCookieSupabaseClient } from '@/lib/server-supabase';
import { formatApplicationHtml, sendApplicationEmail } from '@/utils/application-email';
import { parseMoney } from '@/lib/admin-auth';
import { findInvestmentProduct } from '@/lib/investments/investmentProducts';

function parseInteger(value: unknown) {
  const parsed = Number.parseInt(String(value ?? '').replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function deriveInvestmentAmount(payload: Record<string, unknown>) {
  const product = findInvestmentProduct(String(payload.product || ''));

  if (product.name === 'Normal Savings Account') return parseMoney(payload.monthlyContribution);
  if (product.name === 'Target Savings Plan') return parseMoney(payload.targetAmount);
  if (product.name === 'Fixed Deposit Investment') return parseMoney(payload.lumpSumAmount);
  if (product.name === 'Share Capital Investment') return parseMoney(payload.amountToInvest);

  return parseMoney(payload.amount);
}

function deriveTenureMonths(payload: Record<string, unknown>) {
  const product = findInvestmentProduct(String(payload.product || ''));

  if (product.name === 'Target Savings Plan') return parseInteger(payload.preferredDurationMonths);
  if (product.name === 'Fixed Deposit Investment') return parseInteger(payload.preferredTenureMonths);
  return null;
}

function targetGoal(payload: Record<string, unknown>) {
  const product = findInvestmentProduct(String(payload.product || ''));

  if (product.name === 'Target Savings Plan') return String(payload.goalDescription || '');
  return null;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!payload?.email || !payload?.fullName || !payload?.product) {
      return NextResponse.json({ success: false, error: 'Missing required application fields.' }, { status: 400 });
    }

    const supabase = createCookieSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const product = findInvestmentProduct(payload.product);
    const amount = deriveInvestmentAmount(payload);

    if (amount <= 0) {
      return NextResponse.json({ success: false, error: 'Enter a valid investment amount.' }, { status: 400 });
    }

    const { error: insertError } = await supabase.from('investment_applications').insert({
      user_id: session.user.id,
      investment_type: product.name,
      amount,
      tenure_months: deriveTenureMonths(payload),
      target_goal: targetGoal(payload),
      status: 'pending',
    });

    if (insertError) throw insertError;

    try {
      await sendApplicationEmail({
        subject: `Investment Application - ${payload.product}`,
        html: formatApplicationHtml('Smart Save Investment Application', payload),
      });
    } catch {
      // Email failure must not block investment submission.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = (error as { message?: string } | null)?.message || 'Unable to submit investment application.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
