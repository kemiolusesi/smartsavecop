import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

interface MagicLinkRequest {
  email: string;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { email }: MagicLinkRequest = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Generate token
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store in database
    const { error: dbError } = await supabase
      .from('verification_tokens')
      .insert({
        email: email.toLowerCase(),
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to generate login link' },
        { status: 500 }
      );
    }

    // In production, send email with magic link
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLink = `${origin}/api/auth/callback?token=${token}&email=${encodeURIComponent(email)}`;

    console.log('[DEV] Magic link:', magicLink);
    console.log('[DEV] Token will expire at:', expiresAt);

    // TODO: In production, replace with actual email service (SendGrid, Resend, etc.)
    // const emailResponse = await sendEmail({
    //   to: email,
    //   subject: 'Your Smart Save Sign-In Link',
    //   html: `<a href="${magicLink}">Click here to sign in</a>`,
    // });

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to email',
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
