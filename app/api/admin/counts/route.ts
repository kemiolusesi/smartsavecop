import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

async function getAdminPendingCounts(supabase: any) {
  const [memberships, payments, withdrawals, loans, investments] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending')
      .eq('is_admin', false),
    supabase
      .from('payment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('payment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('payment_type', 'withdrawal'),
    supabase
      .from('loan_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('investment_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const error = memberships.error || payments.error || withdrawals.error || loans.error || investments.error;
  if (error) throw error;

  const counts = {
    members: memberships.count || 0,
    payments: payments.count || 0,
    withdrawals: withdrawals.count || 0,
    loans: loans.count || 0,
    investments: investments.count || 0,
  };

  return {
    ...counts,
    totalPendingActions: counts.members + counts.payments + counts.loans + counts.investments,
  };
}

export async function GET() {
  const context = await requireAdmin();
  if (context instanceof NextResponse) return context;

  const counts = await getAdminPendingCounts(context.supabase);

  return NextResponse.json({
    success: true,
    ...counts,
  });
}
