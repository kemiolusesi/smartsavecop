import AdminDashboardClient from '../AdminDashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminLoansPage() {
  return <AdminDashboardClient view="loans" />;
}


