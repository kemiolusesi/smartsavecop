-- Smart Save Cooperative admin dashboard support.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_withdrawal_at TIMESTAMPTZ;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS loan_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_number TEXT;

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'transactions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%type%IN%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE transactions DROP CONSTRAINT %I', constraint_name);
  END IF;

  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'transactions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%IN%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE transactions DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type IN (
    'deposit',
    'withdrawal',
    'registration_fee',
    'fee',
    'interest_accrual',
    'loan_repayment',
    'loan_disbursement',
    'manual_adjustment',
    'interest_credit'
  ));

ALTER TABLE transactions
  ADD CONSTRAINT transactions_status_check
  CHECK (status IN ('success', 'approved', 'completed', 'pending', 'processing', 'failed', 'rejected', 'transferred'));

CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  loan_type TEXT,
  amount NUMERIC,
  purpose TEXT,
  duration TEXT,
  repayment_option TEXT,
  employment_status TEXT,
  monthly_income TEXT,
  has_savings BOOLEAN,
  savings_amount TEXT,
  guarantor_name TEXT,
  guarantor_phone TEXT,
  guarantor_relationship TEXT,
  has_collateral BOOLEAN,
  collateral_description TEXT,
  urgency TEXT,
  additional_info TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  disbursed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loan_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  interest_rate NUMERIC DEFAULT 0,
  max_tenure_months INTEGER DEFAULT 3,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  product TEXT,
  amount NUMERIC,
  duration TEXT,
  goals TEXT,
  existing_savings BOOLEAN,
  source TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  body TEXT,
  type TEXT DEFAULT 'info',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cooperative_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
      AND is_admin = true
      AND COALESCE(is_suspended, false) = false
  );
$$;

CREATE OR REPLACE FUNCTION public.refresh_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_loan_products_updated_at ON loan_products;
CREATE TRIGGER update_loan_products_updated_at
  BEFORE UPDATE ON loan_products
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_updated_at();

ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can read all transactions" ON transactions;
CREATE POLICY "Admins can read all transactions"
  ON transactions FOR SELECT
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can update all transactions" ON transactions;
CREATE POLICY "Admins can update all transactions"
  ON transactions FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can insert transactions" ON transactions;
CREATE POLICY "Admins can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Members can read own loan applications" ON loan_applications;
CREATE POLICY "Members can read own loan applications"
  ON loan_applications FOR SELECT
  USING (auth.uid() = user_id OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Members can create own loan applications" ON loan_applications;
CREATE POLICY "Members can create own loan applications"
  ON loan_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage loan applications" ON loan_applications;
CREATE POLICY "Admins can manage loan applications"
  ON loan_applications FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Members can read active loan products" ON loan_products;
CREATE POLICY "Members can read active loan products"
  ON loan_products FOR SELECT
  USING (is_active = true OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can manage loan products" ON loan_products;
CREATE POLICY "Admins can manage loan products"
  ON loan_products FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Members can read own investment applications" ON investment_applications;
CREATE POLICY "Members can read own investment applications"
  ON investment_applications FOR SELECT
  USING (auth.uid() = user_id OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Members can create own investment applications" ON investment_applications;
CREATE POLICY "Members can create own investment applications"
  ON investment_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage investment applications" ON investment_applications;
CREATE POLICY "Admins can manage investment applications"
  ON investment_applications FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Members can read active announcements" ON announcements;
CREATE POLICY "Members can read active announcements"
  ON announcements FOR SELECT
  USING (expires_at IS NULL OR expires_at > now() OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can manage cooperative settings" ON cooperative_settings;
CREATE POLICY "Admins can manage cooperative settings"
  ON cooperative_settings FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Members can read cooperative settings" ON cooperative_settings;
CREATE POLICY "Members can read cooperative settings"
  ON cooperative_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage admin notes" ON admin_notes;
CREATE POLICY "Admins can manage admin notes"
  ON admin_notes FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can manage audit log" ON admin_audit_log;
CREATE POLICY "Admins can manage audit log"
  ON admin_audit_log FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

INSERT INTO cooperative_settings (key, value) VALUES
  ('cooperative_name', 'Smart Save Cooperative'),
  ('registration_fee', '5000'),
  ('withdrawal_quarters_per_year', '4'),
  ('withdrawal_max_percent', '60'),
  ('contact_email', 'smartsavecooperative@gmail.com'),
  ('contact_phones', ''),
  ('whatsapp_number', ''),
  ('social_handles', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO loan_products (name, interest_rate, max_tenure_months, description, is_active)
VALUES
  ('Normal Loan', 10, 3, 'Personal emergencies, school fees, business support, household expenses.', true),
  ('Special Loan', 15, 3, 'Business expansion, contract execution, and capital-intensive projects.', true),
  ('Products Loan', 20, 3, 'Cooperative products, business equipment, and specialized purchases.', true),
  ('Electronics Loan', 3, 12, 'TVs, fridges, ACs, computers, solar systems, and approved electronics.', true),
  ('Festival Loan', 10, 3, 'Christmas, Eid, New Year, and family ceremonies.', true)
ON CONFLICT DO NOTHING;
