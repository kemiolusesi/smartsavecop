import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin-auth';

const ADMIN_DEV_BYPASS_COOKIE = 'ss_admin_dev_bypass';

function isAdminDevBypassActive() {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_ADMIN_DEV_BYPASS === 'true' &&
    cookies().get(ADMIN_DEV_BYPASS_COOKIE)?.value === 'true'
  );
}

function createDevAdminData() {
  const now = new Date().toISOString();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'dev-admin@smartsave.local';

  return {
    success: true,
    adminProfile: {
      user_id: 'dev-admin',
      full_name: 'Development Admin',
      email: adminEmail,
      is_admin: true,
    },
    profiles: [
      {
        id: 'profile-1',
        user_id: 'member-1',
        full_name: 'Ada Okafor',
        email: 'ada@example.com',
        phone_number: '08012345678',
        kyc_status: 'pending',
        approval_status: 'pending',
        balance: 250000,
        onboarding_completed: true,
        has_paid: true,
        date_of_birth: '1990-05-14',
        gender: 'Female',
        address: '12 Cooperative Road, Lagos',
        state_of_residence: 'Lagos',
        occupation: 'Trader',
        employment_status: 'Business Owner',
        monthly_income_range: 'N150K-N500K',
        nin: 'Submitted',
        next_of_kin_name: 'Chidi Okafor',
        next_of_kin_relationship: 'Sibling',
        next_of_kin_phone: '08012345670',
        next_of_kin_address: 'Lagos',
        terms_accepted: true,
        is_admin: false,
        created_at: now,
      },
      {
        id: 'profile-2',
        user_id: 'member-2',
        full_name: 'Tunde Bello',
        email: 'tunde@example.com',
        phone_number: '08087654321',
        kyc_status: 'approved',
        approval_status: 'approved',
        balance: 520000,
        onboarding_completed: true,
        has_paid: true,
        is_admin: false,
        created_at: now,
      },
    ],
    transactions: [
      {
        id: 'txn-1',
        user_id: 'member-1',
        amount: 150000,
        type: 'deposit',
        status: 'approved',
        reference: 'DEV-DEP-001',
        description: 'Dev deposit preview',
        created_at: now,
      },
      {
        id: 'txn-2',
        user_id: 'member-2',
        amount: 80000,
        type: 'withdrawal',
        status: 'pending',
        bank_name: 'Preview Bank',
        account_number: '0123456789',
        reference: 'DEV-WDR-001',
        description: 'Dev withdrawal preview',
        created_at: now,
      },
    ],
    paymentSubmissions: [
      {
        id: 'payment-withdrawal-1',
        user_id: 'member-2',
        full_name: 'Tunde Bello',
        email: 'tunde@example.com',
        amount: 80000,
        payment_type: 'withdrawal',
        transaction_reference: 'Tunde Bello - 0123456789 - Preview Bank',
        status: 'pending',
        created_at: now,
      },
    ],
    interestLedger: [],
    interestPayoutSchedule: [],
    loanRepaymentSchedule: [],
    cooperativeLedger: [],
    cooperativeFinancialSummary: null,
    loanApplications: [
      {
        id: 'loan-1',
        user_id: 'member-1',
        loan_type: 'Normal Loan',
        amount_requested: 200000,
        status: 'pending',
        purpose: 'Business support',
        created_at: now,
      },
    ],
    loanProducts: [],
    investmentApplications: [
      {
        id: 'investment-1',
        user_id: 'member-2',
        investment_type: 'Fixed Deposit Investment',
        amount: 500000,
        status: 'pending',
        tenure_months: 12,
        target_goal: 'Capital growth',
        created_at: now,
      },
    ],
    announcements: [
      {
        id: 'announcement-1',
        title: 'Welcome to Smart Save',
        body: 'This is a development preview announcement.',
        type: 'info',
        recipient_type: 'all',
        recipient_user_ids: [],
        sent_count: 2,
        sent_at: now,
        created_at: now,
      },
    ],
    settings: [
      { key: 'cooperative_name', value: 'Smart Save Cooperative' },
      { key: 'registration_fee', value: '5000' },
      { key: 'withdrawal_max_percent', value: '60' },
      { key: 'withdrawal_quarters_per_year', value: '4' },
    ],
    adminNotes: [],
    auditLog: [],
    identityRequests: [],
  };
}

async function selectSafe(supabase: any, table: string, query: string, orderColumn: string | null = 'created_at') {
  let request = supabase.from(table).select(query);
  if (orderColumn) {
    request = request.order(orderColumn, { ascending: false });
  }

  const { data, error } = await request;

  if (error) {
    return [];
  }

  return data || [];
}

export async function GET() {
  if (isAdminDevBypassActive() && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(createDevAdminData());
  }

  const context = await requireAdmin();
  if (context instanceof NextResponse) return context;

  const { supabase, adminProfile } = context;
  const [
    profiles,
    transactions,
    paymentSubmissions,
    interestLedger,
    loanApplications,
    investmentApplications,
    announcements,
    interestPayoutSchedule,
    loanRepaymentSchedule,
    cooperativeLedger,
    cooperativeFinancialSummaryRows,
  ] =
    await Promise.all([
      selectSafe(supabase, 'profiles', '*'),
      selectSafe(supabase, 'transactions', '*'),
      selectSafe(supabase, 'payment_submissions', '*'),
      selectSafe(supabase, 'interest_ledger', '*'),
      selectSafe(supabase, 'loan_applications', '*'),
      selectSafe(supabase, 'investment_applications', '*'),
      selectSafe(supabase, 'announcements', '*'),
      selectSafe(supabase, 'interest_payout_schedule', '*', 'due_date'),
      selectSafe(supabase, 'loan_repayment_schedule', '*', 'due_date'),
      selectSafe(supabase, 'cooperative_ledger', '*'),
      selectSafe(supabase, 'cooperative_financial_summary', '*', null),
    ]);


  return NextResponse.json({
    success: true,
    adminProfile,
    profiles,
    transactions,
    paymentSubmissions,
    interestLedger,
    interestPayoutSchedule,
    loanRepaymentSchedule,
    cooperativeLedger,
    cooperativeFinancialSummary: cooperativeFinancialSummaryRows[0] || null,
    loanApplications,
    loanProducts: [],
    investmentApplications,
    announcements,
    settings: [],
    adminNotes: [],
    auditLog: [],
    identityRequests: [],
  });
}

