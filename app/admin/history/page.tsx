import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import AdminHistoryClient from './AdminHistoryClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminActivityHistoryPage() {
  const context = await requireAdmin();

  if (context instanceof Response) {
    redirect('/signin?returnTo=/admin/history');
  }

  const { data, error } = await context.supabase
    .from('admin_activity_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const adminEmail = context.adminProfile?.email || 'Admin';

  return <AdminHistoryClient rows={data || []} adminEmail={adminEmail} />;
}
