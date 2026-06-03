import { NextRequest, NextResponse } from 'next/server';

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }

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
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to calculate growth');
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Growth calculation API error:', error);
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/growth-calculator?principal=${principal}&rate=${rate}&months=${months}&type=${type}&frequency=${frequency}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to calculate growth');
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Growth calculation API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
