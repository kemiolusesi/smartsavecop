import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

function formatNaira(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(String(value || '').replace(/[^\d.-]/g, ''));
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB');
}

function parseMoney(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(String(value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

async function getAdminUserId(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data: byAdminFlag } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('is_admin', true)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (byAdminFlag?.user_id) return byAdminFlag.user_id;

  const { data: byEmail } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', 'smartsavecooperative@gmail.com')
    .limit(1)
    .maybeSingle();

  return byEmail?.user_id || null;
}

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get('CRON_SECRET') || request.headers.get('x-cron-secret');

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const today = new Date();
  const todayText = dateOnly(today);
  const dueInFiveText = dateOnly(addDays(today, 5));
  const yesterdayText = dateOnly(addDays(today, -1));
  const processed = {
    overdueLoanRepayments: 0,
    overdueInterestPayouts: 0,
    loanRepaymentReminders: 0,
    interestMemberNotifications: 0,
    interestAdminNotifications: 0,
    overdueLoanAdminNotifications: 0,
  };

  const { data: overdueLoans, error: overdueLoanError } = await supabase
    .from('loan_repayment_schedule')
    .update({ status: 'overdue' })
    .eq('status', 'pending')
    .lt('due_date', todayText)
    .select('id');

  if (overdueLoanError) throw overdueLoanError;
  processed.overdueLoanRepayments = overdueLoans?.length || 0;

  const { data: overdueInterest, error: overdueInterestError } = await supabase
    .from('interest_payout_schedule')
    .update({ status: 'overdue' })
    .eq('status', 'pending')
    .lt('due_date', todayText)
    .select('id');

  if (overdueInterestError) throw overdueInterestError;
  processed.overdueInterestPayouts = overdueInterest?.length || 0;

  const { data: dueLoans, error: dueLoansError } = await supabase
    .from('loan_repayment_schedule')
    .select('id,user_id,loan_application_id,due_date,total_due,notified_member')
    .eq('status', 'pending')
    .eq('due_date', dueInFiveText)
    .eq('notified_member', false);

  if (dueLoansError) throw dueLoansError;

  for (const row of dueLoans || []) {
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: row.user_id,
      title: 'Loan Repayment Due Soon',
      message: `Your loan repayment of ${formatNaira(row.total_due)} is due on ${formatDate(row.due_date)}. Please transfer to: Stanbic IBTC | Smart Save Cooperative Society | Account: 0079404511. Reference your name and loan ID in the transfer description.`,
      is_read: false,
    });
    if (notificationError) throw notificationError;

    const { error: updateError } = await supabase
      .from('loan_repayment_schedule')
      .update({ notified_member: true })
      .eq('id', row.id);
    if (updateError) throw updateError;
    processed.loanRepaymentReminders += 1;
  }

  const { data: dueInterestRows, error: dueInterestError } = await supabase
    .from('interest_payout_schedule')
    .select('id,user_id,due_date,amount,notified_member')
    .eq('status', 'pending')
    .eq('due_date', todayText)
    .eq('notified_member', false);

  if (dueInterestError) throw dueInterestError;

  for (const row of dueInterestRows || []) {
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: row.user_id,
      title: 'Interest Payout Being Processed',
      message: `Your quarterly interest payout of ${formatNaira(row.amount)} is being processed today and will be transferred to your registered bank account within 2 working days.`,
      is_read: false,
    });
    if (notificationError) throw notificationError;

    const { error: updateError } = await supabase
      .from('interest_payout_schedule')
      .update({ notified_member: true, status: 'processing' })
      .eq('id', row.id);
    if (updateError) throw updateError;
    processed.interestMemberNotifications += 1;
  }

  const adminUserId = await getAdminUserId(supabase);
  const { data: adminInterestRows, error: adminInterestError } = await supabase
    .from('interest_payout_schedule')
    .select('id,amount')
    .in('status', ['pending', 'processing'])
    .eq('due_date', todayText)
    .eq('notified_admin', false);

  if (adminInterestError) throw adminInterestError;

  if (adminUserId && adminInterestRows && adminInterestRows.length > 0) {
    const total = adminInterestRows.reduce((sum, row) => sum + parseMoney(row.amount), 0);
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: adminUserId,
      title: 'Interest Payouts Due Today',
      message: `${adminInterestRows.length} member(s) are due interest payouts today totalling ${formatNaira(total)}. Please process these payments and mark them as paid in the admin dashboard.`,
      is_read: false,
    });
    if (notificationError) throw notificationError;

    const { error: updateError } = await supabase
      .from('interest_payout_schedule')
      .update({ notified_admin: true })
      .in('id', adminInterestRows.map((row) => row.id));
    if (updateError) throw updateError;
    processed.interestAdminNotifications = 1;
  }

  const { data: overdueLoanRows, error: overdueLoanRowsError } = await supabase
    .from('loan_repayment_schedule')
    .select('id')
    .eq('status', 'overdue')
    .eq('due_date', yesterdayText);

  if (overdueLoanRowsError) throw overdueLoanRowsError;

  if (adminUserId && overdueLoanRows && overdueLoanRows.length > 0) {
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: adminUserId,
      title: 'Loan Repayments Overdue',
      message: `${overdueLoanRows.length} loan repayment(s) became overdue today. Check the admin dashboard for details.`,
      is_read: false,
    });
    if (notificationError) throw notificationError;
    processed.overdueLoanAdminNotifications = 1;
  }

  return NextResponse.json({ success: true, processed });
}
