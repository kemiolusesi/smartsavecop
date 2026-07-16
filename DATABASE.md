# Smart Save Cooperative - Database Architecture

## Overview

The Smart Save Cooperative backend uses Supabase PostgreSQL with Row-Level Security (RLS) for data protection. The schema consists of three primary tables: `profiles`, `savings_plans`, and `transactions`.

## Tables

### 1. Profiles Table

Stores user KYC (Know-Your-Customer) information and verification status.

**Columns:**
- `id` (UUID, Primary Key) - Unique identifier
- `user_id` (UUID, FK to auth.users) - Reference to Supabase Auth user
- `full_name` (text) - User's full legal name
- `phone` (text) - Contact phone number
- `bvn` (text, unique) - Bank Verification Number
- `bvn_verified` (boolean, default: false) - BVN verification status
- `kyc_status` (text) - One of: `pending`, `approved`, `rejected`
- `kyc_submitted_at` (timestamptz) - When KYC was submitted
- `kyc_approved_at` (timestamptz) - When KYC was approved
- `created_at` (timestamptz) - Record creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `user_id`
- Unique index on `bvn`
- Index on `kyc_status`
- Index on `created_at`

**RLS Policies:**
- Users can SELECT their own profile
- Users can INSERT their own profile
- Users can UPDATE their own profile

### 2. Savings Plans Table

Tracks user investments in savings plans with interest accrual.

**Columns:**
- `id` (UUID, Primary Key) - Unique identifier
- `user_id` (UUID, FK to auth.users) - User who owns the plan
- `plan_type` (text) - One of: `6-month`, `12-month`
- `principal_amount` (numeric) - Initial investment amount
- `annual_rate` (numeric) - Annual interest rate (e.g., 0.15 for 15%)
- `accrued_interest` (numeric, default: 0) - Accumulated interest
- `start_date` (timestamptz) - Plan start date
- `mature_date` (timestamptz) - Plan maturity date
- `status` (text) - One of: `active`, `matured`, `withdrawn`, `cancelled`
- `created_at` (timestamptz) - Record creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `status`
- Index on `mature_date`
- Index on `created_at`

**RLS Policies:**
- Users can SELECT their own savings plans
- Users can INSERT their own savings plans
- Users can UPDATE their own savings plans

**Interest Calculation:**
- 6-month plan: 7% annual rate
- 12-month plan: 15% annual rate

### 3. Transactions Table

Audit log of all financial transactions including deposits, withdrawals, and fees.

**Columns:**
- `id` (UUID, Primary Key) - Unique identifier
- `user_id` (UUID, FK to auth.users) - User who performed the transaction
- `savings_plan_id` (UUID, FK to savings_plans, nullable) - Associated plan
- `amount` (numeric) - Transaction amount in NGN
- `type` (text) - One of: `deposit`, `withdrawal`, `fee`, `interest_accrual`
- `status` (text) - One of: `success`, `pending`, `failed`
- `reference` (text, unique) - Unique transaction reference (auto-generated)
- `description` (text) - Transaction description
- `created_at` (timestamptz) - Record creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Unique index on `reference`
- Index on `status`
- Index on `type`
- Index on `created_at`

**RLS Policies:**
- Users can SELECT their own transactions
- Users can INSERT their own transactions
- Users can UPDATE their own transactions

**Reference Format:**
- Automatically generated as `TXN-{timestamp}-{random}`
- Example: `TXN-1716453600000-ABC1XYZ`

## Relationships

```
auth.users (Supabase Auth)
├── profiles (1:1) - User KYC information
├── savings_plans (1:N) - Multiple investment plans per user
│   └── transactions (1:N) - Transactions linked to plans
└── transactions (1:N) - All user transactions
```

## Services

### Profile Services (`lib/services/profiles.ts`)

- `getProfile(userId)` - Retrieve user profile
- `createProfile(userId, profile)` - Create new profile
- `updateProfile(userId, updates)` - Update profile fields
- `submitKYC(userId, fullName, phone, bvn)` - Submit KYC information
- `verifyBVN(userId, bvn)` - Mark BVN as verified

### Savings Services (`lib/services/savings.ts`)

- `createSavingsPlan(userId, planType, principalAmount)` - Create investment plan
- `getUserSavingsPlans(userId)` - Get all user plans
- `getSavingsPlan(planId)` - Get specific plan
- `updatePlanStatus(planId, status)` - Update plan status
- `calculateInterest(plan)` - Calculate accrued interest
- `getActivePlans(userId)` - Get only active plans

### Transaction Services (`lib/services/transactions.ts`)

- `createTransaction(userId, amount, type, status)` - Record transaction
- `getUserTransactions(userId, limit, offset)` - Get user's transactions
- `getTransaction(transactionId)` - Get specific transaction
- `getTransactionByReference(reference)` - Lookup by reference
- `updateTransactionStatus(transactionId, status)` - Update transaction status
- `getUserBalance(userId)` - Calculate total balance from transactions
- `getPlanTransactions(planId)` - Get transactions for a plan

### API Helpers (`lib/api-helpers.ts`)

- `getUserDashboard(userId)` - Get dashboard data (profile, plans, balance, transactions)
- `initializeUserAccount(userId, fullName)` - Create user account on signup
- `calculateProjectedReturn(principal, rate, months)` - Calculate projected returns

## Security

### Row-Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow users to SELECT their own data only
- Allow users to INSERT new records only for themselves
- Allow users to UPDATE their own data only
- Prevent users from accessing other users' data

### Data Protection

- BVN is stored and must be unique to prevent duplicates
- Transaction references are immutable and unique for auditing
- All timestamps are auto-managed by database triggers
- Foreign keys enforce referential integrity

## Migrations

The complete schema is created via Supabase migrations:
- Migration file: `supabase/migrations/{timestamp}_create_smart_save_schema.sql`
- All tables include triggers for automatic `updated_at` timestamps
- Indexes created for query performance

## Usage Examples

```typescript
// Get user dashboard
const dashboard = await getUserDashboard(userId);

// Create savings plan
const plan = await createSavingsPlan(userId, '12-month', 1000000);

// Record deposit transaction
const txn = await createTransaction(
  userId,
  1000000,
  'deposit',
  'success',
  plan.id,
  'Initial investment'
);

// Get user balance
const balance = await getUserBalance(userId);

// Update plan status to matured
await updatePlanStatus(plan.id, 'matured');
```

## Environment Variables

Required environment variables (in `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are automatically provided by Supabase and used by the client to connect to the database.
