import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.redirect(new URL('/auth?error=invalid_link', req.url));
    }

    const tokenHash = hashToken(token);

    // Query for token in database
    const { data: tokenData, error: queryError } = await supabase
      .from('verification_tokens')
      .select('id, email, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (queryError || !tokenData) {
      console.error('Token query error:', queryError);
      return NextResponse.redirect(new URL('/auth?error=invalid_token', req.url));
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/auth?error=link_expired', req.url));
    }

    // Check if token already used
    if (tokenData.used_at) {
      return NextResponse.redirect(new URL('/auth?error=link_already_used', req.url));
    }

    // Mark token as used
    const { error: updateError } = await supabase
      .from('verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('Token update error:', updateError);
      return NextResponse.redirect(new URL('/auth?error=verification_failed', req.url));
    }

    // Create or get user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: crypto.randomBytes(32).toString('hex'),
      email_confirm: true,
      user_metadata: {
        email_verified_at: new Date().toISOString(),
      },
    });

    // If user already exists, that's fine
    if (authError && !authError.message.includes('already exists')) {
      console.error('Auth creation error:', authError);
      return NextResponse.redirect(new URL('/auth?error=auth_failed', req.url));
    }

    const userId = authData?.user?.id || tokenData.email; // Fallback if user already existed

    // Check user profile existence
    const { data: profileData } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    // Create session by signing in
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: crypto.randomBytes(32).toString('hex'),
    });

    // For passwordless, we'll use Supabase's built-in session handling
    // Generate a simple session redirect
    const redirectUrl = profileData?.onboarding_completed === false
      ? '/onboarding'
      : '/dashboard';

    // Create response with redirect
    const response = NextResponse.redirect(new URL(redirectUrl, req.url), 302);

    // Set auth token in cookie for client-side session
    response.cookies.set({
      name: 'auth_verified',
      value: 'true',
      maxAge: 86400, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/auth?error=server_error', req.url));
  }
}
