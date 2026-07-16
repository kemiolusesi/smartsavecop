import { NextResponse } from 'next/server';
import { createCookieSupabaseClient } from '@/lib/server-supabase';
import { formatApplicationHtml, sendApplicationEmail } from '@/utils/application-email';
import { parseMoney } from '@/lib/admin-auth';
import { calculateLoanRepayment, normalizeRepaymentOption, REPAYMENT_OPTIONS } from '@/lib/loans/loanTerms';

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
    const repayment = calculateLoanRepayment(amount, payload.loanType, repaymentOption);

    if (amount <= 0) {
      return NextResponse.json({ success: false, error: 'Enter a valid loan amount.' }, { status: 400 });
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
      loan_type: repayment.term.name,
      amount_requested: amount,
      purpose: payload.purpose || '',
      repayment_option: repaymentOptionCode,
      interest_rate: repayment.term.rate,
      tenure_months: repayment.term.months,
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
        subject: `Loan Application - ${payload.loanType}`,
        html: formatApplicationHtml('Smart Save Loan Application', payload),
      });
    } catch {
      // Email failure must not block loan submission.
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || String(error),
      details: JSON.stringify(error),
    }, { status: 500 });
  }
}
