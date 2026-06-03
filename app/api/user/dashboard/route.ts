import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const [profileRes, plansRes, transactionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('savings_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('mature_date', { ascending: true }),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const profile = profileRes.data;
    const activePlans = (plansRes.data || []) as any[];
    const recentTransactions = (transactionsRes.data || []) as any[];

    let totalBalance = 0;
    let monthlyReturn = 0;

    activePlans.forEach((plan) => {
      totalBalance += plan.principal_amount + plan.accrued_interest;
      const monthlyRate = plan.annual_rate / 12;
      monthlyReturn += plan.principal_amount * monthlyRate;
    });

    return NextResponse.json({
      profile,
      activePlans,
      recentTransactions,
      totalBalance,
      monthlyReturn,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
