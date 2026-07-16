import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthErrorMessage } from '@/lib/utils/authError';

function createCallbackSupabaseClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const type = requestUrl.searchParams.get('type');
    const siteUrl = requestUrl.origin;

    if (!code) {
      const redirectUrl = new URL('/signin', siteUrl);
      redirectUrl.searchParams.set('error', 'missing_auth_code');
      return NextResponse.redirect(redirectUrl);
    }

    const supabase = createCallbackSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const redirectUrl = new URL('/signin', siteUrl);
      redirectUrl.searchParams.set('error', getAuthErrorMessage(error));
      return NextResponse.redirect(redirectUrl);
    }

    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/reset-password', siteUrl));
    }

    const user = session?.user;
    const isAdmin = user?.app_metadata?.is_admin === true;

    return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/dashboard', siteUrl));
  } catch (error) {
    const siteUrl = new URL(request.url).origin;
    const redirectUrl = new URL('/signin', siteUrl);
    redirectUrl.searchParams.set('error', getAuthErrorMessage(error));
    return NextResponse.redirect(redirectUrl);
  }
}
