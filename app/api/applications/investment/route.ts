import { NextResponse } from 'next/server';
import { createCookieSupabaseClient } from '@/lib/server-supabase';
import { formatApplicationHtml, sendApplicationEmail } from '@/utils/application-email';
import { parseMoney } from '@/lib/admin-auth';
import { findInvestmentProduct } from '@/lib/investments/investmentProducts';
import { parseError } from '@/lib/parseError';

function parseInteger(value: unknown) {
  const parsed = Number.parseInt(String(value ?? '').replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function deriveInvestmentAmount(payload: Record<string, unknown>) {
  const productType = String(payload.productType || '').toLowerCase();
  if (productType === 'savings') return parseMoney(payload.monthlyContribution);
  if (productType === 'fixed') return parseMoney(payload.lumpSumAmount);

  const product = findInvestmentProduct(String(payload.product || ''));

  if (product.name === 'Normal Savings Account') return parseMoney(payload.monthlyContribution);
  if (product.name === 'Target Savings Plan') return parseMoney(payload.targetAmount);
  if (product.name === 'Fixed Deposit Investment') return parseMoney(payload.lumpSumAmount);
  if (product.name === 'Share Capital Investment') return parseMoney(payload.amountToInvest);

  return parseMoney(payload.amount);
}

function deriveTenureMonths(payload: Record<string, unknown>) {
  const productType = String(payload.productType || '').toLowerCase();
  if (productType === 'savings') return 12;
  if (productType === 'fixed') return parseInteger(payload.preferredTenureMonths);

  const product = findInvestmentProduct(String(payload.product || ''));

  if (product.name === 'Target Savings Plan') return parseInteger(payload.preferredDurationMonths);
  if (product.name === 'Fixed Deposit Investment') return parseInteger(payload.preferredTenureMonths);
  return null;
}

function selectedInvestmentName(payload: Record<string, unknown>) {
  const dynamicName = String(payload.plan_name || payload.planName || payload.product_name || payload.product || '').trim();
  if (String(payload.productType || '').trim() && dynamicName) return dynamicName;
  return findInvestmentProduct(String(payload.product || '')).name;
}

function optionalUuid(value: unknown) {
  const text = String(value || '').trim();
  return text || null;
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

    const amount = deriveInvestmentAmount(payload);
    const investmentName = selectedInvestmentName(payload);
    const termMonths = deriveTenureMonths(payload);
    const productId = optionalUuid(payload.investment_product_id);
    const amountPaid = parseMoney(payload.amount_paid);
    const proofOfPaymentUrl = String(payload.proof_of_payment_url || '').trim();
    const paymentReference = String(payload.payment_reference || '').trim();

    if (amount <= 0) {
      return NextResponse.json({ success: false, error: 'Enter a valid investment amount.' }, { status: 400 });
    }
    if (!proofOfPaymentUrl || amountPaid <= 0) {
      return NextResponse.json({ success: false, error: 'Please upload your transfer receipt and enter the amount paid before submitting.' }, { status: 400 });
    }

    const { error: insertError } = await supabase.from('investment_applications').insert({
      user_id: session.user.id,
      investment_type: investmentName,
      amount,
      lump_sum_amount: amount,
      investment_term_months: termMonths,
      investment_product_id: productId,
      plan_name: investmentName,
      proof_of_payment_url: proofOfPaymentUrl,
      payment_reference: paymentReference || null,
      amount_paid: amountPaid,
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
    return NextResponse.json({ success: false, error: parseError(error) }, { status: 500 });
  }
}
