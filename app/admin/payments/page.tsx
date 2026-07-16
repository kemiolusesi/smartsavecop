import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import PaymentApprovalsClient, { type PaymentSubmissionRow } from './PaymentApprovalsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPaymentsPage() {
  const context = await requireAdmin();

  if (context instanceof Response) {
    redirect('/signin?returnTo=/admin/payments');
  }

  const { data, error } = await context.supabase
    .from('payment_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return <PaymentApprovalsClient initialPayments={(data || []) as PaymentSubmissionRow[]} />;
}
