-- ============================================================================
-- Smart Save Cooperative Database Migration
-- ============================================================================
-- This migration sets up the core tables for the Smart Save Cooperative
-- savings management system including:
--   - profiles: User KYC information and verification status
--   - savings_plans: User savings plan subscriptions
--   - transactions: All financial transactions
--
-- All tables have RLS enabled with policies for user data isolation.
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- Stores user profile information with KYC details
-- ============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    bvn TEXT UNIQUE,
    bvn_verified BOOLEAN DEFAULT FALSE,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    kyc_submitted_at TIMESTAMPTZ,
    kyc_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Create index on bvn for BVN verification lookups
CREATE INDEX idx_profiles_bvn ON profiles(bvn);

-- Create index on kyc_status for filtering
CREATE INDEX idx_profiles_kyc_status ON profiles(kyc_status);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- SAVINGS_PLANS TABLE
-- Stores user savings plan subscriptions
-- ============================================================================
CREATE TABLE savings_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('6-month', '12-month')),
    principal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    annual_rate NUMERIC(5, 2) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mature_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matured', 'withdrawn', 'cancelled')),
    accrued_interest NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_savings_plans_user_id ON savings_plans(user_id);

-- Create index on status for filtering active/matured plans
CREATE INDEX idx_savings_plans_status ON savings_plans(status);

-- Create index on mature_date for maturity scheduling
CREATE INDEX idx_savings_plans_mature_date ON savings_plans(mature_date);

-- Enable RLS on savings_plans
ALTER TABLE savings_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own savings plans
CREATE POLICY "Users can view own savings plans" ON savings_plans
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own savings plans
CREATE POLICY "Users can insert own savings plans" ON savings_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own savings plans
CREATE POLICY "Users can update own savings plans" ON savings_plans
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- TRANSACTIONS TABLE
-- Stores all financial transactions
-- ============================================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    savings_plan_id UUID REFERENCES savings_plans(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'fee', 'interest_accrual')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('success', 'pending', 'failed')),
    reference TEXT UNIQUE NOT NULL DEFAULT 'TXN-' || substring(uuid_generate_v4()::text, 1, 12),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Create index on savings_plan_id for plan-related queries
CREATE INDEX idx_transactions_savings_plan_id ON transactions(savings_plan_id);

-- Create index on type for filtering by transaction type
CREATE INDEX idx_transactions_type ON transactions(type);

-- Create index on status for filtering pending transactions
CREATE INDEX idx_transactions_status ON transactions(status);

-- Create index on created_at for chronological ordering
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Create index on reference for unique lookups
CREATE INDEX idx_transactions_reference ON transactions(reference);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own transactions
CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER FUNCTIONS FOR UPDATED_AT
-- Automatically update the updated_at timestamp on row updates
-- ============================================================================

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to savings_plans
CREATE TRIGGER update_savings_plans_updated_at
    BEFORE UPDATE ON savings_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to transactions
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- 
-- Tables Created:
--   1. profiles - User KYC information with:
--      - UUID primary key
--      - Foreign key to auth.users with CASCADE delete
--      - Unique BVN constraint
--      - KYC status tracking (pending/approved/rejected)
--      - Timestamps for KYC submission and approval
--
--   2. savings_plans - Savings plan subscriptions with:
--      - UUID primary key
--      - Foreign key to auth.users with CASCADE delete
--      - Plan types: 6-month or 12-month
--      - Principal amount and interest rate tracking
--      - Maturity date and status tracking
--      - Accrued interest balance
--
--   3. transactions - Financial transactions with:
--      - UUID primary key
--      - Foreign key to auth.users with CASCADE delete
--      - Nullable foreign key to savings_plans
--      - Transaction types: deposit, withdrawal, fee, interest_accrual
--      - Status tracking: success, pending, failed
--      - Unique auto-generated reference
--
-- Security:
--   - RLS enabled on all tables
--   - Policies restrict data access to authenticated users' own records
--
-- Indexes:
--   - Performance indexes on user_id, status, and date columns
--   - Unique constraint on BVN and transaction references
--
-- Triggers:
--   - Automatic updated_at timestamp on all tables
-- ============================================================================