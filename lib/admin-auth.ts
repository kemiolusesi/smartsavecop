import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createCookieSupabaseClient } from '@/lib/server-supabase';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const ADMIN_DEV_BYPASS_COOKIE = 'ss_admin_dev_bypass';

function isAdminDevBypassActive() {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_ADMIN_DEV_BYPASS === 'true' &&
    cookies().get(ADMIN_DEV_BYPASS_COOKIE)?.value === 'true'
  );
}

async function getConfiguredDevAdminProfile(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';

  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL is required for admin dev bypass.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', adminEmail.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  if (!data?.is_admin || data?.is_active === false) {
    throw new Error('Configured admin profile was not found or is not active.');
  }

  return data;
}

export type AdminContext = {
  adminId: string;
  adminProfile: any;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
};

export async function requireAdmin(): Promise<AdminContext | NextResponse> {
  if (isAdminDevBypassActive()) {
    try {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          { success: false, error: 'Admin action unavailable in dev bypass without SUPABASE_SERVICE_ROLE_KEY.' },
          { status: 503 }
        );
      }

      const supabase = createSupabaseAdminClient();
      const adminProfile = await getConfiguredDevAdminProfile(supabase);

      return {
        adminId: adminProfile.user_id,
        adminProfile,
        supabase,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Admin dev bypass failed.';
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
  }

  const authSupabase = createCookieSupabaseClient();
  const {
    data: { session },
  } = await authSupabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: adminProfile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (!adminProfile?.is_admin || adminProfile?.is_active === false) {
    return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
  }

  return {
    adminId: session.user.id,
    adminProfile,
    supabase,
  };
}

export async function logAdminAction(
  context: AdminContext,
  action: string,
  targetUserId?: string | null,
  details: Record<string, unknown> = {}
) {
  void context;
  void action;
  void targetUserId;
  void details;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
