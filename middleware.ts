import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function isPublicPath(path: string) {
  const publicRoutes = [
    '/',
    '/signin',
    '/signup',
    '/about',
    '/contact',
    '/faq',
    '/privacy',
    '/terms',
    '/compliance',
    '/marketplace',
    '/pending-activation',
    '/auth/callback',
    '/auth/confirm',
    '/clear-session',
    '/reset-password',
  ];

  return (
    publicRoutes.some((route) => path === route) ||
    path.startsWith('/auth/') ||
    path.startsWith('/api/') ||
    path.startsWith('/_next/')
  );
}

function isProtectedPath(path: string) {
  return path === '/admin' || path.startsWith('/admin/') || path === '/dashboard' || path.startsWith('/dashboard/') || path === '/onboarding' || path.startsWith('/onboarding/');
}

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({ request });
    const path = request.nextUrl.pathname;

    if (isPublicPath(path)) {
      return response;
    }

    if (!isProtectedPath(path)) {
      return response;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables for middleware.');
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('returnTo', path);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.css$|.*\\.js$).*)',
  ],
};
