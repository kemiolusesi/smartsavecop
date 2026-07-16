import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    const { plan_id } = body;

    if (!plan_id) {
      return NextResponse.json(
        { error: 'Missing required field: plan_id' },
        { status: 400 }
      );
    }

    const { data: plan, error: planError } = await supabase
      .from('savings_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan not found or access denied' },
        { status: 404 }
      );
    }

    const { data: accruedInterest, error: accrualError } = await supabase
      .rpc('calculate_accrued_interest', { plan_id });

    if (accrualError) {
      throw accrualError;
    }

    const { data: projection, error: projectionError } = await supabase
      .rpc('get_plan_projected_return', { plan_id });

    void projectionError;

    return NextResponse.json({
      success: true,
      plan_id,
      accrued_interest: accruedInterest,
      projection: projection || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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
    const planId = searchParams.get('plan_id');

    if (!planId) {
      return NextResponse.json(
        { error: 'Missing query parameter: plan_id' },
        { status: 400 }
      );
    }

    const { data: projection, error: projectionError } = await supabase
      .rpc('get_plan_projected_return', { plan_id: planId });

    if (projectionError) {
      throw projectionError;
    }

    return NextResponse.json({
      success: true,
      projection,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
