import { NextResponse } from 'next/server';
import { createCookieSupabaseClient } from '@/lib/server-supabase';
import { formatApplicationHtml, sendApplicationEmail } from '@/utils/application-email';
import { parseMoney } from '@/lib/admin-auth';
import { calculateLoanRepayment, normalizeRepaymentOption, REPAYMENT_OPTIONS } from '@/lib/loans/loanTerms';
import { parseError } from '@/lib/parseError';

function calculateDynamicLoanRepayment(amount: number, monthlyRate: number, months: number, repaymentOption: string) {
  const principal = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const safeRate = Number.isFinite(monthlyRate) ? Math.max(0, monthlyRate) : 0;
  const safeMonths = Number.isFinite(months) && months > 0 ? months : 1;
  const totalInterest = principal * safeRate * safeMonths;
  const totalRepayable = principal + totalInterest;
  const interestOnly = normalizeRepaymentOption(repaymentOption) === 'interest_only';
  const monthlyPayment = interestOnly ? principal * safeRate : totalRepayable / safeMonths;
  const finalPayment = interestOnly ? principal + monthlyPayment : monthlyPayment;

  return {
    totalRepayable,
    monthlyPayment,
    finalPayment,
  };
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!payload?.email || !payload?.fullName || !payload?.loanType) {
      return NextResponse.json({ success: false, error: 'Missing required application fields.' }, { status: 400 });
    }

    const supabase = createCookieSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const amount = parseMoney(payload.amount);
    const repaymentOption = REPAYMENT_OPTIONS.includes(payload.repaymentOption)
      ? payload.repaymentOption
      : REPAYMENT_OPTIONS[0];
    const repaymentOptionCode = normalizeRepaymentOption(repaymentOption);
    const loanProductId = String(payload.loanProductId || '').trim();
    let selectedPlan: {
      name: string;
      min_amount: number | string | null;
      max_amount: number | string | null;
      monthly_interest_rate: number | string | null;
      tenure_months: number | string | null;
    } | null = null;

    if (loanProductId) {
      const { data } = await supabase
        .from('loan_products')
        .select('name,min_amount,max_amount,monthly_interest_rate,tenure_months')
        .eq('id', loanProductId)
        .eq('is_active', true)
        .maybeSingle();
      selectedPlan = data;
    } else if (payload.loanType) {
      const { data } = await supabase
        .from('loan_products')
        .select('name,min_amount,max_amount,monthly_interest_rate,tenure_months')
        .eq('name', payload.loanType)
        .eq('is_active', true)
        .maybeSingle();
      selectedPlan = data;
    }

    const fallbackRepayment = calculateLoanRepayment(amount, payload.loanType, repaymentOption);
    const monthlyRate = selectedPlan ? Number(selectedPlan.monthly_interest_rate || 0) : fallbackRepayment.term.rate / 100;
    const tenureMonths = selectedPlan ? Number(selectedPlan.tenure_months || 0) : fallbackRepayment.term.months;
    const repayment = selectedPlan
      ? calculateDynamicLoanRepayment(amount, monthlyRate, tenureMonths, repaymentOption)
      : fallbackRepayment;
    const loanType = selectedPlan?.name || fallbackRepayment.term.name;

    if (amount <= 0) {
      return NextResponse.json({ success: false, error: 'Enter a valid loan amount.' }, { status: 400 });
    }

    if (selectedPlan) {
      const minAmount = parseMoney(selectedPlan.min_amount);
      const maxAmount = parseMoney(selectedPlan.max_amount);
      if (minAmount > 0 && amount < minAmount) {
        return NextResponse.json({ success: false, error: `Minimum amount for ${selectedPlan.name} is ₦${minAmount.toLocaleString('en-NG')}.` }, { status: 400 });
      }
      if (maxAmount > 0 && amount > maxAmount) {
        return NextResponse.json({ success: false, error: `Maximum amount for ${selectedPlan.name} is ₦${maxAmount.toLocaleString('en-NG')}.` }, { status: 400 });
      }
    }

    if (!String(payload.guarantorName || '').trim() || !String(payload.guarantorPhone || '').trim() || !String(payload.purpose || '').trim()) {
      return NextResponse.json({ success: false, error: 'Guarantor name, guarantor phone, and loan purpose are required.' }, { status: 400 });
    }

    if (!String(payload.disbursementAccountNumber || '').trim() || !String(payload.disbursementBankName || '').trim()) {
      return NextResponse.json({ success: false, error: 'Disbursement account number and bank name are required.' }, { status: 400 });
    }

    if (!/^\d{10}$/.test(String(payload.disbursementAccountNumber || '').trim())) {
      return NextResponse.json({ success: false, error: 'Incomplete account number. Enter exactly 10 numeric digits.' }, { status: 400 });
    }

    const { error: insertError } = await supabase.from('loan_applications').insert({
      user_id: session.user.id,
      loan_product_id: loanProductId || null,
      loan_type: loanType,
      amount_requested: amount,
      purpose: payload.purpose || '',
      repayment_option: repaymentOptionCode,
      interest_rate: monthlyRate * 100,
      tenure_months: tenureMonths,
      guarantor_name: payload.guarantorName || '',
      guarantor_phone: payload.guarantorPhone || '',
      disbursement_account_number: payload.disbursementAccountNumber || '',
      disbursement_bank_name: payload.disbursementBankName || '',
      status: 'pending',
    });

    if (insertError) {
      throw insertError;
    }

    try {
      await sendApplicationEmail({
        subject: `Loan Application - ${loanType}`,
        html: formatApplicationHtml('Smart Save Loan Application', payload),
      });
    } catch {
      // Email failure must not block loan submission.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: parseError(error),
    }, { status: 500 });
  }
}
