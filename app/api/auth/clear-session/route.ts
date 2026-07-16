import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ ok: true });

  request.cookies.getAll().forEach((cookie) => {
    if (
      cookie.name.startsWith('sb-') ||
      cookie.name.toLowerCase().includes('supabase') ||
      cookie.name.toLowerCase().includes('auth')
    ) {
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        maxAge: 0,
        path: '/',
      });
    }
  });

  return response;
}
