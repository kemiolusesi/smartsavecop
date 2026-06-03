# API Routes & React Hooks Documentation

## Overview

Smart Save Cooperative implements a complete API layer with Next.js route handlers and custom React hooks for seamless data fetching from Supabase. All endpoints require JWT authentication.

## API Routes

### Dashboard (`/api/user/dashboard`)

**GET** - Retrieve complete dashboard data for authenticated user

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "user_id": "uuid",
    "full_name": "string",
    "kyc_status": "pending|approved|rejected",
    "bvn_verified": boolean
  },
  "activePlans": [{
    "id": "uuid",
    "plan_type": "6-month|12-month",
    "principal_amount": number,
    "annual_rate": number,
    "accrued_interest": number,
    "status": "active|matured|withdrawn|cancelled"
  }],
  "recentTransactions": [{
    "id": "uuid",
    "amount": number,
    "type": "deposit|withdrawal|fee|interest_accrual",
    "status": "success|pending|failed",
    "reference": "string",
    "created_at": "ISO8601"
  }],
  "totalBalance": number,
  "monthlyReturn": number
}
```

### Profile (`/api/user/profile`)

**GET** - Retrieve user profile

**POST** - Create or update user profile

**Request body:**
```json
{
  "full_name": "string",
  "phone": "string",
  "bvn": "string",
  "kyc_status": "pending|approved|rejected"
}
```

### Savings Plans (`/api/user/savings-plans`)

**GET** - List all user savings plans
- Query params:
  - `status` (optional): Filter by status ('active', 'matured', 'withdrawn', 'cancelled')

**POST** - Create new savings plan

**Request body:**
```json
{
  "plan_type": "6-month|12-month",
  "principal_amount": number
}
```

**Auto-calculated:**
- Annual rates: 6-month (7%), 12-month (15%)
- Mature date based on plan type
- Status defaults to 'active'

### Transactions (`/api/user/transactions`)

**GET** - List user transactions
- Query params:
  - `limit` (default: 50): Number of records to fetch
  - `offset` (default: 0): Pagination offset
  - `type` (optional): Filter by type ('deposit', 'withdrawal', 'fee', 'interest_accrual')

**POST** - Create new transaction

**Request body:**
```json
{
  "amount": number,
  "type": "deposit|withdrawal|fee|interest_accrual",
  "description": "string (optional)",
  "savings_plan_id": "uuid (optional)"
}
```

## Authentication

All API routes require Bearer token authentication:

```typescript
const headers = {
  'Authorization': `Bearer ${session.access_token}`,
  'Content-Type': 'application/json'
};
```

Tokens are obtained from Supabase Auth and validated server-side.

## React Hooks

### useDashboard

Fetches complete dashboard data with 5-minute caching.

**Usage:**
```typescript
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
```

**Features:**
- Automatic caching (5-minute TTL)
- Loading states
- Error handling
- Manual refetch capability

### useProfile

Manage user profile with update capability.

**Usage:**
```typescript
const {
  profile,
  loading,
  error,
  updateProfile,
  refetch
} = useProfile();

// Update profile
await updateProfile({
  full_name: 'John Doe',
  phone: '+2348000000000'
});
```

**Parameters:**
- None (fetches authenticated user's profile)

**Methods:**
- `updateProfile(updates)` - Returns Promise<Profile | null>

### useSavingsPlans

Manage user savings plans with creation capability.

**Usage:**
```typescript
const {
  plans,
  loading,
  error,
  createPlan,
  refetch
} = useSavingsPlans('active'); // Optional status filter

// Create new plan
const plan = await createPlan('12-month', 1000000);
```

**Parameters:**
- `status` (optional): 'active' | 'matured' | 'withdrawn' | 'cancelled'

**Methods:**
- `createPlan(planType, amount)` - Returns Promise<SavingsPlan | null>
  - `planType`: '6-month' | '12-month'
  - `amount`: Principal amount in NGN

### useTransactions

Retrieve transaction history with creation capability.

**Usage:**
```typescript
const {
  transactions,
  loading,
  error,
  createTransaction,
  refetch
} = useTransactions(50, 'deposit'); // limit, optional type filter

// Create transaction
const txn = await createTransaction(
  50000,                    // amount
  'deposit',                // type
  'Deposit for investment', // description
  planId                    // savings_plan_id (optional)
);
```

**Parameters:**
- `limit` (default: 50): Records per fetch
- `type` (optional): Filter by transaction type

**Methods:**
- `createTransaction(amount, type, description?, planId?)` - Returns Promise<Transaction | null>

## Error Handling

All hooks follow consistent error patterns:

```typescript
const { data, loading, error, refetch } = useHook();

if (error) {
  console.error('Operation failed:', error);
  // Handle error appropriately
}
```

Common errors:
- `"Not authenticated"` - No valid session
- `"Failed to fetch [resource]"` - Network/API error
- `"Invalid token"` - Expired or invalid auth token

## Performance Optimization

### Caching Strategy

- **Dashboard**: 5-minute cache for complete dashboard data
- **Profile**: Real-time fetch (no cache)
- **Plans**: Real-time fetch with sorted results
- **Transactions**: Real-time fetch with pagination

### Best Practices

1. **Use specific hooks** - Don't load dashboard when you only need profile
2. **Leverage pagination** - Use limit/offset for large transaction lists
3. **Cache dashboard data** - Dashboard hook implements intelligent caching
4. **Manual refetch** - Call `refetch()` after mutations

## Integration Example

```typescript
'use client';

import { useDashboard } from '@/hooks/use-dashboard';
import { useSavingsPlans } from '@/hooks/use-savings-plans';

export function Dashboard() {
  const dashboard = useDashboard();
  const { createPlan } = useSavingsPlans('active');

  const handleCreatePlan = async () => {
    const plan = await createPlan('12-month', 1000000);
    if (plan) {
      // Refresh dashboard to show new plan
      dashboard.refetch();
    }
  };

  if (dashboard.loading) return <div>Loading...</div>;
  if (dashboard.error) return <div>Error: {dashboard.error}</div>;

  return (
    <div>
      <h1>Balance: ₦{dashboard.totalBalance}</h1>
      <button onClick={handleCreatePlan}>Create Plan</button>
    </div>
  );
}
```

## Security Considerations

1. **JWT Validation** - All routes validate Bearer token with Supabase Auth
2. **Row-Level Security** - Supabase RLS ensures users access only their data
3. **No Secrets in Frontend** - All sensitive operations happen server-side
4. **Error Messages** - Generic error messages prevent information leakage

## Type Safety

All endpoints and hooks are fully typed with TypeScript:

```typescript
import { Profile, SavingsPlan, Transaction } from '@/lib/types/database';

const profile: Profile = await getProfile();
const plans: SavingsPlan[] = await getSavingsPlans();
const txns: Transaction[] = await getTransactions();
```

## Rate Limiting

No explicit rate limiting implemented - Supabase applies standard limits:
- Database: 50,000 requests/day (free tier)
- Authentication: Built-in abuse protection

## Future Enhancements

- WebSocket subscriptions for real-time updates
- Offline-first caching with service workers
- Advanced filtering and search
- Export transaction history
- Batch operations for multiple plans
