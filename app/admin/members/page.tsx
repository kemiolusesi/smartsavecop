import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import MembersManagementClient, { type MemberRow } from './MembersManagementClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminMembersPage() {
  const context = await requireAdmin();

  if (context instanceof Response) {
    redirect('/signin?returnTo=/admin/members');
  }

  const { data, error } = await context.supabase
    .from('profiles')
    .select('user_id,full_name,email,is_active,approval_status,kyc_status,balance,created_at,has_paid,activated_at,deactivated_at')
    .eq('is_admin', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return <MembersManagementClient initialMembers={(data || []) as MemberRow[]} />;
}
