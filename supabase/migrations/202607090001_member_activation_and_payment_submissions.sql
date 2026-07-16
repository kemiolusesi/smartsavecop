ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ALTER COLUMN is_active SET DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    is_admin,
    has_paid,
    onboarding_completed,
    kyc_status,
    balance,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false,
    false,
    false,
    'pending',
    0,
    false
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL,
  transaction_reference TEXT NOT NULL,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  rejection_reason TEXT
);

ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS amount NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'registration';
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS transaction_reference TEXT NOT NULL DEFAULT '';
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL;
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can create own payment submissions" ON payment_submissions;
CREATE POLICY "Members can create own payment submissions"
  ON payment_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can read own payment submissions" ON payment_submissions;
CREATE POLICY "Members can read own payment submissions"
  ON payment_submissions FOR SELECT
  USING (auth.uid() = user_id OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can manage payment submissions" ON payment_submissions;
CREATE POLICY "Admins can manage payment submissions"
  ON payment_submissions FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());
