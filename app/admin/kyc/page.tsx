import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import KycApprovalsClient, { type KycProfileRow } from './KycApprovalsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminKycPage() {
  const context = await requireAdmin();

  if (context instanceof Response) {
    redirect('/signin?returnTo=/admin/kyc');
  }

  const { data, error } = await context.supabase
    .from('profiles')
    .select('user_id,full_name,email,kyc_status,kyc_document_type,kyc_document_number,kyc_document_url,kyc_submitted_at,created_at')
    .eq('kyc_status', 'submitted')
    .order('kyc_submitted_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return <KycApprovalsClient initialProfiles={(data || []) as KycProfileRow[]} />;
}
