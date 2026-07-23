import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { SAVINGS_DURATION_MONTHS, SAVINGS_RETURN_RATE, getFixedInvestmentTier } from '@/lib/investment-config';

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const adminSupabase = createSupabaseAdminClient();

    let query = adminSupabase.from('savings_plans').select('*').eq('user_id', user.id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { plan_type, principal_amount } = body;

    if (!plan_type || !principal_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const planMonths = { '6-month': 6, '12-month': SAVINGS_DURATION_MONTHS };

    const tier = getFixedInvestmentTier(Number(principal_amount));
    const configuredRate = tier?.monthlyRate || SAVINGS_RETURN_RATE;
    const months = planMonths[plan_type as keyof typeof planMonths] || 0;

    if (!months) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const startDate = new Date();
    const matureDate = new Date(startDate);
    matureDate.setMonth(matureDate.getMonth() + months);

    const adminSupabase = createSupabaseAdminClient();
    const { data, error } = await adminSupabase
      .from('savings_plans')
      .insert([
        {
          user_id: user.id,
          plan_type,
          principal_amount,
          annual_rate: configuredRate,
          accrued_interest: 0,
          start_date: startDate.toISOString(),
          mature_date: matureDate.toISOString(),
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
