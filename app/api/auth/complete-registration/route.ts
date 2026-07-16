import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

interface CompleteRegistrationRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  preferredCurrency: string;
  financialFocus: string;
  monthlyTarget: number;
}

function buildProfilePayload(data: CompleteRegistrationRequest, userId: string, email: string) {
  const now = new Date().toISOString();

  return {
    user_id: userId,
    email,
    full_name: data.fullName,
    phone_number: data.phone,
    onboarding_completed: true,
    onboarding_step: 6,
    has_paid: true,
    updated_at: now,
  };
}

async function findAuthUserIdByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email?.toLowerCase() === email)?.id || '';
}

export async function POST(req: NextRequest) {
  try {
    const body: CompleteRegistrationRequest = await req.json();
    const { email, password, fullName, phone, preferredCurrency, financialFocus, monthlyTarget } = body;

    if (!email || !password || !fullName || !phone || !preferredCurrency || !financialFocus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (!Number.isFinite(monthlyTarget) || monthlyTarget <= 0) {
      return NextResponse.json({ error: 'Invalid monthly target' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('user_id, has_paid')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileCheckError) {
      return NextResponse.json({ error: 'Unable to verify account status' }, { status: 500 });
    }

    if (existingProfile?.has_paid) {
      return NextResponse.json({ error: 'Account already exists. Please sign in.' }, { status: 409 });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        preferred_currency: preferredCurrency,
        financial_focus: financialFocus,
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      },
    });

    if (authError && !/already|duplicate|exists/i.test(authError.message || '')) {
      return NextResponse.json(
        { error: `Failed to create account: ${authError.message}` },
        { status: 500 }
      );
    }

    const userId = authData?.user?.id || existingProfile?.user_id || (await findAuthUserIdByEmail(normalizedEmail));

    if (!userId) {
      return NextResponse.json({ error: 'Failed to create or find user account' }, { status: 500 });
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(buildProfilePayload(body, userId, normalizedEmail), { onConflict: 'user_id' });

    if (profileError) {
      if (authData?.user?.id) {
        await supabase.auth.admin.deleteUser(userId);
      }

      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    await supabase.from('verification_tokens').delete().eq('email', normalizedEmail);

    return NextResponse.json({
      success: true,
      userId,
      message: 'Registration completed successfully! Please sign in with your email and password.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during registration';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
