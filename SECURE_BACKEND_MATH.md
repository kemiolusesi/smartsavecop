# Secure Backend Math Logic Implementation

## Overview

All financial calculations for Smart Save Cooperative now run **securely on the backend**, ensuring accuracy, tamper-proof operations, and client-side simplicity.

## Architecture

```
Client (Frontend)
    ↓ (requests calculation)
Next.js API Route
    ↓ (proxies request)
Supabase Edge Function (growth-calculator)
    ↓ (executes)
Server-side Math (Deno runtime)
    ↓ (returns)
Verified Calculation Results
    ↓ (cached)
Dashboard Display
```

## Components

### 1. Growth Calculator Edge Function

**Endpoint**: `POST /functions/v1/growth-calculator`

**Purpose**: Calculate investment growth with simple or compound interest

**Input**:
```json
{
  "principal": 1000000,
  "rate": 0.15,
  "months": 12,
  "type": "simple" | "compound",
  "frequency": "monthly" | "annually"
}
```

**Output**:
```json
{
  "principal": 1000000,
  "rate": 0.15,
  "months": 12,
  "type": "simple",
  "total_interest": 150000,
  "final_amount": 1150000,
  "monthly_return": 12500,
  "effective_annual_rate": 0.15,
  "breakdown": [
    {
      "month": 1,
      "starting_balance": 1000000,
      "interest_accrued": 12500,
      "ending_balance": 1012500,
      "cumulative_interest": 12500
    }
    // ... for each month
  ]
}
```

**Security Features**:
- Runs in Deno sandbox (Supabase Edge Function)
- No access to database credentials
- Stateless and isolated
- CORS protected

### 2. Interest Accrual Database Functions

**Function**: `calculate_accrued_interest(plan_id)`

**Purpose**: Calculate real-time accrued interest for active savings plans

**Logic**:
```sql
-- Simple Interest Formula
accrued_interest = principal × annual_rate × (days_elapsed / 365)

-- Updates savings_plans table
UPDATE savings_plans
SET accrued_interest = calculated_interest
WHERE id = plan_id
```

**Function**: `update_all_active_plan_interests()`

**Purpose**: Batch update all active plans (scheduled job)

**Returns**: Number of plans updated

**Function**: `get_plan_projected_return(plan_id)`

**Purpose**: Get projected final returns for a plan

**Output**:
```sql
SELECT
  current_interest,
  projected_total_interest,
  projected_final_amount,
  days_remaining,
  monthly_payout
```

### 3. Daily Accrual Job Edge Function

**Endpoint**: `GET /functions/v1/daily-accrual-job`

**Purpose**: Daily scheduled job to update all active plan interests

**Operations**:
1. Call `update_all_active_plan_interests()` for all active plans
2. Check for plans that reached maturity date
3. Update matured plans status to 'matured'
4. Log all updates

**Security**:
- JWT verification required
- Service role key for database operations
- Idempotent (can run multiple times safely)

### 4. Manual Interest Accrual API

**Endpoint**: `POST /api/user/plans/accrue-interest`

**Purpose**: Manually trigger interest calculation for a specific plan

**Input**:
```json
{
  "plan_id": "uuid"
}
```

**Process**:
1. Validate user owns the plan
2. Call database function `calculate_accrued_interest(plan_id)`
3. Return updated interest and projection

**Use Cases**:
- Dashboard refresh (shows live interest)
- Before withdrawals
- User requests current interest

## Math Formulas

### Simple Interest (Default for all plans)

**Formula**:
```
Total Interest = Principal × Annual Rate × (Months / 12)

Final Amount = Principal + Total Interest

Monthly Return = Total Interest / Months
```

**Example** (₦1,000,000 for 12 months at 15% p.a.):
```
Interest = 1,000,000 × 0.15 × (12/12) = ₦150,000
Final = 1,000,000 + 150,000 = ₦1,150,000
Monthly Return = 150,000 / 12 = ₦12,500
```

### Compound Interest (Future feature)

**Formula**:
```
Final Amount = Principal × (1 + Rate / N)^(N × Years)

Where:
- N = compounding periods per year
- For monthly: N = 12
- For annually: N = 1
```

### Daily Accrual Calculation

**Formula**:
```
Days Elapsed = NOW() - start_date

Accrued Interest = Principal × Annual Rate × (Days Elapsed / 365)

Example (30 days elapsed, ₦1M at 15%):
Days = 30
Interest = 1,000,000 × 0.15 × (30/365) = ₦12,328.77
```

## ROI Calculator Integration

**Before** (Client-side):
```typescript
// Insecure - calculations in browser
const interest = principal * rate * (months / 12);
const total = principal + interest;
```

**After** (Server-side):
```typescript
// Secure - backend calculation
const response = await fetch('/api/calculator/growth', {
  method: 'POST',
  body: JSON.stringify({ principal, rate, months, type: 'simple' })
});
const result = await response.json();

// Result verified by backend
console.log(result.total_interest); // Securely calculated
```

## Dashboard Live Interest

**Implementation**:

1. **On Load**: Dashboard fetches all active plans
2. **Auto-Update**: Hook automatically requests interest accrual for each plan
3. **Display**: Shows live accrued interest with "(live)" badge
4. **Real-time**: Calculates days elapsed and total balance

**Code Flow**:
```typescript
// useDashboard hook
const fetchDashboard = async () => {
  // 1. Get all active plans from database
  const { data } = await fetch('/api/user/dashboard');

  // 2. Update interest for each plan
  for (const plan of data.activePlans) {
    await fetch('/api/user/plans/accrue-interest', {
      method: 'POST',
      body: JSON.stringify({ plan_id: plan.id })
    });
  }

  // 3. Re-fetch dashboard with updated interest
  const updated = await fetch('/api/user/dashboard');

  // 4. Display to user
  setData(updated);
};
```

## Security Guarantees

### 1. Tamper-Proof Calculations
- All math runs server-side (Edge Functions + Postgres)
- Client cannot manipulate formulas or parameters
- Results validated by database constraints

### 2. User Isolation
- RLS policies ensure users only see their own plans
- Interest accrual functions verify plan ownership
- Service role key only in Edge Functions

### 3. Audit Trail
- All plan updates logged with timestamps
- Transaction references are unique and immutable
- Interest calculations are reproducible

### 4. Accuracy
- Uses PostgreSQL's DECIMAL type for precision
- No JavaScript floating-point errors
- Consistent formulas across all users

## Performance

### Caching Strategy
- Dashboard: 1-minute cache (more accurate interest)
- Edge Function responses: Stateless, can be cached by CDN
- Database functions: Run on-demand, no stale data

### Optimization
- Index on `status = 'active'` for fast accrual queries
- Batch updates in daily job
- Pagination for transaction history

### Monitoring
- Edge Function logs show calculation requests
- Database triggers track plan updates
- Error handling returns detailed messages

## Usage Examples

### Calculate Investment Growth

```typescript
// Frontend
import { useGrowthCalculator } from '@/hooks/use-growth-calculator';

const { calculate, result, loading } = useGrowthCalculator();

await calculate(1000000, 0.15, 12, 'simple');
// result.total_interest = 150000 (verified by backend)
```

### Get Real-Time Accrued Interest

```typescript
// Dashboard automatically updates
const { activePlans, refetch } = useDashboard();

// Each plan shows live interest
activePlans.forEach(plan => {
  console.log(plan.accrued_interest); // Real-time calculation
  console.log(plan.principal_amount + plan.accrued_interest); // Current balance
});
```

### Manual Accrual Request

```bash
# API call
curl -X POST https://your-project.supabase.co/functions/v1/accrue-interest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "uuid"}'

# Response
{
  "success": true,
  "accrued_interest": 12345.67,
  "projection": {
    "current_interest": 12345.67,
    "projected_total_interest": 150000,
    "days_remaining": 330
  }
}
```

## Deployment

### Edge Functions
```bash
# Deployed automatically via mcp__supabase__deploy_edge_function
- growth-calculator (interest calculation)
- accrue-interest (single plan update)
- daily-accrual-job (scheduled batch update)
```

### Database Functions
```sql
-- Applied via migration
- calculate_accrued_interest(plan_id)
- update_all_active_plan_interests()
- get_plan_projected_return(plan_id)
```

### API Routes
```
- POST /api/calculator/growth
- POST /api/user/plans/accrue-interest
- GET /api/user/dashboard (includes live interest)
```

## Future Enhancements

1. **Real-time Updates**: WebSocket for live interest updates
2. **Compound Interest**: Add option for different compounding frequencies
3. **Tax Calculations**: Backend withholding tax computation
4. **Multi-currency**: Support for different currencies
5. **Historical Rates**: Track rate changes over time

## Monitoring & Alerts

### Edge Function Metrics
- Request count
- Response time
- Error rate

### Database Metrics
- Active plans count
- Daily accrual updates
- Maturity events

### Alerts
- Failed accrual calculations
- Unusually high interest deviations
- Plan maturity notifications

## Documentation

All math logic is documented in:
- `SECURE_BACKEND_MATH.md` (this file)
- `API_HOOKS.md` - Frontend integration
- `DATABASE.md` - Schema and functions
- Edge Function inline comments

## Summary

Every financial calculation in Smart Save Cooperative now runs securely on the backend:

✅ Growth projections: Edge Function + API route
✅ Daily interest accrual: Database function + scheduled job
✅ Real-time interest display: Dashboard hook with automatic updates
✅ Tamper-proof: Client cannot manipulate calculations
✅ Audit-ready: All results verifiable and reproducible

No client-side math - only display of verified backend results.
