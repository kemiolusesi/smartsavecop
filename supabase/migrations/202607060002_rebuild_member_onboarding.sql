-- Smart Save Cooperative member onboarding rebuild.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nin TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS residential_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state_of_residence TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_income TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_document_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_document_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS next_of_kin_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS next_of_kin_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_submitted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass
      AND conname = 'profiles_approval_status_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_approval_status_check
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_approval_status
  ON profiles(approval_status);

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_submitted_at
  ON profiles(onboarding_submitted_at DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Members can upload own KYC documents" ON storage.objects;
CREATE POLICY "Members can upload own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Members can update own KYC documents" ON storage.objects;
CREATE POLICY "Members can update own KYC documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'kyc-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Members can read own KYC documents" ON storage.objects;
CREATE POLICY "Members can read own KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins can read all KYC documents" ON storage.objects;
CREATE POLICY "Admins can read all KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND public.current_user_is_admin()
  );
