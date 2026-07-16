# Smart Save Cooperative - Implementation Guide

## Architecture Overview

```
Frontend (React/Next.js)
    ↓
React Hooks (useDashboard, useProfile, etc.)
    ↓
Next.js API Routes (/api/user/*)
    ↓
Supabase Client
    ↓
PostgreSQL Database + RLS Policies
```

## What's Been Implemented

### 1. Database Layer (Supabase)
- **3 core tables**: profiles, savings_plans, transactions
- **Row-Level Security**: Users access only their own data
- **Automatic timestamps**: created_at and updated_at
- **Type-safe TypeScript types**: Full schema definitions

See: `DATABASE.md`

### 2. Service Layer (`lib/services/`)
- `profiles.ts` - Profile management (KYC, BVN)
- `savings.ts` - Investment plan operations
- `transactions.ts` - Financial transaction tracking
- `api-helpers.ts` - High-level helpers

Low-level database operations with proper error handling.

### 3. API Routes (`app/api/user/`)
- `/api/user/dashboard` - Complete dashboard data
- `/api/user/profile` - Profile management
- `/api/user/savings-plans` - Savings plan CRUD
- `/api/user/transactions` - Transaction history

All routes:
- Require JWT authentication
- Validate user identity
- Return proper HTTP status codes
- Handle errors gracefully

### 4. React Hooks (`hooks/`)
- `use-dashboard.ts` - Dashboard with caching
- `use-profile.ts` - Profile fetching & updating
- `use-savings-plans.ts` - Plans with creation
- `use-transactions.ts` - Transaction history

All hooks:
- Handle loading/error states
- Provide mutation methods
- Support manual refetch
- Automatic data fetching on mount

### 5. Dashboard Page (`app/dashboard/page.tsx`)
- **Key metrics**: Total balance, monthly return, KYC status
- **Active plans**: Display all investment subscriptions
- **Recent transactions**: Latest 10 transactions
- **Responsive design**: Mobile-first layout
- **Privacy toggle**: Hide/show balance

## How the Data Flows

### Get Dashboard Data
```
useDashboard()
  ↓
fetch(/api/user/dashboard, { headers: { Authorization: Bearer token } })
  ↓
API route validates token with supabase.auth.getUser()
  ↓
Query profiles, savings_plans, transactions from Supabase
  ↓
RLS policies enforce user can only see their data
  ↓
Calculate totals and return to frontend
  ↓
Hook caches for 5 minutes
```

### Create New Savings Plan
```
useSavingsPlans().createPlan('12-month', 1000000)
  ↓
POST /api/user/savings-plans with { plan_type, principal_amount }
  ↓
API route validates token
  ↓
Calculate dates (start + 12 months = mature)
  ↓
Insert into savings_plans table
  ↓
RLS policy ensures user_id matches auth user
  ↓
Return created plan with ID
  ↓
Hook updates local state and updates UI
```

## File Structure

```
app/
├── api/user/
│   ├── dashboard/route.ts
│   ├── profile/route.ts
│   ├── savings-plans/route.ts
│   └── transactions/route.ts
├── dashboard/
│   └── page.tsx
└── layout.tsx

hooks/
├── use-dashboard.ts
├── use-profile.ts
├── use-savings-plans.ts
└── use-transactions.ts

lib/
├── services/
│   ├── profiles.ts
│   ├── savings.ts
│   ├── transactions.ts
│   └── index.ts
├── types/
│   └── database.ts
├── api-helpers.ts
├── supabase.ts
└── utils.ts

components/
└── [shared UI components]
```

## Using the Dashboard Hook

```typescript
'use client';

import { useDashboard } from '@/hooks/use-dashboard';

export function MyComponent() {
  const {
    profile,
    activePlans,
    recentTransactions,
    totalBalance,
    monthlyReturn,
    loading,
    error,
    refetch
  } = useDashboard();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome, {profile?.full_name}</h1>
      <p>Balance: ₦{totalBalance}</p>
      <p>Plans: {activePlans.length}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

## Using Profile Hook

```typescript
const { profile, updateProfile, error } = useProfile();

const handleKYCSubmit = async (formData) => {
  const result = await updateProfile({
    full_name: formData.name,
    phone: formData.phone,
    bvn: formData.bvn,
    kyc_status: 'pending'
  });
  
  if (result) {
    console.log('Profile updated');
  }
};
```

## Creating a Savings Plan

```typescript
const { createPlan, loading, error } = useSavingsPlans();

const handleCreatePlan = async (planType: '6-month' | '12-month', amount: number) => {
  const plan = await createPlan(planType, amount);
  if (plan) {
    console.log('Plan created:', plan.id);
    // Refresh dashboard
    dashboard.refetch();
  }
};
```

## Recording a Transaction

```typescript
const { createTransaction } = useTransactions();

const handleDeposit = async (amount: number, planId: string) => {
  const txn = await createTransaction(
    amount,
    'deposit',
    'Initial investment',
    planId
  );
  
  if (txn) {
    console.log('Transaction recorded:', txn.reference);
  }
};
```

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are automatically provided by Supabase.

## Build & Deployment

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Type checking
npm run typecheck

# Linting
npm run lint
```

The build includes:
- All API routes
- Dashboard page
- React hooks
- Database types
- Service layer

## Key Features

### Security
- JWT authentication on all API routes
- Row-Level Security in database
- User isolation (can only access own data)
- No credentials in frontend code

### Performance
- 5-minute dashboard caching
- Pagination for transactions
- Optimized Supabase queries
- Lazy loading with Suspense-ready

### User Experience
- Loading states on all data fetches
- Error messages with fallbacks
- Responsive design
- Real-time updates after mutations
- Privacy toggle (hide/show balance)

### Data Validation
- Server-side validation on all routes
- TypeScript type checking
- Unique constraints (BVN, references)
- Foreign key relationships

## Next Steps

1. **Authentication Pages**
   - Signup with email/password
   - Login flow
   - Logout functionality
   - Redirect to dashboard on auth

2. **KYC Submission**
   - Form for submitting KYC
   - BVN verification
   - Document upload
   - Status tracking

3. **Savings Plan Purchase**
   - Plan selection UI
   - Amount input with validation
   - Confirmation page
   - Payment integration (Stripe)

4. **Transaction Processing**
   - Bank transfer details
   - Payment gateway
   - Webhook handling
   - Status updates

5. **Additional Features**
   - Interest accrual cron job
   - Plan maturity automation
   - Email notifications
   - Mobile app

## Troubleshooting

### Hook returns "Not authenticated"
- User session is null
- Call `supabase.auth.signIn()` first

### API returns 401
- JWT token is expired
- User not in Supabase Auth
- Check Authorization header format

### Data not updating after mutation
- Call `refetch()` on the hook
- Dashboard has 5-min cache - wait or refresh manually
- Check browser console for errors

### RLS policy violations
- User trying to access other user's data
- Profile table row-level security is working correctly

## Type Definitions

All database types are in `lib/types/database.ts`:

```typescript
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  bvn: string;
  bvn_verified: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface SavingsPlan {
  id: string;
  user_id: string;
  plan_type: '6-month' | '12-month';
  principal_amount: number;
  annual_rate: number;
  accrued_interest: number;
  start_date: string;
  mature_date: string;
  status: 'active' | 'matured' | 'withdrawn' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  savings_plan_id: string | null;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'fee' | 'interest_accrual';
  status: 'success' | 'pending' | 'failed';
  reference: string;
  description: string;
  created_at: string;
  updated_at: string;
}
```

## Documentation

- `DATABASE.md` - Database schema and migrations
- `API_HOOKS.md` - API routes and React hooks
- `BACKEND_SETUP.md` - Backend architecture
- `IMPLEMENTATION_GUIDE.md` - This file

All code is fully documented with TypeScript and JSDoc comments.
