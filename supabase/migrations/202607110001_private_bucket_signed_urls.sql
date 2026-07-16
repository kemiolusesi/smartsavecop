-- Private bucket URL repair for onboarding KYC documents and payment proofs.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_document_number TEXT;

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%kyc_status%'
  LOOP
    EXECUTE format('ALTER TABLE profiles DROP CONSTRAINT %I', constraint_record.conname);
  END LOOP;
END $$;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_kyc_status_check
  CHECK (kyc_status IN ('pending', 'submitted', 'approved', 'rejected'));

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('kyc-documents', 'kyc-documents', false),
  ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Members can upload own payment proofs" ON storage.objects;
CREATE POLICY "Members can upload own payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Members can read own payment proofs" ON storage.objects;
CREATE POLICY "Members can read own payment proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins can read all payment proofs" ON storage.objects;
CREATE POLICY "Admins can read all payment proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND public.current_user_is_admin()
  );
